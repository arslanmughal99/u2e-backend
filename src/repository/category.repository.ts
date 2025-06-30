import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AdminCreateCategoryDto,
  AdminUpdateCategoryDto,
} from '../admin/dto/category.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class CategoryRepository {
  private exceptionMsg: string;
  private logger = new Logger('CategoryRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  // Get single category by its title
  async getCategoryById(id: number) {
    try {
      const category = await this.prisma.category.findFirst({
        where: { id },
      });
      return category;
    } catch (err) {
      this.logger.error('failed to find category', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  // list all categories
  async listCategories() {
    try {
      const categories = await this.prisma.category.findMany({
        select: { id: true, icon: true, title: true },
      });
      return { categories };
    } catch (err) {
      this.logger.error('failed to list category', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * ADMIN AREA
   */

  // Create a new category
  async createCategory(dto: AdminCreateCategoryDto) {
    const { icon, title } = dto;
    const category = await this.prisma.category.create({
      data: { icon, title },
      select: { id: true, icon: true, title: true },
    });

    return category;
  }

  /**
   * List categories is reused from user logic
   */

  // Update category
  async updateCategory(dto: AdminUpdateCategoryDto) {
    const { icon, title, id } = dto;
    const category = await this.prisma.category.update({
      where: { id },
      data: { title, icon },
      select: { id: true, icon: true, title: true },
    });

    return category;
  }
}
