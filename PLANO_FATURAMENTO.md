# Diagnóstico e Plano de Ação: Faturamento e Entrega (The Pixel Dream)

Realizei uma varredura completa na arquitetura atual de autenticação, banco de dados (Supabase) e fluxo de pagamento (Stripe). O sistema possui uma base sólida, mas precisa de ajustes críticos para suportar o faturamento real e a entrega automatizada de forma segura.

## 1. Diagnóstico Atual

### 1.1 Autenticação e Perfis (Supabase Auth)
- **Status:** O fluxo de Signup/Login via Server Actions (`/auth/signup/route.ts` e `/auth/login/route.ts`) está funcional.
- **Vínculo de Perfil:** O Supabase possui uma trigger `on_auth_user_created` que chama a função `handle_new_user()` para criar automaticamente uma linha na tabela `profiles` quando um usuário se cadastra, vinculando o `auth.uid()`.
- **Segurança (RLS):** A tabela `profiles` possui políticas RLS que permitem aos usuários ler e atualizar apenas o próprio perfil. No entanto, a tabela `orders` possui uma política perigosa (`Service role can insert orders` com permissão `public`), e faltam tabelas cruciais para a entrega dos arquivos (como a tabela `entitlements` e `order_items`, que não existem no banco de produção, apesar de estarem no schema.sql do repositório).

### 1.2 Integração com Stripe
- **Status:** O checkout (`/api/checkout/stripe/route.ts`) atualmente cria uma sessão no Stripe "on-the-fly" usando `price_data`. Isso funciona para pagamentos avulsos, mas não cria um Produto/Preço oficial no painel do Stripe, dificultando a gestão contábil e o uso de recursos avançados (como Customer Portal e links de pagamento).
- **Criação de Produtos:** A página de administração (`AdminClient.tsx`) salva os produtos no Supabase, mas **não** se comunica com a API do Stripe para criar o produto equivalente lá.
- **Coluna Ausente:** A tabela `products` no Supabase não possui a coluna `stripe_price_id` para vincular os dois ecossistemas.

### 1.3 Lógica de Entrega Pós-Compra (Webhook)
- **Status:** A rota de webhook (`/api/webhooks/stripe/route.ts`) está configurada para ouvir eventos do Stripe, mas ela tenta inserir dados em tabelas que **não existem no banco de dados de produção** (`order_items` e `entitlements`).
- **Página de Conta:** A página `/account` consulta a tabela `entitlements` (que não existe) para listar os produtos comprados. Além disso, a lógica atual não contempla a disponibilização dos arquivos fonte originais (como os modelos de IA completos ou links de download seguros).

---

## 2. Plano de Ação

Para preparar o marketplace para faturar de forma automatizada e segura, executarei as seguintes etapas em uma nova branch (`feature/billing-stripe`):

### Fase 1: Correção do Schema e RLS no Supabase
1. **Novas Colunas:** Adicionar `stripe_product_id` e `stripe_price_id` à tabela `products`.
2. **Novas Tabelas:** Criar as tabelas `order_items` (para detalhamento do pedido) e `entitlements` (para controle de acesso e entrega dos arquivos), que estão ausentes na produção.
3. **Ajuste de RLS:** Reforçar as políticas de segurança da tabela `orders` e garantir que `entitlements` seja acessível apenas pelo comprador e administradores.

### Fase 2: Sincronização Automática com o Stripe
1. **Refatoração do Admin:** Modificar a criação de produtos no painel de administração (`AdminClient.tsx` e uma nova API route segura) para que, ao salvar um produto no Supabase, ele faça uma chamada à API do Stripe (`stripe.products.create` e `stripe.prices.create`).
2. **Vínculo:** Salvar os IDs retornados pelo Stripe na linha correspondente do Supabase.
3. **Refatoração do Checkout:** Alterar a rota `/api/checkout/stripe/route.ts` para usar o `stripe_price_id` real do produto, em vez de criar preços dinâmicos `on-the-fly`.

### Fase 3: Entrega Automatizada (Webhook e Account)
1. **Ajuste do Webhook:** Garantir que o webhook de sucesso do Stripe (`checkout.session.completed`) insira corretamente o registro na tabela `entitlements`.
2. **Página de Download:** Atualizar a página `/account` para listar os produtos liberados (lendo de `entitlements`) e criar uma interface para que o usuário possa visualizar as instruções de uso e baixar os arquivos finais (ou acessar os links dos modelos).

Aguardando sua aprovação para iniciar a codificação e as migrações de banco de dados na nova branch.
