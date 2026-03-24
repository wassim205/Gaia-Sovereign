import { IsNotEmpty, IsUUID } from 'class-validator';

export class RevokeTokenDto {
  @IsUUID()
  @IsNotEmpty()
  tokenId!: string;
}
