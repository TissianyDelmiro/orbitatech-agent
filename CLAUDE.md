# CLAUDE.md — Agente ÓrbitaTech (Challenge ONE IA for Tech)

Este arquivo é a fonte de verdade do projeto. Leia-o por completo antes de qualquer alteração e mantenha-o atualizado conforme o projeto evolui.

## 1. Objetivo do projeto

Construir um **agente de IA corporativo (RAG)** que responde perguntas de colaboradores da empresa fictícia **ÓrbitaTech** com base em documentos internos, com uma **interface de chat simples e bonita**, rodando localmente primeiro (via VS Code) e preparado para deploy em nuvem depois.

Este é o Challenge final do curso Alura/ONE (Oracle Next Education) "Agentes de IA". Regras do desafio:

- Projeto num repositório público no GitHub, com código organizado e **histórico de commits real** (não um único commit gigante).
- Deploy final em nuvem com URL pública — **escolhido: Vercel** (o desafio aceita alternativas à OCI, como Render, Vercel e Streamlit Community Cloud, desde que o link fique público).
- **Primeiro fazer funcionar 100% local, só depois pensar em deploy.**
- README bem documentado (ver seção 5).
- Não vale a pena gastar muito tempo caprichando na interface — o importante é ter um projeto **funcional** que atenda aos requisitos.

## 2. Documentos-fonte (base de conhecimento)

Os documentos internos da ÓrbitaTech já foram gerados e devem ser colocados na pasta `docs/` do repositório:

| Arquivo | Categoria | Formato |
|---|---|---|
| `01_manual_onboarding_rh.docx` | RH | Word |
| `02_orcamento_e_reembolso_financeiro.xlsx` | Financeiro | Excel |
| `03_manual_procedimentos_operacionais.md` | Operacional | Markdown |
| `04_politica_seguranca_dados_corporativa.pdf` | Legal/Compliance | PDF |
| `05_okrs_roadmap_estrategico.pptx` | Estratégico | PowerPoint |

O agente precisa extrair texto de **todos esses formatos** (PDF, DOCX, XLSX, MD, PPTX) — essa é uma parte avaliada do desafio, não simplifique convertendo tudo pra .txt manualmente antes.

## 3. Stack técnica

Stack escolhida pensando em deploy nativo e gratuito na **Vercel**, que roda melhor projetos Next.js do que backends Python de longa duração:

- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS para a interface de chat.
- **LLM e embeddings:** Cohere (`embed-multilingual-v3.0` para embeddings, `rerank-multilingual-v3.0` para reranking, `command-r-plus` para geração de resposta), chamado via API route do Next.js (`/app/api/chat/route.ts`), nunca direto do client.
- **Variável de ambiente:** `COHERE_API_KEY` em `.env.local` (nunca commitada — no `.gitignore` desde o primeiro commit) e configurada depois nas Environment Variables do projeto na Vercel.
- **Indexação vetorial:** como a base de documentos é pequena (5 arquivos, poucas centenas de chunks), **não precisa de um banco vetorial dedicado**. Um script roda uma única vez localmente (`scripts/build-index.mjs` ou `.py`), extrai o texto dos documentos, gera os embeddings via Cohere e salva tudo em `data/index.json` (chunks + embeddings + metadados). Esse arquivo é commitado no repositório; em runtime, a API route só carrega esse JSON e calcula similaridade de cosseno em memória — não precisa reprocessar nada a cada deploy, e funciona bem no ambiente serverless da Vercel.
- **Extração de documentos:** pode ser feita em Python (reaproveitando a lógica do notebook do Colab) ou em Node — o importante é rodar **uma vez, localmente**, para gerar `data/index.json`; não faz parte do runtime da aplicação.

## 4. Arquitetura do pipeline (nesta ordem de construção)

**Etapa offline (roda uma vez, localmente, antes do deploy):**

1. **Extração** — um módulo por formato de arquivo, devolvendo texto + metadados (arquivo de origem, categoria, seção/página/slide/aba).
2. **Limpeza e chunking** — remover ruído (cabeçalhos repetidos, espaços duplicados), dividir em chunks de ~800 caracteres com ~150 de sobreposição, mantendo metadados por chunk.
3. **Geração dos embeddings** — chamar a Cohere para cada chunk e salvar tudo (`texto`, `embedding`, `metadados`) em `data/index.json`. Esse arquivo é commitado no repositório.

**Etapa online (roda a cada requisição, na Vercel):**

4. **Recuperação (retrieval)** — na API route: gerar o embedding da pergunta, calcular similaridade de cosseno contra `data/index.json` em memória (top ~20), opcionalmente filtrar por categoria, depois rerankear via Cohere (top ~5).
5. **Geração de resposta** — prompt com o contexto recuperado, instruindo o modelo a responder só com base no contexto e citar a fonte (arquivo + categoria) ao final da resposta.
6. **Interface de chat (Next.js)** — campo de pergunta, histórico de conversa no estado do React, exibição das fontes usadas em cada resposta, indicação clara de que é um agente de IA. Design simples, mas caprichado (Tailwind já ajuda bastante sem esforço extra).
7. **Logs** — em produção na Vercel, `console.log` estruturado (JSON) de cada pergunta/resposta/fontes/tempo de resposta já fica disponível nos logs da função serverless; em desenvolvimento local, opcionalmente também gravar em `logs/agent_logs.jsonl`.

