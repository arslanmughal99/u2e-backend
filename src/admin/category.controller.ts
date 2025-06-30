import { UserRole } from '@prisma/client';
import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';

import {
  AdminCreateCategoryDto,
  AdminUpdateCategoryDto,
} from './dto/category.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminCategoryService } from './category.service';

@Controller('admin/category')
@UseGuards(JwtAuthGuard, RoleGuard)
export class CategoryController {
  constructor(private categoryService: AdminCategoryService) {}

  @Post()
  @Roles(UserRole.Admin)
  async createCategory(@Body() dto: AdminCreateCategoryDto) {
    const category = await this.categoryService.createCategory(dto);
    return category;
  }

  @Patch()
  @Roles(UserRole.Admin)
  async updateCategory(@Body() dto: AdminUpdateCategoryDto) {
    const category = await this.categoryService.updateCategory(dto);
    return category;
  }

  @Get()
  @Roles(UserRole.Admin)
  async listCategories() {
    const categories = await this.categoryService.listCategories();
    return categories;
  }
}
