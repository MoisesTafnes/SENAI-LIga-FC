import { IsOptional, IsString, IsEnum, IsBoolean, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PlayerPosition, PlayerCondition } from '../domain/player-calculator.domain';

export class QueryPlayersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'])
  position?: PlayerPosition;

  @IsOptional()
  @IsEnum(['APTO', 'MAL_CONDICIONADO', 'DOENTE'])
  condition?: PlayerCondition;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  free?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  club_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(16)
  @Max(45)
  min_age?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(16)
  @Max(45)
  max_age?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_value?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_value?: number;

  @IsOptional()
  @IsString()
  sort?: string = 'name';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}