import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateThirdPartyAppDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  redirectUris?: string[];
}
