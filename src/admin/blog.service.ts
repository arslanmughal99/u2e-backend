import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  AdminListBlogsDto,
  AdminUpdateBlogDto,
  AdminCreateBlogDto,
  AdminGetBlogByIdDto,
  AdminDeleteBlogByIdDto,
} from './dto/blog.dto';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';

import { BlogRepository } from '../repository/blog.repository';
import { CategoryRepository } from '../repository/category.repository';

@Injectable()
export class AdminBlogService {
  constructor(
    private blogRepository: BlogRepository,
    private categoryRepository: CategoryRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async createBlog(dto: AdminCreateBlogDto) {
    const { image, categoryId } = dto;

    const imgExist = await this.uploadService.verifyBlogImageUpload(image);
    if (!imgExist) throw new NotFoundException('Image not found.');

    const categoryExist = await this.categoryRepository.getCategoryById(
      categoryId,
    );
    if (!categoryExist) throw new NotFoundException('Category not found.');

    const blog = await this.blogRepository.createBlogAdmin(dto);
    blog.category.icon = this.uploadService.createCategoryIconLink(
      blog.category.icon,
    );
    blog.user.profileImage = this.uploadService.createUserProfileLink(
      blog.user.profileImage,
    );
    blog.image = this.uploadService.createBlogImageLink(blog.image);

    return blog;
  }

  async updateBlog(dto: AdminUpdateBlogDto) {
    const { image, categoryId } = dto;

    if (image) {
      const imgExist = await this.uploadService.verifyBlogImageUpload(image);
      if (!imgExist) throw new NotFoundException('Image not found.');
    }

    if (categoryId) {
      const categoryExist = await this.categoryRepository.getCategoryById(
        categoryId,
      );
      if (!categoryExist) throw new NotFoundException('Category not found.');
    }

    const blog = await this.blogRepository.updateBlogAdmin(dto);
    blog.category.icon = this.uploadService.createCategoryIconLink(
      blog.category.icon,
    );
    blog.user.profileImage = this.uploadService.createUserProfileLink(
      blog.user.profileImage,
    );
    blog.image = this.uploadService.createBlogImageLink(blog.image);

    return blog;
  }

  async listBlogs(dto: AdminListBlogsDto) {
    const blogs = await this.blogRepository.listBlogsAdmin(dto);
    blogs.blogs = blogs.blogs.map((t) => {
      t.category.icon = this.uploadService.createCategoryIconLink(
        t.category.icon,
      );

      t.image = this.uploadService.createBlogImageLink(t.image);

      if (t.user.profileImage)
        t.user.profileImage = this.uploadService.createUserProfileLink(
          t.user.profileImage,
        );
      return t;
    });
    return blogs;
  }

  async getBlogById(dto: AdminGetBlogByIdDto) {
    const { id } = dto;
    const blog = await this.blogRepository.getBlogById(id);
    blog.category.icon = this.uploadService.createCategoryIconLink(
      blog.category.icon,
    );

    blog.image = await this.uploadService.createBlogImageLink(blog.image);

    if (blog.user.profileImage)
      blog.user.profileImage = this.uploadService.createUserProfileLink(
        blog.user.profileImage,
      );

    return blog;
  }

  async deleteBlogById(dto: AdminDeleteBlogByIdDto) {
    const { id } = dto;
    const d = await this.blogRepository.deleteBlogByIdAdmin(id);
    return d;
  }
}
