import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, Response } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { QueryClubsDto } from './dto/query-clubs.dto';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

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
}