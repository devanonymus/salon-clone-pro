import { PrismaService } from '../prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';

describe('FiscalController', () => {
  let controller: FiscalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FiscalController],
      providers: [
        { provide: PrismaService, useValue: {} },
        { provide: FiscalService, useValue: {} },
      ],
    }).compile();

    controller = module.get<FiscalController>(FiscalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
