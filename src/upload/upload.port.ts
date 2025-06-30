import { User } from '@prisma/client';

export const UPLOAD_SERVICE = 'UPLOAD_SERVICE';

export interface UploadService {
  /**
   * User upload handlers
   */

  // create cousrse thumbnail upload signature
  createUserProfileImageUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;

  // create publically accessable link for the user profile
  createUserProfileLink(public_id: string): string;

  // verify course thumbnaile is uploaded
  verifyUserProfileImageUpload(public_id: string): Promise<boolean>;

  // verify user cover is uploaded
  verifyUserCoverImageUpload(public_id: string): Promise<boolean>;
  // create user cover upload signature
  createUserCoverImageUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;
  // create public url for user over image
  createUserCoverLink(public_id: string): string;

  /**
   *  Course thumbnail upload handlers
   *  Must be publically readable
   */

  // create cousrse thumbnail upload signature
  createCourseThumbnailUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;
  // verify course thumbnaile is uploaded
  verifyCourseThumbnailUpload(public_id: string): Promise<boolean>;
  // create public link for course thumbnail
  createCourseThumbnailLink(public_id: string): string;

  /**
   *  Lecture upload handlers
   *  Must be publically readable
   */

  // create lecture thumbnail upload signature
  createLectureThumbnailUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;
  // verify lecture thumbnaile is uploaded
  verifyLectureThumbnailUpload(public_id: string): Promise<boolean>;
  // create lecture thumbnail public link
  createLectureThumbnailLink(public_id: string): string;

  // create lecture attachment upload signature
  createLectureAttachmentUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;
  // verify lecture attachment is uploaded
  verifyLectureAttachmentUpload(public_id: string): Promise<boolean>;
  // create lecture attachment signed link
  createLectureAttachmentLink(public_id: string): Promise<string>;

  createAssignmentReplyAttachmentUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;
  createAssignmentReplyAttachmentLink(public_id: string): Promise<string>;
  verifyAssignmentReplyAttachmentUpload(public_id: string): Promise<boolean>;

  // create lecture video upload signature
  createLectureVideoUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;

  // verify lecture video is uploaded
  verifyLectureVideoUpload(public_id: string): Promise<number>;
  // create signed url for lecture video
  createLectureVideoLink(public_id: string): Promise<string>;

  /**
   *  Lecture assignment attachment upload handlers
   *  Must be private
   */

  // create lecture attachment upload signature
  createLectureAssignmentAttachmentUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;
  // verify lecture attachment is uploaded
  verifyLectureAssignmentAttachmentUpload(public_id: string): Promise<boolean>;
  // create lecture assignment attachment signed link
  createLectureAssignmentAttachmentLink(public_id: string): Promise<string>;

  /**
   *  Support attachment upload handlers
   *  Must be private
   */

  // create support attachment upload signature
  createSupportAttachmentUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;
  // verify support attachment is uploaded
  verifySupportAttachmentUpload(public_id: string): Promise<boolean>;
  createSupportAttachmentLink(public_id: string): Promise<string>;
  /**
   * Blog upload handlers
   * must be publically available
   */

  // create cousrse thumbnail upload signature
  createBlogImageUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;

  // verify course thumbnaile is uploaded
  verifyBlogImageUpload(public_id: string): Promise<boolean>;
  createBlogImageLink(public_id: string): string;

  // create cousrse thumbnail upload signature
  createProductImageUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;

  // verify course thumbnaile is uploaded
  verifyProductImageUpload(public_id: string): Promise<boolean>;
  createProductImageLink(public_id: string): string;

  // create cousrse thumbnail upload signature
  createCategoryIconUploadSignature(
    user: User,
    filename?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    uploadPreset: string;
  }>;

  // verify course thumbnaile is uploaded
  verifyCategoryIconUpload(public_id: string): Promise<boolean>;
  createCategoryIconLink(public_id: string): string;

  // createPublicAssetLink(publicId: string): Promise<string>;
  // createPrivateAssetLink(args: {
  //   publicId: string;
  //   duration: number;
  // }): Promise<string>;

  // createImageUploadSignature(
  //   user: User,
  //   filename?: string,
  // ): Promise<{
  //   signature: string;
  //   timestamp: number;
  //   uploadPreset: string;
  // }>;
  // createVideoUploadSignature(
  //   user: User,
  //   filename?: string,
  // ): Promise<{
  //   signature: string;
  //   timestamp: number;
  //   uploadPreset: string;
  // }>;
  // createAttachmentsUploadSignature(
  //   user: User,
  //   filename?: string,
  // ): Promise<{
  //   signature: string;
  //   timestamp: number;
  //   uploadPreset: string;
  // }>;
  // createAssetLink(args: {
  //   ip?: string;
  //   publicId: string;
  //   duration?: number;
  // }): Promise<string>;
  // verifyVideoUpload(public_id: string): Promise<number>;
  // verifyImageUpload(public_id: string): Promise<boolean>;
  // verifyAttachmentsUpload(
  //   ...public_ids: AttachmentsDto[]
  // ): Promise<string | boolean>;
  // verifyBulkImageUpload(...public_ids: string[]): Promise<string | boolean>;
}
