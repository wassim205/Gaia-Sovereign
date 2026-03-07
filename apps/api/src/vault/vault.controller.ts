import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VaultService } from './vault.service';
import { CreateVaultEntryDto } from './dto/create-vault-entry.dto';
import { UpdateVaultEntryDto } from './dto/update-vault-entry.dto';
import { QueryVaultEntriesDto } from './dto/query-vault-entries.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';
import { UsersService } from 'src/users/users.service';

@Controller('vault')
@UseGuards(JwtAuthGuard)
export class VaultController {
  constructor(
    private readonly vaultService: VaultService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createVaultEntryDto: CreateVaultEntryDto,
  ) {
    // Get user's master key
    const fullUser = await this.usersService.findById(user.id);
    const masterKey = fullUser?.encryptedMasterKey || '';

    const entry = await this.vaultService.create(
      user.id,
      masterKey,
      createVaultEntryDto,
    );

    return {
      message: 'Vault entry created successfully',
      data: entry,
    };
  }

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query() query: QueryVaultEntriesDto,
  ) {
    const fullUser = await this.usersService.findById(user.id);
    const masterKey = fullUser?.encryptedMasterKey || '';

    return this.vaultService.findAll(user.id, masterKey, query);
  }

  @Get('categories/counts')
  async getCategoryCounts(@CurrentUser() user: CurrentUserData) {
    return this.vaultService.getCategoryCounts(user.id);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const fullUser = await this.usersService.findById(user.id);
    const masterKey = fullUser?.encryptedMasterKey || '';

    return this.vaultService.findOne(user.id, masterKey, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() updateVaultEntryDto: UpdateVaultEntryDto,
  ) {
    const fullUser = await this.usersService.findById(user.id);
    const masterKey = fullUser?.encryptedMasterKey || '';

    const entry = await this.vaultService.update(
      user.id,
      masterKey,
      id,
      updateVaultEntryDto,
    );

    return {
      message: 'Vault entry updated successfully',
      data: entry,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.vaultService.remove(user.id, id);
  }
}
