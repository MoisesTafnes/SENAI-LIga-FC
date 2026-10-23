import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MarketService } from './market.service';
import { BuyPlayerDto } from './dto/buy-player.dto';
import { ResourceIdPipe } from '../common/pipes/resource-id.pipe';

@ApiTags('Mercado')
@Controller('players')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post(':id/buy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Comprar jogador para um clube' })
  @ApiResponse({ status: 200, description: 'Compra concluída.' })
  @ApiResponse({
    status: 409,
    description: 'Compra recusada por regra de negócio.',
  })
  async buyPlayer(
    @Param('id', ResourceIdPipe) playerId: number,
    @Body() dto: BuyPlayerDto,
  ) {
    return this.marketService.buyPlayer(playerId, dto);
  }

  @Post(':id/sell')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vender jogador do clube atual' })
  async sellPlayer(@Param('id', ResourceIdPipe) playerId: number) {
    return this.marketService.sellPlayer(playerId);
  }
}
