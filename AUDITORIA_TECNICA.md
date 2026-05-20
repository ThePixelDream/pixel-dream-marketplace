# Relatório de Auditoria Técnica: The Pixel Dream Marketplace

## 1. Visão Geral e Arquitetura Atual

O projeto "The Pixel Dream Marketplace" é uma aplicação web moderna construída com **Next.js 16.2 (App Router)** e **React 19.2**. A arquitetura segue um padrão *server-first*, utilizando componentes de servidor para a maioria das rotas e delegando a persistência e autenticação ao **Supabase**. O processamento de pagamentos é gerenciado através de integrações com **Stripe** e **Coinbase Commerce**.

### 1.1 Ecossistema Front-end (Next.js)
- **Estrutura de Diretórios:** O código-fonte está contido no diretório `web/`. As páginas principais estão localizadas em `web/app/`, seguindo o padrão do App Router.
- **Estilização:** Utiliza CSS modular (`*.module.css`) para escopo de componentes e um arquivo global extenso (`globals.css`) que define variáveis de tema, reset e estilos base (incluindo um design focado no modo escuro e fontes customizadas como "Funnel Display", "Fraunces" e "Redaction 35").
- **Componentes Principais:** O `layout.tsx` serve como envelope raiz, renderizando o `Header.tsx` globalmente. O projeto possui rotas para marketplace (`/marketplace`), página de produto dinâmico (`/product/[id]`), checkout (`/checkout`), conta de usuário (`/account`) e um painel de administração (`/admin`).
- **Autenticação:** Existem múltiplas rotas de autenticação (`/login`, `/signup`, `/auth/login`, `/auth/signup`). A criação de usuários injeta um código de afiliado (se fornecido) nos metadados do usuário.

### 1.2 Ecossistema Back-end (Supabase)
O banco de dados PostgreSQL hospedado no Supabase atua como backend principal, com as seguintes tabelas chave:
- `profiles`: Vinculada 1:1 com `auth.users`, armazenando o papel (`role`) e código de indicação (`referred_by_code`).
- `products`: Catálogo de produtos contendo preços, URLs de mídia (cover, avatar, galeria, vídeo) e flags de disponibilidade (`active`, `sold`).
- `orders` e `order_items`: Registro de compras realizadas via Stripe ou Coinbase.
- `entitlements`: Direitos de acesso aos produtos adquiridos.
- `affiliates` e `commissions` (ou `affiliate_commissions` no schema original): Sistema de comissionamento para parceiros.
- `site_settings`: Tabela de configuração genérica (chave/valor JSONB), usada para armazenar vídeos da página inicial.

A comunicação Next.js ↔ Supabase é feita através do pacote `@supabase/ssr`, utilizando clientes distintos para servidor (`server.ts`), navegador (`browser.ts`) e operações privilegiadas via service role (`admin.ts`).

### 1.3 Deploy (Vercel)
O projeto está hospedado na Vercel sob o projeto `prj_Uj9cHJeLPTcgSXPitWqce7wWq7Je` e o domínio principal é `pixel-dream-marketplace.vercel.app`. O deploy mais recente (ID: `dpl_7k5ajgm485k7LDUoHDRsa289Jz32`) foi construído com sucesso usando Turbopack. Curiosamente, o repositório contém um arquivo `netlify.toml`, indicando um possível histórico de migração ou configuração residual de outra plataforma.

---

## 2. Fluxo de Dados

### 2.1 Visualização de Produtos
1. O usuário acessa a página inicial ou `/marketplace`.
2. O Next.js (Server Component) consulta a tabela `products` no Supabase, filtrando por `active=true` e `sold=false`.
3. Os dados são renderizados no servidor e entregues ao cliente.
4. Ao clicar em um produto, a rota dinâmica `/product/[id]` consulta os detalhes específicos e exibe as opções de plano.

### 2.2 Fluxo de Checkout e Pagamento
1. O usuário seleciona um plano e é direcionado para `/checkout`.
2. O Next.js verifica a autenticação (redirecionando para login se necessário).
3. O usuário escolhe Stripe ou Coinbase. O formulário envia um POST para `/api/checkout/stripe` (ou coinbase).
4. A rota da API busca o produto e o código de afiliado do usuário, e cria uma sessão de checkout no provedor de pagamento, injetando `product_id`, `user_id` e `affiliate_code` nos metadados.
5. O usuário é redirecionado para a página de pagamento externa.

### 2.3 Webhooks e Liberação de Acesso
1. Após o pagamento, o Stripe/Coinbase envia um evento para `/api/webhooks/stripe`.
2. O Next.js valida a assinatura do webhook e extrai os metadados.
3. Utilizando o **Supabase Admin Client** (service role), o sistema insere um registro em `orders` e `order_items`.
4. Um registro é criado em `entitlements`, liberando o acesso ao produto para o usuário.
5. Se um `affiliate_code` válido estiver presente, uma comissão (ex: 10%) é calculada e inserida na tabela de comissões.

