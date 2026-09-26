import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateLeadDto } from './leads.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Post()
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  create(@Body() body: CreateLeadDto) {
    return this.service.create(body);
  }
}
