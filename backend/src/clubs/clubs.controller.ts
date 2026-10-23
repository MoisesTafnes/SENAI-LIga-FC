import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Response,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { MarketService } from '../market/market.service';
import { CreateClubDto } from './dto/create-club.dto';
import { QueryClubsDto } from './dto/query-clubs.dto';
import { SetLineupDto } from './dto/set-lineup.dto';
import { QueryTransactionsDto } from '../market/dto/query-transactions.dto';
import { ResourceIdPipe } from '../common/pipes/resource-id.pipe';

@ApiTags('Clubes')
@Controller('clubs')
export class ClubsController {
  constructor(
    private readonly clubsService: ClubsService,
    private readonly marketService: MarketService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar clube' })
  @ApiResponse({ status: 201, description: 'Clube criado com caixa inicial.' })
  @ApiResponse({ status: 409, description: 'Nome ou sigla já cadastrados.' })
  async create(
    @Body() dto: CreateClubDto,
    @Response({ passthrough: true }) res: any,
  ) {
    const club = await this.clubsService.create(dto);
    res.setHeader('Location', `/api/v1/clubs/${club.id}`);
    return club;
  }

  @Get()
  @ApiOperation({ summary: 'Listar e ordenar clubes' })
  findAll(@Query() query: QueryClubsDto) {
    return this.clubsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar clube e elenco' })
  findOne(@Param('id', ResourceIdPipe) id: number) {
    return this.clubsService.findOne(id);
  }

  @Put(':id/lineup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Definir escalação completa do clube' })
  updateLineup(
    @Param('id', ResourceIdPipe) id: number,
    @Body() dto: SetLineupDto,
  ) {
    return this.clubsService.updateLineup(id, dto);
  }

  @Get(':id/lineup')
  @ApiOperation({ summary: 'Consultar escalação do clube' })
  getLineup(@Param('id', ResourceIdPipe) id: number) {
    return this.clubsService.getLineup(id);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Consultar histórico e resumo de transações' })
  getTransactions(
    @Param('id', ResourceIdPipe) id: number,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.marketService.getTransactionsByClub(
      id,
      query.type,
      query.player_id,
    );
  }

  @Get(':id/transactions/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({ summary: 'Exportar histórico de transações em CSV' })
  async exportTransactions(
    @Param('id', ResourceIdPipe) id: number,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.marketService.exportTransactionsCsv(
      id,
      query.type,
      query.player_id,
    );
  }
}
