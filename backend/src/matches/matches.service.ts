import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { ClubsService } from '../clubs/clubs.service';
import { CreateMatchDto } from './dto/create-match.dto';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clubsService: ClubsService,
  ) {}

  /**
   * Helper privado para calcular o atributo ajustado pela condição física no duelo (RN20)
   */
  private getAdjustedAttribute(value: number, condition: string): number {
    if (condition === 'MAL_CONDICIONADO') {
      return Math.round(value * 0.85);
    }
    return value;
  }

  /**
   * Helper privado para determinar qual atributo de ataque o jogador usa segundo sua posição (RN20)
   */
  private getAttackingAttributeName(position: string): {
    name: string;
    key: string;
  } {
    if (position === 'ATA') return { name: 'finalização', key: 'shooting' };
    if (position === 'MEI') return { name: 'passe', key: 'passing' };
    return { name: 'drible', key: 'dribbling' }; // ZAG ou LAT
  }

  /**
   * RN20 - Simular e Gravar Partida (POST /matches)
   */
  async simulateMatch(dto: CreateMatchDto) {
    const { home_club_id, away_club_id } = dto;

    // 1. Validação de mandante igual a visitante (400)
    if (home_club_id === away_club_id) {
      throw new BadRequestException(
        'O clube mandante não pode ser igual ao clube visitante.',
      );
    }

    // 2. Verificar existência dos clubes e escalação completa (RN19/RN20)
    const homeLineup = await this.clubsService.getLineup(home_club_id);
    const awayLineup = await this.clubsService.getLineup(away_club_id);

    if (!homeLineup.complete || !awayLineup.complete) {
      throw new ConflictException(
        'O clube mandante ou o clube visitante não possui uma escalação completa (5 titulares válidos).',
      );
    }

    const homeClub = await this.prisma.clube.findUnique({
      where: { id: home_club_id },
    });
    const awayClub = await this.prisma.clube.findUnique({
      where: { id: away_club_id },
    });

    if (!homeClub || !awayClub) {
      throw new NotFoundException(
        'Clube mandante ou visitante não encontrado.',
      );
    }

    const homePlayers = homeLineup.players;
    const awayPlayers = awayLineup.players;

    // 3. Montar a estrutura dos 6 duelos determinísticos
    const duelConfigs = [
      // Duelos 1 a 3: Mandante ataca
      {
        order: 1,
        attackerTeam: 'home',
        atkIdx: 4,
        defenderTeam: 'away',
        defIdx: 0,
      },
      {
        order: 2,
        attackerTeam: 'home',
        atkIdx: 3,
        defenderTeam: 'away',
        defIdx: 1,
      },
      {
        order: 3,
        attackerTeam: 'home',
        atkIdx: 2,
        defenderTeam: 'away',
        defIdx: 2,
      },
      // Duelos 4 a 6: Visitante ataca
      {
        order: 4,
        attackerTeam: 'away',
        atkIdx: 4,
        defenderTeam: 'home',
        defIdx: 0,
      },
      {
        order: 5,
        attackerTeam: 'away',
        atkIdx: 3,
        defenderTeam: 'home',
        defIdx: 1,
      },
      {
        order: 6,
        attackerTeam: 'away',
        atkIdx: 2,
        defenderTeam: 'home',
        defIdx: 2,
      },
    ];

    let homeGoals = 0;
    let awayGoals = 0;
    const duelsData: any[] = [];

    for (const config of duelConfigs) {
      const isHomeAttacking = config.attackerTeam === 'home';
      const atkClub = isHomeAttacking ? homeClub : awayClub;

      const attacker: any = isHomeAttacking
        ? homePlayers[config.atkIdx]
        : awayPlayers[config.atkIdx];
      const defender: any = isHomeAttacking
        ? awayPlayers[config.defIdx]
        : homePlayers[config.defIdx];

      const atkAttrInfo = this.getAttackingAttributeName(attacker.position);
      const rawAtkVal = attacker[atkAttrInfo.key];
      const adjAtkVal = this.getAdjustedAttribute(
        rawAtkVal,
        attacker.condition,
      );

      const rawDefVal = defender.defending;
      const adjDefVal = this.getAdjustedAttribute(
        rawDefVal,
        defender.condition,
      );

      const isGoal = adjAtkVal > adjDefVal;
      if (isGoal) {
        if (isHomeAttacking) homeGoals++;
        else awayGoals++;
      }

      duelsData.push({
        ordem: config.order,
        clubeAtacanteId: atkClub.id,
        atacanteId: attacker.id,
        defensorId: defender.id,
        nomeAtacante: attacker.name,
        nomeDefensor: defender.name,
        posicaoAtacante: attacker.position,
        posicaoDefensor: defender.position,
        condicaoAtacante: attacker.condition,
        condicaoDefensor: defender.condition,
        atributoAtaque: atkAttrInfo.key,
        atributoDefesa: 'defending',
        valorAtaque: adjAtkVal,
        valorDefesa: adjDefVal,
        gol: isGoal,
      });
    }

    const createdMatch = await this.prisma.$transaction(async (tx) => {
      const match = await tx.partida.create({
        data: {
          mandanteId: home_club_id,
          visitanteId: away_club_id,
          golsMandante: homeGoals,
          golsVisitante: awayGoals,
          formacaoMandante: homeLineup.formation || '2-1-1',
          formacaoVisitante: awayLineup.formation || '2-1-1',
          duelos: {
            create: duelsData,
          },
        },
        include: {
          mandante: true,
          visitante: true,
          duelos: {
            orderBy: { ordem: 'asc' },
          },
        },
      });

      return match;
    });

    return this.formatMatchResponse(createdMatch);
  }

  /**
   * RN21 - Listar Partidas (GET /matches)
   */
  async findAll(clubId?: number) {
    if (clubId) {
      const clubExists = await this.prisma.clube.findUnique({
        where: { id: clubId },
      });
      if (!clubExists) throw new NotFoundException('Clube não encontrado.');
    }

    const matches = await this.prisma.partida.findMany({
      where: clubId
        ? {
            OR: [{ mandanteId: clubId }, { visitanteId: clubId }],
          }
        : undefined,
      orderBy: [{ jogadaEm: 'desc' }, { id: 'desc' }],
      include: {
        mandante: true,
        visitante: true,
      },
    });

    return matches.map((m) => this.formatMatchSummaryResponse(m));
  }

  /**
   * RN21 - Consultar Partida com Duelos (GET /matches/:id)
   */
  async findOne(id: number) {
    const match = await this.prisma.partida.findUnique({
      where: { id },
      include: {
        mandante: true,
        visitante: true,
        duelos: {
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Partida não encontrada.');
    }

    return this.formatMatchResponse(match);
  }

  /**
   * RN21 - Tabela de Classificação Atualizada (GET /standings)
   */
  async getStandings() {
    const clubs = await this.prisma.clube.findMany();
    const matches = await this.prisma.partida.findMany();

    const standingsMap = new Map<number, any>();

    for (const club of clubs) {
      standingsMap.set(club.id, {
        club_id: club.id,
        club_name: club.nome,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
      });
    }

    for (const m of matches) {
      const home = standingsMap.get(m.mandanteId);
      const away = standingsMap.get(m.visitanteId);

      if (home) {
        home.played += 1;
        home.goals_for += m.golsMandante;
        home.goals_against += m.golsVisitante;
        home.goal_difference = home.goals_for - home.goals_against;

        if (m.golsMandante > m.golsVisitante) {
          home.wins += 1;
          home.points += 3;
        } else if (m.golsMandante === m.golsVisitante) {
          home.draws += 1;
          home.points += 1;
        } else {
          home.losses += 1;
        }
      }

      if (away) {
        away.played += 1;
        away.goals_for += m.golsVisitante;
        away.goals_against += m.golsMandante;
        away.goal_difference = away.goals_for - away.goals_against;

        if (m.golsVisitante > m.golsMandante) {
          away.wins += 1;
          away.points += 3;
        } else if (m.golsMandante === m.golsVisitante) {
          away.draws += 1;
          away.points += 1;
        } else {
          away.losses += 1;
        }
      }
    }

    const standingsList = Array.from(standingsMap.values());

    // Ordenar pelos 4 critérios de desempate do edital (RN21)
    standingsList.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference)
        return b.goal_difference - a.goal_difference;
      if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;

      const nameDiff = a.club_name.localeCompare(b.club_name, 'pt-BR', {
        sensitivity: 'base',
      });
      if (nameDiff !== 0) return nameDiff;

      return a.club_id - b.club_id;
    });

    // Adicionar a posição numérica no ranking (1..N)
    return standingsList.map((item, index) => ({
      position: index + 1,
      ...item,
    }));
  }

  // Helpers de formatação dos retornos JSON conforme contrato do edital
  private formatMatchSummaryResponse(m: any) {
    let result: 'MANDANTE' | 'VISITANTE' | 'EMPATE' = 'EMPATE';
    if (m.golsMandante > m.golsVisitante) result = 'MANDANTE';
    else if (m.golsVisitante > m.golsMandante) result = 'VISITANTE';

    return {
      id: m.id,
      played_at: m.jogadaEm.toISOString(),
      home: {
        club_id: m.mandante.id,
        club_name: m.mandante.nome,
        formation: m.formacaoMandante,
        goals: m.golsMandante,
      },
      away: {
        club_id: m.visitante.id,
        club_name: m.visitante.nome,
        formation: m.formacaoVisitante,
        goals: m.golsVisitante,
      },
      result,
    };
  }

  private formatMatchResponse(m: any) {
    const summary = this.formatMatchSummaryResponse(m);
    return {
      ...summary,
      duels: m.duelos.map((d: any) => ({
        order: d.ordem,
        attacking_club_id: d.clubeAtacanteId,
        attacker: {
          player_id: d.atacanteId,
          player_name: d.nomeAtacante,
          position: d.posicaoAtacante,
          condition: d.condicaoAtacante,
          attribute: d.atributoAtaque,
          value: d.valorAtaque,
        },
        defender: {
          player_id: d.defensorId,
          player_name: d.nomeDefensor,
          position: d.posicaoDefensor,
          condition: d.condicaoDefensor,
          attribute: d.atributoDefesa,
          value: d.valorDefesa,
        },
        goal: d.gol,
      })),
    };
  }
}
