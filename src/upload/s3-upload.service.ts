import {
  Inject,
  Logger,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { exec } from 'child_process';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3';

import { UploadService } from './upload.port';
import { ERROR_CODES_TOKEN, ErrorCodes } from '../errors';

@Injectable()
export class S3UploadService implements UploadService {
  private s3Client: S3;
  private s3ProfileImageUploadExp: number;
  private s3ProfileCoverUploadExp: number;
  private s3LectureVideoUploadExp: number;
  private s3LectureThumbnailUploadExp: number;
  private s3LectureAttachmentUploadExp: number;
  private s3LectureAssignmentAttachmentUploadExp: number;
  private s3SupportAttachmentUploadExp: number;
  private s3CourseThumbnailUploadExp: number;
  private s3BlogImageUploadExp: number;
  private s3PublicBucket: string;
  private s3PrivateBucket: string;
  private s3PublicBucketCDN: string;
  private s3PrivateBucketCDN: string;
  private logger = new Logger('S3UploadService');

  constructor(
    private configs: ConfigService,
    @Inject(ERROR_CODES_TOKEN) private errCodes: ErrorCodes,
  ) {
    // this.s3Endpoint = this.configs.getOrThrow('S3_ENDPOINT');
    // this.s3TenantId = this.configs.getOrThrow('S3_TENANT_ID');
    this.s3PublicBucket = this.configs.getOrThrow('S3_PUBLIC_BUCKET_NAME');
    this.s3PrivateBucket = this.configs.getOrThrow('S3_PRIVATE_BUCKET_NAME');
    this.s3PublicBucketCDN = this.configs.getOrThrow(
      'S3_PUBLIC_BUCKET_CDN_NAME',
    );
    this.s3PrivateBucketCDN = this.configs.getOrThrow(
      'S3_PRIVATE_BUCKET_CDN_NAME',
    );
    this.s3CourseThumbnailUploadExp = parseInt(
      this.configs.getOrThrow('S3_COURSE_THUMBNAIL_UPLOAD_EXP_SEC'),
    );
    this.s3LectureThumbnailUploadExp = parseInt(
      this.configs.getOrThrow('S3_LECTURE_THUMBNAIL_UPLOAD_EXP_SEC'),
    );
    this.s3LectureAttachmentUploadExp = parseInt(
      this.configs.getOrThrow('S3_LECTURE_ATTACHMENT_UPLOAD_EXP_SEC'),
    );
    this.s3LectureAssignmentAttachmentUploadExp = parseInt(
      this.configs.getOrThrow(
        'S3_LECTURE_ASSIGNMENT_ATTACHMENT_UPLOAD_EXP_SEC',
      ),
    );
    this.s3LectureVideoUploadExp = parseInt(
      this.configs.getOrThrow('S3_LECTURE_VIDEO_UPLOAD_EXP_SEC'),
    );
    this.s3ProfileCoverUploadExp = parseInt(
      this.configs.getOrThrow('S3_PROFILE_COVER_UPLOAD_EXP_SEC'),
    );
    this.s3ProfileImageUploadExp = parseInt(
      this.configs.getOrThrow('S3_PROFILE_IMAGE_UPLOAD_EXP_SEC'),
    );
    this.s3SupportAttachmentUploadExp = parseInt(
      this.configs.getOrThrow('S3_SUPPORT_ATTACHMENT_UPLOAD_EXP_SEC'),
    );
    this.s3BlogImageUploadExp = parseInt(
      this.configs.getOrThrow('S3_BLOG_IMAGE_UPLOAD_EXP'),
    );
    this.s3Client = new S3({
      bucketEndpoint: true,
      region: this.configs.getOrThrow('S3_REGION'),
      credentials: {
        accessKeyId: this.configs.getOrThrow('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configs.getOrThrow('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async createUserProfileImageUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const bucket = this.s3PrivateBucket;

    const key = `${user.storageDirectory}/profile/images/${nanoid(
      10,
    )}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      Bucket: bucket,
      ACL: 'public-read',
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3ProfileImageUploadExp,
      });
      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error('failed to create profile image upload signature', err);
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  createUserProfileLink(public_id: string): string {
    const url = `${this.s3PrivateBucketCDN}/${public_id}`;
    return url;
  }

  async verifyUserProfileImageUpload(public_id: string): Promise<boolean> {
    const bucket = this.s3PrivateBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });

      return true;
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
      this.logger.warn('user profile image verification failed', err);
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createUserCoverImageUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const bucket = this.s3PrivateBucket;

    const key = `${user.storageDirectory}/cover/images/${nanoid(
      10,
    )}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      Bucket: bucket,
      ACL: 'public-read',
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3ProfileCoverUploadExp,
      });
      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error('failed to create user cover upload signature', err);
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifyUserCoverImageUpload(public_id: string): Promise<boolean> {
    const bucket = this.s3PrivateBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });

      return true;
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
      this.logger.warn('user cover upload verification failed', err);
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  createUserCoverLink(public_id: string): string {
    const url = `${this.s3PrivateBucketCDN}/${public_id}`;
    return url;
  }

  async createCourseThumbnailUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const bucket = this.s3PrivateBucket;

    const key = `${user.storageDirectory}/courses/thumbnails/${nanoid(
      10,
    )}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      Bucket: bucket,
      ACL: 'public-read',
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3CourseThumbnailUploadExp,
      });
      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error(
        'failed to create course thumbnail upload signature',
        err,
      );
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifyCourseThumbnailUpload(public_id: string): Promise<boolean> {
    const bucket = this.s3PrivateBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });

      return true;
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
      this.logger.warn('failed to verify course thumbnail upload', err);
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  createCourseThumbnailLink(public_id: string): string {
    const url = `${this.s3PrivateBucketCDN}/${public_id}`;
    return url;
  }

  async createLectureThumbnailUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const bucket = this.s3PrivateBucket;

    const key = `${user.storageDirectory}/lectures/thumbnails/${nanoid(
      10,
    )}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      Bucket: bucket,
      ACL: 'public-read',
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3LectureThumbnailUploadExp,
      });
      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error(
        'failed to create lecture thumbnail upload signature',
        err,
      );
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifyLectureThumbnailUpload(public_id: string): Promise<boolean> {
    const bucket = this.s3PrivateBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });

      return true;
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
      this.logger.warn('lecture thumbnail upload verification failed');
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  createLectureThumbnailLink(public_id: string): string {
    const url = `${this.s3PrivateBucketCDN}/${public_id}`;
    return url;
  }

  async createLectureVideoUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const key = `${user.storageDirectory}/courses/videos/${nanoid(
      10,
    )}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      ACL: 'private',
      Bucket: this.s3PrivateBucket,
      ContentType: 'application/mp4',
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3LectureVideoUploadExp,
      });
      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error('failed to create lecture video upload signature', err);
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifyLectureVideoUpload(public_id: string): Promise<number> {
    const bucket = this.s3PrivateBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return;
      this.logger.warn('lecture video upload verification failed', err);
      throw new NotFoundException(this.errCodes.SOMETHING_WENT_WRONG);
    }

    try {
      const command = new GetObjectCommand({
        Key: public_id,
        Bucket: bucket,
      });

      const url = await getSignedUrl(this.s3Client, command);
      const duration: number = await this.getVideoDuration(url);

      return duration;
    } catch (err) {
      this.s3Client
        .deleteObject({ Bucket: bucket, Key: public_id })
        .then()
        .catch((_err) => {
          this.logger.warn(
            'failed to delete failed video verification object',
            _err,
          );
        });
      this.logger.warn('video upload verification failed');
      throw new NotFoundException(this.errCodes.SOMETHING_WENT_WRONG);
    }
  }

  async createLectureVideoLink(public_id: string): Promise<string> {
    const bucket = this.s3PrivateBucket;

    const command = new GetObjectCommand({
      Key: public_id,
      Bucket: bucket,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60,
      });
      return signedUrl;
    } catch (err) {
      this.logger.error('failed to create lecture video signed link', err);
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createLectureAttachmentUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const bucket = this.s3PrivateBucket;

    const key = `${user.storageDirectory}/lectures/attachments/${nanoid(
      10,
    )}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      ACL: 'private',
      Bucket: bucket,
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3LectureAttachmentUploadExp,
      });

      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error(
        'failed to create lecture attachments upload signature',
        err,
      );
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifyLectureAttachmentUpload(public_id: string): Promise<boolean> {
    const bucket = this.s3PrivateBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });

      return true;
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
      this.logger.warn('verify lecture attachment upload failed', err);
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createLectureAttachmentLink(public_id: string): Promise<string> {
    const bucket = this.s3PrivateBucket;

    const command = new GetObjectCommand({
      Key: public_id,
      Bucket: bucket,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60,
      });
      return signedUrl;
    } catch (err) {
      this.logger.error('failed to create lecture attachments signed url', err);
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createLectureAssignmentAttachmentUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const bucket = this.s3PrivateBucket;

    const key = `${
      user.storageDirectory
    }/lectures/assignemnts/attachments/${nanoid(10)}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      ACL: 'private',
      Bucket: bucket,
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3LectureAssignmentAttachmentUploadExp,
      });

      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error(
        'failed to create lecture assignment attachments upload signature',
        err,
      );
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifyLectureAssignmentAttachmentUpload(
    public_id: string,
  ): Promise<boolean> {
    const bucket = this.s3PrivateBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });

      return true;
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
      this.logger.warn('lecture assignment attachment verification failed');
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createLectureAssignmentAttachmentLink(
    public_id: string,
  ): Promise<string> {
    const bucket = this.s3PrivateBucket;

    const command = new GetObjectCommand({
      Key: public_id,
      Bucket: bucket,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60,
      });
      return signedUrl;
    } catch (err) {
      this.logger.error(
        'failed to create lecture assignment attachment signed url',
        err,
      );
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createAssignmentReplyAttachmentUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const bucket = this.s3PrivateBucket;

    const key = `${
      user.storageDirectory
    }/lectures/assignemnts/comment/attachments/${nanoid(10)}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      ACL: 'private',
      Bucket: bucket,
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3LectureAssignmentAttachmentUploadExp,
      });

      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error(
        'failed to create assignment reply attachments upload signature',
        err,
      );
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifyAssignmentReplyAttachmentUpload(
    public_id: string,
  ): Promise<boolean> {
    const bucket = this.s3PrivateBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });

      return true;
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
      this.logger.warn('assignment reply attachment verification failed');
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createAssignmentReplyAttachmentLink(
    public_id: string,
  ): Promise<string> {
    const bucket = this.s3PrivateBucket;

    const command = new GetObjectCommand({
      Key: public_id,
      Bucket: bucket,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60,
      });
      return signedUrl;
    } catch (err) {
      this.logger.error(
        'failed to create lecture assignment reply attachment signed url',
        err,
      );
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createSupportAttachmentUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const bucket = this.s3PrivateBucket;

    const key = `${user.storageDirectory}/support/attachments/${nanoid(
      10,
    )}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      ACL: 'private',
      Bucket: bucket,
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3SupportAttachmentUploadExp,
      });

      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error(
        'failed to create support attachment upload signature',
        err,
      );
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifySupportAttachmentUpload(public_id: string): Promise<boolean> {
    const bucket = this.s3PrivateBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });

      return true;
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
      this.logger.warn('support attachment upload verification failed');
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createSupportAttachmentLink(public_id: string): Promise<string> {
    const bucket = this.s3PrivateBucket;

    const command = new GetObjectCommand({
      Key: public_id,
      Bucket: bucket,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60,
      });
      return signedUrl;
    } catch (err) {
      this.logger.error('failed to create support attachment url', err);
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createBlogImageUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const bucket = this.s3PublicBucket;

    const key = `${user.storageDirectory}/blogs/${nanoid(10)}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      ACL: 'public-read',
      Bucket: bucket,
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3BlogImageUploadExp,
      });
      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error('failed to create blog image upload signature', err);
      throw new InternalServerErrorException(this.errCodes);
    }
  }

  async verifyBlogImageUpload(public_id: string): Promise<boolean> {
    const bucket = this.s3PublicBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });

      return true;
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
      this.logger.warn('blog image upload verification failed');
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  createBlogImageLink(public_id: any): string {
    const url = `${this.s3PublicBucketCDN}/${public_id}`;
    return url;
  }

  async createProductImageUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const bucket = this.s3PublicBucket;

    const key = `${user.storageDirectory}/products/${nanoid(10)}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      Bucket: bucket,
      ACL: 'public-read',
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3BlogImageUploadExp,
      });
      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error('failed to create product image upload signature', err);
      throw new InternalServerErrorException(this.errCodes);
    }
  }

  async verifyProductImageUpload(public_id: string): Promise<boolean> {
    const bucket = this.s3PublicBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });

      return true;
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
      this.logger.warn('product image upload verification failed');
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  createProductImageLink(public_id: any): string {
    const url = `${this.s3PublicBucketCDN}/${public_id}`;
    return url;
  }

  async createCategoryIconUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{ signature: string; timestamp: number; uploadPreset: string }> {
    if (!filename)
      throw new NotFoundException(this.errCodes.FILE_NAME_REQUIRED);

    const bucket = this.s3PublicBucket;

    const key = `category/icons/${nanoid(10)}-${filename}`;

    const command = new PutObjectCommand({
      Key: key,
      Bucket: bucket,
      ACL: 'public-read',
      Metadata: { original_name: filename },
    });

    try {
      const signature = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.s3BlogImageUploadExp,
      });
      return {
        signature,
        timestamp: 0,
        uploadPreset: '-',
      };
    } catch (err) {
      this.logger.error('failed to create product image upload signature', err);
      throw new InternalServerErrorException(this.errCodes);
    }
  }

  async verifyCategoryIconUpload(public_id: string): Promise<boolean> {
    const bucket = this.s3PublicBucket;

    try {
      await this.s3Client.headObject({
        Key: public_id,
        Bucket: bucket,
      });

      return true;
    } catch (err) {
      if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
      this.logger.warn('category icon upload verification failed');
      throw new InternalServerErrorException(
        this.errCodes.SOMETHING_WENT_WRONG,
      );
    }
  }

  createCategoryIconLink(public_id: any): string {
    const url = `${this.s3PublicBucketCDN}/${public_id}`;
    return url;
  }

  private async getVideoDuration(url: string) {
    const stdout = await this.ffprobe(url);
    return stdout.format.duration;
  }

  private ffprobe(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      exec(
        `ffprobe -v quiet -print_format json -show_format "${url + 1}"`,
        (err, stdout, stderr) => {
          if (err) reject(err);
          if (stderr) reject(stderr);
          if (stdout) resolve(JSON.parse(stdout));
        },
      );
    });
  }
}

// async createPrivateAssetLink(args: {
//   publicId: string;
//   duration: number;
// }): Promise<string> {
//   const { duration, publicId } = args;
//   const bucket = this.s3BucketEndpoint + this.s3PrivateBucket;
//   const command = new GetObjectCommand({
//     Key: publicId,
//     Bucket: bucket,
//   });

//   try {
//     const signedUrl = await getSignedUrl(this.s3Client, command, {
//       expiresIn: duration,
//     });
//     return signedUrl;
//   } catch (err) {
//     this.logger.error('failed to create asset signed url', err);
//     throw new InternalServerErrorException('Something went wrong');
//   }
// }

// async createImageUploadSignature(user: User, filename?: string) {
//   if (!filename) throw new NotFoundException('file name is required.');
//   const key = `${user.storageDirectory}/${nanoid(10)}-${filename}`;

//   const command = new PutObjectCommand({
//     Key: key,
//     ACL: 'private',
//     Bucket: this.s3BucketEndpoint,
//     Expires: new Date(Date.now() + this.s3ImageUploadExp * 1000),
//     Metadata: { original_name: filename },
//   });

//   try {
//     const signature = await getSignedUrl(this.s3Client, command, {
//       expiresIn: 3600,
//     });

//     return {
//       signature,
//       timestamp: 0,
//       uploadPreset: '-',
//     };
//   } catch (err) {
//     this.logger.error('failed to create image upload signature', err);
//     throw new InternalServerErrorException('Something went wrong');
//   }
// }

// async createVideoUploadSignature(user: User, filename?: string) {
//   if (!filename) throw new NotFoundException('file name is required.');
//   const key = `${user.storageDirectory}/${nanoid(10)}-${filename}`;

//   const command = new PutObjectCommand({
//     Key: key,
//     ACL: 'private',
//     Bucket: this.s3BucketEndpoint,
//     ContentType: 'application/mp4',
//     Metadata: { original_name: filename },
//   });

//   try {
//     const signature = await getSignedUrl(this.s3Client, command, {
//       expiresIn: 3600,
//     });

//     return {
//       signature,
//       timestamp: 0,
//       uploadPreset: '-',
//     };
//   } catch (err) {
//     this.logger.error('failed to create video upload signature', err);
//     throw new InternalServerErrorException('Something went wrong');
//   }
// }

// async createAttachmentsUploadSignature(user: User, filename?: string) {
//   if (!filename) throw new NotFoundException('file name is required.');
//   const key = `${user.storageDirectory}/${nanoid(10)}-${filename}`;

//   const command = new PutObjectCommand({
//     Key: key,
//     Bucket: this.s3BucketEndpoint,
//     Metadata: { original_name: filename },
//   });

//   try {
//     const signature = await getSignedUrl(this.s3Client, command, {
//       expiresIn: 3600,
//     });

//     return {
//       signature,
//       timestamp: 0,
//       uploadPreset: '-',
//     };
//   } catch (err) {
//     this.logger.error('failed to create attachments upload signature', err);
//     throw new InternalServerErrorException('Something went wrong');
//   }
// }

// async createAssetLink(args: {
//   ip?: string;
//   publicId: string;
//   duration?: number;
// }) {
//   const { publicId, duration } = args;
//   const bucket = this.s3BucketEndpoint + this.s3PrivateBucket;
//   const _duration = duration || 60 * 10; // 10mins
//   const command = new GetObjectCommand({
//     Key: publicId,
//     Bucket: bucket,
//   });

//   try {
//     const signedUrl = await getSignedUrl(this.s3Client, command, {
//       expiresIn: _duration,
//     });
//     return signedUrl;
//   } catch (err) {
//     this.logger.error('failed to create asset signed url', err);
//     throw new InternalServerErrorException('Something went wrong');
//   }
// }

// async verifyVideoUpload(public_id: string): Promise<number> {
//   const bucket = this.s3BucketEndpoint + this.s3PrivateBucket;

//   try {
//     await this.s3Client.headObject({
//       Key: public_id,
//       Bucket: bucket,
//     });
//   } catch (err) {
//     if (err.$metadata && err.$metadata.httpStatusCode === 404) return;
//     this.logger.warn('video upload verification failed');
//     throw new NotFoundException('Video not found.');
//   }

//   try {
//     const command = new GetObjectCommand({
//       Key: public_id,
//       Bucket: bucket,
//     });

//     const url = await getSignedUrl(this.s3Client, command);
//     const duration: number = await this.getVideoDuration(url);
//     return duration;
//   } catch (err) {
//     this.logger.warn('video upload verification failed');
//     throw new NotFoundException('Something went wrong.');
//   }
// }

// async verifyImageUpload(public_id: string): Promise<boolean> {
//   const bucket = this.s3BucketEndpoint + this.s3PrivateBucket;

//   try {
//     await this.s3Client.headObject({
//       Key: public_id,
//       Bucket: bucket,
//     });

//     return true;
//   } catch (err) {
//     if (err.$metadata && err.$metadata.httpStatusCode === 404) return false;
//     this.logger.warn('image upload verification failed');
//     throw new InternalServerErrorException('Something went wrong.');
//   }
// }

// async verifyAttachmentsUpload(...public_ids: AttachmentsDto[]) {
//   const bucket = this.s3BucketEndpoint + this.s3PrivateBucket;
//   try {
//     const checkAssets = public_ids.map(async (pid) => {
//       try {
//         // const res = await cloudinary.uploader.explicit(pid.id, {
//         //   type: 'authenticated',
//         // });
//         const res = await this.s3Client.headObject({
//           Key: pid.id,
//           Bucket: bucket,
//         });

//         return { ...pid, res };
//       } catch (err) {
//         if (err.$metadata && err.$metadata.httpStatusCode === 404)
//           return { ...pid, res };
//         this.logger.warn(`failed to verify attachment ${pid.name}:${pid.id}`);
//         return err;
//       }
//     });

//     const res = await Promise.all(checkAssets);

//     const failedAttachments = res.filter((a) => {
//       // a.res && a.$metadata && a.$metadata.httpStatusCode === 404,
//       if (a.res && a.res.$metadata && a.res.$metadata.httpStatusCode === 404)
//         return true;
//     });

//     if (failedAttachments.length > 0) {
//       return failedAttachments.map((f) => f.name).join(',');
//     }

//     return true;
//   } catch (err) {
//     this.logger.error('failed to verify attachments upload', err);
//     throw new InternalServerErrorException(this.exceptionMsg);
//   }
// }

// async verifyBulkImageUpload(
//   ...public_ids: string[]
// ): Promise<string | boolean> {
//   const bucket = this.s3BucketEndpoint + this.s3PrivateBucket;

//   try {
//     const checkAssets = public_ids.map(async (public_id) => {
//       try {
//         const res = await this.s3Client.headObject({
//           Key: public_id,
//           Bucket: bucket,
//         });

//         return { public_id, res };
//       } catch (err) {
//         if (err.$metadata && err.$metadata.httpStatusCode === 404)
//           return { public_id, res };
//         this.logger.warn(`failed to verify attachment ${public_id}`);
//         return err;
//       }
//     });

//     const res = await Promise.all(checkAssets);

//     const failedAttachments = res.filter((a) => {
//       // a.res && a.$metadata && a.$metadata.httpStatusCode === 404,
//       if (a.res && a.res.$metadata && a.res.$metadata.httpStatusCode === 404)
//         return true;
//     });

//     if (failedAttachments.length > 0) {
//       return failedAttachments.map((f) => f.public_id).join(',');
//     }

//     return true;
//   } catch (err) {
//     this.logger.error('failed to verify bulk image upload', err);
//     throw new InternalServerErrorException(this.exceptionMsg);
//   }
// }
