# SENAI FC

Aplicação para gerenciar uma liga de futebol: cadastro de jogadores e clubes, mercado de transferências, escalações, partidas e classificação. Desenvolvi o backend como uma API REST e o frontend como uma SPA em React, consumindo essa API pelo navegador.

## 1. Backend (NestJS, TypeScript, Prisma ORM e PostgreSQL)

O backend é dividido em módulos NestJS para jogadores, clubes, mercado e partidas. Os controladores expõem a API em `/api/v1`, os serviços concentram as regras de negócio e o Prisma faz o acesso ao PostgreSQL. A validação dos corpos e parâmetros usa DTOs, `class-validator`, `class-transformer` e o `ValidationPipe` global.

Implementei:

- cadastro, consulta, atualização, filtros, ordenação e exclusão lógica de jogadores;
- cadastro e consulta de clubes, caixa, elenco e patrimônio;
- escalações com validação de formação, posição, vínculo e condição dos titulares;
- compra e venda de jogadores, contratos de fidelidade, taxas, multas, comissões e histórico de transações;
- exportação CSV do histórico, com filtros;
- simulação de partidas, persistência dos seis duelos e consulta do histórico e da classificação;
- tratamento de erros HTTP com respostas JSON e validação dos identificadores nas rotas.

Os cálculos de mercado, overall, valor base e multa de fidelidade ficam centralizados na camada de domínio. Compra, venda, alteração de condição que tira o titular da escalação, definição de escalação e gravação de partidas usam transações do Prisma para manter juntas as gravações relacionadas.

### Documentação da API

Com a aplicação em execução, a documentação Swagger/OpenAPI fica em:

- Interface interativa: <http://localhost:3000/api/docs>
- Documento OpenAPI em JSON: <http://localhost:3000/api/docs-json>

A documentação é gerada a partir dos controladores e DTOs do NestJS. Não é necessário cadastrar uma chave ou fazer login na interface Swagger.

## 2. Frontend (React, Vite, TypeScript e Tailwind CSS)

O frontend é uma SPA (Single Page Application): o React renderiza as telas no navegador e consulta diretamente a API REST. Não uso Next.js, Route Handlers nem Server Actions para acessar o banco ou calcular respostas da API.

As telas cobrem o painel inicial, jogadores, clubes e elenco, compra e venda, histórico de transações, escalações, partidas e classificação. As chamadas HTTP ficam em clientes e serviços próprios; os componentes apresentam os dados e as respostas da API. O endereço-base padrão é `http://localhost:3000/api/v1`.

## 3. Suíte de Testes Automatizados

Os testes são executados em modo não interativo e terminam sozinhos:

```bash
cd backend
npm ci
npm test
```

```bash
cd frontend
npm ci
npm test
```

Na última validação feita durante esta implementação, os testes do backend passaram **59 de 59** e os do frontend, **32 de 32**. Há testes para regras de cálculo, serviços, validações, identificadores inválidos, geração do documento OpenAPI e componentes/serviços do frontend. Esse resultado registra a execução local; não representa cobertura de 100% do código nem substitui os roteiros de avaliação da banca.

Lint e verificação de formatação:

```bash
cd backend
npm run lint
npm run format:check
npm audit
```

```bash
cd frontend
npm run lint
npm run format:check
```

Para compilar os dois projetos:

```bash
cd backend
npm run build
```

```bash
cd frontend
npm run build
```

## 4. Infraestrutura, Docker e Segurança

O Docker Compose inicia PostgreSQL, backend e frontend. O backend aplica as migrations do Prisma antes de iniciar a API. As imagens usam Node.js 20 Alpine para compilar e executar o backend, Node.js 20 Alpine para compilar o frontend, Nginx Alpine para servir os arquivos estáticos e PostgreSQL 16 Alpine para o banco.

O backend libera CORS somente para a origem indicada em `CORS_ORIGIN`. Também desativa o cabeçalho `X-Powered-By`, adiciona cabeçalhos de segurança e registra, em uma linha por requisição, data/hora, método, caminho e status HTTP.

Senhas não devem ser gravadas no código. O `.env.example` contém somente valores locais de exemplo; crie seu `.env` e altere a senha antes de iniciar os serviços. O `.env` está ignorado pelo Git. CORS limita o acesso via navegador, mas não substitui autenticação: esta aplicação didática não implementa contas ou autorização e não deve ser exposta publicamente como serviço de produção sem esses controles e uma revisão adicional de segurança.

Também verifico as dependências do backend com `npm audit`. Para manter o Prisma 6 e corrigir avisos em dependências transitivas, o `package.json` registra overrides de `deepmerge-ts` e `js-yaml`; validei o resultado com o audit, o build e os testes do backend.

## Requisitos e versões

| Componente | Versão utilizada |
| --- | --- |
| Node.js nos Dockerfiles | `20-alpine` |
| NestJS | `11.2.8` |
| TypeScript do backend | `5.7.x` (lockfile instala `5.9.3`) |
| Prisma ORM e Prisma Client | `6.19.3` |
| PostgreSQL | `16-alpine` |
| React e React DOM | `19.3.1` |
| Vite | `8.3.5` |
| TypeScript do frontend | `6.0.3` |
| Tailwind CSS | `4.3.3` |
| Swagger (`@nestjs/swagger`) | `11.4.7` |
| Docker Compose | V2 |

