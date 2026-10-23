import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PrismaService } from '../database';

describe('PlayersService - Validação de Limites e Regras de Negócio', () => {
  let service: PlayersService;

  const mockPrismaService = {
    jogador: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    escalacao: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);

    jest.clearAllMocks();
    mockPrismaService.$transaction.mockImplementation((callback: any) =>
      callback(mockPrismaService),
    );
  });

  describe('Validações de Limites no Cadastro de Jogador (POST /players)', () => {
    const validBaseDto = {
      name: 'Carlos Silva',
      position: 'MEI' as const,
      agility: 80,
      age: 25,
      pace: 70,
      shooting: 65,
      passing: 80,
      dribbling: 75,
      defending: 50,
      physical: 60,
      potential: 85,
    };

    it('deve recusar nome com menos de duas palavras (400)', async () => {
      const invalidDto = { ...validBaseDto, name: 'Carlos' };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve recusar cadastro quando a soma dos seis atributos ultrapassar 480 (400)', async () => {
      const invalidDto = {
        ...validBaseDto,
        pace: 90,
        shooting: 90,
        passing: 90,
        dribbling: 90,
        defending: 80,
        physical: 50, // Soma = 490 (> 480)
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve recusar agilidade superior a 85 para jogadores com 35 anos ou mais (400)', async () => {
      const invalidDto = {
        ...validBaseDto,
        age: 36,
        agility: 90, // Para idade >= 35, o máximo de agilidade aceito é 85
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve recusar potencial menor que o maior dos seis atributos (400)', async () => {
      const invalidDto = {
        ...validBaseDto,
        passing: 85, // Maior atributo
        potential: 80, // Potencial 80 < 85 é inválido
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve exigir que o potencial seja exatamente igual ao maior atributo para idade >= 33 no cadastro (400)', async () => {
      const invalidDto = {
        ...validBaseDto,
        age: 34,
        passing: 80, // Maior atributo é 80
        potential: 88, // Para idade >= 33, deveria ser exatamente igual a 80
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Validações de Alteração de Estado e Edição (PUT / PATCH)', () => {
    it('remove o jogador da escalação na mesma transação ao marcá-lo como DOENTE', async () => {
      const player = {
        id: 5,
        nome: 'Carlos Silva',
        condicao: 'APTO',
        excluidoEm: null,
        posicao: 'MEI',
        valorBase: 40,
        agilidade: 70,
        idade: 24,
        velocidade: 70,
        finalizacao: 60,
        passe: 80,
        drible: 75,
        defesa: 50,
        fisico: 60,
        potencial: 85,
        clubeId: 1,
      };
      mockPrismaService.jogador.findFirst.mockResolvedValue(player);
      mockPrismaService.jogador.update.mockResolvedValue({
        ...player,
        condicao: 'DOENTE',
      });

      await service.updateCondition(5, { condition: 'DOENTE' });

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.escalacao.deleteMany).toHaveBeenCalledWith({
        where: { jogadorId: 5 },
      });
    });

    it('deve recusar transição direta da condição DOENTE para APTO (409)', async () => {
      mockPrismaService.jogador.findFirst.mockResolvedValue({
        id: 1,
        nome: 'João Souza',
        condicao: 'DOENTE',
        excluidoEm: null,
      });

      await expect(
        service.updateCondition(1, { condition: 'APTO' }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve recusar alteração de posição para jogador vinculado a um clube (409)', async () => {
      mockPrismaService.jogador.findFirst.mockResolvedValue({
        id: 2,
        nome: 'Lucas Lima',
        posicao: 'ZAG',
        idade: 24,
        agilidade: 70,
        clubeId: 10, // Vinculado a um clube
        excluidoEm: null,
      });

      await expect(
        service.update(2, {
          name: 'Lucas Lima',
          position: 'MEI', // Tentativa de alterar a posição
          agility: 70,
          age: 24,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve recusar redução de idade do jogador no PUT (409)', async () => {
      mockPrismaService.jogador.findFirst.mockResolvedValue({
        id: 3,
        nome: 'Pedro Alves',
        posicao: 'ATA',
        idade: 28,
        agilidade: 75,
        clubeId: null,
        excluidoEm: null,
      });

      await expect(
        service.update(3, {
          name: 'Pedro Alves',
          position: 'ATA',
          agility: 75,
          age: 27, // Idade menor que a atual (28)
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve recusar exclusão lógica de jogador vinculado a um clube (409)', async () => {
      mockPrismaService.jogador.findFirst.mockResolvedValue({
        id: 4,
        nome: 'Marcos Rocha',
        clubeId: 5, // Jogador em clube
        excluidoEm: null,
      });

      await expect(service.remove(4)).rejects.toThrow(ConflictException);
    });
  });
});
