import { PartialType } from '@nestjs/mapped-types';
import { CreateVaultEntryDto } from './create-vault-entry.dto';

export class UpdateVaultEntryDto extends PartialType(CreateVaultEntryDto) {}
