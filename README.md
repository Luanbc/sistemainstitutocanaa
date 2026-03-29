<div align="center" style="background: #132638; padding: 20px; border-radius: 10px;">
  <img src="https://i.ibb.co/XZ42Xw34/branca.png" alt="Instituto Canaã" width="80"/>
  <h1 style="color: white">Sistema Gestão Canaã</h1>
  <p style="color: #38bdf8">Plataforma de Gestão Financeira, Escolar e Social Baseada em Nuvem</p>
</div>

<br/>

O **Sistema Gestão Canaã** é uma plataforma administrativa interna desenvolvida exclusivamente para automatizar e otimizar a gestão de alunos, inadimplentes, contratos e o fluxo financeiro do Instituto Social e Educacional Canaã.

## ✨ Recursos Principais

### 🎓 Gestão Acadêmica e Social
- **Cadastro de Alunos:** Base de dados completa com informações de saúde, filiação, endereço (Via API de CEP) e vínculo com projetos.
- **Painel de Projetos:** Gerenciamento de modalidades (ex: Ballet, Dança, Música), vagas dinâmicas e associações.
- **Geração de Contratos:** Criação automatizada de contratos customizados em formato PDF, prontos para assinatura digital ou física, de acordo com o projeto vinculado ao aluno.

### 💰 Inteligência Financeira e Inadimplência
- **Carnês e Mensalidades:** Geração de boletos e fluxos de pagamentos em massa de acordo com as datas de vencimento de cada aluno.
- **Cobrança via PIX (Integração Mercado Pago):** Geração nativa de QR Code e chave PIX "Copia e Cola" dinâmico e estático para os carnês mensais.
- **Baixa Automática no Sistema (Webhooks):** Integração via Edge Functions com o Mercado Pago para identificar o pagamento e atualizar o status do aluno instantaneamente no painel.
- **Controle de Inadimplentes Inteligente:** Identificação automática de devedores e atrasos com separação por escalas.
- **Notificação Integrada de Cobrança WhatsApp:** Disparo de notificações de cobrança (`Lembrete`, `Vencimento Hoje`, `Atraso`, `Notificação Crítica`).

### 📊 Painéis e Segurança
- **Dashboard Analítico:** Visão diária de faturamento do instituto, alunos bolsistas, e pagamentos aprovados.
- **Logs de Auditoria Avançados:** Registro vitalício (Black-box) rastreando qual usuário realizou qual operação, em qual tela, capturando o IP público responsável.
- **Relatórios:** Exportação massiva em relatórios formatados em versão A4 (Paisagem) ou manipulação em Excel `.csv`.
- **Autenticação RBAC:** Senhas encriptadas e segurança RLS (*Row Level Security*).

---

## 🛠️ Stack Tecnológica

* **Front-end:** [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
* **Back-end & Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Row Level Security)
* **API de Pagamentos:** Integração [Mercado Pago](https://www.mercadopago.com.br/)
* **Serverless Edge Functions:** Webhooks e geração segura de PIX hospedados no Supabase e geridos por `Deno`.
* **Deployment:** Otimizado e deploy contínuo (*CI/CD*) na Infraestrutura Cloudflare Pages e Vercel.

---

## ⚙️ Como executar o projeto localmente

Pré-requisitos: `Node.js` (v18+) instalado.

1. **Clone este repositório**
   ```bash
   git clone https://github.com/SeuUsuario/sistemainstitutocanaa.git
   ```

2. **Acesse a pasta do projeto**
   ```bash
   cd sistemainstitutocanaa
   ```

3. **Instale as dependências**
   ```bash
   npm install
   ```

4. **Variáveis de Ambiente**
   Você não precisa criar um arquivo `.env` imediatamente, o sistema já possui chaves (*fallback keys*) configuradas para um banco de dados de validação da aplicação se nenhuma chave for identificada no sistema.
   *Nota: Nunca suba as chaves mestras e Service Role do Supabase para o GitHub.*

5. **Rode o Servidor Local**
   ```bash
   npm run dev
   ```
   *Acesse `http://localhost:5173/` no navegador.*

---

<p align="center">
  Construído com ❤️ e alta performance para facilitar dezenas de horas de administração escolar 🚀
</p>
