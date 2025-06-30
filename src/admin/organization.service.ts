// import {
//   Inject,
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { isString } from 'class-validator';

// import {
//   AdminListOrganizationDto,
//   AdminUpdateOrganizationDto,
//   AdminCreateOrganizationDto,
// } from './dto/organization.dto';
// import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';
// import { OrganizationRepository } from '../repository/organization.repository';

// @Injectable()
// export class AdminOrgService {
//   constructor(
//     private orgRepository: OrganizationRepository,
//     @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
//   ) {}

//   /**
//    * @description create organization by admin
//    */
//   async createOrganization(dto: AdminCreateOrganizationDto) {
//     const { coverImage } = dto;

//     if (coverImage) {
//       const coverImgExist = await this.uploadService.verifyImageUpload(
//         coverImage,
//       );
//       if (!coverImgExist)
//         throw new NotFoundException('Cover image does not exist.');
//     }

//     const org = await this.orgRepository.createOrganization(dto);
//     org.coverImage = await this.uploadService.createAssetLink({
//       publicId: org.coverImage,
//     });

//     return org;
//   }

//   /**
//    * @description update organization by admin
//    */
//   async updateOrganization(dto: AdminUpdateOrganizationDto) {
//     const { coverImage, description } = dto;

//     if (!isString(description) && description !== null) {
//       throw new BadRequestException('Invalid description.');
//     }

//     if (!isString(coverImage) && coverImage !== null) {
//       throw new BadRequestException('Invalid cover image.');
//     }

//     if (isString(coverImage)) {
//       const coverImgExist = await this.uploadService.verifyImageUpload(
//         coverImage,
//       );
//       if (!coverImgExist)
//         throw new NotFoundException('Cover image does not exist.');
//     }

//     const org = await this.orgRepository.updateOrganization(dto);
//     org.coverImage = await this.uploadService.createAssetLink({
//       publicId: org.coverImage,
//     });

//     return org;
//   }

//   async listOrganization(dto: AdminListOrganizationDto) {
//     const o = await this.orgRepository.listOrganizations(dto);
//     o.organizations = await Promise.all(
//       o.organizations.map(async (org) => {
//         org.coverImage = await this.uploadService.createAssetLink({
//           publicId: org.coverImage,
//         });

//         return org;
//       }),
//     );

//     return o;
//   }
// }
