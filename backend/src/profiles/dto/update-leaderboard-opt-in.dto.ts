import { IsBoolean } from 'class-validator';

export class UpdateLeaderboardOptInDto {
  @IsBoolean()
  optIn: boolean;
}
