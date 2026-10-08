# MUSICFY

Catálogo musical com aplicação web Node.js, API de álbuns e armazenamento
compartilhado. Use SQLite no desenvolvimento local ou PostgreSQL para publicação
na internet.

## Requisitos

- Node.js 24.13.0 ou superior.
- npm.

## Desenvolvimento local

```bash
npm install
npm start
```

Abra `http://localhost:5500`. Sem `DATABASE_URL`, o servidor cria e usa
`data/musicfy.db` automaticamente. No Windows também é possível iniciar o app
com `iniciar-site.bat`.

Para configurar variáveis localmente, copie `.env.example` para `.env`. O
arquivo `.env` é ignorado pelo Git e não deve ser publicado.

## Publicar na internet com Render e Neon

O Render hospeda o site e a API; o Neon hospeda o PostgreSQL. O endereço público
do Render atende as páginas e a API na mesma origem, e a senha do banco permanece
no ambiente do servidor.

1. Envie o repositório GitHub que contém esta pasta (`MUSICFY_web`).
2. Crie um projeto PostgreSQL no [Neon](https://neon.tech/). Copie a URL de
   conexão **pooled** fornecida pelo Neon e mantenha-a privada.
3. No [Render](https://render.com/), crie um **Blueprint** usando o repositório
   e informe `MUSICFY_web/render.yaml` como caminho do Blueprint. Esse arquivo
   configura a pasta-raiz da aplicação, os comandos de instalação e
   inicialização, a versão do Node e a verificação de saúde.
4. Durante a configuração do Blueprint, forneça `DATABASE_URL` como variável
   secreta, usando a URL PostgreSQL copiada do Neon. Não coloque essa URL no
   código, em arquivos públicos, nem no repositório.
5. Defina `ADMIN_PASSWORD` como outro segredo, com pelo menos 16 caracteres.
   Gere uma senha aleatória longa e não reutilize a senha da sua conta; por
   exemplo, gere uma credencial nova localmente com
   `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`
   e coloque o resultado apenas no campo secreto do Render. O site permite que
   visitantes consultem álbuns, mas exige o login de administrador para
   publicar. A sessão usa um cookie HttpOnly e expira em 12 horas.
6. Aguarde o deploy. O Render exibirá um endereço HTTPS público, por exemplo
   `https://musicfy.onrender.com`. Abra esse endereço para acessar o site.
7. Confirme que `/healthz` responde com `{"status":"ok"}`. Entre em
   `https://<seu-endereco-render>/criar-album.html` com a senha de administrador
   para publicar. O servidor cria a tabela PostgreSQL automaticamente.

Se preferir criar o serviço sem Blueprint, escolha **New > Web Service**, use
este repositório, configure o comando de build `npm ci`, o comando de início
`npm start`, o health check `/healthz`, Node `24.13.0` e as variáveis secretas
`DATABASE_URL` e `ADMIN_PASSWORD`.

Se `DATABASE_URL` não for configurada, o servidor em produção falhará ao iniciar,
em vez de criar silenciosamente um banco SQLite temporário. O servidor também
exige `ADMIN_PASSWORD` em produção; nunca armazena a senha no banco, na página
HTML ou no JavaScript enviado aos visitantes.

O serviço Render do plano gratuito pode suspender a aplicação quando ociosa,
causando demora na primeira visita. Planos, limites e disponibilidade mudam;
consulte os provedores para os detalhes atuais. Neon e Render precisam permitir
conexões entre si.

## Neon Object Storage

O `neon.ts` declara os buckets privados `artistas`, `covers` e `banners` para a
branch `production`. Os nomes existem no Neon após executar `neon deploy`. Esses
buckets são privados: a aplicação deve usar o servidor com credenciais para
enviar e servir objetos. Eles não ficam automaticamente disponíveis por uma URL
pública. O catálogo continua usando as imagens incluídas em `public/assets`
e as capas enviadas como dados no PostgreSQL até que o servidor seja migrado
para upload/download pela API S3 do Neon.

`neon link` guarda a URL de conexão e as credenciais de armazenamento em
`.env.local`. Esse arquivo é ignorado pelo Git, carregado pelo comando `npm
start` local e nunca deve ser enviado ao repositório. Ao usar o banco Neon fora
de produção, configure também `ADMIN_PASSWORD` localmente antes de publicar:
escrever em um banco remoto sempre exige uma sessão de administrador.

## Migrar os álbuns do SQLite local

Se você já salvou álbuns em `data/musicfy.db`, pode copiá-los ao PostgreSQL antes
ou depois da publicação. No computador onde está o arquivo, forneça a URL de
conexão do Neon e execute:

```bash
npm run import:sqlite
```

O comando lê o banco SQLite sem alterá-lo, preserva os identificadores e não
substitui álbuns já presentes no PostgreSQL. Caso o SQLite esteja em outro local,
defina `MUSICFY_SQLITE_PATH` para o caminho do arquivo. A URL do Neon é uma
credencial: use uma variável de ambiente privada, não a digite em um arquivo
versionado.

Se os álbuns antigos ainda estiverem somente no `localStorage` do navegador,
inicie esta versão localmente com `DATABASE_URL` definido em `.env` e, no mesmo
navegador e perfil usados antes, abra `http://localhost:5500` e
`http://localhost:5500/criar-album.html`. O app envia esses álbuns ao banco
PostgreSQL e remove a cópia local somente após confirmar a sincronização. Faça
isso antes de trocar de endereço local ou perder o acesso ao perfil antigo do
navegador. Defina `ADMIN_PASSWORD` com pelo menos 16 caracteres em `.env.local`
e entre como administrador na página de criação; essa senha local pode ser
diferente da senha configurada no Render.

## Verificação

```bash
npm run check
```

## Estrutura

```text
public/           páginas e assets servidos ao navegador
server/           servidor HTTP, API e acesso ao banco
scripts/          ferramentas de manutenção e migração
data/             SQLite de desenvolvimento, criado localmente
render.yaml       configuração de deploy do Render
```
