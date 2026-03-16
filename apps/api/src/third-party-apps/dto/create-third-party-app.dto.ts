import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsValidRedirectUriArray } from '../decorators/is-valid-redirect-uri.decorator';

export class CreateThirdPartyAppDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsValidRedirectUriArray()
  redirectUris!: string[];
}
