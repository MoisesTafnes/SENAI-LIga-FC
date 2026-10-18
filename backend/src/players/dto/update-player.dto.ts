import { IsString, IsInt, Min, Max, IsIn, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import type { PlayerPosition } from '../domain/player-calculator.domain';

export class UpdatePlayerDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value))
  @Length(3, 100)
  @Matches(/^[a-zA-ZÀ-ÿ\s-]+$/, {
    message: 'O nome deve conter apenas letras, espaços e hífens',
  })
  name: string;

  @IsString()
  @IsIn(['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'])
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
