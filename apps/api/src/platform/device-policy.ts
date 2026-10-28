import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
export const deviceSections = ['registratore', 'pos', 'stampanti'] as const;
export type DeviceSection = (typeof deviceSections)[number];
export const deviceChecks: Record<DeviceSection, string> = {
  registratore: 'REGISTRATORE',
  pos: 'POS',
  stampanti: 'STAMPANTE',
};
/** A technical deadline is a calendar date in the platform's Italian business timezone. */
export function technicalToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return new Date(
    `${part('year')}-${part('month')}-${part('day')}T00:00:00.000Z`,
  );
}
export async function assertDevicesReady(
  tx: Prisma.TransactionClient,
  tenantId: string,
  key = 'COLLAUDO',
  result = 'PASS',
) {
  const section = deviceSections.find((s) => deviceChecks[s] === key);
  if (!section && key !== 'COLLAUDO') return;
  if (result === 'NA' && section) {
    if (
      await tx.platformDevice.count({
        where: { tenantId, section, archivedAt: null },
      })
    )
      throw new BadRequestException(
        'Sono presenti dispositivi attivi: la verifica non può essere non applicabile',
      );
    return;
  }
  if (result !== 'PASS') return;
  if (
    await tx.platformDevice.count({
      where: {
        tenantId,
        archivedAt: null,
        ...(section ? { section } : {}),
        OR: [
          { physicalCheck: { not: 'PASS' } },
          { dueDate: { lt: technicalToday() } },
        ],
      },
    })
  )
    throw new BadRequestException(
      'Collaudare tutti i dispositivi attivi e aggiornare le scadenze superate',
    );
}
