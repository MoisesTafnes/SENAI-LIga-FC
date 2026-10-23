import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./pages/Home";
import { AppLayout } from "./layouts/AppLayout";
import { PlayersPage } from "./modules/players/pages/PlayersPage";
import { ClubsPage } from "./modules/clubs/pages/ClubsPage";
import { ClubDetailPage } from "./modules/clubs/pages/ClubDetailPage";
import { Market } from "./pages/Market";
import { Matches } from "./pages/Matches";
import { MatchDetail } from "./pages/MatchDetail";
import { Standings } from "./pages/Standings";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tela Inicial (W01 & W02) */}
        <Route path="/" element={<Home />} />

        {/* Rotas Internas com AppLayout / Sidebar do Figma */}
        <Route element={<AppLayout />}>
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/clubs/:id" element={<ClubDetailPage />} />
          <Route path="/market" element={<Market />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/standings" element={<Standings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
