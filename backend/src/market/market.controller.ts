import { Controller, Post, Param, Body, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { MarketService } from './market.service';
import { BuyPlayerDto } from './dto/buy-player.dto';

@Controller('players')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post(':id/buy')
  @HttpCode(HttpStatus.OK)
  async buyPlayer(
    @Param('id', ParseIntPipe) playerId: number,
    @Body() dto: BuyPlayerDto,
  ) {
    return this.marketService.buyPlayer(playerId, dto);
  }

  @Post(':id/sell')
  @HttpCode(HttpStatus.OK)
  async sellPlayer(@Param('id', ParseIntPipe) playerId: number) {
    return this.marketService.sellPlayer(playerId);
  }
}