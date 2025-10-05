import { IsString, Length } from 'class-validator';

export class CreateProduitDto {
  @IsString()
  @Length(8, 14)
  gtin: string;

  @IsString()
  @Length(2, 32)
  family: string;

  @IsString()
  @Length(2, 32)
  subFamily: string;
}