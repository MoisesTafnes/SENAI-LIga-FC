export type PlayerPosition = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';
export type PlayerCondition = 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE';

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface LoyaltyPenalty {
  daysRemaining: number;
  percentage: number;
  amount: number;
}

export class PlayerCalculatorDomain {
  /**
   * Tabela de Pesos por Posição (RN06)
   * A soma dos pesos de cada posição é estritamente igual a 100%.
   */
  private static readonly POSITION_WEIGHTS: Record<
    PlayerPosition,
    PlayerAttributes
  > = {
    GOL: {
      pace: 10,
      shooting: 0,
      passing: 20,
      dribbling: 0,
      defending: 40,
      physical: 30,
    },
    ZAG: {
      pace: 10,
      shooting: 0,
      passing: 15,
      dribbling: 0,
      defending: 45,
      physical: 30,
    },
    LAT: {
      pace: 25,
      shooting: 0,
      passing: 20,
      dribbling: 15,
      defending: 25,
      physical: 15,
    },
    MEI: {
      pace: 10,
      shooting: 15,
      passing: 35,
      dribbling: 25,
      defending: 5,
      physical: 10,
    },
    ATA: {
      pace: 20,
      shooting: 40,
      passing: 10,
      dribbling: 20,
      defending: 0,
      physical: 10,
    },
  };

  /**
   * Arredondamento 'Half Away From Zero' (Premissas e RN01)
   * Exemplo: 14.775 -> 14.78; 0.385 -> 0.39; 3.625 -> 3.63
   */
  public static roundHalfAwayFromZero(num: number, decimals = 2): number {
    const sign = num >= 0 ? 1 : -1;
    const absNum = Math.abs(num);
    const factor = Math.pow(10, decimals);
    const rounded = Math.floor(absNum * factor + 0.5) / factor;
    return Number((sign * rounded).toFixed(decimals));
  }

  /**
   * Cálculo do Overall (RN06)
   * Passo 1: Multiplica cada atributo pelo peso da posição.
   * Passo 2: Soma os produtos e divide por 100.
   * Passo 3: Arredonda para o inteiro mais próximo (meio para cima: 72.5 -> 73).
   */
  public static calculateOverall(
    position: PlayerPosition,
    attributes: PlayerAttributes,
  ): number {
    const weights = this.POSITION_WEIGHTS[position];
    const sumProducts =
      attributes.pace * weights.pace +
      attributes.shooting * weights.shooting +
      attributes.passing * weights.passing +
      attributes.dribbling * weights.dribbling +
      attributes.defending * weights.defending +
      attributes.physical * weights.physical;

    const rawOverall = sumProducts / 100;
    return Math.floor(rawOverall + 0.5);
  }

  /**
   * Cálculo do Valor Base no Cadastro (RN06)
   * Calculado UMA ÚNICA VEZ no cadastro do jogador.
   * Faixas progressivas de Overall:
   * - Até 40: 0.00
   * - 41 a 60: 0.50 por ponto
   * - 61 a 75: 2.00 por ponto
   * - 76 a 99: 6.00 por ponto
   * Multiplicador de Jovem Promessa (idade <= 21): parte do overall * (100 + potencial - overall) / 100
   * Piso Mínimo: 1.00
   */
  public static calculateBaseValue(
    overall: number,
    potential: number,
    ageAtCreation: number,
  ): number {
    let overallPart = 0;

    if (overall > 40 && overall <= 60) {
      overallPart = (overall - 40) * 0.5;
    } else if (overall > 60 && overall <= 75) {
      overallPart = 20 * 0.5 + (overall - 60) * 2.0;
    } else if (overall > 75) {
      overallPart = 20 * 0.5 + 15 * 2.0 + (overall - 75) * 6.0;
    }

    if (ageAtCreation <= 21) {
      overallPart = (overallPart * (100 + potential - overall)) / 100;
    }

    const roundedValue = this.roundHalfAwayFromZero(overallPart, 2);
    return roundedValue < 1.0 ? 1.0 : roundedValue;
  }

  /**
   * Cálculo do Valor de Mercado (RN02 a RN05)
   * Calculado DINAMICAMENTE em tempo de consulta.
   * 1. Desconto por condição (RN02): APTO (0%), MAL_CONDICIONADO (15%), DOENTE (30%).
   * 2. Efeito da Agilidade (RN03) se não for APTO:
   *    - Agilidade 80 a 100: desconto cai pela metade.
   *    - Agilidade 1 a 30: desconto aumenta 10 pontos percentuais.
   * 3. Ajuste por idade (RN04): <= 21 (+10%), 22 a 31 (0%), >= 32 (-10%).
   * 4. Percentual total = ajuste idade - desconto condição.
   * 5. Teto de desconto: limite mínimo de -40%.
   * 6. Piso do valor de mercado: mínimo de 1.00.
   */
  public static calculateMarketValue(
    baseValue: number,
    condition: PlayerCondition,
    agility: number,
    currentAge: number,
  ): number {
    let conditionDiscount = 0;

    if (condition === 'MAL_CONDICIONADO') {
      conditionDiscount = 15;
    } else if (condition === 'DOENTE') {
      conditionDiscount = 30;
    }

    if (condition !== 'APTO') {
      if (agility >= 80 && agility <= 100) {
        conditionDiscount /= 2;
      } else if (agility >= 1 && agility <= 30) {
        conditionDiscount += 10;
      }
    }

    let ageAdjustment = 0;
    if (currentAge <= 21) {
      ageAdjustment = 10;
    } else if (currentAge >= 32) {
      ageAdjustment = -10;
    }

    let totalPercentage = ageAdjustment - conditionDiscount;

    if (totalPercentage < -40) {
      totalPercentage = -40;
    }

    const rawMarketValue = (baseValue * (100 + totalPercentage)) / 100;
    const roundedValue = this.roundHalfAwayFromZero(rawMarketValue, 2);

    return roundedValue < 1.0 ? 1.0 : roundedValue;
  }

  public static calculateLoyaltyPenalty(
    loyaltyUntil: Date,
    now: Date,
    marketValue: number,
  ): LoyaltyPenalty {
    const remainingMilliseconds = loyaltyUntil.getTime() - now.getTime();
    const daysRemaining =
      remainingMilliseconds > 0
        ? Math.ceil(remainingMilliseconds / (1000 * 60 * 60 * 24))
        : 0;

    let percentage = 0;
    if (daysRemaining > 0 && daysRemaining <= 30) percentage = 5;
    else if (daysRemaining <= 180 && daysRemaining > 0) percentage = 10;
    else if (daysRemaining > 180) percentage = 20;

    const uncappedAmount = this.roundHalfAwayFromZero(
      (marketValue * percentage) / 100,
      2,
    );

    return {
      daysRemaining,
      percentage,
      amount: Math.min(uncappedAmount, 10),
    };
  }
}
