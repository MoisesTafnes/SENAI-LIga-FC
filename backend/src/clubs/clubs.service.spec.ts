import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { PrismaService } from '../database';

describe('ClubsService - Validação de Limites de Nome, Sigla e Liga', () => {
  let service: ClubsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    clube: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
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
    prisma = module.get<PrismaService>(PrismaService);

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
        { nome: 'Águias FC', sigla: 'AGU' },
      ]);

      await expect(
        service.create({ name: 'águias fc', acronym: 'AGU' }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve recusar sigla duplicada na liga (409)', async () => {
      mockPrismaService.clube.count.mockResolvedValue(5);
      mockPrismaService.clube.findMany.mockResolvedValue([
        { nome: 'Águias FC', sigla: 'AGU' },
      ]);

      await expect(
        service.create({ name: 'Atlético Guanabara', acronym: 'AGU' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});