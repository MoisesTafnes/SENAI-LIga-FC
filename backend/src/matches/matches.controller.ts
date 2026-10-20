import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseIntPipe,
  Response,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';

@Controller()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('matches')
  @HttpCode(HttpStatus.CREATED)
  async simulateMatch(
    @Body() dto: CreateMatchDto,
    @Response({ passthrough: true }) res: any,
  ) {
    const match = await this.matchesService.simulateMatch(dto);
    res.setHeader('Location', `/api/v1/matches/${match.id}`);
    return match;
  }

  @Get('matches')
  async findAll(@Query('club_id') clubId?: string) {
    const parsedClubId = clubId ? parseInt(clubId, 10) : undefined;
    return this.matchesService.findAll(parsedClubId);
  }

  @Get('matches/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.findOne(id);
  }

  @Get('standings')
  async getStandings() {
    return this.matchesService.getStandings();
  }
}