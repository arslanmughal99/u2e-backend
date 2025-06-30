import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { User } from '@prisma/client';

import {
  ListThreadsDto,
  UpdateThreadDto,
  CreateThreadDto,
  DeleteThreadDto,
  GetThreadByIdDto,
  ListThreadCommentsDto,
  CreateThreadCommentDto,
  CreateThreadReactionDto,
  DeleteThreadReactionDto,
} from './forum.dto';
import { AuthUtils } from '../auth/auth.utils';
import { ForumRepository } from '../repository/forum.repository';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';
import { RewardPointsService } from '../reward-points/reward-points.service';
import { RewardPointsConditionKey } from '../repository/reward-points.repository';

@Injectable()
export class ForumService {
  constructor(
    private authUtils: AuthUtils,
    private forumRepository: ForumRepository,
    private rewardPointsService: RewardPointsService,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async createThread(dto: CreateThreadDto) {
    const thread = await this.forumRepository.createThread(dto);

    if (thread.user.profileImage)
      thread.user.profileImage = this.uploadService.createUserProfileLink(
        thread.user.profileImage,
      );

    await this.rewardPointsService.giveRewardPoints(
      dto.user,
      RewardPointsConditionKey.CreateThread,
    );

    return thread;
  }

  async updateThread(dto: UpdateThreadDto) {
    const thread = await this.forumRepository.updateThread(dto);
    if (thread.user.profileImage)
      thread.user.profileImage = this.uploadService.createUserProfileLink(
        thread.user.profileImage,
      );
    return thread;
  }

  async deleteThread(dto: DeleteThreadDto) {
    const deleted = await this.forumRepository.deleteThread(dto);
    return deleted;
  }

  async listThreads(dto: ListThreadsDto, _token?: string) {
    let user: User;
    if (_token) user = await this.authUtils.validateUser(_token);
    dto.user = user;
    const threads = await this.forumRepository.listThreads(dto);
    threads.threads = threads.threads.map((t) => {
      if (t.user.profileImage)
        t.user.profileImage = this.uploadService.createUserProfileLink(
          t.user.profileImage,
        );
      return t;
    });
    return threads;
  }

  async getThreadById(dto: GetThreadByIdDto) {
    const thread = await this.forumRepository.getThreadById(dto.id);

    if (thread.user.profileImage)
      thread.user.profileImage = this.uploadService.createUserProfileLink(
        thread.user.profileImage,
      );
    return thread;
  }

  async createThreadComment(dto: CreateThreadCommentDto) {
    const { threadId } = dto;
    const thread = await this.forumRepository.getThreadById(threadId);
    if (!thread) throw new NotFoundException('Thread not found.');

    const comment = await this.forumRepository.createComment(dto);

    await this.rewardPointsService.giveRewardPoints(
      dto.user,
      RewardPointsConditionKey.PostReplyThread,
    );

    return comment;
  }

  async listComments(dto: ListThreadCommentsDto) {
    const comments = await this.forumRepository.listComments(dto);

    comments.comments = comments.comments.map((c) => {
      if (c.user.profileImage)
        c.user.profileImage = this.uploadService.createUserProfileLink(
          c.user.profileImage,
        );
      return c;
    });

    return comments;
  }

  async createThreadFeedback(dto: CreateThreadReactionDto) {
    const { threadId, user } = dto;

    const thread = await this.forumRepository.getThreadById(threadId);

    if (!thread) throw new NotFoundException('Thread not found.');

    const exist = await this.forumRepository.getThreadFeedbackByUser(
      threadId,
      user,
    );

    if (exist) throw new ConflictException('Feedback already exist');

    const feedback = await this.forumRepository.createThreadFeedback(dto);

    return feedback;
  }

  async deleteThreadFeedback(dto: DeleteThreadReactionDto) {
    const { user, threadId } = dto;
    const thread = await this.forumRepository.getThreadFeedbackByUser(
      threadId,
      user,
    );

    if (!thread)
      throw new NotFoundException(
        "You haven't provide feedback on this thread.",
      );

    await this.forumRepository.deleteThreadFeedback(thread);

    return { deleted: true };
  }
}
