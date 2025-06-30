import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  AdminCreateCategoryDto,
  AdminUpdateCategoryDto,
} from './dto/category.dto';
import { UPLOAD_SERVICE, UploadService } from '../upload/upload.port';
import { CategoryRepository } from '../repository/category.repository';

@Injectable()
export class AdminCategoryService {
  constructor(
    private categoryRepository: CategoryRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async createCategory(dto: AdminCreateCategoryDto) {
    const { icon } = dto;

    const iconExist = await this.uploadService.verifyCategoryIconUpload(icon);
    if (!iconExist) throw new NotFoundException('Icon does not exist.');

    const category = await this.categoryRepository.createCategory(dto);
    category.icon = await this.uploadService.createCategoryIconLink(icon);

    return category;
  }

  async updateCategory(dto: AdminUpdateCategoryDto) {
    const { icon } = dto;

    if (icon) {
      const iconExist = await this.uploadService.verifyCategoryIconUpload(icon);
      if (!iconExist) throw new NotFoundException('Icon does not exist.');
    }

    const category = await this.categoryRepository.updateCategory(dto);
    category.icon = await this.uploadService.createCategoryIconLink(icon);

    return category;
  }

  async listCategories() {
    const categories = await this.categoryRepository.listCategories();
    categories.categories = categories.categories.map((c) => {
      c.icon = this.uploadService.createCategoryIconLink(c.icon);
      return c;
    });
    return categories;
  }
}
