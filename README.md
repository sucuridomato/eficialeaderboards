# EficIA Leaderboards

Tela de ranking/leaderboard com visual premium, leitura real do Supabase e atualizacao em tempo real.

## Stack

- React + TypeScript + Vite
- Supabase JS (`@supabase/supabase-js`)

## Rodar local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Variaveis de ambiente (opcional)

O projeto possui fallback para URL e anon key no codigo, mas voce pode sobrescrever por ambiente:

```bash
VITE_SUPABASE_URL=https://egjvcxywrifspxlxfgwx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_CURRENT_USER_ID=uuid-do-usuario
VITE_CURRENT_USER_NAME=nome-publico-opcional
```

`VITE_CURRENT_USER_ID` e `VITE_CURRENT_USER_NAME` sao usados apenas para destacar o card "Sua posicao".
