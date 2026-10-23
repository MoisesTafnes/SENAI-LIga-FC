import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Response,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { QueryMatchesDto } from './dto/query-matches.dto';
import { ResourceIdPipe } from '../common/pipes/resource-id.pipe';

@ApiTags('Liga')
@Controller()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('matches')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Simular e registrar partida' })
  @ApiResponse({
    status: 201,
    description: 'Partida registrada com seus seis duelos.',
  })
  async simulateMatch(
    @Body() dto: CreateMatchDto,
    @Response({ passthrough: true }) res: any,
  ) {
    const match = await this.matchesService.simulateMatch(dto);
    res.setHeader('Location', `/api/v1/matches/${match.id}`);
    return match;
  }

  @Get('matches')
  @ApiOperation({ summary: 'Listar partidas, opcionalmente por clube' })
  async findAll(@Query() query: QueryMatchesDto) {
    return this.matchesService.findAll(query.club_id);
  }

  @Get('matches/:id')
  @ApiOperation({ summary: 'Consultar partida e seus seis duelos' })
  async findOne(@Param('id', ResourceIdPipe) id: number) {
    return this.matchesService.findOne(id);
  }

  @Get('standings')
  @ApiOperation({ summary: 'Consultar classificação da liga' })
  async getStandings() {
    return this.matchesService.getStandings();
  }
}
