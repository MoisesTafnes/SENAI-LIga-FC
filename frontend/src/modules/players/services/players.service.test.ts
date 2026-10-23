import { describe, it, expect, vi, beforeEach } from "vitest";
import { playersService } from "./players.service";
import { api } from "../../../services/api";

vi.mock("../../../services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("PlayersService (Frontend API Client)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar jogadores com parâmetros de paginação e filtros", async () => {
    const mockResponse = {
      data: {
        data: [{ id: 1, name: "Lucas Silva", position: "MEI" }],
        meta: { page: 1, limit: 10, total_items: 1, total_pages: 1 },
      },
    };
    vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

    const result = await playersService.getPlayers({
      page: 1,
      limit: 10,
      position: "MEI",
    });

    expect(api.get).toHaveBeenCalledWith("/players", {
      params: { page: 1, limit: 10, position: "MEI" },
    });
    expect(result).toEqual(mockResponse.data);
  });

  it("deve buscar jogador por ID", async () => {
    const mockPlayer = { id: 10, name: "Gabriel Barbosa", position: "ATA" };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPlayer });

    const result = await playersService.getPlayerById(10);

    expect(api.get).toHaveBeenCalledWith("/players/10");
    expect(result).toEqual(mockPlayer);
  });

  it("deve cadastrar novo jogador via POST /players", async () => {
    const newPlayerData = {
      name: "Carlos Alberto",
      position: "ZAG",
      age: 22,
      agility: 75,
      pace: 70,
      shooting: 50,
      passing: 65,
      dribbling: 60,
      defending: 82,
      physical: 78,
      potential: 85,
    };
    const createdPlayer = {
      id: 15,
      ...newPlayerData,
      base_value: 40.0,
      market_value: 40.0,
      overall: 75,
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: createdPlayer });

    const result = await playersService.createPlayer(newPlayerData);

    expect(api.post).toHaveBeenCalledWith("/players", newPlayerData);
    expect(result).toEqual(createdPlayer);
  });

  it("deve atualizar jogador utilizando PUT /players/:id (alinhado ao contrato da API)", async () => {
    const updateData = {
      name: "Carlos Alberto Santos",
      position: "ZAG",
      age: 23,
      agility: 76,
    };
    const updatedPlayer = { id: 15, ...updateData };
    vi.mocked(api.put).mockResolvedValueOnce({ data: updatedPlayer });

    const result = await playersService.updatePlayer(15, updateData);

    expect(api.put).toHaveBeenCalledWith("/players/15", updateData);
    expect(result).toEqual(updatedPlayer);
  });

  it("deve atualizar condição física via PATCH /players/:id/condition", async () => {
    const conditionResponse = {
      id: 15,
      condition: "MAL_CONDICIONADO",
      market_value: 34.0,
    };
    vi.mocked(api.patch).mockResolvedValueOnce({ data: conditionResponse });

    const result = await playersService.updateCondition(15, "MAL_CONDICIONADO");

    expect(api.patch).toHaveBeenCalledWith("/players/15/condition", {
      condition: "MAL_CONDICIONADO",
    });
    expect(result).toEqual(conditionResponse);
  });

  it("deve excluir jogador logicamente via DELETE /players/:id", async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null });

    const result = await playersService.deletePlayer(15);

    expect(api.delete).toHaveBeenCalledWith("/players/15");
    expect(result).toBeNull();
  });
});
