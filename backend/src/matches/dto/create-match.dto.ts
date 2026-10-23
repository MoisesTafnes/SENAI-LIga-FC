import { IsInt, IsPositive, IsNotEmpty } from 'class-validator';

export class CreateMatchDto {
  @IsInt({ message: 'home_club_id deve ser um número inteiro.' })
  @IsPositive({ message: 'home_club_id deve ser um inteiro positivo.' })
  @IsNotEmpty({ message: 'home_club_id é obrigatório.' })
  home_club_id: number;

  @IsInt({ message: 'away_club_id deve ser um número inteiro.' })
  @IsPositive({ message: 'away_club_id deve ser um inteiro positivo.' })
  @IsNotEmpty({ message: 'away_club_id é obrigatório.' })
  away_club_id: number;
}
