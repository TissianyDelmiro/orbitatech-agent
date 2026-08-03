# 🚀 Guia de Deploy na Vercel

Este guia detalha o processo completo de deploy do Agente IA ÓrbitaTech na plataforma Vercel.

## Pré-requisitos

- Conta na Vercel ([vercel.com](https://vercel.com))
- Repositório público no GitHub: `https://github.com/TissianyDelmiro/orbitatech-agent`
- Chave da API Cohere (`COHERE_API_KEY`)

---

## Passo a Passo do Deploy

### 1. Acessar o Painel da Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New..."** → **"Project"**

### 2. Importar o Repositório do GitHub

1. Clique em **"Import Git Repository"**
2. Autorize a Vercel a acessar sua conta do GitHub (se ainda não estiver autorizado)
3. Selecione o repositório: `TissianyDelmiro/orbitatech-agent`
4. Clique em **"Import"**

### 3. Configurar o Projeto

Na tela de configuração do projeto:

1. **Project Name:** mantenha `orbitatech-agent` ou escolha outro nome
2. **Framework Preset:** Next.js (deve ser detectado automaticamente)
3. **Root Directory:** `.` (raiz do projeto)
4. **Build Command:** `npm run build` (já está configurado no package.json)
5. **Output Directory:** `.next` (padrão do Next.js)

### 4. Configurar Variáveis de Ambiente

**IMPORTANTE:** Antes de fazer o deploy, configure a variável de ambiente:

1. Clique em **"Environment Variables"**
2. Adicione a seguinte variável:
   - **Key:** `COHERE_API_KEY`
   - **Value:** `sua_chave_cohere_aqui` (substitua pela sua chave real)
   - **Environments:** marque todos (Production, Preview, Development)
3. Clique em **"Add"**

### 5. Fazer o Deploy

1. Clique em **"Deploy"**
2. Aguarde o processo de build e deploy (geralmente leva 1-3 minutos)
3. Após conclusão, você verá a mensagem de sucesso com o link do projeto

### 6. Obter a URL Pública

Após o deploy bem-sucedido:

1. A Vercel fornecerá uma URL no formato: `https://orbitatech-agent.vercel.app` ou `https://orbitatech-agent-seunome.vercel.app`
2. Copie essa URL para atualizar o README.md

---

## Verificação Pós-Deploy

Após o deploy, teste o agente:

1. Acesse a URL fornecida pela Vercel
2. Faça algumas perguntas de teste em diferentes categorias
3. Verifique se as respostas estão sendo geradas corretamente
4. Confirme que as fontes estão sendo citadas

### Exemplos de Perguntas para Teste:

- **RH:** "Como funciona o período de experiência?"
- **Financeiro:** "Qual o limite para reembolso de refeições?"
- **Operacional:** "Qual é o procedimento em caso de incidente?"
- **Legal:** "Quais são as regras para classificação de dados confidenciais?"
- **Estratégico:** "Quais são os OKRs principais para o 3º Trimestre?"

---

## Deploys Automáticos

A partir deste momento, **cada push na branch `master`** acionará um novo deploy automaticamente na Vercel. Branches de preview também geram URLs temporárias para testes.

---

## Solução de Problemas

### Erro: "Missing environment variable COHERE_API_KEY"

**Solução:** Acesse o painel da Vercel → Settings → Environment Variables e adicione a chave `COHERE_API_KEY`.

### Erro de Build

**Solução:** Verifique os logs de build no painel da Vercel. Certifique-se de que:
- Todas as dependências estão no `package.json`
- O arquivo `data/index.json` foi commitado no repositório
- Não há erros de TypeScript

### Deploy bem-sucedido, mas o agente não responde

**Solução:** Verifique:
1. Se a variável `COHERE_API_KEY` está configurada corretamente
2. Se o arquivo `data/index.json` existe no repositório
3. Os logs de função serverless no painel da Vercel (Runtime Logs)

---

## Comandos Úteis

```bash
# Instalar a CLI da Vercel (opcional)
npm i -g vercel

# Deploy via CLI
vercel

# Deploy para produção via CLI
vercel --prod
```

---

## Próximos Passos Após Deploy

1. Atualizar o README.md com a URL pública
2. Fazer commit final: `chore: configura variáveis de ambiente na Vercel e faz o deploy`
3. Testar todas as funcionalidades em produção
4. (Opcional) Adicionar prints e vídeo de demonstração ao README
5. (Opcional) Configurar domínio customizado na Vercel
