import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database';
import { CreateClubDto } from './dto/create-club.dto';
import { QueryClubsDto } from './dto/query-clubs.dto';
import { PlayerCalculatorDomain, PlayerPosition, PlayerCondition } from '../players/domain/player-calculator.domain';

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida as regras estritas da sigla (RN10):
   * 1. As 3 letras não podem ser todas iguais (ex: "AAA" é recusado).
   * 2. A primeira letra da sigla DEVE ser a primeira letra do nome do clube.
   * 3. As 3 letras devem aparecer no nome nessa ordem (insensível a acentos/caixa).
   */
  private validateAcronym(name: string, acronym: string): boolean {
    if (acronym[0] === acronym[1] && acronym[1] === acronym[2]) {
      return false;
    }

    const normalizedName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const cleanAcronym = acronym.toUpperCase();

    const firstLetterOfName = normalizedName.replace(/[^A-Z]/g, '')[0];
    if (cleanAcronym[0] !== firstLetterOfName) {
      return false;
    }

    let acronymIndex = 0;
    for (let i = 0; i < normalizedName.length; i++) {
      if (normalizedName[i] === cleanAcronym[acronymIndex]) {
        acronymIndex++;
        if (acronymIndex === cleanAcronym.length) return true;
      }
    }

    return false;
  }

  async create(dto: CreateClubDto) {
    // 1. Limite da liga: máximo 20 clubes
    const totalClubs = await this.prisma.clube.count();
    if (totalClubs >= 20) {
      throw new ConflictException('A liga já atingiu o limite máximo de 20 clubes.');
    }

    // 2. Nome do clube deve ter de 2 a 5 palavras
    const nameWords = dto.name.trim().split(/\s+/);
    if (nameWords.length < 2 || nameWords.length > 5) {
      throw new BadRequestException('O nome do clube deve conter entre 2 e 5 palavras.');
    }

    // 3. Validação da sigla
    if (!this.validateAcronym(dto.name, dto.acronym)) {
      throw new BadRequestException('A sigla informada é inválida para o nome do clube.');
    }

    // 4. Unicidade de nome (insensível a caixa alta/baixa, mas sensível a acentos: "Águias FC" vs "Aguias FC")
    const allClubs = await this.prisma.clube.findMany({ select: { nome: true, sigla: true } });
    const targetNameLower = dto.name.toLowerCase();
    
    const existingName = allClubs.some((c) => c.nome.toLowerCase() === targetNameLower);
    if (existingName) {
      throw new ConflictException('Já existe um clube cadastrado com esse nome.');
    }

    // 5. Unicidade de sigla
    const existingAcronym = allClubs.some((c) => c.sigla === dto.acronym.toUpperCase());
    if (existingAcronym) {
      throw new ConflictException('Já existe um clube cadastrado com essa sigla.');
    }

    // 6. Criação do clube com caixa inicial de 300,00
    const club = await this.prisma.clube.create({
      data: {
        nome: dto.name,
        sigla: dto.acronym.toUpperCase(),
        caixa: 300.0,
      },
    });

    return {
      id: club.id,
      name: club.nome,
      acronym: club.sigla,
      cash: Number(club.caixa),
      squad_value: 0.0,
      net_worth: Number(club.caixa),
    };
  }

  async findAll(query: QueryClubsDto) {
    const clubs = await this.prisma.clube.findMany({
      include: {
        jogadores: {
          where: { excluidoEm: null },
        },
      },
    });

    const mappedClubs = clubs.map((club) => {
      const squadValue = club.jogadores.reduce((sum, player) => {
        const marketValue = PlayerCalculatorDomain.calculateMarketValue(
          Number(player.valorBase),
          player.condicao as PlayerCondition,
          player.agilidade,
          player.idade,
        );
        return sum + marketValue;
      }, 0);

      const roundedSquadValue = PlayerCalculatorDomain.roundHalfAwayFromZero(squadValue, 2);
      const cash = Number(club.caixa);
      const netWorth = PlayerCalculatorDomain.roundHalfAwayFromZero(cash + roundedSquadValue, 2);

      return {
        id: club.id,
        name: club.nome,
        acronym: club.sigla,
        cash,
        squad_value: roundedSquadValue,
        net_worth: netWorth,
      };
    });

    mappedClubs.sort((a, b) => {
      if (query.sort === 'net_worth_desc') {
        const diff = b.net_worth - a.net_worth;
        if (diff !== 0) return diff;
      } else if (query.sort === 'net_worth_asc') {
        const diff = a.net_worth - b.net_worth;
        if (diff !== 0) return diff;
      }

      const nameDiff = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
      if (nameDiff !== 0) return nameDiff;

      return a.id - b.id;
    });

    return mappedClubs;
  }

