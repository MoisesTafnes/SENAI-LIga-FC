import { Player } from '../../players/types/player.types';

export interface Club {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export interface ClubPlayerContract {
  loyalty_until: string;
  days_remaining: number;
  penalty_percentage: number;
}

export interface ClubPlayer extends Player {
  contract?: ClubPlayerContract | null;
}

export interface ClubDetail extends Club {
  players: ClubPlayer[];
}

export interface CreateClubDto {
  name: string;
  acronym: string;
}

export type ClubSortOption = 'name' | 'net_worth_desc' | 'net_worth_asc';
