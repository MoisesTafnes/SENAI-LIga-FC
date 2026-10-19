import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { MarketService } from './market.service';
import { PrismaService } from '../database';

describe('MarketService - Regras Financeiras e Contratuais', () => {
  let service: MarketService;

  const mockPrismaService: any = {
    clube: {
      findUnique: jest.fn().mockResolvedValue({ id: 1, caixa: 100.0 }),
      update: jest.fn().mockResolvedValue({}),
    },
    jogador: {
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    contrato: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({}),
    },
    transacao: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MarketService>(MarketService);
    jest.clearAllMocks();
    mockPrismaService.$transaction.mockImplementation((callback: any) => callback(mockPrismaService));
    mockPrismaService.transacao.create.mockResolvedValue({ id: 1 });
    mockPrismaService.contrato.create.mockResolvedValue({ id: 1 });
  });

  describe('Compra de Jogador (POST /players/:id/buy)', () => {
    it('deve recusar compra quando o custo total ultrapassar 50% do caixa do clube comprador (409)', async () => {
      mockPrismaService.clube.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Clube Comprador',
        caixa: 100.0,
        jogadores: [],
      });

      mockPrismaService.jogador.findFirst.mockResolvedValue({
        id: 10,
        nome: 'Atacante Caro',
        valorBase: 60.0,
        condicao: 'APTO',
        agilidade: 80,
        idade: 25,
        clubeId: null,
        contratos: [],
      });

      await expect(
        service.buyPlayer(10, { club_id: 1, loyalty_until: '2027-10-18T20:00:00-03:00' }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve recusar compra se o clube comprador já possuir 12 jogadores no elenco (409)', async () => {
      mockPrismaService.clube.findUnique.mockResolvedValue({
        id: 2,
        nome: 'Clube Cheio',
        caixa: 1000.0,
        jogadores: new Array(12).fill({ id: 1 }),
      });

      await expect(
        service.buyPlayer(10, { club_id: 2, loyalty_until: '2027-10-18T20:00:00-03:00' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Venda de Jogador (POST /players/:id/sell)', () => {
    it('deve aplicar teto máximo de 10.00 moedas na multa por quebra de fidelidade', async () => {
      const now = new Date();
      const futureLoyalty = new Date();
      futureLoyalty.setFullYear(now.getFullYear() + 1);

      mockPrismaService.jogador.findFirst.mockResolvedValue({
        id: 5,
        nome: 'Estrela Vendida',
        valorBase: 50.0,
        condicao: 'APTO',
        agilidade: 80,
        idade: 25,
        clubeId: 1,
        contratos: [
          {
            id: 100,
            clubeId: 1,
            situacao: 'ATIVO',
            valorCompra: 50.0,
            fidelidadeAte: futureLoyalty,
          },
        ],
      });

      mockPrismaService.clube.findUnique.mockResolvedValue({ id: 1, caixa: 100.0 });
      mockPrismaService.transacao.create.mockResolvedValue({ id: 1 });

      const result = await service.sellPlayer(5);

      expect(result.penalty_fee).toBe(10.00);
      expect(result.transaction_id).toBe(1);
    });
  });
});