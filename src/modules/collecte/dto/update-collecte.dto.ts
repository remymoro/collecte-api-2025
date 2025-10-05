import { PartialType } from '@nestjs/mapped-types';
import { CreateCollecteDto } from './create-collecte.dto';

export class UpdateCollecteDto extends PartialType(CreateCollecteDto) {}
