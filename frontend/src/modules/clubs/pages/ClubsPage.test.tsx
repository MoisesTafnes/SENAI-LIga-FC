import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { ClubsPage } from "./ClubsPage";

vi.mock("../services/clubs.service", () => ({
  clubsService: {
    getClubs: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: "Águias FC",
        acronym: "AGU",
        cash: 51.58,
        squad_value: 222.68,
        net_worth: 274.26,
      },
      {
        id: 2,
        name: "Delta FC",
        acronym: "DEL",
        cash: 91.85,
        squad_value: 200.76,
        net_worth: 292.61,
      },
    ]),
  },
}));

describe("ClubsPage Component (Módulo de Clubes - C01)", () => {
  it("deve renderizar o título da página, botão de novo clube e listagem de clubes", async () => {
    render(
      <MemoryRouter>
        <ClubsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Clubes" })).toBeInTheDocument();
    expect(screen.getByText("Novo clube")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Águias FC")).toBeInTheDocument();
      expect(screen.getByText("Delta FC")).toBeInTheDocument();
    });
  });
});
