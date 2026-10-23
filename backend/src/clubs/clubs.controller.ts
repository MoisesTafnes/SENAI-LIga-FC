import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Response,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { MarketService } from '../market/market.service';
import { CreateClubDto } from './dto/create-club.dto';
import { QueryClubsDto } from './dto/query-clubs.dto';
import { SetLineupDto } from './dto/set-lineup.dto';
import { QueryTransactionsDto } from '../market/dto/query-transactions.dto';

@Controller('clubs')
export class ClubsController {
  constructor(
    private readonly clubsService: ClubsService,
    private readonly marketService: MarketService,
  ) {}

  @Post()
  async create(@Body() dto: CreateClubDto, @Response({ passthrough: true }) res: any) {
    const club = await this.clubsService.create(dto);
    res.setHeader('Location', `/api/v1/clubs/${club.id}`);
    return club;
  }

  @Get()
  findAll(@Query() query: QueryClubsDto) {
    return this.clubsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clubsService.findOne(id);
  }

  @Put(':id/lineup')
  @HttpCode(HttpStatus.OK)
  updateLineup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetLineupDto,
  ) {
    return this.clubsService.updateLineup(id, dto);
  }

  @Get(':id/lineup')
  getLineup(@Param('id', ParseIntPipe) id: number) {
    return this.clubsService.getLineup(id);
  }

  @Get(':id/transactions')
  getTransactions(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.marketService.getTransactionsByClub(id, query.type, query.player_id);
  }

  @Get(':id/transactions/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportTransactions(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.marketService.exportTransactionsCsv(id, query.type, query.player_id);
  }
}