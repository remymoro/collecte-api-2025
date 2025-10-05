import { PartialType } from '@nestjs/mapped-types';
import { CreateMagasinDto } from './create-magasin.dto';

export class UpdateMagasinDto extends PartialType(CreateMagasinDto) {}