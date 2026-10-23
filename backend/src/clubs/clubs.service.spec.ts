import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { PrismaService } from '../database';
import { LineupFormation } from './dto/set-lineup.dto';

describe('ClubsService', () => {
  let service: ClubsService;

  const mockPrismaService = {
    clube: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    jogador: {
      findMany: jest.fn(),
    },
    escalacao: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClubsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClubsService>(ClubsService);

    jest.clearAllMocks();
  });

  describe('Validações de Cadastro do Clube (POST /clubs)', () => {
    it('deve recusar criação do 21º clube excedendo o limite da liga (409)', async () => {
      mockPrismaService.clube.count.mockResolvedValue(20);

      await expect(
        service.create({ name: 'Novo Clube FC', acronym: 'NCF' }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve recusar nome com menos de 2 palavras (400)', async () => {
      mockPrismaService.clube.count.mockResolvedValue(5);

      await expect(
        service.create({ name: 'Águias', acronym: 'AGU' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve recusar nome com mais de 5 palavras (400)', async () => {
      mockPrismaService.clube.count.mockResolvedValue(5);

      await expect(
        service.create({
          name: 'Clube de Futebol Esporte e Atletismo do Nordeste',
          acronym: 'CFE',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve recusar sigla com as 3 letras totalmente idênticas como "AAA" (400)', async () => {
      mockPrismaService.clube.count.mockResolvedValue(5);

      await expect(
        service.create({ name: 'América Futebol Clube', acronym: 'AAA' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve recusar sigla cuja primeira letra seja diferente da primeira letra do nome (400)', async () => {
      mockPrismaService.clube.count.mockResolvedValue(5);

      await expect(
        service.create({ name: 'Águias Futebol Clube', acronym: 'FAG' }), // "F" !== "A"
      ).rejects.toThrow(BadRequestException);
    });

    it('deve recusar nome duplicado (409)', async () => {
      mockPrismaService.clube.count.mockResolvedValue(5);
      mockPrismaService.clube.findMany.mockResolvedValue([
        { nomeNormalizado: 'águias fc', sigla: 'AGU' },
      ]);

      await expect(
        service.create({ name: 'águias fc', acronym: 'AGU' }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve preservar acentos na chave normalizada e aceitar nomes que só diferem por acento', async () => {
      mockPrismaService.clube.count.mockResolvedValue(5);
      mockPrismaService.clube.findMany.mockResolvedValue([
        { nomeNormalizado: 'águias fc', sigla: 'AGU' },
      ]);
      mockPrismaService.clube.create.mockResolvedValue({
        id: 6,
        nome: 'Aguias FC',
        nomeNormalizado: 'aguias fc',
        sigla: 'AGF',
        caixa: 300,
      });

      await service.create({ name: 'Aguias FC', acronym: 'AGF' });

      expect(mockPrismaService.clube.create).toHaveBeenCalledWith({
        data: {
          nome: 'Aguias FC',
          nomeNormalizado: 'aguias fc',
          sigla: 'AGF',
          caixa: 300,
        },
      });
    });

    it('deve recusar sigla duplicada na liga (409)', async () => {
      mockPrismaService.clube.count.mockResolvedValue(5);
      mockPrismaService.clube.findMany.mockResolvedValue([
        { nomeNormalizado: 'águias fc', sigla: 'AGU' },
      ]);

      await expect(
        service.create({ name: 'Atlético Guanabara', acronym: 'AGU' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Validações de Escalação e Formação Tática (PUT/GET /clubs/:id/lineup - RN19)', () => {
    const mockClub = {
      id: 1,
      nome: 'Águias FC',
      sigla: 'AGU',
      caixa: 300.0,
      formacao: '2-2',
    };

    const mockValidPlayers = [
      {
        id: 10,
        nome: 'Goleiro Bruno',
        posicao: 'GOL',
        condicao: 'APTO',
        clubeId: 1,
        valorBase: 50,
        agilidade: 80,
        idade: 25,
        velocidade: 70,
        finalizacao: 50,
        passe: 60,
        drible: 50,
        defesa: 80,
        fisico: 70,
        potencial: 80,
        excluidoEm: null,
      },
      {
        id: 11,
        nome: 'Zagueiro Arboleda',
        posicao: 'ZAG',
        condicao: 'APTO',
        clubeId: 1,
        valorBase: 50,
        agilidade: 80,
        idade: 25,
        velocidade: 70,
        finalizacao: 50,
        passe: 60,
        drible: 50,
        defesa: 80,
        fisico: 70,
        potencial: 80,
        excluidoEm: null,
      },
      {
        id: 12,
        nome: 'Lateral Rafinha',
        posicao: 'LAT',
        condicao: 'APTO',
        clubeId: 1,
        valorBase: 50,
        agilidade: 80,
        idade: 25,
        velocidade: 70,
        finalizacao: 50,
        passe: 60,
        drible: 50,
        defesa: 80,
        fisico: 70,
        potencial: 80,
        excluidoEm: null,
      },
      {
        id: 13,
        nome: 'Atacante Luciano',
        posicao: 'ATA',
        condicao: 'APTO',
        clubeId: 1,
        valorBase: 50,
        agilidade: 80,
        idade: 25,
        velocidade: 70,
        finalizacao: 80,
        passe: 60,
        drible: 75,
        defesa: 40,
        fisico: 70,
        potencial: 80,
        excluidoEm: null,
      },
      {
        id: 14,
        nome: 'Atacante Calleri',
        posicao: 'ATA',
        condicao: 'APTO',
        clubeId: 1,
        valorBase: 50,
        agilidade: 80,
        idade: 25,
        velocidade: 70,
        finalizacao: 85,
        passe: 60,
        drible: 70,
        defesa: 40,
        fisico: 80,
        potencial: 85,
        excluidoEm: null,
      },
    ];

    describe('updateLineup', () => {
      it('deve lançar NotFoundException quando o clube não for encontrado (404)', async () => {
        mockPrismaService.clube.findUnique.mockResolvedValue(null);

        await expect(
          service.updateLineup(999, {
            formation: LineupFormation.F_2_2,
            player_ids: [10, 11, 12, 13, 14],
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it('deve lançar NotFoundException se menos de 5 jogadores forem encontrados no banco (404)', async () => {
        mockPrismaService.clube.findUnique.mockResolvedValue(mockClub);
        mockPrismaService.jogador.findMany.mockResolvedValue(
          mockValidPlayers.slice(0, 4),
        );

        await expect(
          service.updateLineup(1, {
            formation: LineupFormation.F_2_2,
            player_ids: [10, 11, 12, 13, 14],
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it('deve lançar ConflictException se algum jogador pertencer a outro clube (409)', async () => {
        mockPrismaService.clube.findUnique.mockResolvedValue(mockClub);
        const invalidClubPlayers = mockValidPlayers.map((p, i) =>
          i === 0 ? { ...p, clubeId: 99 } : p,
        );
        mockPrismaService.jogador.findMany.mockResolvedValue(
          invalidClubPlayers,
        );

        await expect(
          service.updateLineup(1, {
            formation: LineupFormation.F_2_2,
            player_ids: [10, 11, 12, 13, 14],
          }),
        ).rejects.toThrow(ConflictException);
      });

      it('deve lançar ConflictException se algum jogador estiver DOENTE (409)', async () => {
        mockPrismaService.clube.findUnique.mockResolvedValue(mockClub);
        const sickPlayers = mockValidPlayers.map((p, i) =>
          i === 0 ? { ...p, condicao: 'DOENTE' } : p,
        );
        mockPrismaService.jogador.findMany.mockResolvedValue(sickPlayers);

        await expect(
          service.updateLineup(1, {
            formation: LineupFormation.F_2_2,
            player_ids: [10, 11, 12, 13, 14],
          }),
        ).rejects.toThrow(ConflictException);
      });

      it('deve lançar ConflictException se a escalação não possuir exatamente 1 Goleiro (409)', async () => {
        mockPrismaService.clube.findUnique.mockResolvedValue(mockClub);
        const noGkPlayers = mockValidPlayers.map((p) => ({
          ...p,
          posicao: 'ZAG',
        }));
        mockPrismaService.jogador.findMany.mockResolvedValue(noGkPlayers);

        await expect(
          service.updateLineup(1, {
            formation: LineupFormation.F_2_2,
            player_ids: [10, 11, 12, 13, 14],
          }),
        ).rejects.toThrow(ConflictException);
      });

      it('deve lançar ConflictException se as posições não baterem com a formação escolhida (409)', async () => {
        mockPrismaService.clube.findUnique.mockResolvedValue(mockClub);
        mockPrismaService.jogador.findMany.mockResolvedValue(mockValidPlayers);

        // Tenta aplicar formação 3-1 usando elenco 2-2 (possui apenas 2 defensores)
        await expect(
          service.updateLineup(1, {
            formation: LineupFormation.F_3_1,
            player_ids: [10, 11, 12, 13, 14],
          }),
        ).rejects.toThrow(ConflictException);
      });

      it('deve definir a escalação com sucesso quando os dados forem válidos (200)', async () => {
        mockPrismaService.clube.findUnique.mockResolvedValueOnce(mockClub);
        mockPrismaService.jogador.findMany.mockResolvedValue(mockValidPlayers);
        mockPrismaService.clube.update.mockResolvedValue(mockClub);
        mockPrismaService.escalacao.deleteMany.mockResolvedValue({ count: 5 });
        mockPrismaService.escalacao.createMany.mockResolvedValue({ count: 5 });

        // Retorno da consulta interna do getLineup pós-salvamento
        mockPrismaService.clube.findUnique.mockResolvedValueOnce({
          ...mockClub,
          formacao: '2-2',
          escalacoes: mockValidPlayers.map((p) => ({ jogador: p })),
        });

        const result = await service.updateLineup(1, {
          formation: LineupFormation.F_2_2,
          player_ids: [10, 11, 12, 13, 14],
        });

        expect(result.club_id).toBe(1);
        expect(result.formation).toBe('2-2');
        expect(result.complete).toBe(true);
        expect(result.players.length).toBe(5);
      });
    });

    describe('getLineup', () => {
      it('deve lançar NotFoundException se o clube não for encontrado (404)', async () => {
        mockPrismaService.clube.findUnique.mockResolvedValue(null);

        await expect(service.getLineup(999)).rejects.toThrow(NotFoundException);
      });

      it('deve retornar complete: false e lista vazia se não houver formação/escalação', async () => {
        mockPrismaService.clube.findUnique.mockResolvedValue({
          ...mockClub,
          formacao: null,
          escalacoes: [],
        });

        const result = await service.getLineup(1);

        expect(result.complete).toBe(false);
        expect(result.players).toEqual([]);
      });

      it('deve retornar complete: true e titulares ordenados por posição tática (GOL, ZAG, LAT, MEI, ATA)', async () => {
        mockPrismaService.clube.findUnique.mockResolvedValue({
          ...mockClub,
          formacao: '2-2',
          escalacoes: mockValidPlayers.map((p) => ({ jogador: p })),
        });

        const result = await service.getLineup(1);

        expect(result.complete).toBe(true);
        expect(result.players.length).toBe(5);
        expect(result.players[0].position).toBe('GOL');
        expect(result.players[1].position).toBe('ZAG');
        expect(result.players[2].position).toBe('LAT');
        expect(result.players[3].position).toBe('ATA');
        expect(result.players[4].position).toBe('ATA');
      });

      it('deve sinalizar complete: false se um dos titulares escalados estiver desfalque (ex: DOENTE)', async () => {
        const incompletePlayers = mockValidPlayers.map((p, i) =>
          i === 0 ? { ...p, condicao: 'DOENTE' } : p,
        );

        mockPrismaService.clube.findUnique.mockResolvedValue({
          ...mockClub,
          formacao: '2-2',
          escalacoes: incompletePlayers.map((p) => ({ jogador: p })),
        });

        const result = await service.getLineup(1);

        expect(result.complete).toBe(false);
        expect(result.players.length).toBe(4);
      });
    });
  });
});
