import { PartialType } from '@nestjs/mapped-types';
import { CreateMaydayDto } from './create-mayday.dto';

export class UpdateMaydayDto extends PartialType(CreateMaydayDto) {}
