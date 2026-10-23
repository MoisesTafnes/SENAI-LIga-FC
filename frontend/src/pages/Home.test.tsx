import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Home } from './Home';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn((url: string) => {
      if (url.includes('/players')) {
        return Promise.resolve({ data: { data: [], meta: { total_items: 23 } } });
      }
      if (url.includes('/clubs')) {
        return Promise.resolve({ data: [{ id: 1, name: 'Delta FC' }] });
      }
      if (url.includes('/matches')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/standings')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    }),
  },
}));

describe('Home Page (W01 & W02)', () => {
  it('deve renderizar a tela inicial com todos os elementos de W01 e W02', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Passe')).toBeInTheDocument();
    expect(screen.getByText('Gestão da liga, do mercado à classificação')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar/i })).toBeInTheDocument();
    expect(screen.getByText('Enter')).toBeInTheDocument();
    expect(screen.getByText('Não precisa de login')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('Jogadores')).toBeInTheDocument();
    expect(screen.getByText('06')).toBeInTheDocument();
    expect(screen.getByText('Liga')).toBeInTheDocument();
    expect(screen.getByText(/Horário de Brasília/i)).toBeInTheDocument();
  });
});
