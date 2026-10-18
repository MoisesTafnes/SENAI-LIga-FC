import { IsOptional, IsString, IsInt, IsIn, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import type { PlayerPosition, PlayerCondition } from '../domain/player-calculator.domain';

export class QueryPlayersDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'])
  position?: PlayerPosition;

  @IsOptional()
  @IsString()
  @IsIn(['APTO', 'MAL_CONDICIONADO', 'DOENTE'])
  condition?: PlayerCondition;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_value?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_value?: number;

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
  @IsInt()
  club_id?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  free?: boolean;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}