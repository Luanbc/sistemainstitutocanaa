# 🏫 Sistema para o Gerenciamento de Projetos Sociais

Sistema de gerenciamento de projetos sociais desenvolvido para o **Instituto Social e Educacional Canaã**, com geração de carnês de mensalidade com QR Code PIX e controle financeiro completo.

---

## ✨ Funcionalidades

### 🔒 Segurança e Acesso
- Autenticação de usuários via Supabase (E-mail e Senha)
- Recuperação de senha segura ("Esqueci minha senha")
- Deslogamento automático após 15 minutos de inatividade
- Proteção de rotas e interface sob tela de login

### 📋 Gerador de Carnês
- Cadastro de projetos com chave PIX
- Cadastro de alunos com código sequencial automático
- Geração de carnês mensais com QR Code PIX (padrão Banco Central)
- Opção de **Pular Mês** ao gerar as parcelas (útil para isenções)
- Impressão individual ou em lote

### 💰 Controle Financeiro
- Visualização agrupada por aluno com badge do projeto (Total, Pago, Pendente)
- Indicador de status: ✅ Pago / ⏳ Pendente / 🔴 Vencida
- Registro de pagamento com **recibo imprimível**
- Cancelamento de baixa (reverter pagamento)
- **Quitar Tudo** — paga todas as parcelas pendentes de um aluno de uma vez
- **Excluir Todos** — exclui todas as parcelas em aberto de um aluno
- Filtros por nome, projeto e mês de vencimento
- Gráfico de arrecadação mensal consolidado
- Exportação de dados para **CSV**

### ⚙️ Interface e Experiência (UX/UI)
- Design responsivo otimizado nativamente para uso em Celular/Mobile
- Notificações, confirmações e popups modais elegantes via **SweetAlert2**
- Menu de abas de navegação rápida e painéis estilo Dashboard
- Gerenciamento de cadastros de Projetos e Alunos em modais

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML5 + CSS3 + JavaScript (vanilla) |
| Banco de dados | [Supabase](https://supabase.com) (PostgreSQL) |
| QR Code PIX | [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) |
| Gráficos | [Chart.js](https://www.chartjs.org/) |
| UI/Popups | [SweetAlert2](https://sweetalert2.github.io/) |
| Deploy | [Vercel](https://vercel.com) |

---

## 🗄️ Estrutura do Banco (Supabase)

```sql
-- Projetos (ex: Futsal, Dança, Inglês)
create table projetos (
  id   bigint generated always as identity primary key,
  nome text not null,
  pix  text
);

-- Alunos cadastrados
create table alunos (
  id      bigint generated always as identity primary key,
  codigo  text not null,
  nome    text not null,
  resp    text,
  cpf     text,
  tel     text
);

-- Parcelas financeiras geradas
create table financeiro (
  id           bigint generated always as identity primary key,
  aluno_codigo text,
  aluno_nome   text,
  resp         text,
  cpf          text,
  tel          text,
  projeto      text,
  pix          text,
  valor        text,
  vencimento   text,
  dna          text unique,
  parc         text,
  pago         boolean default false
);
```

---

## 🚀 Como rodar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/Luanbc/sistemacanaa.git
   ```

2. Abra `index.html` com um servidor local (ex: [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) no VS Code)

3. Configure suas credenciais Supabase em `index.html`:
   ```js
   const SUPABASE_URL = 'sua_url_aqui';
   const SUPABASE_KEY = 'sua_anon_key_aqui';
   ```

---

## 📁 Estrutura de Arquivos

```
sistemacanaa/
├── index.html      # Aplicação completa (HTML + CSS + JS)
├── vercel.json     # Configuração de deploy Vercel
└── README.md
```

---

## 👨‍💻 Desenvolvido por

**Luan Costa**
