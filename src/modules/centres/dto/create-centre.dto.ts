import { IsString, IsOptional, IsEmail, Length, Matches, MinLength } from 'class-validator';

export class CreateCentreDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsString()
  @Length(5, 180)
  address: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  @Matches(/^[0-9+ ]*$/, { message: 'Le téléphone doit contenir uniquement des chiffres, espaces ou +' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'La référence externe doit contenir au moins 1 caractère' })
  externalRef?: string;
}
