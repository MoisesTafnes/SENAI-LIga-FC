import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class BuyPlayerDto {
  @IsInt()
  @IsNotEmpty()
  club_id: number;

  @IsString()
  @IsNotEmpty()
  loyalty_until: string;
}
