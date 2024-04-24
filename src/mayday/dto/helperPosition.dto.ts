import { IsString } from 'class-validator';
import { LocationDto } from './location.dto';

export class HelperPositionDto extends LocationDto {
  @IsString()
  userName?: string;
}