async findOne(id: number) {
    const club = await this.prisma.clube.findUnique({
      where: { id },
      include: {
        jogadores: {
          where: { excluidoEm: null },
          include: {
            contratos: {
              where: { situacao: 'ATIVO' }, // Corrigido de status para situacao
              take: 1,
            },
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundException('Clube não encontrado.');
    }

    const positionOrder: Record<string, number> = { GOL: 1, ZAG: 2, LAT: 3, MEI: 4, ATA: 5 };

    const mappedPlayers = club.jogadores.map((player) => {
      const position = player.posicao as PlayerPosition;
      const condition = player.condicao as PlayerCondition;

      const overall = PlayerCalculatorDomain.calculateOverall(position, {
        pace: player.velocidade,
        shooting: player.finalizacao,
        passing: player.passe,
        dribbling: player.drible,
        defending: player.defesa,
        physical: player.fisico,
      });

      const marketValue = PlayerCalculatorDomain.calculateMarketValue(
        Number(player.valorBase),
        condition,
        player.agilidade,
        player.idade,
      );

      // Pega o primeiro contrato ativo da lista tratada pelo Prisma
      const activeContract = player.contratos && player.contratos.length > 0 ? player.contratos[0] : null;
      let contractInfo = null;

      if (activeContract) {
        const now = new Date();
        const loyaltyUntil = new Date(activeContract.fidelidadeAte);
        const diffTime = loyaltyUntil.getTime() - now.getTime();
        const daysRemaining = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

        let penaltyPercentage = 0;
        if (daysRemaining > 0 && daysRemaining <= 30) penaltyPercentage = 5;
        else if (daysRemaining >= 31 && daysRemaining <= 180) penaltyPercentage = 10;
        else if (daysRemaining >= 181) penaltyPercentage = 20;

        contractInfo = {
          loyalty_until: activeContract.fidelidadeAte.toISOString(),
          days_remaining: daysRemaining,
          penalty_percentage: penaltyPercentage,
        };
      }

      return {
        id: player.id,
        name: player.nome,
        position: player.posicao,
        agility: player.agilidade,
        age: player.idade,
        condition: player.condicao,
        base_value: Number(player.valorBase),
        market_value: marketValue,
        pace: player.velocidade,
        shooting: player.finalizacao,
        passing: player.passe,
        dribbling: player.drible,
        defending: player.defesa,
        physical: player.fisico,
        potential: player.potencial,
        overall,
        club_id: player.clubeId,
        contract: contractInfo,
      };
    });

    mappedPlayers.sort((a, b) => {
      const posDiff = positionOrder[a.position] - positionOrder[b.position];
      if (posDiff !== 0) return posDiff;

      const nameDiff = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
      if (nameDiff !== 0) return nameDiff;

      return a.id - b.id;
    });

    const squadValue = mappedPlayers.reduce((sum, p) => sum + p.market_value, 0);
    const roundedSquadValue = PlayerCalculatorDomain.roundHalfAwayFromZero(squadValue, 2);
    const cash = Number(club.caixa);
    const netWorth = PlayerCalculatorDomain.roundHalfAwayFromZero(cash + roundedSquadValue, 2);

    return {
      id: club.id,
      name: club.nome,
      acronym: club.sigla,
      cash,
      squad_value: roundedSquadValue,
      net_worth: netWorth,
      players: mappedPlayers,
    };
  }
}
