import { IsArray, IsOptional, IsString } from 'class-validator';

export class ApproveConsentRequestDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  approvedFields?: string[];
}
