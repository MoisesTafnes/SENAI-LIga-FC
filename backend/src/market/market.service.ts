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

    if (player.clubeId !== null) {
      throw new ConflictException('Apenas jogadores livres podem ser comprados.');
    }

    const previousSale = await this.prisma.transacao.findFirst({
      where: {
        clubeId: club_id,
        jogadorId: playerId,
        tipo: 'VENDA',
      },
    });

    if (previousSale) {
      throw new ConflictException('Um clube não pode comprar um jogador que ele mesmo já vendeu.');
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
        id: transactionRecord.id,
        transaction_id: transactionRecord.id,
        club_id: club_id,
        buyer_club_id: club_id,
        seller_club_id: sellerClubId,
        player_id: player.id,
        player_name: player.nome,
        type: 'COMPRA',
        value: marketValue,
        market_value: marketValue,
        fee: leagueFee,
        league_fee: leagueFee,
        penalty: 0.00,
        profit: null,
        cash_change: -totalCost,
        total_cost: totalCost,
        created_at: now.toISOString(),
        contract: {
          purchase_value: marketValue,
          loyalty_until: loyaltyUntilDate.toISOString(),
          status: 'ATIVO',
        },
        club_cash: Number(buyerClub.caixa) - totalCost,
        contract_id: newContract.id,
        loyalty_until: loyaltyUntilDate.toISOString(),
        message: 'Compra de jogador realizada com sucesso.',
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
        id: transactionRecord.id,
        transaction_id: transactionRecord.id,
        club_id: sellerClubId,
        seller_club_id: sellerClubId,
        player_id: player.id,
        player_name: player.nome,
        type: 'VENDA',
        value: saleValue,
        sale_value: saleValue,
        fee: leagueCommission,
        league_commission: leagueCommission,
        penalty: penaltyFee,
        penalty_fee: penaltyFee,
        profit: profit,
        cash_change: netReceivable,
        net_receivable: netReceivable,
        created_at: now.toISOString(),
        purchase_value: originalPurchaseValue,
        remaining_days: daysRemaining,
        days_remaining_loyalty: daysRemaining,
        penalty_rate: penaltyPercentage * 100,
        contract_status: contractStatus,
        club_cash: newCash,
        new_cash: newCash,
        message: 'Venda de jogador realizada com sucesso.',
      };
    });
  }

  async getTransactionsByClub(
    clubId: number,
    type?: string,
    playerId?: number,
  ) {
    const club = await this.prisma.clube.findUnique({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException('Clube não encontrado.');
    }

    if (playerId) {
      const player = await this.prisma.jogador.findFirst({
        where: { id: playerId, excluidoEm: null },
      });
      if (!player) {
        throw new NotFoundException('Jogador não encontrado ou excluído.');
      }
    }

    const where: any = { clubeId: clubId };

    if (type) {
      const types = type.split(',');
      where.tipo = { in: types };
    }

    if (playerId) {
      where.jogadorId = playerId;
    }

    const transactions = await this.prisma.transacao.findMany({
      where,
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
    });

    const data = transactions.map((t) => ({
      id: t.id,
      club_id: t.clubeId,
      player_id: t.jogadorId,
      player_name: t.nomeJogador,
      type: t.tipo,
      value: Number(t.valor),
      fee: Number(t.taxa),
      penalty: Number(t.multa),
      profit: t.lucro !== null ? Number(t.lucro) : null,
      cash_change: Number(t.variacaoCaixa),
      created_at: t.criadoEm.toISOString(),
    }));

    let totalSpent = 0;
    let totalReceived = 0;
    let totalFees = 0;
    let totalPenalties = 0;
    let totalProfit = 0;

    for (const item of data) {
      if (item.type === 'COMPRA') {
        totalSpent += item.value + item.fee;
      } else if (item.type === 'VENDA') {
        totalReceived += item.cash_change;
        totalPenalties += item.penalty;
        if (item.profit !== null) {
          totalProfit += item.profit;
        }
      }
      totalFees += item.fee;
    }

    return {
      data,
      summary: {
        total_spent: PlayerCalculatorDomain.roundHalfAwayFromZero(totalSpent, 2),
        total_received: PlayerCalculatorDomain.roundHalfAwayFromZero(totalReceived, 2),
        total_fees: PlayerCalculatorDomain.roundHalfAwayFromZero(totalFees, 2),
        total_penalties: PlayerCalculatorDomain.roundHalfAwayFromZero(totalPenalties, 2),
        total_profit: PlayerCalculatorDomain.roundHalfAwayFromZero(totalProfit, 2),
      },
    };
  }

  async exportTransactionsCsv(
    clubId: number,
    type?: string,
    playerId?: number,
  ): Promise<string> {
    const result = await this.getTransactionsByClub(clubId, type, playerId);
    const header = 'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa';

    const formatDecimal = (val: number | null) => {
      if (val === null || val === undefined) return '';
      return val.toFixed(2).replace('.', ',');
    };

    const escapeName = (name: string) => {
      if (name.includes(';') || name.includes('"')) {
        return `"${name.replace(/"/g, '""')}"`;
      }
      return name;
    };

    const rows = result.data.map((t) => [
      t.created_at,
      t.type,
      escapeName(t.player_name),
      formatDecimal(t.value),
      formatDecimal(t.fee),
      formatDecimal(t.penalty),
      t.profit !== null ? formatDecimal(t.profit) : '',
      formatDecimal(t.cash_change),
    ]);

    const lines = [header, ...rows.map((r) => r.join(';'))];
    return lines.join('\n') + '\n';
  }

  async getTransactions() {
    return this.prisma.transacao.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }
}