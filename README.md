# Perto — marketplace local

Fundação e módulo de anúncios implementados. Monólito Next.js App Router, TypeScript strict, Tailwind 4, componentes shadcn/ui locais, Prisma 7 e PostgreSQL. Sem API separada, pagamentos, entregas ou chat.

## Executar localmente

Requisitos: Node.js 22.12+ e Docker Compose (ou PostgreSQL disponível).

```bash
cp .env.example .env
# Gere um segredo e coloque em AUTH_SECRET:
openssl rand -base64 32
npm ci
docker compose up -d
npm run db:deploy
npm run db:seed
npm run dev
```

Abra http://localhost:3000. O banco Docker usa a porta 5434, ligada somente a localhost. O volume persiste os dados. As credenciais do compose são exclusivamente para desenvolvimento.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm ci` gera o Prisma Client. `npm run db:migrate -- --name nome` cria novas migrations em desenvolvimento. `db:deploy` aplica migrations existentes; `db:studio` abre o editor do banco. O seed é explícito e idempotente; executá-lo novamente não cria categorias duplicadas nem reativa categorias desativadas.

## Ambiente

| Variável | Finalidade |
| --- | --- |
| DATABASE_URL | Conexão PostgreSQL; exemplo local em `.env.example` |
| AUTH_SECRET | Segredo aleatório para sessões Auth.js; gere com OpenSSL |
| AUTH_URL | Origem da aplicação, localmente `http://localhost:3000` |

Nunca versionar `.env` ou usar o segredo de exemplo em produção. Um `.env` local foi gerado para a verificação desta etapa.

## Estrutura

```text
prisma/
  schema.prisma
  seed.ts
  migrations/
src/
  app/
    (site)/
      layout.tsx                 # shell público
      page.tsx                   # home inicial
      entrar/                    # login
      criar-conta/               # cadastro
      anuncio/[slug]/            # página pública do produto
      (account)/
        layout.tsx               # exige usuário ativo
        perfil/                  # edição de perfil
        meus-anuncios/           # criar, editar e gerenciar anúncios
        meus-anuncios/novo/
        meus-anuncios/[id]/editar/
    admin/                       # layout protegido e páginas base
      usuarios/
      anuncios/
      categorias/
      denuncias/
    api/auth/[...nextauth]/       # handler do Auth.js
    media/[...key]/              # entrega de imagens com controle de acesso
    layout.tsx
    globals.css
  components/
    ui/                          # Button, Input, Card
    action-form.tsx
    site-header.tsx
  lib/                           # Prisma, storage, erros, classes
  modules/
    auth/                        # configuração, ações, schemas, serviços, repository
    users/                       # perfil: action → service → repository
    categories/                  # query → repository
    listings/                    # componentes, schemas, actions, services, repository e queries
    favorites/                   # contrato para a próxima etapa
    reports/                     # contrato para a próxima etapa
  generated/prisma/              # gerado, não versionado
tests/                           # regras e integração banco/storage
```

As rotas públicas incluem `/buscar`, `/categoria/[slug]`, `/anuncio/[slug]` e `/vendedor/[id]`. Usuários autenticados também têm `/favoritos`. As telas operacionais do admin continuam para uma etapa futura.

## Banco

| Modelo | Conteúdo e constraints |
| --- | --- |
| User | Nome, email único normalizado, hash de senha, telefone, WhatsApp, foto, role USER/ADMIN, status ACTIVE/SUSPENDED |
| Listing | Slug único, título, descrição, Decimal(12,2), condição NEW/USED, status DRAFT/ACTIVE/PAUSED/SOLD/REMOVED, localização, vendedor, categoria e visualizações |
| ListingImage | Várias imagens por anúncio, posição não negativa e única por anúncio |
| Category | Slug único, nome, ordem e ativação |
| Favorite | Chave composta usuário/anúncio impede duplicidade |
| Report | Motivo, detalhes, denunciante opcional, estado de revisão e administrador responsável |
| ListingContact | Evento de clique por anúncio, usuário opcional e data; permite contatos anônimos |
| AuthRateLimit | Contador persistido por operação/email e janela de 15 minutos |

