import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Response,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';
import { QueryPlayersDto } from './dto/query-players.dto';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  async create(@Body() dto: CreatePlayerDto, @Response({ passthrough: true }) res: any) {
    const player = await this.playersService.create(dto);
    res.setHeader('Location', `/api/v1/players/${player.id}`);
    return player;
  }

  @Get()
  findAll(@Query() query: QueryPlayersDto) {
    return this.playersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePlayerDto) {
    return this.playersService.update(id, dto);
  }

  @Patch(':id/condition')
  updateCondition(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateConditionDto) {
    return this.playersService.updateCondition(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.remove(id);
  }
}