---

## 3. Pontos de Atenção e Oportunidades de Melhoria

Durante a auditoria, identifiquei várias inconsistências, gargalos de performance e riscos de segurança que devem ser endereçados:

### 3.1 Discrepâncias de Schema e Código
- **Nomenclatura de Tabelas:** O arquivo `schema.sql` define a tabela `affiliate_commissions`, mas o código em `/admin/page.tsx` e o banco de dados real na Vercel utilizam a tabela `commissions`.
- **Colunas Faltantes no Schema Original:** O banco de dados em produção possui colunas em `products` (ex: `slug`, `avatar_image_url`, `gallery_urls`, `video_url`, `price_basic`, `price_pro`, `price_premium`, `sold`, `delivery_lora`, etc.) que não estão presentes no `schema.sql` do repositório. O schema no repositório está desatualizado em relação à produção.
- **Tabela `site_settings`:** Utilizada pelo código (ex: para carregar vídeos da home) e presente em produção, mas completamente ausente do `schema.sql`.

### 3.2 Performance e Otimização
- **Falta de Índices em Chaves Estrangeiras:** O Supabase Advisor alertou para a ausência de índices em várias chaves estrangeiras (ex: `orders_user_id_fkey`, `orders_product_id_fkey`, `commissions_affiliate_id_fkey`). Isso causará degradação de performance em queries JOIN à medida que o banco crescer.
- **Políticas RLS Subótimas (Initplan):** Várias políticas RLS utilizam chamadas diretas a funções como `auth.uid()`, o que força a reavaliação por linha. O Supabase recomenda encapsular essas chamadas em um `(select auth.uid())` para melhor performance.
- **Mídias Externas Não Otimizadas:** O front-end carrega vídeos da home e imagens diretamente de URLs externas (ex: `andreatuysuzian.com`, Unsplash) sem passar por um processo de otimização de imagem/vídeo do Next.js. Isso pode impactar o tempo de carregamento e o SEO.
- **Políticas RLS Duplicadas:** A tabela `commissions` possui múltiplas políticas permissivas para a mesma ação (ex: "Admins can view all commissions" e "Affiliates can view own commissions" aplicadas globalmente), o que pode retardar a execução das queries.

### 3.3 Segurança
- **Bucket de Storage Público:** O bucket `products` possui uma política genérica de `SELECT` que permite a listagem de todos os arquivos. Recomenda-se restringir a política para permitir leitura apenas de arquivos específicos, em vez de permitir a listagem do diretório.
- **Funções SECURITY DEFINER Expostas:** A função `handle_new_user()` pode ser executada por usuários anônimos via API REST (`/rest/v1/rpc/handle_new_user`). Como é uma função de gatilho (trigger), o privilégio de execução (`EXECUTE`) deve ser revogado para a role `public` ou `anon`.
- **Política RLS Insegura em `orders`:** Existe uma política "Service role can insert orders" configurada como `true`. Embora a service role ignore o RLS, ter uma política pública com `WITH CHECK (true)` pode abrir brechas se não for restrita adequadamente.

### 3.4 Arquitetura e Código Front-end
- **Duplicação de Rotas de Autenticação:** Existem rotas de UI redundantes para login e signup (ex: `/login` vs `/auth/login/login-page.tsx`). O projeto se beneficiaria de uma consolidação dessas páginas.
- **Parâmetros de Checkout Inconsistentes:** A página de produto constrói links de checkout com `?plan=...&product=...`, mas a página `/checkout/page.tsx` espera o parâmetro `productId`. Isso pode causar quebra na navegação do usuário.
- **Autoplay Imperativo de Vídeos:** O componente `HomeClient.tsx` força o autoplay de vídeos manipulando o DOM diretamente via `useEffect` e reiniciando componentes para contornar o cache do navegador. Uma abordagem mais declarativa e amigável ao React seria preferível.
- **Configuração Residual:** O arquivo `netlify.toml` deve ser removido se o projeto está exclusivamente na Vercel, para evitar confusão na infraestrutura.

---

## Conclusão

O ecossistema está bem estruturado em torno do paradigma Next.js + Supabase, utilizando padrões modernos como Server Components e processamento de pagamentos via webhooks. No entanto, há uma **dessincronização crítica entre o código/schema no repositório e o estado real do banco de dados em produção**. 

A prioridade imediata antes de adicionar novas funcionalidades deve ser:
1. Atualizar o `schema.sql` no repositório para refletir o banco de dados de produção.
2. Adicionar os índices ausentes nas chaves estrangeiras.
3. Corrigir os parâmetros de URL entre a página de produto e o checkout.
4. Refinar as políticas de segurança (RLS e permissões de execução de funções) no Supabase.
