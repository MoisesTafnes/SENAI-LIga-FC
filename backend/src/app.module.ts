import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database';
import { PlayersModule } from './players/players.module';
import { ClubsModule } from './clubs/clubs.module';
import { MarketModule } from './market/market.module';

@Module({
  imports: [PrismaModule, PlayersModule, ClubsModule, MarketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}