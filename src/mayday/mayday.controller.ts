import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MaydayService } from './mayday.service';
import { CreateMaydayDto } from './dto/create-mayday.dto';
import { UpdateMaydayDto } from './dto/update-mayday.dto';

@Controller('mayday')
export class MaydayController {
  constructor(private readonly maydayService: MaydayService) {}
}
