import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database';
import { BuyPlayerDto } from './dto/buy-player.dto';
import { PlayerCalculatorDomain, PlayerCondition } from '../players/domain/player-calculator.domain';

@Injectable()
export class MarketService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * RN12 & RN13 - Compra de Jogador (POST /players/:id/buy)
   */
  async buyPlayer(playerId: number, dto: BuyPlayerDto) {
    const { club_id, loyalty_until } = dto;

    const buyerClub = await this.prisma.clube.findUnique({
      where: { id: club_id },
      include: {
        jogadores: {
          where: { excluidoEm: null },
        },
      },
    });

    if (!buyerClub) {
      throw new NotFoundException('Clube comprador não encontrado.');
    }

    if (buyerClub.jogadores.length >= 12) {
      throw new ConflictException('O clube comprador já atingiu o limite máximo de 12 jogadores no elenco.');
    }

    const player = await this.prisma.jogador.findFirst({
      where: { id: playerId, excluidoEm: null },
      include: {
        contratos: {
          where: { situacao: 'ATIVO' },
          take: 1,
        },
      },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado.');
    }

    if (player.condicao === 'DOENTE') {
      throw new ConflictException('Jogadores doentes não podem ser transferidos.');
    }

    if (player.clubeId === club_id) {
      throw new ConflictException('O jogador já pertence a este clube.');
    }

    const marketValue = PlayerCalculatorDomain.calculateMarketValue(
      Number(player.valorBase),
      player.condicao as PlayerCondition,
      player.agilidade,
      player.idade,
    );

    const leagueFee = marketValue > 30.00
      ? PlayerCalculatorDomain.roundHalfAwayFromZero(marketValue * 0.05, 2)
      : 0.00;

    const totalCost = PlayerCalculatorDomain.roundHalfAwayFromZero(marketValue + leagueFee, 2);

    const currentCash = Number(buyerClub.caixa);
    const maxAllowedCost = currentCash * 0.50;

    if (totalCost > maxAllowedCost) {
      throw new ConflictException(
        `O custo total da operação (${totalCost.toFixed(2)}) excede o limite de 50% do caixa disponível (${maxAllowedCost.toFixed(2)}).`,
      );
    }

    const sellerClubId = player.clubeId;
    const now = new Date();
    const loyaltyUntilDate = new Date(loyalty_until);

    return this.prisma.$transaction(async (tx) => {
      await tx.clube.update({
        where: { id: club_id },
        data: { caixa: currentCash - totalCost },
      });

      if (sellerClubId) {
        const sellerClub = await tx.clube.findUnique({ where: { id: sellerClubId } });
        if (sellerClub) {
          await tx.clube.update({
            where: { id: sellerClubId },
            data: { caixa: Number(sellerClub.caixa) + marketValue },
          });
        }
      }

      const activeContract = player.contratos && player.contratos.length > 0 ? player.contratos[0] : null;
      if (activeContract) {
        await tx.contrato.update({
          where: { id: activeContract.id },
          data: { situacao: 'ENCERRADO', encerradoEm: now },
        });
      }

      const newContract = await tx.contrato.create({
        data: {
          jogadorId: player.id,
          clubeId: club_id,
          valorCompra: marketValue,
          iniciadoEm: now,
          fidelidadeAte: loyaltyUntilDate,
          situacao: 'ATIVO',
        },
      });

      await tx.jogador.update({
        where: { id: player.id },
        data: { clubeId: club_id },
      });

      const transactionRecord = await tx.transacao.create({
        data: {
          tipo: 'COMPRA',
          clubeId: club_id,
          jogadorId: player.id,
          nomeJogador: player.nome,
          valor: marketValue,
          taxa: leagueFee,
          multa: 0.00,
          lucro: null,
          variacaoCaixa: -totalCost,
          criadoEm: now,
        },
      });

      return {
        message: 'Compra de jogador realizada com sucesso.',
        transaction_id: transactionRecord.id,
        buyer_club_id: club_id,
        seller_club_id: sellerClubId,
        player_id: player.id,
        market_value: marketValue,
        league_fee: leagueFee,
        total_cost: totalCost,
        contract_id: newContract.id,
        loyalty_until: loyaltyUntilDate.toISOString(),
      };
    });
  }

  /**
   * RN14 a RN17 - Venda / Rescisão de Jogador (POST /players/:id/sell)
   */
  async sellPlayer(playerId: number) {
    const player = await this.prisma.jogador.findFirst({
      where: { id: playerId, excluidoEm: null },
      include: {
        contratos: {
          where: { situacao: 'ATIVO' },
          take: 1,
        },
      },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado.');
    }

    if (!player.clubeId) {
      throw new ConflictException('Jogador livre (sem clube) não pode ser vendido.');
    }

    const sellerClubId = player.clubeId;
    const activeContract = player.contratos && player.contratos.length > 0 ? player.contratos[0] : null;
    if (!activeContract) {
      throw new ConflictException('Nenhum contrato ativo encontrado para o jogador.');
    }

    const saleValue = PlayerCalculatorDomain.calculateMarketValue(
      Number(player.valorBase),
      player.condicao as PlayerCondition,
      player.agilidade,
      player.idade,
    );

    const now = new Date();
    const loyaltyUntil = new Date(activeContract.fidelidadeAte);
    const diffTime = loyaltyUntil.getTime() - now.getTime();
    const daysRemaining = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

    let penaltyPercentage = 0;
    if (daysRemaining > 0 && daysRemaining <= 30) penaltyPercentage = 0.05;
    else if (daysRemaining >= 31 && daysRemaining <= 180) penaltyPercentage = 0.10;
    else if (daysRemaining >= 181) penaltyPercentage = 0.20;

    let penaltyFee = PlayerCalculatorDomain.roundHalfAwayFromZero(saleValue * penaltyPercentage, 2);
    if (penaltyFee > 10.00) {
      penaltyFee = 10.00;
    }

    const originalPurchaseValue = Number(activeContract.valorCompra);
    const profit = saleValue - originalPurchaseValue;

    let leagueCommission = 0.00;
    if (profit > 0) {
      if (profit <= 10.00) {
        leagueCommission = profit * 0.10;
      } else {
        const firstTier = 10.00 * 0.10;
        const secondTier = (profit - 10.00) * 0.20;
        leagueCommission = firstTier + secondTier;
      }
      leagueCommission = PlayerCalculatorDomain.roundHalfAwayFromZero(leagueCommission, 2);
    }

    const netReceivable = PlayerCalculatorDomain.roundHalfAwayFromZero(saleValue - penaltyFee - leagueCommission, 2);
    const contractStatus = penaltyFee > 0 ? 'RESCINDIDO' : 'ENCERRADO';

    return this.prisma.$transaction(async (tx) => {
      const sellerClub = await tx.clube.findUnique({ where: { id: sellerClubId } });
      const newCash = Number(sellerClub?.caixa || 0) + netReceivable;

      await tx.clube.update({
        where: { id: sellerClubId },
        data: { caixa: newCash },
      });

      await tx.contrato.update({
        where: { id: activeContract.id },
        data: { situacao: contractStatus, encerradoEm: now },
      });

      await tx.jogador.update({
        where: { id: player.id },
        data: { clubeId: null },
      });

      const transactionRecord = await tx.transacao.create({
        data: {
          tipo: 'VENDA',
          clubeId: sellerClubId,
          jogadorId: player.id,
          nomeJogador: player.nome,
          valor: saleValue,
          taxa: leagueCommission,
          multa: penaltyFee,
          lucro: profit,
          variacaoCaixa: netReceivable,
          criadoEm: now,
        },
      });

      return {
        message: 'Venda de jogador realizada com sucesso.',
        transaction_id: transactionRecord.id,
        seller_club_id: sellerClubId,
        player_id: player.id,
        purchase_value: originalPurchaseValue,
        sale_value: saleValue,
        days_remaining_loyalty: daysRemaining,
        penalty_fee: penaltyFee,
        profit,
        league_commission: leagueCommission,
        net_receivable: netReceivable,
        new_cash: newCash,
        contract_status: contractStatus,
      };
    });
  }

  async getTransactions() {
    const transactions = await this.prisma.transacao.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        clube: true,
        jogador: true,
      },
    });

    return transactions.map((t) => ({
      id: t.id,
      type: t.tipo,
      club_name: t.clube ? t.clube.nome : 'Desconhecido',
      player_name: t.nomeJogador || (t.jogador ? t.jogador.nome : 'Desconhecido'),
      value: Number(t.valor),
      fee: Number(t.taxa),
      penalty: Number(t.multa),
      profit: t.lucro !== null ? Number(t.lucro) : null,
      cash_variation: Number(t.variacaoCaixa),
      date: t.criadoEm.toISOString(),
    }));
  }

  async exportTransactionsCsv(): Promise<string> {
    const transactions = await this.getTransactions();
    const headers = ['ID', 'Tipo', 'Clube', 'Jogador', 'Valor', 'Taxa/Comissao', 'Multa', 'Lucro', 'Variacao Caixa', 'Data'];

    const rows = transactions.map((t) => [
      t.id,
      t.type,
      `"${t.club_name}"`,
      `"${t.player_name}"`,
      t.value.toFixed(2),
      t.fee.toFixed(2),
      t.penalty.toFixed(2),
      t.profit !== null ? t.profit.toFixed(2) : 'N/A',
      t.cash_variation.toFixed(2),
      t.date,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}