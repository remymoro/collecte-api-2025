import { IsOptional, IsString, MinLength } from 'class-validator';


export class ResetPasswordDto {
  // si absent → on génère
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
