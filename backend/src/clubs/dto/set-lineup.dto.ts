import {
  IsArray,
  IsEnum,
  IsInt,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayUnique,
} from 'class-validator';

export enum LineupFormation {
  F_3_1 = '3-1',
  F_2_2 = '2-2',
  F_2_1_1 = '2-1-1',
  F_1_2_1 = '1-2-1',
}

export class SetLineupDto {
  @IsEnum(LineupFormation, {
    message: 'Formação inválida. Valores aceitos: 3-1, 2-2, 2-1-1, 1-2-1.',
  })
  formation: LineupFormation;

  @IsArray({ message: 'player_ids deve ser uma lista de IDs.' })
  @ArrayMinSize(5, {
    message: 'A escalação deve conter exatamente 5 jogadores.',
  })
  @ArrayMaxSize(5, {
    message: 'A escalação deve conter exatamente 5 jogadores.',
  })
  @ArrayUnique({
    message: 'Os IDs dos jogadores escalados não podem ser repetidos.',
  })
  @IsInt({
    each: true,
    message: 'Cada elemento de player_ids deve ser um número inteiro.',
  })
  player_ids: number[];
}
