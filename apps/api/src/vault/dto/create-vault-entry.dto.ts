import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum VaultCategoryDto {
  PROFILE = 'PROFILE',
  CONTACT = 'CONTACT',
  DOCUMENT = 'DOCUMENT',
  CREDENTIAL = 'CREDENTIAL',
  NOTE = 'NOTE',
  OTHER = 'OTHER',
}

export enum FieldTypeDto {
  TEXT = 'text',
  EMAIL = 'email',
  PASSWORD = 'password',
  URL = 'url',
  PHONE = 'phone',
  NUMBER = 'number',
  DATE = 'date',
  TEXTAREA = 'textarea',
}

export class VaultFieldDto {
  @IsString()
  @MinLength(1, { message: 'Field key cannot be empty' })
  @MaxLength(100, { message: 'Field key cannot exceed 100 characters' })
  fieldKey: string;

  @IsString()
  @MaxLength(10000, { message: 'Field value cannot exceed 10000 characters' })
  value: string;

  @IsOptional()
  @IsEnum(FieldTypeDto)
  fieldType?: FieldTypeDto;
}

export class CreateVaultEntryDto {
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title: string;

  @IsEnum(VaultCategoryDto)
  category: VaultCategoryDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VaultFieldDto)
  fields: VaultFieldDto[];
}
