import { IsEnum, IsInt, IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';
import type { Role } from 'src/modules/auth/interfaces/role.interface';
// ...existing code...
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_]{3,32}$/)
  login?: string;

  @IsOptional()
  @IsEnum(['ADMIN','CENTRE','VOLUNTEER'] as any)
  role?: Role;

  @ValidateIf(o => o.role && o.role !== 'ADMIN')
  @IsInt()
  @IsOptional()
  centreId?: number;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  isActive?: boolean;
}
