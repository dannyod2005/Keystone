import { IsString, MinLength } from 'class-validator';

export class JoinProviderDto {
  @IsString()
  @MinLength(1)
  inviteCode: string;
}