Para executar tudo via Docker, basta ter Docker Engine e Docker Compose V2. Para trabalhar fora dos contêineres, instale Node.js `20.19+` ou `22.12+` e npm. Os arquivos `backend/package-lock.json` e `frontend/package-lock.json` estão versionados; use `npm ci` para instalar as dependências correspondentes ao lockfile.

## Executar o projeto com Docker Compose

Na raiz do repositório:

```bash
cp .env.example .env
```

Edite `POSTGRES_PASSWORD` e a senha correspondente dentro de `DATABASE_URL` no `.env`. Use uma senha de desenvolvimento com caracteres seguros para URL (ou codifique os caracteres especiais na URL). Mantenha a porta `3000` se não for atualizar também `VITE_API_URL`.

Inicie os três serviços com um único comando:

```bash
docker compose up --build -d
```

Endereços locais:

| Serviço | Endereço |
| --- | --- |
| Frontend | <http://localhost:5173> |
| API | <http://localhost:3000/api/v1> |
| Swagger | <http://localhost:3000/api/docs> |
| PostgreSQL | `localhost:5432` |

Confira o estado e os logs:

```bash
docker compose ps
docker compose logs --tail=100 backend
```

Encerre os serviços sem remover os dados:

```bash
docker compose down
```

Para recriar o banco do zero, removendo também o volume persistente, execute:

```bash
docker compose down -v
docker compose up --build -d
```

**Atenção:** `docker compose down -v` apaga permanentemente os dados locais do PostgreSQL. A senha do PostgreSQL é inicializada quando o volume é criado; se mudar a senha no `.env` depois da primeira inicialização, a nova variável não altera automaticamente a senha gravada no volume existente. Para um banco local descartável, a forma mais simples de aplicar a nova senha é recriar o volume com o comando acima.

O frontend Vite incorpora `VITE_API_URL` durante o build. Se mudar essa variável, reconstrua o frontend:

```bash
docker compose build --no-cache frontend
docker compose up -d --force-recreate frontend
```

## Executar sem Docker

É necessário ter um PostgreSQL 16 disponível e criado com o usuário e o banco definidos no `.env`. Na raiz, copie o arquivo de exemplo e ajuste `DATABASE_URL` para apontar ao PostgreSQL local:

```bash
cp .env.example .env
```

No primeiro terminal, instale as dependências do backend, carregue as variáveis locais no shell, aplique as migrations, gere o Prisma Client e inicie a API:

```bash
cd backend
npm ci
set -a
. ../.env
set +a
export NODE_ENV=development
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

No segundo terminal, a partir da raiz do repositório, instale as dependências e inicie o frontend:

```bash
cd frontend
npm ci
npm run dev
```

O Vite abre a interface em <http://localhost:5173>. A API fica em <http://localhost:3000/api/v1>. Para desenvolvimento local, configure `NODE_ENV=development` no ambiente do backend se quiser habilitar os logs de consulta do Prisma.

Para zerar o banco local e reaplicar todas as migrations, execute no backend:

```bash
cd backend
set -a
. ../.env
set +a
npx prisma migrate reset --force
```

Esse comando apaga os dados do banco selecionado em `DATABASE_URL`.

## Variáveis de ambiente

| Variável | Onde é usada | Valor de exemplo |
| --- | --- | --- |
| `POSTGRES_USER` | Inicialização do PostgreSQL e URL de conexão do Compose | `administrator_senai` |
| `POSTGRES_PASSWORD` | Inicialização do PostgreSQL e URL de conexão do Compose | `change-this-password` |
| `POSTGRES_DB` | Banco inicial do PostgreSQL e URL de conexão do Compose | `senai_fc` |
| `DATABASE_URL` | Prisma em execução local; no Compose é construída para usar o hostname do serviço `postgres` | `postgresql://...` |
| `PORT` | Porta em que a API NestJS escuta | `3000` |
| `NODE_ENV` | Modo do backend; afeta os logs do Prisma | `production` |
| `CORS_ORIGIN` | Única origem de navegador liberada pelo backend | `http://localhost:5173` |
| `VITE_API_URL` | URL da API incorporada no bundle do frontend no build | `http://localhost:3000/api/v1` |

Quando usar Docker, o Compose monta a `DATABASE_URL` interna com o hostname `postgres`; o valor de exemplo com `localhost` é para desenvolvimento fora do Compose. Se alterar a senha, atualize também a senha da URL usada fora dos contêineres.

## Rotas principais

Todas as rotas abaixo recebem o prefixo `/api/v1`:

