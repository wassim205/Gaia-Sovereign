import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { VaultCategoryDto, VaultFieldDto } from './create-vault-entry.dto';

export class UpdateVaultEntryDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title?: string;

  @IsOptional()
  @IsEnum(VaultCategoryDto)
  category?: VaultCategoryDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VaultFieldDto)
  fields?: VaultFieldDto[];
}
