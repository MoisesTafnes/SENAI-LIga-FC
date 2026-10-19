import { IsInt, IsNumber, Min } from 'class-validator';

export class SellPlayerDto {
  @IsInt()
  seller_club_id: number;

  @IsInt()
  player_id: number;

  @IsNumber()
  @Min(0.01)
  sale_value: number;
}