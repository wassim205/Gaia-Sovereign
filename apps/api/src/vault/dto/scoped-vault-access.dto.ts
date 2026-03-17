import { IsArray, IsString, IsOptional } from 'class-validator';

export class ScopedVaultAccessDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requestedFields?: string[];
}
