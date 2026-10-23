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
  Response,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';
import { QueryPlayersDto } from './dto/query-players.dto';
import { ResourceIdPipe } from '../common/pipes/resource-id.pipe';

@ApiTags('Jogadores')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar jogador' })
  @ApiResponse({ status: 201, description: 'Jogador cadastrado.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async create(
    @Body() dto: CreatePlayerDto,
    @Response({ passthrough: true }) res: any,
  ) {
    const player = await this.playersService.create(dto);
    res.setHeader('Location', `/api/v1/players/${player.id}`);
    return player;
  }

  @Get()
  @ApiOperation({ summary: 'Listar e filtrar jogadores' })
  findAll(@Query() query: QueryPlayersDto) {
    return this.playersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar jogador' })
  @ApiResponse({ status: 404, description: 'Jogador não encontrado.' })
  findOne(@Param('id', ResourceIdPipe) id: number) {
    return this.playersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Editar jogador' })
  update(
    @Param('id', ResourceIdPipe) id: number,
    @Body() dto: UpdatePlayerDto,
  ) {
    return this.playersService.update(id, dto);
  }

  @Patch(':id/condition')
  @ApiOperation({ summary: 'Alterar condição física do jogador' })
  updateCondition(
    @Param('id', ResourceIdPipe) id: number,
    @Body() dto: UpdateConditionDto,
  ) {
    return this.playersService.updateCondition(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir logicamente jogador livre' })
  @ApiResponse({ status: 204, description: 'Jogador excluído.' })
  remove(@Param('id', ResourceIdPipe) id: number) {
    return this.playersService.remove(id);
  }
}
