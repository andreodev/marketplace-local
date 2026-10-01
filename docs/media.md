# Armazenamento de fotos

A aplicação usa chaves de objetos e duas operações simples de storage: gravar e ler/verificar. A implementação está em `src/lib/media-storage.ts`, sem classes ou SDK de plataforma de imagens. O driver remoto usa a API S3, suportada por vários fornecedores de object storage. Uma plataforma com API proprietária exige adaptar este arquivo; não basta trocar o endpoint.

## Desenvolvimento sem fornecedor

```dotenv
MEDIA_DRIVER=local
MEDIA_LOCAL_DIR=.data/media
```

A pasta não é versionada e precisa ser preservada. Em servidor com disco persistente, prefira caminho absoluto e volume com backup. Em hospedagem com disco efêmero/serverless, use o driver S3. Em produção o modo local exige MEDIA_LOCAL_DIR explícito.

## Storage remoto compatível com S3

```dotenv
MEDIA_DRIVER=s3
MEDIA_S3_ENDPOINT=https://endpoint-fornecido-pelo-storage
MEDIA_S3_REGION=regiao-fornecida-pelo-storage
MEDIA_S3_BUCKET=nome-do-bucket
MEDIA_S3_ACCESS_KEY_ID=sua-chave
MEDIA_S3_SECRET_ACCESS_KEY=seu-segredo
MEDIA_S3_FORCE_PATH_STYLE=false
```

Endpoint pode ficar vazio para o endpoint padrão S3; região precisa corresponder ao serviço (alguns aceitam `auto`). `FORCE_PATH_STYLE=true` atende endpoints que exigem `/bucket/chave` em vez de bucket como subdomínio. Reinicie o Next.js após alterar as envs. Nenhuma credencial usa prefixo NEXT_PUBLIC.

Crie o bucket e conceda à credencial permissão para PutObject e GetObject (HEAD usa GetObject) somente no prefixo `listings/`. O bucket pode permanecer privado: uploads e leitura são feitos pelo servidor Next.js. Não são necessários bucket público, URL pública do fornecedor ou CORS para upload pelo browser. Credenciais reais ainda não foram fornecidas; o protocolo foi testado com servidor S3 simulado, não com a sua conta externa.

## Fotos e acesso

- JPEG, PNG e WebP de até 3 MB, no máximo oito fotos por anúncio.
- Upload de uma foto por Server Action (limite do corpo: 4 MB). A hospedagem deve permitir esse tamanho.
- Decodificação e validação real do conteúdo com Sharp; SVG e arquivos inválidos são rejeitados.
- Conversão para WebP, rotação pela orientação e tamanho máximo de 1600 × 1600; metadados originais não são preservados.
- Chaves geradas no servidor: `listings/ID_DO_USUARIO/UUID.webp`. Nome de arquivo do cliente nunca define o caminho.
- A URL estável é `/media/listings/ID_DO_USUARIO/UUID.webp`. O banco não guarda domínio do fornecedor.
- Publicação valida chave, proprietário e existência da foto. URLs arbitrárias não são aceitas pelo formulário de anúncios.
- Rascunhos/uploads só são visíveis ao dono. A entrega pública verifica anúncio/vendedor/categoria ativos.

## Trocar de fornecedor

Trocar as envs configura o destino dos novos uploads. Para preservar fotos existentes, copie os objetos para o novo bucket mantendo exatamente suas chaves, valide a cópia e então altere as envs/reinicie. A cópia é necessária inclusive ao sair do storage local; ela não é executada automaticamente. O banco e URLs dos anúncios permanecem iguais. Backups devem incluir banco e objetos.

Uploads abandonados e fotos substituídas permanecem no storage nesta etapa; a exclusão do anúncio é lógica e preserva arquivos/histórico. Não configure expiração indiscriminada no prefixo `listings/`, pois isso apagaria fotos de anúncios ativos. Uma futura limpeza deve reconciliar as chaves com ListingImage e respeitar uploads em andamento.
