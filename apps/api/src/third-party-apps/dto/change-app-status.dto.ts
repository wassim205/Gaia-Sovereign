import { IsEnum } from 'class-validator';

export class ChangeAppStatusDto {
  @IsEnum(['ACTIVE', 'BLOCKED'])
  status!: 'ACTIVE' | 'BLOCKED';
}
