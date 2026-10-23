import { IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateClubDto {
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @Length(3, 60)
  @Matches(/^[a-zA-ZÀ-ÿ\s.-]+$/, {
    message:
      'O nome do clube deve conter apenas letras, espaços, hífens e pontos.',
  })
  name: string;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'A sigla deve conter exatamente 3 letras maiúsculas de A a Z.',
  })
  acronym: string;
}
