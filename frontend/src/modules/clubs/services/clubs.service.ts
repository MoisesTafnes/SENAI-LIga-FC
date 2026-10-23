import { api } from '../../../services/api';
import { Club, ClubDetail, CreateClubDto, ClubSortOption } from '../types/club.types';

export const clubsService = {
  async getClubs(sort?: ClubSortOption): Promise<Club[]> {
    const res = await api.get('/clubs', { params: { sort } });
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  },

  async getClubById(id: number): Promise<ClubDetail> {
    const res = await api.get(`/clubs/${id}`);
    return res.data;
  },

  async createClub(dto: CreateClubDto): Promise<Club> {
    const res = await api.post('/clubs', dto);
    return res.data;
  },

  async getLineup(clubId: number) {
    const res = await api.get(`/clubs/${clubId}/lineup`);
    return res.data;
  },

  async updateLineup(clubId: number, formation: string, playerIds: number[]) {
    const res = await api.put(`/clubs/${clubId}/lineup`, {
      formation,
      player_ids: playerIds,
    });
    return res.data;
  },

  async getTransactions(clubId: number, type?: 'COMPRA' | 'VENDA', playerId?: number) {
    const res = await api.get(`/clubs/${clubId}/transactions`, {
      params: { type, player_id: playerId },
    });
    return res.data;
  },

  async exportTransactionsCsv(clubId: number, type?: 'COMPRA' | 'VENDA', playerId?: number) {
    const res = await api.get(`/clubs/${clubId}/transactions/export`, {
      params: { type, player_id: playerId },
      responseType: 'blob',
    });
    return res.data;
  },

  async sellPlayer(playerId: number) {
    const res = await api.post(`/players/${playerId}/sell`);
    return res.data;
  },
};
