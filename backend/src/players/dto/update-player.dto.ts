import { IsString, IsEnum, IsInt, Min, Max, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { PlayerPosition } from '../domain/player-calculator.domain';

export class UpdatePlayerDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value))
  @Length(3, 100)
  @Matches(/^[a-zA-ZÀ-ÿ\s-]+$/)
  name: string;

  @IsEnum(['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'])
  position: PlayerPosition;

  @IsInt()
  @Min(1)
  @Max(100)
  agility: number;

  @IsInt()
  @Min(16)
  @Max(45)
  age: number;
}