Índices compostos por status/data, categoria/status, vendedor/data e estado/cidade/status. Índice GIN de busca textual em português sobre título/descrição na migration SQL. CHECKs impedem preços, visualizações e posições negativos. Favorites e imagens dependentes usam Cascade; anúncios, categorias e histórico de denúncias/contatos usam Restrict onde apagar perderia histórico. Usuários de eventos e denúncias podem ser SetNull.

## Arquitetura e segurança

- UI → Server Action → Service → Repository → Prisma nas mutações. Queries simples de leitura podem ir diretamente ao repository; sem service vazio.
- Server Components por padrão. O formulário com `useActionState` é o componente cliente necessário para feedback e estado de envio.
- Auth.js Credentials com sessão JWT e senha usando scrypt do Node, salt aleatório e comparação em tempo constante. Credentials persiste usuários pelo nosso repository; não exige modelos OAuth Account/Session.
- Login e cadastro limitados a dez tentativas por email/operação/janela. O limite por email tem teto: não substitui proteção por IP na infraestrutura contra abuso distribuído.
- Usuário ativo e role são relidos no banco em cada requisição autenticada, com cache apenas da requisição. Suspensão e revogação de admin não aguardam expiração do JWT.
- Perfil obtém o ID da sessão. Schemas Zod aceitam somente campos previstos; roles e IDs não são editáveis pelo cliente. Email não é editável nesta etapa.
- Administração verifica role no servidor; não basta esconder links. Novas actions/services administrativos devem chamar `requireAdmin()` também.
- Anúncios usam sellerId da sessão, verificam propriedade no service e novamente no filtro de escrita. updatedAt evita sobrescrever uma edição concorrente. Exclusão é lógica (REMOVED), preservando histórico.
- Preço permanece string até `Prisma.Decimal`, sem conversão para Float. Fotos passam por validação/decodificação no servidor; o banco guarda a chave do objeto e uma URL da aplicação. [Configuração de mídias](docs/media.md).
- A action de contato valida anúncio, vendedor e categoria ativos, registra ListingContact e redireciona para WhatsApp com mensagem pré-preenchida. O número não é entregue à UI como texto nem no objeto público do vendedor.

## Administrador local

Cadastre uma conta pela interface. Promova explicitamente no banco pelo `npm run db:studio`, alterando `role` para `ADMIN`. Não existe senha padrão nem promoção administrativa por formulário público. As páginas admin são somente a base protegida; moderação e CRUD não estão implementados.

## Validação e próxima etapa

`npm test` verifica senha, email, dinheiro, propriedade, status e validação de mídias. `npm run test:integration` usa PostgreSQL local e contas/anúncios temporários para verificar escrita por proprietário, concorrência, estados, métricas, storage local e protocolo S3 com servidor de teste. Não usa nem envia arquivos a um fornecedor externo. Lint, typecheck e build são comandos separados.

Próxima etapa: refinamento do catálogo conforme uso real — relevância da busca, paginação por cursor, limpeza de uploads abandonados e observabilidade. Cadastro de anúncios, publicação, gestão, busca, filtros, páginas de categoria e vendedor, favoritos, denúncias, home com anúncios recentes, página do produto, contato e administração já estão implementados. Não antecipar checkout, carrinho ou pagamentos.

