export type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';
export type Condition = 'APTO' | 'CASSADO' | 'MAL_CONDICIONADO' | 'DOENTE';
export type Formation = '3-1' | '2-2' | '2-1-1' | '1-2-1';

export interface Player {
  id: number;
  name: string;
  position: Position;
  age: number;
  condition: Condition;
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  club_id: number | null;
  deleted_at?: string | null;
}

export interface PaginatedPlayers {
  data: Player[];
  meta: {
    total_items: number;
    total_pages: number;
    current_page: number;
    limit: number;
  };
}

export interface Club {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
  formation: Formation | null;
}

export interface LineupResponse {
  club_id: number;
  club_name: string;
  formation: Formation | null;
  complete: boolean;
  players: Player[];
}

export interface MarketTransaction {
  id: number;
  type: 'BUY' | 'SELL';
  player_id: number;
  player_name: string;
  seller_club_id: number | null;
  seller_club_name: string | null;
  buyer_club_id: number | null;
  buyer_club_name: string | null;
  amount: number;
  transacted_at: string;
}

export interface MatchSummary {
  id: number;
  played_at: string;
  home: {
    club_id: number;
    club_name: string;
    formation: string;
    goals: number;
  };
  away: {
    club_id: number;
    club_name: string;
    formation: string;
    goals: number;
  };
  result: 'MANDANTE' | 'VISITANTE' | 'EMPATE';
}

export interface StandingItem {
  position: number;
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}
