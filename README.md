# GouAuth — Sistema Privado de Autenticação e Licenciamento

O **GouAuth** é uma plataforma privada, proprietária e de alta segurança para gerenciamento de licenças de software, autenticação de usuários, controle de dispositivos (HWID) e parametrização remota, projetada especificamente para ser hospedada na **Square Cloud** com banco de dados **PostgreSQL (mTLS)**.

---

## 1. Visão Geral e Filosofia

* **Single-Tenant & Privado**: Sem cadastro público de administradores, sem cobranças ou planos SaaS para o painel. Construído exclusivamente para você gerenciar seus softwares.
* **Design System Black & White**: Interface moderna, minimalista e premium (#000000, #FFFFFF e tons de cinza), com cores de estado semânticas exclusivas (Verde para ativo, Vermelho para banido/revogado, Amarelo para alerta/expirando).
* **Segurança de Nível Empresarial**:
  * Hashing de senhas com **Argon2id** (OWASP).
  * Geração de chaves de licença via **CSPRNG** de alta entropia.
  * Validações atômicas de licença com locks no nível de linha do PostgreSQL (`SELECT ... FOR UPDATE OF l`).
  * Autenticação de dois fatores (**2FA/TOTP**) com códigos de recuperação criptográficos.
  * Rate limiting em memória contra ataques de força bruta.
  * Notificações via **Webhooks** assinadas com **HMAC-SHA256**.

---

## 2. Arquitetura do Sistema

```
CLIENTES (Seus Programas / Jogos / Launchers / Scripts / SDK)
                   │
                   ▼  (POST /api/v1/auth/license)
┌──────────────────────────────────────────────────────────┐
│                   GouAuth Engine                         │
│             (Next.js 14 / Node.js na Porta 80)           │
│                                                          │
│  - Rate Limiting & Anti-Bruteforce                       │
│  - Middleware de Sessão Admin & API Keys                 │
│  - License Service (Locks Atômicos & Expiração)          │
│  - HWID & Device Binding Service                         │
│  - Webhook Dispatcher com HMAC-SHA256                    │
└──────────────────────────┬───────────────────────────────┘
                           │  mTLS (SSL Seguro com Certificado CA)
                           ▼
┌──────────────────────────────────────────────────────────┐
│             Square Cloud PostgreSQL                      │
│     (Host: square-cloud-db-*.squareweb.app:7002)         │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Estrutura de Pastas

```
d:/GouAuth/
├── banco de dados/              # Certificados mTLS da Square Cloud (ca, cert, key)
├── migrations/                  # Migrações SQL versionadas (Drizzle ORM)
├── scripts/                     # Seed do Administrador
├── src/
│   ├── app/
│   │   ├── (admin)/             # Painel Administrativo
│   │   │   ├── dashboard/       # Métricas, timeline e atividade recente
│   │   │   ├── applications/    # CRUD de Apps, Licenças, Usuários, HWID, Versões, etc.
│   │   │   ├── logs/            # Logs de Autenticação e Trilha de Auditoria
│   │   │   ├── settings/        # Segurança, Senha, 2FA e API Keys
│   │   │   └── docs/            # Documentação interativa da API
│   │   ├── (auth)/login/        # Login seguro do Administrador
│   │   └── api/
│   │       ├── v1/              # API Pública (/auth/license, /auth/login, etc.)
│   │       └── admin/           # API Administrativa do Painel
│   ├── components/              # Design System Black & White (UI, Sidebar, CommandMenu)
│   ├── lib/
│   │   ├── db/                  # Pool PostgreSQL com mTLS e Drizzle Schema
│   │   ├── security/            # Argon2id, CSPRNG, Rate Limiting, HMAC
│   │   ├── auth/                # Gerenciador de Sessão e Cookies HTTP-Only
│   │   └── services/            # LicenseService, WebhookService, AuditService
│   └── sdk/                     # SDK TypeScript Oficial para seus programas
├── tests/                       # Suíte de testes automatizados de fluxos críticos
├── squarecloud.app              # Arquivo oficial de configuração da Square Cloud
├── server.js                    # Servidor de entrada Node.js para a Square Cloud
├── package.json
└── README.md
```

---

## 4. Instalação e Desenvolvimento Local

### Pré-requisitos
* Node.js v20+ ou v24+
* Conexão com o banco da Square Cloud ou PostgreSQL local com SSL

### Passo a Passo

1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Configurar o Arquivo `.env`:**
   Copie `.env.example` para `.env` e confirme os dados:
   ```ini
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=postgresql://squarecloud:SENHA@square-cloud-db-59d8ea3325f74e28ba5b73dbab677f0e.squareweb.app:7002/squarecloud
   DATABASE_CERTS_DIR=./banco de dados
   JWT_SECRET=sua_chave_secreta_jwt_32_caracteres_longa!
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Executar Migrações do Banco:**
   ```bash
   npm run db:migrate
   ```

4. **Criar a Conta do Administrador Inicial:**
   ```bash
   npm run seed
   ```
   *Credenciais padrão criadas:*
   * **Email:** `admin@gouauth.com`
   * **Senha:** `GouAuth#2026`
   *(Altere imediatamente na aba `/settings` após o primeiro login).*

5. **Iniciar Servidor Local de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse: [http://localhost:3000](http://localhost:3000)

---

## 5. Testes Automatizados

Para rodar a suíte de testes de estresse, segurança e atomicidade contra o banco da Square Cloud:
```bash
npm run test
```
*Testa automaticamente:*
* Hashing e verificação Argon2id
* Geração de chaves CSPRNG de alta entropia
* Mascaramento de dados em logs
* Assinatura e verificação de integridade de Webhooks HMAC-SHA256
* Rate limiting por IP e endpoint
* Transações atômicas de licença (`SELECT ... FOR UPDATE OF l`)
* Expiração automática e primeiro uso (UNUSED $\rightarrow$ ACTIVE)
* Binding de HWID e respeito ao `device_limit`
* Bloqueio por banimento de licença ou HWID

---

## 6. Build de Produção

```bash
npm run build
```

---

## 7. Como Fazer o Deploy na Square Cloud

A Square Cloud executa o projeto como uma aplicação web Node.js.

### Arquivo `squarecloud.app`:
```ini
MAIN=server.js
DISPLAY_NAME=GouAuth
MEMORY=512
VERSION=recommended
SUBDOMAIN=gouauth
START=npm run start
AUTORESTART=true
```

### Processo de Envio:
1. Compacte os arquivos do projeto em um arquivo `.zip` (excluindo a pasta `node_modules` e `.next` para agilizar o upload).
2. Certifique-se de que os seguintes itens estão incluídos no zip:
   * `server.js`
   * `squarecloud.app`
   * `package.json`
   * `package-lock.json`
   * `banco de dados/` (com os certificados `ca-certificate.crt`, `certificate.pem`, `private-key.key`)
   * `migrations/`
   * `src/`
   * `.env` (ou configure as variáveis no painel da Square Cloud)
3. Na Square Cloud:
   * Vá em **Dashboard** $\rightarrow$ **Enviar Aplicação**.
   * Faça o upload do `.zip`.
   * Selecione o tipo **Web Publication** e defina o subdomínio (ex: `gouauth`).
   * A Square Cloud instalará as dependências e iniciará o `server.js` escutando na porta `80` em `0.0.0.0`.
4. Sua aplicação estará no ar em: `https://gouauth.squareweb.app`

---

## 8. Integração com Seus Programas (SDK GouAuth)

No seu software em Node.js ou Electron:

```typescript
import { GouAuth } from "./sdk/gouauth";

const auth = new GouAuth({
  appId: "meu-launcher-vip",
  baseUrl: "https://gouauth.squareweb.app"
});

// Autenticação com Licença
const result = await auth.loginWithLicense({
  license: "GOU-ABCD-1234-EFGH"
});

if (result.authorized) {
  console.log("Acesso Liberado! Plano:", result.plan?.name);
  console.log("Expira em:", result.expiresAt);
}
```

---

## 9. Política de Backup e Retenção

1. **Square Cloud Snapshots**: Utilize a ferramenta de snapshot automático de containers disponibilizada no painel da Square Cloud.
2. **Dump PostgreSQL**: Como o banco da Square Cloud é um PostgreSQL padrão com TLS, você pode rodar backups automáticos usando `pg_dump`:
   ```bash
   pg_dump "postgresql://squarecloud:SENHA@square-cloud-db-59d8ea3325f74e28ba5b73dbab677f0e.squareweb.app:7002/squarecloud?sslmode=require&sslrootcert=ca-certificate.crt&sslcert=certificate.pem&sslkey=private-key.key" > backup_$(date +%Y%m%d).sql
   ```
3. **Retenção Recomendada**: Manter 7 backups diários, 4 semanais e 12 mensais.

---

## 10. Licença
Propriedade privada de Gou. Todos os direitos reservados.
