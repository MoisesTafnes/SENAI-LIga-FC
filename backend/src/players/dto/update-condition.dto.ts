import { IsString, IsIn } from 'class-validator';

export class UpdateConditionDto {
  @IsString()
  @IsIn(['APTO', 'MAL_CONDICIONADO', 'DOENTE'])
  condition: 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE';
}
