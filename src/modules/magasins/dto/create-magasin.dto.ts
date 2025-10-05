import { IsEmail, IsOptional, IsString, Length, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

const norm = (v: any) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : v);

export class CreateMagasinDto {
  @IsString()
  @Length(2, 120)
  @Transform(({ value }) => norm(value))
  name: string;

  @IsString()
  @Length(5, 255)
  @Transform(({ value }) => norm(value))
  address: string;

  @IsInt()
  centreId: number;

  @IsOptional()
  @IsString()
  @Length(5, 30)
  @Transform(({ value }) => (norm(value) || undefined))
  phone?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() || undefined : value))
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Transform(({ value }) => (norm(value) || undefined))
  externalRef?: string;
}