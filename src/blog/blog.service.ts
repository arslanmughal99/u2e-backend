import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import {
  ListBlogsDto,
  GetBlogByIdDto,
  ListBlogCommentsDto,
  CreateBlogCommentDto,
  CreateBlogReactionDto,
  DeleteBlogReactionDto,
} from './blog.dto';
import { BlogRepository } from '../repository/blog.repository';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';

@Injectable()
export class BlogService {
  constructor(
    private blogRepository: BlogRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async listBlogs(dto: ListBlogsDto) {
    const blogs = await this.blogRepository.listBlogs(dto);
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

  async getBlogById(dto: GetBlogByIdDto) {
    const blog = await this.blogRepository.getBlogById(dto.id);
    blog.category.icon = this.uploadService.createCategoryIconLink(
      blog.category.icon,
    );

    blog.image = this.uploadService.createBlogImageLink(blog.image);

    if (blog.user.profileImage)
      blog.user.profileImage = this.uploadService.createUserProfileLink(
        blog.user.profileImage,
      );
    return blog;
  }

  async createBlogComment(dto: CreateBlogCommentDto) {
    const { blogId } = dto;
    const blog = await this.blogRepository.getBlogById(blogId);
    if (!blog) throw new NotFoundException('Blog not found.');

    const comment = await this.blogRepository.createComment(dto);

    return comment;
  }

  async listComments(dto: ListBlogCommentsDto) {
    const comments = await this.blogRepository.listComments(dto);
    comments.comments = comments.comments.map((c) => {
      if (c.user.profileImage)
        c.user.profileImage = this.uploadService.createUserProfileLink(
          c.user.profileImage,
        );
      return c;
    });
    return comments;
  }

  async createBlogFeedback(dto: CreateBlogReactionDto) {
    const { blogId, user } = dto;

    const blog = await this.blogRepository.getBlogById(blogId);

    if (!blog) throw new NotFoundException('Blog not found.');

    const exist = await this.blogRepository.getBlogFeedbackByUser(blogId, user);

    if (exist) throw new ConflictException('Feedback already exist');

    const feedback = await this.blogRepository.createBlogFeedback(dto);

    return feedback;
  }

  async deleteBlogFeedback(dto: DeleteBlogReactionDto) {
    const { user, blogId } = dto;
    const blog = await this.blogRepository.getBlogFeedbackByUser(blogId, user);

    if (!blog)
      throw new NotFoundException("You haven't provide feedback on this blog.");

    await this.blogRepository.deleteBlogFeedback(blog);

    return { deleted: true };
  }
}
