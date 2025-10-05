import { IsInt, IsOptional, IsString, IsDateString, IsIn, MaxLength, IsEnum, Max, Min } from 'class-validator';
import { CollecteStatus } from '../enums/collecte-status.enum';


export class CreateCollecteDto {
  @IsInt() @Min(2020) @Max(2100)
  year: number;

  @IsOptional() title?: string;
  @IsOptional() slug?: string;

  @IsOptional() @IsDateString()
  defaultStartAt?: Date;

  @IsOptional() @IsDateString()
  defaultEndAt?: Date;

  @IsOptional() @IsDateString()
  graceUntil?: Date;

  @IsOptional() @IsDateString()
  lockedAt?: Date;

  @IsOptional() @IsEnum(CollecteStatus)
  status?: CollecteStatus;
}
