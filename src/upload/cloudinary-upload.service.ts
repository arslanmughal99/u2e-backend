import {
  Logger,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AuthTokenApiOptions, v2 as cloudinary } from 'cloudinary';

import { AttachmentsDto } from './upload.dto';
import { UploadService } from './upload.port';

@Injectable()
export class CloudinaryUploadService {
  private exceptionMsg: string;
  private imageUploadPreset: string;
  private videoUploadPreset: string;
  private cloudinaryCloudName: string;
  private cloudinaryApiSecrect: string;
  private attachmentsUploadPreset: string;
  private logger = new Logger('UploadService');

  constructor(private configs: ConfigService) {
    this.attachmentsUploadPreset = this.configs.get(
      'CLOUDINARY_ATTACHEMENTS_UPLOAD_PRESET',
    );
    this.cloudinaryCloudName = this.configs.get('CLOUDINARY_CLOUD_NAME');
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
    this.cloudinaryApiSecrect = this.configs.get('CLOUDINARY_API_SECRET');
    this.imageUploadPreset = this.configs.get('CLOUDINARY_IMAGE_UPLOAD_PRESET');
    this.videoUploadPreset = this.configs.get('CLOUDINARY_VIDEO_UPLOAD_PRESET');

    cloudinary.config({
      cloud_name: this.cloudinaryCloudName,
      api_secret: this.cloudinaryApiSecrect,
      api_key: this.configs.get('CLOUDINARY_API_KEY'),
    });
  }

  /**
   * @description check if video exist on cloudinary
   * @param public_id Cloudinary video upload public_id
   */
  async verifyVideoUpload(public_id: string): Promise<number> {
    try {
      const res = await cloudinary.uploader.explicit(public_id, {
        image_metadata: true,
        type: 'authenticated',
        resource_type: 'video',
      });
      return res.video_duration;
    } catch (err) {
      if (err.http_code === HttpStatus.NOT_FOUND) return;

      this.logger.error('failed to verify lecture video upload', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param public_ids Cloudinary public_ids for attachments
   * @description Verify attachments upload and return failed attachments
   */
  async verifyAttachmentsUpload(...public_ids: AttachmentsDto[]) {
    try {
      const checkAssets = public_ids.map(async (pid) => {
        try {
          const res = await cloudinary.uploader.explicit(pid.id, {
            type: 'authenticated',
          });

          return { ...pid, res };
        } catch (err) {
          this.logger.warn(`failed to verify attachment ${pid.name}:${pid.id}`);
          return err;
        }
      });

      const res = await Promise.all(checkAssets);

      const failedAttachments = res.filter(
        (a) =>
          a.res && a.res.http_code && a.res.http_code === HttpStatus.NOT_FOUND,
      );

      if (failedAttachments.length > 0) {
        return failedAttachments.map((f) => f.name).join(',');
      }

      return true;
    } catch (err) {
      this.logger.error('failed to verify lecture attachments upload', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param public_id Cloudinary public_ids for image
   * @description Verify image upload
   */
  async verifyImageUpload(public_id: string) {
    try {
      const res = await cloudinary.uploader.explicit(public_id, {
        type: 'authenticated',
        resource_type: 'image',
      });
      this.logger.debug('**** Verify image upload *****');
      this.logger.debug(res);
      return true;
    } catch (err) {
      if (err.http_code === HttpStatus.NOT_FOUND) return false;
      this.logger.error('failed to verify image upload', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param public_id Cloudinary public_ids for image
   * @description Verify image upload
   */
  async verifyBulkImageUpload(...public_ids: string[]) {
    try {
      const checkImages = public_ids.map(async (pid) => {
        try {
          return await cloudinary.uploader.explicit(pid, {
            type: 'authenticated',
          });
        } catch (err) {
          return err;
        }
      });

      const res = await Promise.all(checkImages);

      const failedAttachments = res.filter(
        (a) => a.http_code && a.http_code === HttpStatus.NOT_FOUND,
      );

      if (failedAttachments.length > 0) {
        return failedAttachments.map((f) => f.message).join(',');
      }
      return true;
    } catch (err) {
      if (err.http_code === HttpStatus.NOT_FOUND) return false;
      this.logger.error('failed to verify bulk image upload', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description create sign token for uploading image
   */
  async createImageUploadSignature(user: User) {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        source: 'uw',
        folder: user.username,
        upload_preset: this.imageUploadPreset,
      },
      this.cloudinaryApiSecrect,
    );

    return { signature, timestamp, uploadPreset: this.imageUploadPreset };
  }

  /**
   * @description create sign token for uploading video
   */
  async createVideoUploadSignature(user: User) {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        source: 'uw',
        folder: user.username,
        upload_preset: this.videoUploadPreset,
      },
      this.cloudinaryApiSecrect,
    );

    return { signature, timestamp, uploadPreset: this.videoUploadPreset };
  }

  /**
   * @description create sign token for uploading attachments
   */
  async createAttachmentsUploadSignature(user: User) {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        source: 'uw',
        folder: user.username,
        upload_preset: this.attachmentsUploadPreset,
      },
      this.cloudinaryApiSecrect,
    );

    return { signature, timestamp, uploadPreset: this.attachmentsUploadPreset };
  }

  /**
   * @param ip public ip of user
   * @returns authenticated asse URL
   * @param publicId public id of asset
   * @description create authenticated URL for an asset
   */
  async createAssetLink(args: {
    publicId: string;
    ip?: string;
    duration?: number;
  }) {
    const { publicId, duration, ip } = args;
    const _duration = 60 * 10; // 10mins
    const auth_token: Partial<AuthTokenApiOptions> = {
      key: publicId,
      duration: _duration,
    };

    if (ip) auth_token.ip = ip;
    if (duration) auth_token.duration = duration;

    const url = cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      type: 'authenticated',
      auth_token: ip ? auth_token : undefined,
    });
    return url;
  }
}
