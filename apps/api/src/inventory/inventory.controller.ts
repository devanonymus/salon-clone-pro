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
  } from "@nestjs/common";
  import { JwtGuard } from "../auth/jwt.guard";
  import { InventoryService } from "./inventory.service";
  
  @Controller("inventory")
  @UseGuards(JwtGuard)
  export class InventoryController {
    constructor(private readonly service: InventoryService) {}
  
    @Get("products")
    products(@Req() req: any) {
      return this.service.products(req.user.tenantId);
    }
  
    @Post("products")
    createProduct(@Req() req: any, @Body() body: any) {
      return this.service.createProduct(req.user.tenantId, body);
    }
  
    @Patch("products/:id")
    updateProduct(@Req() req: any, @Param("id") id: string, @Body() body: any) {
      return this.service.updateProduct(req.user.tenantId, id, body);
    }
  
    @Delete("products/:id")
    deleteProduct(@Req() req: any, @Param("id") id: string) {
      return this.service.deleteProduct(req.user.tenantId, id);
    }
  
    @Post("products/:id/adjust")
    adjust(
      @Req() req: any,
      @Param("id") id: string,
      @Body() body: { delta: number | string },
    ) {
      return this.service.adjustStock(req.user.tenantId, id, Number(body.delta));
    }
  
    @Get("recipes")
    recipes(@Req() req: any) {
      return this.service.recipes(req.user.tenantId);
    }
  
    @Post("recipes")
    saveRecipe(@Req() req: any, @Body() body: any) {
      return this.service.saveRecipe(req.user.tenantId, body);
    }
  
    @Delete("recipes/:id")
    deleteRecipe(@Req() req: any, @Param("id") id: string) {
      return this.service.deleteRecipe(req.user.tenantId, id);
    }
  }