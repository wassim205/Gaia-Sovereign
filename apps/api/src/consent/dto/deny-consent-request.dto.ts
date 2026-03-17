import { IsOptional, IsString } from 'class-validator';

export class DenyConsentRequestDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
