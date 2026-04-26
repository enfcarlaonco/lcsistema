# LC Sistema — MVP

Plataforma de gestão assistencial e econômica para serviços de nefrologia.

---

## Setup em 5 passos

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar banco de dados

Crie uma conta gratuita em [neon.tech](https://neon.tech) e um novo projeto chamado `lcsistema`.

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha o `.env` com sua connection string do Neon:

```
DATABASE_URL="postgresql://usuario:senha@host/lcsistema?sslmode=require"
NEXTAUTH_SECRET="gere-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Criar as tabelas no banco

```bash
npm run db:push
```

### 4. Popular com dados iniciais

```bash
npm run db:seed
```

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Credenciais de acesso (após seed)

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin LC Saúde | luciana@lcsaude.com.br | lcsaude@2026 |
| Cliente Demo | gestao@hospdilsongodinho.com.br | dilson@2026 |

---

## Estrutura do projeto

```
src/
├── app/
│   ├── api/          → endpoints REST
│   ├── auth/         → tela de login
│   ├── dashboard/    → telas principais
│   └── providers.tsx → SessionProvider
├── components/
│   ├── layout/       → Sidebar, Header
│   ├── ui/           → botões, cards, badges
│   ├── forms/        → formulários reutilizáveis
│   ├── charts/       → gráficos Recharts
│   └── dashboard/    → widgets do dashboard
├── lib/
│   ├── prisma.ts     → cliente Prisma singleton
│   ├── auth.ts       → configuração NextAuth
│   └── utils.ts      → utilitários gerais
├── types/            → extensões de tipos TypeScript
└── hooks/            → hooks customizados
prisma/
├── schema.prisma     → modelo do banco de dados
└── seed.ts           → dados iniciais
```

---

## Próximos arquivos (Dia 2)

- `src/app/api/clientes/route.ts`
- `src/app/api/dados-financeiros/route.ts`
- `src/app/dashboard/clientes/page.tsx`
- `src/app/dashboard/financeiro/page.tsx`
- `src/lib/motores/financeiro.ts`
- `src/lib/motores/documental.ts`
