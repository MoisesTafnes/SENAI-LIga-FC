import { IsEnum } from 'class-validator';
import { PlayerCondition } from '../domain/player-calculator.domain';

export class UpdateConditionDto {
  @IsEnum(['APTO', 'MAL_CONDICIONADO', 'DOENTE'])
  condition: PlayerCondition;
}