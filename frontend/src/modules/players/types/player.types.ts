export type PlayerPosition = "GOL" | "ZAG" | "LAT" | "MEI" | "ATA";
export type PlayerCondition = "APTO" | "MAL_CONDICIONADO" | "DOENTE";

export interface Player {
  id: number;
  name: string;
  position: PlayerPosition;
  agility: number;
  age: number;
  condition: PlayerCondition;
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
  overall: number;
  club_id: number | null;
  club_name?: string | null;
  club_acronym?: string | null;
}

export interface QueryPlayersParams {
  search?: string;
  position?: PlayerPosition;
  condition?: PlayerCondition;
  free?: boolean;
  club_id?: number;
  min_age?: number;
  max_age?: number;
  min_value?: number;
  max_value?: number;
  sort?: string;
  page?: number;
  limit?: number;
}