| Recurso | Rotas |
| --- | --- |
| Jogadores | `GET/POST /players`, `GET/PUT/DELETE /players/:id`, `PATCH /players/:id/condition` |
| Clubes | `GET/POST /clubs`, `GET /clubs/:id`, `GET/PUT /clubs/:id/lineup` |
| Histórico | `GET /clubs/:id/transactions`, `GET /clubs/:id/transactions/export` |
| Mercado | `POST /players/:id/buy`, `POST /players/:id/sell` |
| Partidas | `GET/POST /matches`, `GET /matches/:id` |
| Classificação | `GET /standings` |

Consulte o Swagger para os parâmetros, corpos de requisição, respostas e códigos HTTP de cada operação.

## Organização do repositório

```text
backend/
  prisma/             schema, migrations e cliente Prisma
  src/
    clubs/            clubes, elenco, escalação e histórico
    common/           pipes compartilhados
    market/           compras, vendas e transações
    matches/          partidas, duelos e classificação
    players/          jogadores, DTOs e cálculos de domínio
frontend/
  src/
    modules/          telas e serviços de jogadores e clubes
    pages/            painel, partidas e classificação
    services/         cliente HTTP e serviços da API
docker-compose.yml
.env.example
```

## Bibliotecas e ferramentas

### Backend

- **NestJS (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`):** módulos, injeção de dependência, controladores, validação global e servidor HTTP.
- **Prisma (`prisma`, `@prisma/client`):** ORM tipado, migrations e acesso ao PostgreSQL.
- **`class-validator` e `class-transformer`:** validação e conversão declarativa dos DTOs.
- **`reflect-metadata` e `rxjs`:** dependências usadas pelo NestJS.
- **`@nestjs/swagger`:** geração da especificação OpenAPI e interface Swagger.
- **Jest, `ts-jest`, `@nestjs/testing` e Supertest:** testes de unidade/serviços e suporte a testes HTTP.
- **Prettier, Oxlint e `oxlint-tsgolint`:** formatação e análise estática do backend, incluindo lint com verificação de tipos.

### Frontend

- **React e React DOM:** construção e renderização da interface.
- **React Router DOM:** navegação entre telas sem recarregar a aplicação.
- **Vite:** servidor de desenvolvimento e build do frontend.
- **Axios:** cliente HTTP da API, com tratamento comum de erros.
- **Tailwind CSS, PostCSS, Autoprefixer e `tailwind-merge`:** estilos utilitários, processamento CSS e composição de classes.
- **`lucide-react`:** ícones usados nas telas.
- **Vitest, Testing Library, `user-event`, `jest-dom` e jsdom:** testes de componentes e interações em ambiente DOM simulado.
- **Oxlint:** análise estática do frontend.

## Decisões e premissas

- A API é a fonte dos cálculos de negócio; o frontend não recalcula valores financeiros, placares, classificação ou duelos.
- O banco usa migrations versionadas. Valores monetários são persistidos como `DECIMAL`; os valores dinâmicos de mercado e classificação são calculados nas consultas e não armazenados como colunas calculadas.
- O nome normalizado do clube é persistido e tem restrição única no PostgreSQL: espaços repetidos são normalizados e caixa é ignorada, mas acentos continuam distintos.
- O fim da fidelidade recebido pela API precisa conter o fuso horário. A interface envia as datas com o deslocamento de Brasília (`-03:00`).
- O frontend é uma SPA; a API permanece no backend NestJS e é consumida via HTTP pelo navegador.
- A aplicação foi preparada para execução local e avaliação do estudo de caso. Não implementei autenticação, autorização, hospedagem pública, pipeline de deploy nem observabilidade externa.
- Respostas de validação e de regras de negócio usam os códigos HTTP do NestJS e mensagens em português. Identificadores inválidos nas rotas de recursos respondem `404`; parâmetros de consulta inválidos são validados como entrada.

## Uso de ferramentas de IA

Usei o assistente Copilot como apoio durante o desenvolvimento e a correção do projeto. Ele ajudou a analisar o erro do container (`Cannot find module './app.module'`), conferir a saída do Nest build e identificar o efeito do cache incremental; a correção foi desativar o incremental apenas no `tsconfig.build.json` de produção e confirmar que os arquivos compilados voltaram a ser gerados. Também usei o assistente para revisar a configuração do Compose e do `.env.example`, preparar esta documentação e implementar/revisar as correções de CORS, transações da escalação, chave normalizada dos clubes, serviços de API no frontend, logs HTTP e Swagger.

Revisei as sugestões e validei as mudanças com testes e builds locais. Não alterei o caminho de importação do `AppModule`, porque a localização do arquivo e o import já estavam corretos. Para o Swagger, descartei a versão 11, incompatível com o NestJS 10 deste backend, e usei a versão 7.4 compatível. Não usei IA para inventar resultados dos roteiros da banca nem para fabricar histórico de commits ou de envios.

## Histórico do Git

O histórico versionado documenta as etapas de implementação do backend, a inclusão do frontend, os ajustes de infraestrutura e as correções finais. Os hashes de commit enviados na entrega identificam exatamente as versões a serem avaliadas. Não alterei datas de commits nem simulei dias de envio; a plataforma GitHub é a fonte correta para comprovar os pushes.
