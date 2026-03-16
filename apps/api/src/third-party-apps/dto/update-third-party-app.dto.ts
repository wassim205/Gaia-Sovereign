import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsValidRedirectUriArray } from '../decorators/is-valid-redirect-uri.decorator';

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
  @IsValidRedirectUriArray()
  redirectUris?: string[];
}
