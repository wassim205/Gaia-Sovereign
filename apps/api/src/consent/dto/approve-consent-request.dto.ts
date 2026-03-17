import { IsArray, IsOptional, IsString, ArrayMinSize } from 'class-validator';

export class ApproveConsentRequestDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one field must be approved' })
  @IsString({ each: true, message: 'Each approved field must be a string' })
  approvedFields?: string[];
}
