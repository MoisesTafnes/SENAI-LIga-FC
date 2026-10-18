import { IsOptional, IsEnum } from 'class-validator';

export class QueryClubsDto {
  @IsOptional()
  @IsEnum(['name', 'net_worth_asc', 'net_worth_desc'])
  sort?: string = 'name';
}