Referências oficiais consultadas: [Auth.js](https://authjs.dev), [Prisma config](https://www.prisma.io/docs/orm/reference/prisma-config-reference), [shadcn com Tailwind 4](https://ui.shadcn.com/docs/tailwind-v4).

## Resultado das verificações desta etapa

- Lint, TypeScript, teste da fundação e build de produção aprovados.
- Migration aplicada no PostgreSQL local; oito categorias inseridas.
- HTTP: home, login, cadastro e endpoint de sessão com status 200; perfil, meus anúncios e admin redirecionam visitantes para login.
- Integração com banco: cadastro, login, senha incorreta, email duplicado e suspensão verificados com conta temporária removida depois.
- Next.js atualizado para 16.3.8 após auditoria. Auth.js usa `next-auth@5.0.0-beta.32`; a versão beta está fixada pelo lockfile.
- A auditoria ainda registra quatro avisos altos na cadeia Prisma/@prisma/config/deepmerge-ts/mysql2. Não são falhas corrigidas nesta entrega: revisar a atualização compatível antes da publicação. `mysql2` é transitivo do tooling Prisma; a aplicação utiliza PostgreSQL. Não foi aplicado `audit fix --force`, que propõe trocar a versão principal do Prisma.

## Etapa de anúncios e mídias

- Rotas: `/meus-anuncios/novo`, `/meus-anuncios/[id]/editar`, `/meus-anuncios`, `/anuncio/[slug]` e `/media/[...key]`.
- Até oito fotos; rascunhos podem ser salvos sem foto, mas exigem os demais campos preenchidos. Publicação exige pelo menos uma foto existente no storage e categoria ativa.
- Anúncios vendidos/excluídos não voltam a ativos. Excluir preserva registros e arquivos, usando REMOVED. Anúncios pausados e de vendedores suspensos saem da home e da página pública.
- Visualizações são aproximadas, registradas após abertura da página com deduplicação por cookie/anúncio por 24 horas. Contatos contam eventos de clique, não negociações concluídas.
- Imagens de rascunhos e uploads não publicados são acessíveis apenas ao proprietário; imagens públicas exigem anúncio, vendedor e categoria ativos. O endpoint usa cache privado desabilitado para refletir remoção/suspensão.
- Testes automatizados, integração com banco/storage, lint, typecheck e build executados. Verificação visual pendente: o Browser não recebeu permissão para acessar localhost.

## Busca e catálogo

- `/buscar` filtra anúncios ativos por termo no título/descrição, categoria, cidade, UF e condição; filtros são enviados pela URL e funcionam sem JavaScript.
- Categoria e vendedor expõem somente anúncios ativos de vendedores ativos, em categorias ativas. Perfil público não inclui email, telefone nem WhatsApp.
- A busca retorna 24 resultados por página. O índice textual em português já existe na migration; para o MVP a consulta usa busca parcial case-insensitive. Migrar para full-text quando a base exigir relevância, stemming ou escala maior.

## Favoritos e denúncias

- O botão de favorito e a página `/favoritos` mostram apenas anúncios que seguem publicáveis: ativos, de vendedor ativo e categoria ativa. Um usuário não pode favoritar o próprio anúncio.
- A denúncia exige autenticação e motivo. O servidor rejeita denúncia do próprio anúncio, anúncio indisponível e repetição pelo mesmo usuário; a constraint composta `Report(listingId, reporterId)` reforça essa regra no banco.
- Denúncias iniciam como OPEN. A leitura, moderação e alteração de status são responsabilidades da próxima etapa administrativa.

## Administração

- `/admin` apresenta métricas de usuários, anúncios ativos, denúncias pendentes e categorias ativas.
- Usuários podem ser consultados, suspensos e reativados. A aplicação impede que um administrador suspenda a própria conta.
- Anúncios podem ser consultados com fotos, métricas e dados do vendedor; a remoção muda o estado para REMOVED e preserva o histórico.
- Categorias podem ser criadas, editadas, ordenadas e desativadas. Não há exclusão física de categoria vinculada a anúncios.
- Denúncias podem passar para REVIEWING, RESOLVED ou DISMISSED. A ação registra o administrador e a data de conclusão para estados finais.
- O administrador local `dev@perto.local` foi promovido para ADMIN para desenvolvimento. Use as mesmas credenciais informadas anteriormente.
