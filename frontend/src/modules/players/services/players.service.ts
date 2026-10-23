import { api } from '../../../services/api';
import { Player, QueryPlayersParams } from '../types/player.types';

export const playersService = {
  async getPlayers(params: QueryPlayersParams) {
    const res = await api.get('/players', { params });
    return res.data;
  },

  async getPlayerById(id: number): Promise<Player> {
    const res = await api.get(`/players/${id}`);
    return res.data;
  },

  async createPlayer(data: any): Promise<Player> {
    const res = await api.post('/players', data);
    return res.data;
  },

  async updatePlayer(id: number, data: any): Promise<Player> {
    const res = await api.put(`/players/${id}`, data);
    return res.data;
  },

  async updateCondition(id: number, condition: string) {
    const res = await api.patch(`/players/${id}/condition`, { condition });
    return res.data;
  },

  async deletePlayer(id: number) {
    const res = await api.delete(`/players/${id}`);
    return res.data;
  },
};
