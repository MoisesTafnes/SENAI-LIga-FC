import { api } from "./api";

export const leagueService = {
  getPlayers() {
    return api.get("/players", { params: { limit: 100 } });
  },

  getClubs() {
    return api.get("/clubs");
  },

  getMatches(clubId?: number) {
    return api.get("/matches", {
      params: clubId === undefined ? undefined : { club_id: clubId },
    });
  },

  getStandings() {
    return api.get("/standings");
  },

  getMatch(id: number | string) {
    return api.get(`/matches/${id}`);
  },

  createMatch(homeClubId: number, awayClubId: number) {
    return api.post("/matches", {
      home_club_id: homeClubId,
      away_club_id: awayClubId,
    });
  },
};
