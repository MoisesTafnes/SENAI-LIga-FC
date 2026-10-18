import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PlayerPosition } from '../domain/player-calculator.domain';

export class CreatePlayerDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value))
  @Length(3, 100)
  @Matches(/^[a-zA-ZÀ-ÿ\s-]+$/, {
    message: 'O nome deve conter apenas letras, espaços e hifens',
  })
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

  @IsInt() @Min(1) @Max(99) pace: number;
  @IsInt() @Min(1) @Max(99) shooting: number;
  @IsInt() @Min(1) @Max(99) passing: number;
  @IsInt() @Min(1) @Max(99) dribbling: number;
  @IsInt() @Min(1) @Max(99) defending: number;
  @IsInt() @Min(1) @Max(99) physical: number;

  @IsInt()
  @Min(1)
  @Max(99)
  potential: number;
}