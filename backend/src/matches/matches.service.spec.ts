import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { PrismaService } from '../database';
import { ClubsService } from '../clubs/clubs.service';

describe('MatchesService (RN20 e RN21)', () => {
  let service: MatchesService;

  const mockPrismaService = {
    clube: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    partida: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockClubsService = {
    getLineup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ClubsService,
          useValue: mockClubsService,
        },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);

    jest.clearAllMocks();
  });

  describe('simulateMatch (POST /matches - RN20)', () => {
    const mockHomeClub = { id: 1, nome: 'Águias FC', sigla: 'AGU' };
    const mockAwayClub = { id: 2, nome: 'Tigres FC', sigla: 'TIG' };

    const mockHomePlayers = [
      {
        id: 10,
        name: 'Goleiro H',
        position: 'GOL',
        condition: 'APTO',
        defending: 80,
        shooting: 50,
        passing: 50,
        dribbling: 50,
      },
      {
        id: 11,
        name: 'Zagueiro H',
        position: 'ZAG',
        condition: 'APTO',
        defending: 80,
        shooting: 50,
        passing: 50,
        dribbling: 50,
      },
      {
        id: 12,
        name: 'Lateral H',
        position: 'LAT',
        condition: 'APTO',
        defending: 70,
        shooting: 50,
        passing: 50,
        dribbling: 60,
      },
      {
        id: 13,
        name: 'Atacante H1',
        position: 'ATA',
        condition: 'APTO',
        defending: 40,
        shooting: 85,
        passing: 60,
        dribbling: 70,
      },
      {
        id: 14,
        name: 'Atacante H2',
        position: 'ATA',
        condition: 'APTO',
        defending: 40,
        shooting: 90,
        passing: 60,
        dribbling: 75,
      },
    ];

    const mockAwayPlayers = [
      {
        id: 20,
        name: 'Goleiro A',
        position: 'GOL',
        condition: 'APTO',
        defending: 70,
        shooting: 50,
        passing: 50,
        dribbling: 50,
      },
      {
        id: 21,
        name: 'Zagueiro A',
        position: 'ZAG',
        condition: 'APTO',
        defending: 70,
        shooting: 50,
        passing: 50,
        dribbling: 50,
      },
      {
        id: 22,
        name: 'Meia A',
        position: 'MEI',
        condition: 'APTO',
        defending: 60,
        shooting: 60,
        passing: 75,
        dribbling: 70,
      },
      {
        id: 23,
        name: 'Atacante A1',
        position: 'ATA',
        condition: 'APTO',
        defending: 40,
        shooting: 80,
        passing: 60,
        dribbling: 70,
      },
      {
        id: 24,
        name: 'Atacante A2',
        position: 'ATA',
        condition: 'APTO',
        defending: 40,
        shooting: 75,
        passing: 60,
        dribbling: 70,
      },
    ];

    it('deve lançar BadRequestException se mandante for igual ao visitante (400)', async () => {
      await expect(
        service.simulateMatch({ home_club_id: 1, away_club_id: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ConflictException se a escalação de um dos clubes estiver incompleta (409)', async () => {
      mockClubsService.getLineup.mockResolvedValueOnce({
        complete: true,
        players: mockHomePlayers,
      });
      mockClubsService.getLineup.mockResolvedValueOnce({
        complete: false,
        players: [],
      });

      await expect(
        service.simulateMatch({ home_club_id: 1, away_club_id: 2 }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar NotFoundException se algum clube não for encontrado no banco (404)', async () => {
      mockClubsService.getLineup.mockResolvedValue({
        complete: true,
        players: mockHomePlayers,
      });
      mockPrismaService.clube.findUnique.mockResolvedValue(null);

      await expect(
        service.simulateMatch({ home_club_id: 1, away_club_id: 2 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve executar a simulação determinística dos 6 duelos e aplicar penalidade de 15% para MAL_CONDICIONADO', async () => {
      // Atacante H2 está MAL_CONDICIONADO (shooting: 90 -> 90 * 0.85 = 77)
      const mockHomeSick = [...mockHomePlayers];
      mockHomeSick[4] = { ...mockHomeSick[4], condition: 'MAL_CONDICIONADO' };

      mockClubsService.getLineup.mockResolvedValueOnce({
        complete: true,
        formation: '2-2',
        players: mockHomeSick,
      });
      mockClubsService.getLineup.mockResolvedValueOnce({
        complete: true,
        formation: '2-1-1',
        players: mockAwayPlayers,
      });

      mockPrismaService.clube.findUnique.mockImplementation(({ where }) => {
        if (where.id === 1) return Promise.resolve(mockHomeClub);
        if (where.id === 2) return Promise.resolve(mockAwayClub);
        return Promise.resolve(null);
      });

      const mockMatchCreated = {
        id: 100,
        mandanteId: 1,
        visitanteId: 2,
        golsMandante: 3,
        golsVisitante: 1,
        formacaoMandante: '2-2',
        formacaoVisitante: '2-1-1',
        jogadaEm: new Date(),
        mandante: mockHomeClub,
        visitante: mockAwayClub,
        duelos: [
          {
            ordem: 1,
            clubeAtacanteId: 1,
            atacanteId: 14,
            defensorId: 20,
            nomeAtacante: 'Atacante H2',
            nomeDefensor: 'Goleiro A',
            posicaoAtacante: 'ATA',
            posicaoDefensor: 'GOL',
            condicaoAtacante: 'MAL_CONDICIONADO',
            condicaoDefensor: 'APTO',
            atributoAtaque: 'shooting',
            atributoDefesa: 'defending',
            valorAtaque: 77,
            valorDefesa: 70,
            gol: true,
          },
        ],
      };

      mockPrismaService.partida.create.mockResolvedValue(mockMatchCreated);

      const result = await service.simulateMatch({
        home_club_id: 1,
        away_club_id: 2,
      });

      expect(result.id).toBe(100);
      expect(result.home.club_id).toBe(1);
      expect(result.away.club_id).toBe(2);
      expect(result.duels.length).toBeGreaterThan(0);
      expect(result.duels[0].attacker.value).toBe(77); // 90 * 0.85 = 76.5 -> 77
    });
  });

  describe('getStandings (GET /standings - RN21)', () => {
    it('deve calcular a tabela e ordenar por Pontos -> Saldo de Gols -> Gols Pró -> Nome (RN21)', async () => {
      const mockClubs = [
        { id: 1, nome: 'Águias FC' },
        { id: 2, nome: 'Tigres FC' },
        { id: 3, nome: 'Leões FC' },
      ];

      const mockMatches = [
        // Águias 2 x 0 Tigres (Águias 3pts, +2 saldo)
        {
          id: 1,
          mandanteId: 1,
          visitanteId: 2,
          golsMandante: 2,
          golsVisitante: 0,
        },
        // Leões 3 x 0 Tigres (Leões 3pts, +3 saldo)
        {
          id: 2,
          mandanteId: 3,
          visitanteId: 2,
          golsMandante: 3,
          golsVisitante: 0,
        },
      ];

      mockPrismaService.clube.findMany.mockResolvedValue(mockClubs);
      mockPrismaService.partida.findMany.mockResolvedValue(mockMatches);

      const standings = await service.getStandings();

      expect(standings.length).toBe(3);
      // 1º Lugar: Leões FC (3 pts, saldo +3)
      expect(standings[0].club_name).toBe('Leões FC');
      expect(standings[0].position).toBe(1);
      expect(standings[0].points).toBe(3);
      expect(standings[0].goal_difference).toBe(3);

      // 2º Lugar: Águias FC (3 pts, saldo +2)
      expect(standings[1].club_name).toBe('Águias FC');
      expect(standings[1].position).toBe(2);
      expect(standings[1].points).toBe(3);
      expect(standings[1].goal_difference).toBe(2);

      // 3º Lugar: Tigres FC (0 pts, saldo -5)
      expect(standings[2].club_name).toBe('Tigres FC');
      expect(standings[2].position).toBe(3);
      expect(standings[2].points).toBe(0);
    });
  });
});
