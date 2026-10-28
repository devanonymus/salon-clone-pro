/** Only reviewed manufacturer implementations may be registered. No network access or fiscal operation is provided by the control center. */
export interface DeviceAdapter {
  readonly manufacturer: string;
  readonly protocol: string;
  readonly capabilities: Readonly<{
    communication: boolean;
    printTest: boolean;
    fiscalIssue: boolean;
    payment: boolean;
  }>;
  testCommunication(
    configuration: Readonly<Record<string, string>>,
    signal: AbortSignal,
  ): Promise<{ success: boolean; reference?: string }>;
}
export interface PaymentAdapter extends DeviceAdapter {
  /** Implementations must persist an idempotent operation before sending and reconcile uncertain outcomes before any retry. */
  requestPayment(
    input: {
      operationId: string;
      idempotencyKey: string;
      amountMinor: number;
      currency: string;
      terminalId: string;
    },
    signal: AbortSignal,
  ): Promise<{
    status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'UNKNOWN';
    providerReference: string;
  }>;
  reconcile(
    providerReference: string,
    signal: AbortSignal,
  ): Promise<{ status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'UNKNOWN' }>;
}
export class AdapterRegistry {
  private readonly adapters = new Map<string, DeviceAdapter>();
  register(adapter: DeviceAdapter) {
    const key = `${adapter.manufacturer}:${adapter.protocol}`;
    if (this.adapters.has(key)) throw new Error('Adattatore già registrato');
    this.adapters.set(key, adapter);
  }
  find(manufacturer: string, protocol: string) {
    return this.adapters.get(`${manufacturer}:${protocol}`) ?? null;
  }
}
