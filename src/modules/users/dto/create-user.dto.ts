import { IsEnum, IsInt, IsOptional, IsString, Matches, MinLength, ValidateIf, IsBoolean } from 'class-validator';
import type { Role } from 'src/modules/auth/interfaces/role.interface';

export class CreateUserDto {
  @IsString()
  @Matches(/^[a-z0-9_]{3,32}$/)
  login: string;

  @IsEnum(['ADMIN','CENTRE','VOLUNTEER'] as any)
  role: Role;

  @ValidateIf(o => o.role !== 'ADMIN')
  @IsInt()
  centreId?: number;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
