import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database';
import { PlayersModule } from './players/players.module';

@Module({
  imports: [PrismaModule, PlayersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}