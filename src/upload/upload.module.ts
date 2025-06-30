import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UPLOAD_SERVICE } from './upload.port';
import { S3UploadService } from './s3-upload.service';
import { UploadController } from './upload.controller';
import codes, { ERROR_CODES_TOKEN, ErrorCodes } from '../errors';
// import { CloudinaryUploadService } from './cloudinary-upload.service';

enum UploadServiceType {
  S3 = 's3',
  Cloudinary = 'Cloudinary',
}

@Module({
  imports: [],
  exports: [UPLOAD_SERVICE],
  controllers: [UploadController],
  providers: [
    {
      provide: UPLOAD_SERVICE,
      useFactory: (config: ConfigService, errorCodes: ErrorCodes) => {
        const serviceType = config.getOrThrow('UPLOAD_SERVICE_TYPE');
        switch (serviceType) {
          case UploadServiceType.S3:
            return new S3UploadService(config, errorCodes);
          // case UploadServiceType.Cloudinary:
          //   return new CloudinaryUploadService(config,  errorCodes: ErrorCodes);
        }
      },

      inject: [ConfigService, ERROR_CODES_TOKEN],
    },
    { provide: ERROR_CODES_TOKEN, useValue: codes },
  ],
})
export class UploadModule {}