Não pule etapas nem tente fazer tudo num arquivo só — separe em módulos (`lib/retrieval.ts`, `lib/cohere.ts`, `app/api/chat/route.ts`, `app/page.tsx`).

## 5. Estrutura de pastas esperada

```
orbitatech-agent/
├── docs/                       # documentos-fonte originais (os 5 arquivos)
├── scripts/
│   └── build-index.mjs         # roda uma vez: extrai, faz chunking e gera data/index.json
├── data/
│   └── index.json              # base vetorial pré-computada (chunks + embeddings + metadados), commitada
├── app/
│   ├── page.tsx                 # interface de chat
│   ├── globals.css
│   └── api/
│       └── chat/
│           └── route.ts        # retrieval (cosine + rerank) + geração de resposta
├── lib/
│   ├── cohere.ts                # helpers de chamada à API da Cohere
│   └── retrieval.ts             # similaridade de cosseno + filtro por categoria
├── logs/
│   └── agent_logs.jsonl         # apenas em desenvolvimento local
├── .env.local                   # COHERE_API_KEY (nunca commitar)
├── .env.example                 # exemplo de variável de ambiente, sem a chave real
├── .gitignore
├── package.json
├── README.md
└── CLAUDE.md
```

## 6. Convenção de commits

**Faça um commit a cada etapa concluída, nunca um commit único no final.** Use [Conventional Commits](https://www.conventionalcommits.org/pt-br/) e, antes de cada commit, mostre ao usuário a mensagem sugerida para confirmação. Exemplos esperados ao longo do projeto:

```
chore: inicializa projeto Next.js, .gitignore e .env.example
feat: adiciona script de extração e chunking dos documentos-fonte
feat: gera data/index.json com embeddings via Cohere
feat: implementa similaridade de cosseno e filtro por categoria em lib/retrieval.ts
feat: implementa reranking via Cohere em lib/retrieval.ts
feat: implementa API route de chat com geração via command-r-plus
feat: adiciona interface de chat em app/page.tsx
feat: adiciona exibição de fontes citadas na resposta
feat: adiciona logging estruturado das interações
docs: adiciona README com arquitetura e instruções de uso
fix: corrige encoding na extração de arquivos Markdown
refactor: separa chamadas à Cohere em lib/cohere.ts
chore: configura variáveis de ambiente na Vercel e faz o deploy
```

Sempre que terminar uma funcionalidade, pare e sugira o commit correspondente antes de seguir para a próxima etapa.

## 7. README — o que deve conter (gerar só ao final, depois do agente funcionar local)

O README precisa ter, nesta ordem:

1. **Descrição do projeto** — o que é a ÓrbitaTech, o que o agente faz, contexto do Challenge.
2. **Arquitetura** — diagrama simples (texto ou mermaid) do pipeline (extração → chunking → indexação → recuperação → geração → interface).
3. **Tecnologias utilizadas** — Python, Cohere, ChromaDB, Streamlit, bibliotecas de extração.
4. **Instruções de instalação** — clonar repositório, criar `.env.local` a partir do `.env.example`, instalar dependências (`npm install`), gerar o índice (`npm run build-index`), rodar localmente (`npm run dev`) e acessar em `http://localhost:3000`.
5. **Exemplos de perguntas e respostas** — pelo menos 5 pares pergunta/resposta reais, cobrindo categorias diferentes (RH, Financeiro, Operacional, Legal, Estratégico).
6. **Demo** — seção com espaços reservados para vídeo e prints, assim:

   ```markdown
   ## 🎥 Demonstração

   [Vídeo de demonstração — inserir link ou embed aqui]

   ![Print da interface do agente](caminho/para/print-1.png)
   ![Exemplo de resposta com fontes citadas](caminho/para/print-2.png)
   ```

7. **Status de deploy** — a URL pública do projeto na Vercel assim que publicado; até lá, deixar indicado como "local por enquanto, deploy em andamento".
8. **Limitações e próximos passos**.

## 8. Regras gerais de comportamento

- Sempre rode e teste localmente antes de sugerir qualquer coisa relacionada a deploy.
- Não invente credenciais ou chaves — sempre pergunte ao usuário onde ela quer configurar `COHERE_API_KEY`.
- Priorize um projeto simples e funcional sobre um projeto "bonito" mas incompleto.
- A cada módulo novo, rode um teste manual rápido (script ou REPL) mostrando que funciona antes de seguir para o próximo.
- Ao final, revise se todos os requisitos do desafio foram atendidos: repositório público, histórico de commits, README completo, agente funcional local, e deploy na Vercel com URL pública (conectar o repositório GitHub ao projeto na Vercel e configurar `COHERE_API_KEY` nas Environment Variables antes do primeiro deploy).
