import { Injectable } from '@nestjs/common';

@Injectable()
export class OrganizationService {
  // constructor(
  //   private userRepository: UserRepository,
  //   private orgRepository: OrganizationRepository,
  // ) {}
  // async createInstructor(dto: CreateInstructorDto, orgAdmin: User) {
  //   const org = await this.orgRepository.getOrgByAdmin(orgAdmin);
  //   const instructor = await this.userRepository.createInstructor(dto, org);
  //   // Striping confidential and internaly instructor data
  //   delete instructor.hash;
  //   delete instructor.salt;
  //   delete instructor.createdAt;
  //   delete instructor.updatedAt;
  // }
}
