import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { Players } from "./Players";

vi.mock("../services/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            name: "João Silva",
            position: "ATA",
            agility: 80,
            age: 23,
            condition: "APTO",
            base_value: 50.0,
            market_value: 50.0,
            overall: 78,
            club_id: null,
          },
        ],
        meta: { page: 1, limit: 10, total_items: 1, total_pages: 1 },
      },
    }),
  },
}));

describe("Players Component (Módulo de Jogadores)", () => {
  it("deve renderizar o título da página e o botão de novo jogador", async () => {
    render(
      <MemoryRouter>
        <Players />
      </MemoryRouter>,
    );

    expect(screen.getByText("Jogadores")).toBeInTheDocument();
    expect(screen.getByText("Novo jogador")).toBeInTheDocument();
  });
});
