import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateThirdPartyAppDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  redirectUris!: string[];
}
