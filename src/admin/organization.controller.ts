// import {
//   Get,
//   Body,
//   Post,
//   Patch,
//   Query,
//   UseGuards,
//   Controller,
// } from '@nestjs/common';
// import { UserRole } from '@prisma/client';

// import {
//   AdminListOrganizationDto,
//   AdminCreateOrganizationDto,
//   AdminUpdateOrganizationDto,
// } from './dto/organization.dto';
// import { RoleGuard } from '../auth/role.guard';
// import { Roles } from '../auth/roles.decorator';
// import { JwtAuthGuard } from '../auth/jwt.guard';
// import { AdminOrgService } from './organization.service';

// @Controller('admin/organization')
// @UseGuards(JwtAuthGuard, RoleGuard)
// export class OrgController {
//   constructor(private organizationService: AdminOrgService) {}

//   @Post()
//   @Roles(UserRole.Admin)
//   async createOrganization(@Body() dto: AdminCreateOrganizationDto) {
//     const res = await this.organizationService.createOrganization(dto);
//     return res;
//   }

//   @Patch()
//   @Roles(UserRole.Admin)
//   async updateOrganization(@Body() dto: AdminUpdateOrganizationDto) {
//     const res = await this.organizationService.updateOrganization(dto);
//     return res;
//   }

//   @Get()
//   @Roles(UserRole.Admin)
//   async listOrganization(@Query() dto: AdminListOrganizationDto) {
//     const res = await this.organizationService.listOrganization(dto);
//     return res;
//   }
// }
