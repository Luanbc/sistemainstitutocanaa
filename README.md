# 🏫 Sistema Canaã Gestão

Sistema de gerenciamento de projetos sociais desenvolvido para o **Instituto Social e Educacional Canaã**, com geração de carnês de mensalidade com QR Code PIX e controle financeiro completo.

🔗 **Acesse:** [projetoscanaa.vercel.app](https://projetoscanaa.vercel.app)

---

## ✨ Funcionalidades

### 📋 Gerador de Carnês
- Cadastro de projetos com chave PIX
- Cadastro de alunos com código sequencial automático
- Geração de carnês mensais com QR Code PIX (padrão Banco Central)
- Impressão individual ou em lote

### 💰 Controle Financeiro
- Visualização agrupada por aluno com badge do projeto
- Indicador de status: ✅ Pago / ⏳ Pendente / 🔴 Vencida
- Registro de pagamento com **recibo imprimível**
- Cancelamento de baixa (reverter pagamento)
- **Quitar Tudo** — paga todas as parcelas pendentes de um aluno de uma vez
- Filtros por nome, projeto e mês de vencimento
- Gráfico de arrecadação mensal (Pago vs Pendente)
- Exportação para **CSV**

### ⚙️ Gerenciamento
- Editar e excluir projetos e alunos
- Lista de registros com edição inline nos modais

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML5 + CSS3 + JavaScript (vanilla) |
| Banco de dados | [Supabase](https://supabase.com) (PostgreSQL) |
| QR Code PIX | [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) |
| Gráficos | [Chart.js](https://www.chartjs.org/) |
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
