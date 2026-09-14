import { Test, TestingModule } from '@nestjs/testing';
import { FiscalService } from './fiscal.service';
import { PrismaService } from '../prisma.service';

describe('FiscalService', () => {
  let service: FiscalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FiscalService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<FiscalService>(FiscalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
