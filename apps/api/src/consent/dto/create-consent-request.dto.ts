import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConsentRequestDto {
  @IsString()
  @MaxLength(64)
  clientId!: string;

  @IsString()
  clientSecret!: string;

  @IsString()
  redirectUri!: string;

  @IsArray()
  @IsString({ each: true })
  requestedFields!: string[];

  @IsOptional()
  @IsString()
  state?: string;
}
