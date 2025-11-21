# Gummy Hair E-Commerce

E-commerce de vitaminas gummy hair desenvolvido com Expo Router e Supabase.

## Tecnologias

- **Expo Router** - Framework React Native para desenvolvimento web e mobile
- **Supabase** - Backend as a Service (banco de dados, autenticação, storage)
- **TypeScript** - Tipagem estática para JavaScript
- **React Native Web** - Para renderização web

## Estrutura do Projeto

```
├── app/                    # Rotas da aplicação (Expo Router)
│   ├── _layout.tsx        # Layout raiz
│   ├── index.tsx          # Página inicial / produtos
│   ├── cart.tsx           # Carrinho de compras
│   ├── checkout.tsx       # Checkout
│   ├── payment.tsx        # Página de pagamento
│   └── order-confirmation.tsx  # Confirmação do pedido
├── assets/                # Imagens e recursos estáticos
├── hooks/                 # React hooks customizados
├── lib/                   # Configurações e utilidades
│   ├── supabase.ts       # Cliente Supabase
│   ├── images.ts         # Gestão de imagens
│   └── metaPixel.ts      # Meta Pixel tracking
└── supabase/             # Configurações do Supabase
    ├── migrations/       # Migrações do banco de dados
    └── functions/        # Edge Functions
```

## Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- npm ou yarn

## Configuração

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd gummy-hair-ecommerce
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```bash
cp .env.example .env
```

Preencha as variáveis com suas credenciais do Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 4. Configure o banco de dados

As migrações estão em `supabase/migrations/`. Para aplicá-las:

1. Acesse o painel do Supabase
2. Vá em SQL Editor
3. Execute cada arquivo de migração na ordem

Ou use a CLI do Supabase:

```bash
npx supabase db push
```

## Desenvolvimento

### Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Isso iniciará o Expo Dev Server. Você pode:
- Pressionar `w` para abrir no navegador web
- Escanear o QR code com o app Expo Go para testar no mobile

### Build para web

```bash
npm run build:web
```

O build será gerado na pasta `dist/`.

## Deploy

### Vercel (Recomendado)

1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente no painel da Vercel:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Configure o build:
   - Build Command: `npm run build:web`
   - Output Directory: `dist`
4. Deploy!

A Vercel fará deploy automático a cada push na branch principal.

## Funcionalidades

- Catálogo de produtos com imagens
- Carrinho de compras com persistência
- Checkout com validação de formulário
- Integração com sistema de pagamento
- Rastreamento de pedidos
- Chat de atendimento (IA)
- Meta Pixel para tracking de conversões

## Banco de Dados

O projeto usa Supabase PostgreSQL com as seguintes tabelas:

- `addresses` - Endereços de entrega
- `orders` - Pedidos realizados
- `cart_items` - Itens do carrinho
- `chat_sessions` - Sessões de chat
- `chat_messages` - Mensagens do chat

Todas as tabelas possuem Row Level Security (RLS) habilitado.

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build:web` - Gera build para produção (web)
- `npm run lint` - Verifica problemas no código
- `npm run typecheck` - Verifica erros de TypeScript

## Suporte

Para questões sobre o projeto, abra uma issue no GitHub.

## Licença

Privado - Todos os direitos reservados
