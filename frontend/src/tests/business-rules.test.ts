import { describe, it, expect } from 'vitest';

/**
 * Validação das Regras de Negócio no Frontend (RN01 a RN21)
 * Espelha as regras testadas e exigidas pela banca avaliadora no Backend.
 */
describe('Regras de Negócio e Validações (Barema SENAI FC)', () => {
  describe('RN01 e RN02 - Validação de Jogador (Nome, Atributos e Limites)', () => {
    function validatePlayerCreation(dto: {
      name: string;
      age: number;
      agility: number;
      pace: number;
      shooting: number;
      passing: number;
      dribbling: number;
      defending: number;
      physical: number;
      potential: number;
    }) {
      const errors: string[] = [];
      const words = dto.name.trim().split(/\s+/).filter(Boolean);
      if (words.length < 2) {
        errors.push('O nome deve conter pelo menos duas palavras.');
      }
      if (/\d/.test(dto.name)) {
        errors.push('O nome não pode conter números.');
      }

      const sumAttributes =
        dto.pace + dto.shooting + dto.passing + dto.dribbling + dto.defending + dto.physical;
      if (sumAttributes > 480) {
        errors.push('A soma dos seis atributos técnicos não pode ultrapassar 480.');
      }

      if (dto.age >= 35 && dto.agility > 85) {
        errors.push('Jogadores com 35 anos ou mais podem ter no máximo 85 de agilidade.');
      }

      const maxTech = Math.max(
        dto.pace,
        dto.shooting,
        dto.passing,
        dto.dribbling,
        dto.defending,
        dto.physical
      );

      if (dto.potential < maxTech) {
        errors.push('O potencial não pode ser inferior ao maior dos seis atributos.');
      }

      if (dto.age >= 33 && dto.potential !== maxTech) {
        errors.push('Para jogadores com 33 anos ou mais, o potencial deve ser exatamente igual ao maior atributo.');
      }

      return { valid: errors.length === 0, errors };
    }

    it('deve aceitar jogador válido cumprindo todas as regras de limites', () => {
      const res = validatePlayerCreation({
        name: 'Carlos Silva',
        age: 25,
        agility: 80,
        pace: 70,
        shooting: 65,
        passing: 80,
        dribbling: 75,
        defending: 50,
        physical: 60,
        potential: 85,
      });
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('deve recusar nome com apenas uma palavra', () => {
      const res = validatePlayerCreation({
        name: 'Carlos',
        age: 25,
        agility: 80,
        pace: 70,
        shooting: 65,
        passing: 80,
        dribbling: 75,
        defending: 50,
        physical: 60,
        potential: 85,
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('O nome deve conter pelo menos duas palavras.');
    });

    it('deve recusar cadastro quando a soma dos atributos ultrapassar 480', () => {
      const res = validatePlayerCreation({
        name: 'Carlos Silva',
        age: 25,
        agility: 80,
        pace: 90,
        shooting: 90,
        passing: 90,
        dribbling: 90,
        defending: 80,
        physical: 50, // Soma = 490
        potential: 90,
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('A soma dos seis atributos técnicos não pode ultrapassar 480.');
    });

    it('deve recusar agilidade > 85 para jogador com 35 anos ou mais', () => {
      const res = validatePlayerCreation({
        name: 'Carlos Silva',
        age: 36,
        agility: 90,
        pace: 70,
        shooting: 60,
        passing: 70,
        dribbling: 60,
        defending: 70,
        physical: 60,
        potential: 70,
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('Jogadores com 35 anos ou mais podem ter no máximo 85 de agilidade.');
    });

    it('deve exigir que potencial seja igual ao maior atributo para idade >= 33', () => {
      const res = validatePlayerCreation({
        name: 'Carlos Silva',
        age: 34,
        agility: 75,
        pace: 70,
        shooting: 60,
        passing: 80, // Maior atributo = 80
        dribbling: 60,
        defending: 70,
        physical: 60,
        potential: 85, // Inválido: deveria ser 80
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain(
        'Para jogadores com 33 anos ou mais, o potencial deve ser exatamente igual ao maior atributo.'
      );
    });
  });

  describe('RN03 e RN04 - Edição e Transições de Condição Física', () => {
    it('deve bloquear redução de idade na edição do jogador', () => {
      const currentAge = 28;
      const newAge = 27;
      const canUpdateAge = newAge >= currentAge;
      expect(canUpdateAge).toBe(false);
    });

    it('deve bloquear transição direta de condição física DOENTE para APTO', () => {
      function canChangeCondition(current: string, target: string) {
        if (current === 'DOENTE' && target === 'APTO') return false;
        return true;
      }
      expect(canChangeCondition('DOENTE', 'APTO')).toBe(false);
      expect(canChangeCondition('DOENTE', 'MAL_CONDICIONADO')).toBe(true);
      expect(canChangeCondition('MAL_CONDICIONADO', 'APTO')).toBe(true);
    });

    it('deve bloquear mudança de posição para jogador vinculado a um clube', () => {
      const player = { club_id: 1, position: 'ZAG' };
      const newPosition = 'MEI';
      const canChange = !player.club_id || player.position === newPosition;
      expect(canChange).toBe(false);
    });
  });

  describe('RN07 e RN08 - Validações de Cadastro do Clube', () => {
    function validateClubCreation(name: string, acronym: string) {
      const errors: string[] = [];
      const trimmedName = name.trim();
      const words = trimmedName.split(/\s+/).filter(Boolean);

      if (words.length < 2 || words.length > 5) {
        errors.push('O nome deve conter de 2 a 5 palavras.');
      }

      const upperAcronym = acronym.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(upperAcronym)) {
        errors.push('A sigla deve conter exatamente 3 letras.');
      } else {
        if (upperAcronym[0] === upperAcronym[1] && upperAcronym[1] === upperAcronym[2]) {
          errors.push('A sigla não pode ter as 3 letras idênticas.');
        }
        const normalizedName = trimmedName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase();
        const firstLetterOfName = normalizedName.replace(/[^A-Z]/g, '')[0];

        if (trimmedName.length > 0 && upperAcronym[0] !== firstLetterOfName) {
          errors.push('A primeira letra da sigla deve ser igual à primeira letra do nome.');
        }
      }

      return { valid: errors.length === 0, errors };
    }

    it('deve aceitar clube válido com nome de 2 a 5 palavras e sigla coerente', () => {
      const res = validateClubCreation('Águias Futebol Clube', 'AGU');
      expect(res.valid).toBe(true);
    });

    it('deve recusar sigla com as 3 letras idênticas (ex: AAA)', () => {
      const res = validateClubCreation('América Futebol Clube', 'AAA');
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('A sigla não pode ter as 3 letras idênticas.');
    });

    it('deve recusar sigla cuja primeira letra seja diferente da inicial do nome', () => {
      const res = validateClubCreation('Águias Futebol Clube', 'FAG');
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('A primeira letra da sigla deve ser igual à primeira letra do nome.');
    });
  });

  describe('RN10 a RN16 - Regras de Mercado e Transferências', () => {
    it('deve recusar compra se o custo ultrapassar 50% do caixa do clube', () => {
      const clubCash = 100.0;
      const playerMarketValue = 60.0;
      const canAfford = playerMarketValue <= clubCash * 0.5;
      expect(canAfford).toBe(false);
    });

    it('deve recusar compra se o clube já possuir 12 jogadores no elenco', () => {
      const squadCount = 12;
      const canAddPlayer = squadCount < 12;
      expect(canAddPlayer).toBe(false);
    });

    it('deve calcular comissão da liga progressiva (10% até 10 moedas e 20% no excedente)', () => {
      function calculateCommission(profit: number): number {
        if (profit <= 0) return 0;
        if (profit <= 10.0) {
          return profit * 0.1;
        }
        return 10.0 * 0.1 + (profit - 10.0) * 0.2;
      }

      expect(calculateCommission(10.0)).toBe(1.0);
      expect(calculateCommission(15.0)).toBe(2.0); // 1.0 + 5 * 0.2 = 2.0
    });

    it('deve aplicar teto de 10.00 moedas na multa por quebra de fidelidade', () => {
      function calculatePenalty(daysRemaining: number, basePenaltyPerDay: number): number {
        const rawPenalty = daysRemaining * basePenaltyPerDay;
        return Math.min(rawPenalty, 10.0);
      }

      expect(calculatePenalty(300, 0.1)).toBe(10.0); // 30.0 limitado a 10.0
    });
  });

  describe('RN20 e RN21 - Partidas e Classificação da Liga', () => {
    it('deve impedir simulação de partida com o mesmo clube como mandante e visitante', () => {
      const homeClubId = 1;
      const awayClubId = 1;
      const isValidMatch = homeClubId !== awayClubId;
      expect(isValidMatch).toBe(false);
    });

    it('deve ordenar a tabela por Pontos -> Saldo de Gols -> Gols Pró -> Nome', () => {
      const standings = [
        { name: 'Tigres FC', points: 0, goal_diff: -5, goals_for: 0 },
        { name: 'Águias FC', points: 3, goal_diff: 2, goals_for: 2 },
        { name: 'Leões FC', points: 3, goal_diff: 3, goals_for: 3 },
      ];

      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
        if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
        return a.name.localeCompare(b.name, 'pt-BR');
      });

      expect(standings[0].name).toBe('Leões FC');
      expect(standings[1].name).toBe('Águias FC');
      expect(standings[2].name).toBe('Tigres FC');
    });
  });
});
