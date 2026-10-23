import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clubsService } from './clubs.service';
import { api } from '../../../services/api';

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('ClubsService (Frontend API Client)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve listar clubes com ordenação opcional', async () => {
    const mockClubs = [
      { id: 1, name: 'Águias FC', acronym: 'AGU', cash: 300.0, squad_value: 0, net_worth: 300.0 },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockClubs });

    const result = await clubsService.getClubs('net_worth_desc');

    expect(api.get).toHaveBeenCalledWith('/clubs', { params: { sort: 'net_worth_desc' } });
    expect(result).toEqual(mockClubs);
  });

  it('deve buscar detalhes do clube por ID', async () => {
    const mockClubDetail = {
      id: 1,
      name: 'Águias FC',
      acronym: 'AGU',
      cash: 300.0,
      formation: '2-2',
      players: [],
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockClubDetail });

    const result = await clubsService.getClubById(1);

    expect(api.get).toHaveBeenCalledWith('/clubs/1');
    expect(result).toEqual(mockClubDetail);
  });

  it('deve criar novo clube via POST /clubs', async () => {
    const createDto = { name: 'Falcões da Serra', acronym: 'FDS' };
    const created = { id: 2, ...createDto, cash: 300.0 };
    vi.mocked(api.post).mockResolvedValueOnce({ data: created });

    const result = await clubsService.createClub(createDto);

    expect(api.post).toHaveBeenCalledWith('/clubs', createDto);
    expect(result).toEqual(created);
  });

  it('deve consultar escalação tática do clube via GET /clubs/:id/lineup', async () => {
    const mockLineup = {
      club_id: 1,
      formation: '2-2',
      complete: true,
      players: [{ id: 10, position: 'GOL' }],
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockLineup });

    const result = await clubsService.getLineup(1);

    expect(api.get).toHaveBeenCalledWith('/clubs/1/lineup');
    expect(result).toEqual(mockLineup);
  });

  it('deve salvar escalação tática via PUT /clubs/:id/lineup', async () => {
    const lineupPayload = { formation: '2-2', player_ids: [1, 2, 3, 4, 5] };
    const savedLineup = { club_id: 1, formation: '2-2', complete: true, players: [] };
    vi.mocked(api.put).mockResolvedValueOnce({ data: savedLineup });

    const result = await clubsService.updateLineup(1, '2-2', [1, 2, 3, 4, 5]);

    expect(api.put).toHaveBeenCalledWith('/clubs/1/lineup', lineupPayload);
    expect(result).toEqual(savedLineup);
  });

  it('deve vender jogador do clube via POST /players/:id/sell', async () => {
    const sellResult = {
      transaction_id: 5,
      profit: 10.0,
      penalty_fee: 0.0,
      league_commission: 1.0,
      cash_change: 29.0,
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: sellResult });

    const result = await clubsService.sellPlayer(10);

    expect(api.post).toHaveBeenCalledWith('/players/10/sell');
    expect(result).toEqual(sellResult);
  });
});
