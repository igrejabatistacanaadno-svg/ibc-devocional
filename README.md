# IBC Devocional 🙏

**Aplicativo PWA de devocionais diárias da Igreja Batista Canaã**

[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3-06B6D4)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E)](https://supabase.com)
[![PWA](https://img.shields.io/badge/PWA-instalável-purple)](https://web.dev/pwa)

---

## Funcionalidades

- **Membros**: Acesso com código `@igrejabatistaibc` — sem cadastro, email ou senha
- **Devocionais diárias** com áudio, texto, versículo e oração final
- **Gravação de áudio** diretamente pelo celular do pastor
- **Mixagem automática** de voz + fundo musical (Web Audio API)
- **Notificações push** para Android e iOS (via PWA instalado)
- **Comentários moderados** pelo administrador
- **Pedidos de oração** públicos e privados
- **Avisos da igreja** com prioridade
- **Reações**: Amém e Fui edificado
- **Painel administrativo** completo com dashboard
- **Funciona offline** com cache de Service Worker
- **Instalável** no Android (Chrome/Edge) e iPhone (Safari)

---

## Estrutura do Projeto

```
ibc-devocional/
├── public/
│   ├── manifest.json          # Configuração PWA
│   ├── sw.js                  # Service Worker
│   ├── offline.html           # Página offline
│   └── icons/                 # Ícones do app
├── src/
│   ├── components/
│   │   ├── layout/            # BottomNav, Header, Layouts
│   │   ├── devotional/        # AudioPlayer
│   │   ├── admin/             # AudioRecorder, MusicMixer
│   │   └── ui/                # Button, Card
│   ├── context/
│   │   └── AuthContext.tsx    # Autenticação (membro + admin)
│   ├── lib/
│   │   ├── supabase.ts        # Todas as chamadas ao banco
│   │   ├── audioMixer.ts      # Web Audio API mixer
│   │   ├── pushNotifications.ts
│   │   ├── deviceId.ts        # Device ID anônimo
│   │   └── mockData.ts        # Dados de exemplo (sem Supabase)
│   ├── pages/
│   │   ├── public/            # EntryPage, HomePage, DevotionalPage...
│   │   └── admin/             # AdminLogin, Dashboard, NewDevotional...
│   ├── types/                 # TypeScript interfaces
│   └── App.tsx                # Roteamento principal
├── supabase/
│   ├── migrations/001_initial.sql   # Schema completo do banco
│   └── functions/send-push/         # Edge Function notificações
├── .env.example
└── package.json
```

---

## 1. Como rodar localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone ou descompacte o projeto
cd ibc-devocional

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com seus dados do Supabase (ou deixe em branco para modo mock)

# Inicie o servidor de desenvolvimento
npm run dev
```

O app abrirá em `http://localhost:5173`

**Modo mock (sem Supabase):**
Se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não forem preenchidas, o app usa dados de exemplo automaticamente.

**Credenciais de desenvolvimento:**
- Código de acesso dos membros: `@igrejabatistaibc`
- Admin: usuário `admin` / senha conforme `VITE_ADMIN_PASSWORD` no `.env`

---

## 2. Como configurar o banco (Supabase)

### Passo a passo

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **New Project** e preencha nome e senha do banco
3. Aguarde o projeto inicializar (~2 minutos)
4. Vá em **SQL Editor → New Query**
5. Cole o conteúdo de `supabase/migrations/001_initial.sql` e clique em **Run**
6. Crie o usuário admin executando (substitua a senha!):
   ```sql
   INSERT INTO public.admin_users (username, password_hash, role)
   VALUES ('admin', crypt('SUA_SENHA_AQUI', gen_salt('bf')), 'super_admin');
   ```
7. Configure os buckets de Storage em **Storage → New Bucket**:
   - `devotional-audio` (público)
   - `devotional-images` (público)
   - `background-music` (público)
8. Copie as chaves em **Settings → API**:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`
9. Cole no seu `.env` e reinicie o servidor

---

## 3. Como configurar as notificações push

### Gerar chaves VAPID

```bash
npx web-push generate-vapid-keys
```

Você receberá:
```
Public Key: BNxxxxxxxxxxxxxxxxxx
Private Key: xxxxxxxxxxxxxxxx
```

### Configurar

1. Coloque a **chave pública** no `.env`:
   ```
   VITE_VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. Configure os **secrets** da Edge Function no Supabase:
   ```bash
   supabase secrets set VAPID_PUBLIC_KEY=BNxxx
   supabase secrets set VAPID_PRIVATE_KEY=xxx
   supabase secrets set VAPID_SUBJECT=mailto:pastor@igrejaibc.com
   ```

3. Faça o deploy da Edge Function:
   ```bash
   npm install -g supabase
   supabase login
   supabase functions deploy send-push
   ```

### Comportamento iOS
- No iPhone, notificações push só funcionam com o app instalado via Safari → "Adicionar à Tela de Início"
- O app detecta automaticamente o iPhone e exibe as instruções

---

## 4. Como instalar no Android

1. Abra o app no **Chrome** ou **Edge**
2. Toque no menu do navegador (⋮ ou ...)
3. Toque em **"Adicionar à tela inicial"** ou **"Instalar app"**
4. Confirme a instalação
5. O app aparecerá na tela inicial como um app nativo

---

## 5. Como instalar no iPhone

1. Abra o app no **Safari** (obrigatório no iOS)
2. Toque no botão de **compartilhar** (ícone com seta para cima)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Toque em **"Adicionar"** para confirmar
5. Abra o app pelo ícone criado
6. Dentro do app, ative as notificações no menu **Mais**

---

## 6. Como publicar em produção

### Opção A — Vercel (recomendado)

```bash
npm install -g vercel
npm run build
vercel --prod
```

Configure as variáveis de ambiente no painel da Vercel.

### Opção B — Netlify

```bash
npm run build
# Faça upload da pasta dist/ no painel do Netlify
# Ou conecte o repositório Git
```

### Opção C — GitHub Pages / qualquer CDN

```bash
npm run build
# Conteúdo em dist/ — faça upload para qualquer hosting estático
```

**Importante para produção:**
- Configure HTTPS (obrigatório para PWA e push notifications)
- Adicione as variáveis de ambiente no painel do seu hosting
- Configure o redirect de todas as rotas para `index.html` (SPA)

No Netlify, crie `public/_redirects`:
```
/* /index.html 200
```

No Vercel, já é automático.

---

## 7. Como personalizar

### Trocar o logo
Substitua os arquivos em `public/icons/`:
- `icon-192.png` — ícone 192×192 px
- `icon-512.png` — ícone 512×512 px
- `icon-maskable-512.png` — ícone adaptável (Android)

### Trocar cores
Edite `tailwind.config.ts`, seção `colors.primary` (azul escuro) e `colors.gold`.

### Trocar o nome do app
1. Edite `public/manifest.json` — campos `name` e `short_name`
2. Edite `index.html` — tag `<title>`
3. Edite `VITE_APP_NAME` no `.env`

### Trocar o código de acesso da igreja
Edite a constante `CHURCH_CODE` em `src/context/AuthContext.tsx`.

---

## Tecnologias utilizadas

| Categoria | Tecnologia |
|-----------|-----------|
| Frontend  | React 18 + TypeScript + Vite |
| Estilos   | TailwindCSS 3 |
| Roteamento | React Router 6 |
| Backend   | Supabase (PostgreSQL + Storage + Edge Functions) |
| PWA       | vite-plugin-pwa + Service Worker manual |
| Áudio     | MediaRecorder API + Web Audio API |
| Push      | Web Push API + VAPID |
| Ícones    | Lucide React |
| Datas     | date-fns |

---

## Segurança

- Senhas admin armazenadas com bcrypt (`pgcrypto`)
- RLS (Row Level Security) habilitado em todas as tabelas
- Membros identificados apenas por `device_id` local (sem dados pessoais)
- Comentários entram como `pendente` e precisam de aprovação
- Pedidos de oração privados só aparecem no painel admin
- Variáveis sensíveis nunca expostas no frontend

---

## Suporte

Em caso de dúvidas sobre configuração:
1. Verifique o console do navegador (F12)
2. Confira se as variáveis de ambiente estão corretas
3. Certifique-se que o SQL foi executado no Supabase sem erros

---

*IBC Devocional — Igreja Batista Canaã · Desenvolvido com ❤️ e 🙏*
