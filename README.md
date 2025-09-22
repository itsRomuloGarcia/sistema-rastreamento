# Sistema de Rastreamento Corporativo

Sistema profissional para rastreamento de pedidos com dark mode.

## Instalação

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Funcionalidades

- ✅ Dark mode por padrão com toggle (sem erro de hidratação)
- ✅ Busca por número do pedido ou nota fiscal
- ✅ Cálculos corretos de prazo de entrega
- ✅ Validação robusta de dados da planilha
- ✅ Interface responsiva e profissional
- ✅ Tratamento de erros e loading states

## Configuração

Configure a URL da planilha no `.env.local`:

```
NEXT_PUBLIC_SHEET_URL=sua_url_aqui
```

## Tecnologias

- Next.js 14 + TypeScript
- Tailwind CSS + Dark Mode
- Framer Motion
- TanStack Query
- date-fns
- next-themes
