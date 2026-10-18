import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';
import { QueryPlayersDto } from './dto/query-players.dto';
import { PlayerCalculatorDomain, PlayerPosition, PlayerCondition } from './domain/player-calculator.domain';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToResponse(player: any) {
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
    };
  }

  async create(dto: CreatePlayerDto) {
    // 1. Validação de pelo menos duas palavras no nome
    const nameWords = dto.name.trim().split(/\s+/);
    if (nameWords.length < 2) {
      throw new BadRequestException('O nome do jogador deve conter pelo menos duas palavras.');
    }

    // 2. Validação da soma dos seis atributos (máximo 480)
    const sumAttr = dto.pace + dto.shooting + dto.passing + dto.dribbling + dto.defending + dto.physical;
    if (sumAttr > 480) {
      throw new BadRequestException('A soma dos seis atributos do jogador não pode ultrapassar 480.');
    }

    // 3. Validação do limite de agilidade para >= 35 anos (máximo 85)
    if (dto.age >= 35 && dto.agility > 85) {
      throw new BadRequestException('Jogadores com 35 anos ou mais podem ter agilidade de no máximo 85.');
    }

    // 4. Validação de potencial em relação ao maior atributo
    const maxAttr = Math.max(dto.pace, dto.shooting, dto.passing, dto.dribbling, dto.defending, dto.physical);
    if (dto.potential < maxAttr) {
      throw new BadRequestException('O potencial não pode ser menor do que o maior dos seis atributos.');
    }

    // 5. Validação de potencial para >= 33 anos (deve ser exatamente igual ao maior atributo)
    if (dto.age >= 33 && dto.potential !== maxAttr) {
      throw new BadRequestException('No cadastro de jogador com 33 anos ou mais, o potencial deve ser igual ao maior dos seis atributos.');
    }

    const overall = PlayerCalculatorDomain.calculateOverall(dto.position, dto);
    const baseValue = PlayerCalculatorDomain.calculateBaseValue(overall, dto.potential, dto.age);

    const created = await this.prisma.jogador.create({
      data: {
        nome: dto.name,
        posicao: dto.position,
        agilidade: dto.agility,
        idade: dto.age,
        valorBase: baseValue,
        condicao: 'APTO',
        velocidade: dto.pace,
        finalizacao: dto.shooting,
        passe: dto.passing,
        drible: dto.dribbling,
        defesa: dto.defending,
        fisico: dto.physical,
        potencial: dto.potential,
      },
    });

    return this.mapToResponse(created);
  }

  async update(id: number, dto: UpdatePlayerDto) {
    const player = await this.prisma.jogador.findFirst({
      where: { id, excluidoEm: null },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado.');
    }

    const nameWords = dto.name.trim().split(/\s+/);
    if (nameWords.length < 2) {
      throw new BadRequestException('O nome do jogador deve conter pelo menos duas palavras.');
    }

    if (dto.age >= 35 && dto.agility > 85) {
      throw new BadRequestException('Jogadores com 35 anos ou mais podem ter agilidade de no máximo 85.');
    }

    if (player.clubeId !== null && player.posicao !== dto.position) {
      throw new ConflictException('Jogador vinculado a um clube não pode mudar de posição.');
    }

    if (dto.age < player.idade) {
      throw new ConflictException('A idade do jogador não pode ser reduzida.');
    }

    const updated = await this.prisma.jogador.update({
      where: { id },
      data: {
        nome: dto.name,
        posicao: dto.position,
        agilidade: dto.agility,
        idade: dto.age,
      },
    });

    return this.mapToResponse(updated);
  }

  async findOne(id: number) {
    const player = await this.prisma.jogador.findFirst({
      where: { id, excluidoEm: null },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado ou excluído.');
    }

    return this.mapToResponse(player);
  }

  async updateCondition(id: number, dto: UpdateConditionDto) {
    const player = await this.prisma.jogador.findFirst({
      where: { id, excluidoEm: null },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado.');
    }

    if (player.condicao === 'DOENTE' && dto.condition === 'APTO') {
      throw new ConflictException('Transição direta de DOENTE para APTO não é permitida.');
    }

    const updated = await this.prisma.jogador.update({
      where: { id },
      data: { condicao: dto.condition },
    });

    return this.mapToResponse(updated);
  }

  async remove(id: number) {
    const player = await this.prisma.jogador.findFirst({
      where: { id, excluidoEm: null },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado.');
    }

    if (player.clubeId !== null) {
      throw new ConflictException('Não é possível excluir um jogador vinculado a um clube.');
    }

    await this.prisma.jogador.update({
      where: { id },
      data: { excluidoEm: new Date() },
    });
  }

  async findAll(query: QueryPlayersDto) {
    const where: any = { excluidoEm: null };

    if (query.search) {
      where.nome = { contains: query.search, mode: 'insensitive' };
    }

    if (query.position) where.posicao = query.position;
    if (query.condition) where.condicao = query.condition;
    if (query.free !== undefined) where.clubeId = query.free ? null : { not: null };
    if (query.club_id) where.clubeId = query.club_id;

    if (query.min_age || query.max_age) {
      where.idade = {};
      if (query.min_age) where.idade.gte = query.min_age;
      if (query.max_age) where.idade.lte = query.max_age;
    }

    const rawPlayers = await this.prisma.jogador.findMany({ where });
    let mapped = rawPlayers.map((p) => this.mapToResponse(p));

    if (query.min_value !== undefined) {
      mapped = mapped.filter((p) => p.market_value >= query.min_value!);
    }
    if (query.max_value !== undefined) {
      mapped = mapped.filter((p) => p.market_value <= query.max_value!);
    }

    const positionOrder: Record<string, number> = { GOL: 1, ZAG: 2, LAT: 3, MEI: 4, ATA: 5 };

    mapped.sort((a, b) => {
      if (query.sort === 'position') {
        const diff = positionOrder[a.position] - positionOrder[b.position];
        if (diff !== 0) return diff;
      } else if (query.sort === 'value_desc') {
        const diff = b.market_value - a.market_value;
        if (diff !== 0) return diff;
      } else if (query.sort === 'value_asc') {
        const diff = a.market_value - b.market_value;
        if (diff !== 0) return diff;
      } else if (query.sort === 'age_desc') {
        const diff = b.age - a.age;
        if (diff !== 0) return diff;
      } else if (query.sort === 'age_asc') {
        const diff = a.age - b.age;
        if (diff !== 0) return diff;
      }

      const nameDiff = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
      if (nameDiff !== 0) return nameDiff;

      return a.id - b.id;
    });

    const totalItems = mapped.length;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(totalItems / limit) || 0;

    const startIndex = (page - 1) * limit;
    const paginatedData = mapped.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      meta: {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages,
      },
    };
  }
}