import { PlayerCalculatorDomain } from './player-calculator.domain';

describe('PlayerCalculatorDomain (RN02 a RN06)', () => {
  describe('Cálculo do Valor de Mercado (Tabela da RN05)', () => {
    it('deve calcular corretamente para jogador APTO sem descontos', () => {
      const val = PlayerCalculatorDomain.calculateMarketValue(
        82.0,
        'APTO',
        20,
        25,
      );
      expect(val).toBe(82.0);
    });

    it('deve aplicar +10% de jovem promessa para APTO com 19 anos', () => {
      const val = PlayerCalculatorDomain.calculateMarketValue(
        82.0,
        'APTO',
        50,
        19,
      );
      expect(val).toBe(90.2);
    });

    it('deve aplicar 15% de desconto para MAL_CONDICIONADO com agilidade neutra (50)', () => {
      const val = PlayerCalculatorDomain.calculateMarketValue(
        82.0,
        'MAL_CONDICIONADO',
        50,
        25,
      );
      expect(val).toBe(69.7);
    });

    it('deve reduzir o desconto pela metade quando agilidade for >= 80', () => {
      const val = PlayerCalculatorDomain.calculateMarketValue(
        82.0,
        'MAL_CONDICIONADO',
        80,
        21,
      );
      expect(val).toBe(84.05);
    });

    it('deve aumentar o desconto em 10pp quando agilidade for <= 30', () => {
      const val = PlayerCalculatorDomain.calculateMarketValue(
        82.0,
        'MAL_CONDICIONADO',
        30,
        33,
      );
      expect(val).toBe(53.3);
    });

    it('deve limitar o desconto ao teto de -40% quando a combinação ultrapassar o limite', () => {
      const val = PlayerCalculatorDomain.calculateMarketValue(
        82.0,
        'DOENTE',
        10,
        40,
      );
      expect(val).toBe(49.2);
    });

    it('deve respeitar o piso mínimo de 1.00', () => {
      const val = PlayerCalculatorDomain.calculateMarketValue(
        1.0,
        'MAL_CONDICIONADO',
        50,
        35,
      );
      expect(val).toBe(1.0);
    });
  });

  describe('Cálculo do Overall e Valor Base (Tabelas da RN06)', () => {
    it('deve calcular o overall de MEI corretamente', () => {
      const overall = PlayerCalculatorDomain.calculateOverall('MEI', {
        pace: 68,
        shooting: 65,
        passing: 80,
        dribbling: 78,
        defending: 52,
        physical: 60,
      });
      expect(overall).toBe(73);
    });

    it('deve calcular o valor base para jogador sem multiplicador de jovem promessa (25 anos)', () => {
      const baseValue = PlayerCalculatorDomain.calculateBaseValue(75, 86, 25);
      expect(baseValue).toBe(40.0);
    });

    it('deve aplicar multiplicador de jovem promessa no valor base para idade <= 21', () => {
      const baseValue = PlayerCalculatorDomain.calculateBaseValue(70, 84, 21);
      expect(baseValue).toBe(34.2);
    });
  });

  describe('Multa por fidelidade (RN15)', () => {
    const now = new Date('2026-10-23T12:00:00.000Z');

    it('arredonda para cima os dias restantes e aplica a faixa de 31 dias', () => {
      const loyaltyUntil = new Date(now.getTime() + 30 * 86_400_000 + 1);

      expect(
        PlayerCalculatorDomain.calculateLoyaltyPenalty(loyaltyUntil, now, 64),
      ).toEqual({ daysRemaining: 31, percentage: 10, amount: 6.4 });
    });

    it('limita a multa ao teto de 10,00', () => {
      const loyaltyUntil = new Date(now.getTime() + 200 * 86_400_000);

      expect(
        PlayerCalculatorDomain.calculateLoyaltyPenalty(loyaltyUntil, now, 76),
      ).toEqual({ daysRemaining: 200, percentage: 20, amount: 10 });
    });
  });
});
