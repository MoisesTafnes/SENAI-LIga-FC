# SENAI FC

Plataforma de gerenciamento de uma liga de futebol. O projeto reúne uma interface web para administrar clubes, jogadores, partidas e classificação, com uma API responsável pelas regras de negócio e persistência em PostgreSQL.

## Arquitetura

- **Frontend:** React, TypeScript e Vite. É uma SPA renderizada no navegador que consulta a API REST; não é uma aplicação full server-driven.
- **Backend:** NestJS e TypeScript, com endpoints REST sob `/api/v1`.
- **Banco de dados:** PostgreSQL, acessado pelo Prisma ORM e atualizado por migrations.
- **Execução local:** Docker Compose orquestra banco, API e frontend.

## Funcionalidades

- Cadastro, consulta, atualização e remoção lógica de jogadores.
- Cadastro e consulta de clubes e gerenciamento de elenco.
- Compra e venda de jogadores, com registro de transações e exportação do histórico.
- Definição e consulta de escalações.
- Simulação e consulta de partidas, com detalhes dos duelos.
- Consulta da classificação da liga.

## Requisitos

- Docker Engine e Docker Compose.
- Para executar os projetos sem Docker, Node.js 20 ou superior e npm.

## Executar com Docker Compose

Na raiz do repositório, crie seu arquivo local de variáveis a partir do exemplo:

```bash
cp .env.example .env
```

Altere `POSTGRES_PASSWORD` em `.env` para uma senha própria. Como essa senha é incorporada à URL de conexão do PostgreSQL, use caracteres seguros para URL ou codifique caracteres especiais conforme a codificação de URLs. Em seguida, construa as imagens e inicie os serviços:

```bash
docker compose up --build -d
```

O Compose inicia o PostgreSQL, aplica as migrations do Prisma ao iniciar o backend e serve a interface web.

| Serviço | Endereço |
| --- | --- |
| Frontend | <http://localhost:5173> |
| API | <http://localhost:3000/api/v1> |
| PostgreSQL | `localhost:5432` |

Para verificar o estado dos contêineres e consultar os logs:

```bash
docker compose ps
docker compose logs --tail=100 backend
```

Para encerrar os serviços:

```bash
docker compose down
```

Os dados do banco permanecem no volume `postgres_data`. Para apagar também os dados persistidos, use `docker compose down -v`.

O `VITE_API_URL` é usado durante a compilação do frontend; se alterar essa variável, reconstrua a imagem do frontend. O endereço padrão é adequado para acessar a aplicação a partir do navegador no mesmo computador que executa o Compose.

## Variáveis de ambiente

O arquivo `.env.example` documenta as variáveis usadas pelo Compose. Copie-o para `.env` e mantenha esse arquivo local, sem adicioná-lo ao Git.

| Variável | Uso | Padrão |
| --- | --- | --- |
| `POSTGRES_USER` | Usuário do PostgreSQL e da conexão Prisma | `administrator_senai` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL; obrigatória no Compose | Sem padrão |
| `POSTGRES_DB` | Nome do banco de dados | `senai_fc` |
| `CORS_ORIGIN` | Origem declarada para o backend (a configuração atual aceita todas as origens) | `http://localhost:5173` |
| `VITE_API_URL` | URL base da API incorporada no frontend durante o build | `http://localhost:3000/api/v1` |

Não reutilize senhas ou tokens em arquivos versionados. Se uma credencial já tiver sido compartilhada ou publicada, revogue-a e gere uma nova.

## Desenvolvimento sem Docker

Inicie o PostgreSQL e configure `DATABASE_URL` no ambiente do backend. Depois:

```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Em outro terminal, instale as dependências e inicie o frontend:

```bash
cd frontend
npm ci
npm run dev
```

O frontend usa `http://localhost:3000/api/v1` como URL padrão da API. Para mudar a URL, configure `VITE_API_URL` antes de iniciar o Vite.

## API

Os endpoints são prefixados por `/api/v1`. As principais rotas incluem:

| Recurso | Rotas |
| --- | --- |
| Jogadores | `GET/POST /players`, `GET/PUT/DELETE /players/:id`, `PATCH /players/:id/condition` |
| Clubes | `GET/POST /clubs`, `GET /clubs/:id`, rotas de escalação e transações em `/clubs/:id` |
| Mercado | `POST /players/:id/buy` e `POST /players/:id/sell` |
| Partidas | `GET/POST /matches`, `GET /matches/:id` |
| Classificação | `GET /standings` |

## Testes e build

Backend:

```bash
cd backend
npm ci
npm test
npm run build
```

Frontend:

```bash
cd frontend
npm ci
npm test
npm run build
```
