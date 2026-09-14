import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { InventoryService } from './inventory.service';
import type { AuthRequest } from '../auth/auth-request';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  AdjustStockDto,
  CreateInventoryProductDto,
  SaveRecipeDto,
  UpdateInventoryProductDto,
} from './inventory.dto';

@Controller('inventory')
@UseGuards(JwtGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('products')
  products(@Req() req: AuthRequest) {
    return this.service.products(req.user.tenantId);
  }

  @Post('products')
  @Roles('OWNER', 'MANAGER')
  createProduct(
    @Req() req: AuthRequest,
    @Body() body: CreateInventoryProductDto,
  ) {
    return this.service.createProduct(req.user.tenantId, body);
  }

  @Patch('products/:id')
  @Roles('OWNER', 'MANAGER')
  updateProduct(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: UpdateInventoryProductDto,
  ) {
    return this.service.updateProduct(req.user.tenantId, id, body);
  }

  @Delete('products/:id')
  @Roles('OWNER', 'MANAGER')
  deleteProduct(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.service.deleteProduct(req.user.tenantId, id);
  }

  @Post('products/:id/adjust')
  @Roles('OWNER', 'MANAGER')
  adjust(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: AdjustStockDto,
  ) {
    return this.service.adjustStock(req.user.tenantId, id, body.delta);
  }

  @Get('recipes')
  recipes(@Req() req: AuthRequest) {
    return this.service.recipes(req.user.tenantId);
  }

  @Post('recipes')
  @Roles('OWNER', 'MANAGER')
  saveRecipe(@Req() req: AuthRequest, @Body() body: SaveRecipeDto) {
    return this.service.saveRecipe(req.user.tenantId, body);
  }

  @Delete('recipes/:id')
  @Roles('OWNER', 'MANAGER')
  deleteRecipe(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.service.deleteRecipe(req.user.tenantId, id);
  }
}
