import { IsNotEmpty, IsString } from 'class-validator';

export class AttachmentsDto {
  @IsString({ message: 'Invalid attachment id.' })
  @IsNotEmpty({ message: 'Attachment id is required.' })
  id: string;

  @IsString({ message: 'Invalid attachment name.' })
  @IsNotEmpty({ message: 'Attachment name is required.' })
  name: string;
}

export interface AttachmentWithName {
  id: string;
  name: string;
}
