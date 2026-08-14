---
id: 13_javascript-nodejs-pratica
title: "Módulo 13 — JavaScript / Node.js — Prática"
sidebar_position: 131
---

# Módulo 13 — JavaScript / Node.js — Prática: Projeto DevTrack

> **Objetivo da prática:** construir, incrementalmente, uma ferramenta CLI real — o **DevTrack**,
> um gerenciador de tarefas para desenvolvedores — ao longo de 24 tarefas progressivas. Cada
> tarefa expande o que a anterior construiu; nada é descartado.
> **Pré-requisito:** [13_javascript-nodejs-teoria.md](13_javascript-nodejs-teoria.md).
> **Entregáveis:** o projeto `devtrack/` completo, com `README.md`, `CHANGELOG.md` e
> `docs/structures.md` na entrega final (Tarefa 24).
> **Formato de entrega:** publicado em um repositório no GitHub. Cada tarefa concluída deve virar
> um commit próprio, seguindo os padrões do Módulo 02 (ex: `feat: implementar módulo de
> armazenamento fs/promises`).

---

## Regra fundamental

O código de cada tarefa é usado nas seguintes — **não descarte implementações anteriores, expanda
-as**. Ao final da Tarefa 24, você terá um projeto completo e funcional, publicável no npm.

## Estrutura final do projeto

```
devtrack/
├── cli.js                    # Entry point — bin do package.json
├── package.json               # type: module, bin, scripts, engines
├── .env / .env.example
├── .gitignore
├── README.md
├── CHANGELOG.md
├── src/
│   ├── commands/               # Um arquivo por subcomando Commander
│   ├── storage/db.js            # fs/promises — banco JSON local
│   ├── structures/               # Stack, Queue, Trie, DoublyLinkedList, Graph, MinHeap, LRUCache
│   ├── services/                  # github.js, git.js, export.js, notifier.js, scheduler.js, history.js
│   ├── server/index.js             # http nativo + auth Bearer
│   └── utils/                       # config.js, crypto.js, perf.js
├── workers/fileWorker.js
├── plugins/devtrack-timer.js
├── data/devtrack.json
├── exports/
└── scripts/smoke-test.js
```

## Exemplo resolvido (Tarefa 01, para você seguir o mesmo raciocínio nas demais)

**Contexto:** um projeto Node profissional começa com um `package.json` bem configurado e uma
estrutura de diretórios clara — antes de escrever qualquer lógica, você monta a fundação que as
outras 23 tarefas vão expandir.

**Raciocínio:** `npm init -y` gera um `package.json` mínimo; a partir dele, editamos manualmente
os campos que o DevTrack precisa: `"type": "module"` habilita `import`/`export` (ES Modules) em
vez do `require` mais antigo; `"bin"` mapeia o comando `devtrack` para o arquivo `cli.js`, o que
só funciona depois de rodar `npm link`; `"engines"` documenta a versão mínima do Node exigida.

```js
#!/usr/bin/env node
// cli.js — Entry point do DevTrack
console.log('DevTrack v1.0');
console.log('Node:', process.version);
console.log('Plataforma:', process.platform);
```
A primeira linha (`#!/usr/bin/env node`) é o que permite rodar `./cli.js` diretamente no
terminal, sem digitar `node` antes — o sistema operacional usa essa linha pra saber qual
interpretador usar.

Agora é a sua vez — nas tarefas abaixo, o mesmo padrão se repete: **Contexto** (por que estamos
fazendo isso) → **O que implementar** → **Critérios de aceite** (como saber que está correto).

---

## SEÇÃO 1 — Básico (Tarefas 01 a 06)

### Tarefa 01 — Setup e Estrutura do Projeto

**O que implementar:**
- Crie a pasta `devtrack/` e inicialize com `npm init`.
- Configure o `package.json`: `"type": "module"`; `"engines": { "node": ">=18" }`;
  `"bin": { "devtrack": "./cli.js" }`; scripts `start`, `dev` (`node --watch`), `test`
  (`node --test`), `lint`.
- Crie a estrutura de diretórios completa (ver mapa acima).
- Crie `data/devtrack.json` com: `{ "version": "1.0", "projects": [], "tasks": [], "log": [] }`.
- Crie `cli.js` que imprime `"DevTrack v1.0"` e confirme que `node cli.js` funciona.
- Adicione `.gitignore` cobrindo `node_modules/`, `.env`, `exports/`, `data/*.json` (exceto o
  inicial).

**Critérios de aceite:**
- `npm start` e `node cli.js` executam sem erros.
- `package.json` contém os 6 campos listados.
- Todos os diretórios do mapa existem.
- `npm link` instala o executável e `devtrack` funciona globalmente.

### Tarefa 02 — Módulo de Armazenamento (`fs/promises`)

**Contexto:** o DevTrack persiste tarefas localmente em JSON. Este módulo é usado por todos os
outros — toda tarefa que cria, lê ou atualiza dados passa por aqui.

**O que implementar:**
- Crie `src/storage/db.js` exportando: `lerDB()`, `salvarDB(dados)`, `adicionarTask(task)`,
  `atualizarTask(id, campos)`, `removerTask(id)`, `listarTasks(filtro)`.
- Use `fs/promises` para tudo — sem callbacks, sem versão síncrona.
- Cada tarefa tem os campos: `id` (`crypto.randomUUID()`), `titulo`, `descricao`,
  `status` (`"pendente"|"em_progresso"|"concluida"`), `prioridade` (`"alta"|"media"|"baixa"`),
  `projeto`, `tags` (array), `criadaEm`, `atualizadaEm`.
- Use `path.join` + `fileURLToPath(import.meta.url)` pra construir o caminho do arquivo de forma
  cross-platform.
- `lerDB()` cria o arquivo com estrutura padrão se ele não existir.
- Implemente `fazerBackup()`, que copia o JSON com timestamp: `devtrack-2024-01-15.json`.
- `listarTasks({ status, prioridade, projeto })` filtra por qualquer combinação.

**Dica:** escrita atômica evita corrupção — escreva em `.tmp`, depois renomeie com
`fs.rename()` (a mesma técnica narrada na teoria). Se a escrita falhar no meio, o arquivo
original permanece intacto.

**Critérios de aceite:**
- `lerDB()` retorna objeto válido mesmo que o arquivo não exista.
- `adicionarTask()` retorna a tarefa com `id`, `criadaEm` e `atualizadaEm` preenchidos.
- `listarTasks({ status: "pendente" })` retorna só as pendentes.
- `fazerBackup()` cria arquivo no formato `devtrack-YYYY-MM-DD.json`.

### Tarefa 03 — CLI Interativo com `readline`

**Contexto:** com o armazenamento pronto, o DevTrack precisa de uma interface interativa — este
menu `readline` é a entrada até a Tarefa 7, quando é substituído pelo Commander.js.

**O que implementar:**
- Em `cli.js`, implemente um menu: `1. Adicionar`, `2. Listar`, `3. Atualizar status`, `4. Sair`.
- "Adicionar" pergunta: título (obrigatório), prioridade (padrão `media`), tags (separadas por
  vírgula, pode ficar em branco).
- "Listar" formata a saída como tabela: ID (8 chars), Título (truncado em 30), Status, Prioridade.
- Use `process.stdout.isTTY`: se `false` (pipe/redirect), saída em JSON limpo.
- Capture `process.on("SIGINT")` para encerrar sem stack trace.
- Todas as operações usam o `db.js` da Tarefa 2.

**Dica:** envolva `rl.question` numa Promise para usar `async/await` no menu:
`const ask = (t) => new Promise(res => rl.question(t, res))`. Chame `rl.close()` antes de
`process.exit(0)`.

**Critérios de aceite:**
- Menu navega entre opções e volta ao menu após cada ação, sem reiniciar o processo.
- Tarefa criada pelo menu persiste no `devtrack.json`.
- Ctrl+C exibe "Encerrando..." e fecha limpo com exit code 0.
- `node cli.js | cat` exibe JSON (`isTTY` detectado como `false`).

### Tarefa 04 — Exportação com Streams e Compressão

**Contexto:** o DevTrack precisa exportar tarefas em CSV e comprimir logs de uso. Streams
garantem que isso funcione com milhares de tarefas, sem estourar memória.

**O que implementar:**
- Crie `src/services/export.js` com `exportarCSV(filtro, caminhoSaida)`.
- Use um Transform stream pra converter objetos de tarefa em linhas CSV (header na primeira linha).
- CSV: `id,titulo,status,prioridade,projeto,tags,criadaEm`.
- Crie `exportarLogComprimido(caminhoSaida)`: lê `db.log`, comprime com `zlib.createGzip()`,
  escreve via `pipeline`.
- Use `stream/promises` `pipeline` (não a versão baseada em callback).
- Adicione ao menu: `5. Exportar CSV`, `6. Exportar log comprimido`.

**Dica:** `import { pipeline } from "stream/promises"` retorna uma Promise — use com `await`.
No Transform em `objectMode`, use `super({ objectMode: true })`.

**Critérios de aceite:**
- CSV gerado tem header correto e uma linha por tarefa.
- Arquivo `.gz` gerado é válido (`gunzip -t arquivo.log.gz`).
- `pipeline` encadeia sem vazar memória.
- Erro em qualquer stream é capturado e exibido sem travar o menu.

### Tarefa 05 — Integração com GitHub Issues via HTTP

**Contexto:** muitos times usam GitHub Issues para rastrear bugs. O DevTrack pode importar issues
abertas de qualquer repositório público e convertê-las em tarefas locais.

**O que implementar:**
- Crie `src/services/github.js` com `buscarIssues(repo, token, page=1)`.
- Use `fetch` nativo (global no Node 18+) para `GET
  https://api.github.com/repos/{repo}/issues?state=open&per_page=20&page={page}`.
- Retorne `{ issues, hasNextPage }`, verificando o header `Link` da resposta.
- Converta cada issue: `titulo=issue.title`, `tags=issue.labels.map(l=>l.name)`,
  `descricao=issue.body?.slice(0,200)`, `status="pendente"`, `prioridade="media"`.
- Trate erros HTTP: 401 (token inválido), 404 (repo não encontrado), 403 (rate limit — exiba o
  reset time do header `X-RateLimit-Reset`).
- Adicione ao menu: `7. Importar issues do GitHub`.

**Dica:** para checar paginação: `const link = resposta.headers.get("link"); const hasNext =
link?.includes('rel="next"')`.

**Critérios de aceite:**
- `buscarIssues("nodejs/node", null)` retorna issues sem erros.
- Issues são salvas no `devtrack.json` via `adicionarTask()`.
- Erro 404 exibe `"Repositório X não encontrado"` (não um stack trace).
- Token lido exclusivamente de `process.env.GITHUB_TOKEN`.

### Tarefa 06 — Integração com Git via `child_process`

**Contexto:** o DevTrack pode enriquecer o contexto de cada tarefa com informações do repositório
atual e criar branches padronizadas automaticamente.

**O que implementar:**
- Crie `src/services/git.js` com: `getBranch()`, `getUltimoCommit()`, `getStatusArquivos()`,
  `criarBranchDaTarefa(taskId, titulo)`.
- `getBranch()`: usa `execSync("git branch --show-current")`. Se não for repo Git, retorne `null`
  sem lançar exceção.
- `getUltimoCommit()`: retorna `{ hash, mensagem, autor, data }` via
  `git log --pretty=format:"%H|%s|%an|%ai" -1`.
- `getStatusArquivos()`: usa `git status --porcelain`, retorna `[{ status: "M"|"A"|"D"|"?",
  arquivo }]`.
- `criarBranchDaTarefa(id, titulo)`: cria branch `feat/DT-{id8}-{slug}`, seguindo o padrão de
  nomenclatura de branch do Módulo 02.
- Todos os comandos usam `{ cwd: process.cwd() }` e `promisify(exec)` para a versão assíncrona.
- Adicione ao menu: `8. Vincular tarefa à branch atual`.

**Critérios de aceite:**
- `getBranch()` retorna `null` graciosamente fora de um repo git.
- `criarBranchDaTarefa()` cria a branch e salva o campo `"branch"` na tarefa.
- `getStatusArquivos()` retorna `[]` (não erro) quando não há mudanças.
- `promisify(exec)` usado corretamente — não `execSync` para operações assíncronas.

---

## SEÇÃO 2 — Intermediário (Tarefas 07 a 13)

### Tarefa 07 — Refatoração: CLI com Commander.js e Chalk

**Contexto:** o menu `readline` funciona mas não escala. O menu interativo é substituído por
subcomandos tipados com Commander.js, saída colorida com Chalk e spinners com Ora.

**O que implementar:**
- Instale `commander`, `chalk`, `ora`, `inquirer`.
- Mantenha todos os módulos já criados (`db.js`, `github.js`, `git.js`, `export.js`) — só a
  interface muda.
- Reescreva `cli.js` com `program.command()` para: `add`, `list`, `update`, `remove`, `export`,
  `github`, `git`.
- `devtrack add` aceita: `-p/--prioridade`, `-P/--projeto`, `-t/--tags` (variadic),
  `-d/--descricao`.
- `devtrack list` aceita: `--status`, `--prioridade`, `--projeto`, `--json`.
- Use Chalk: verde=sucesso, vermelho=erro, cinza=metadados, ciano=IDs.
- Use spinner Ora em operações assíncronas: `github`, `git`, `export`.

**Critérios de aceite:**
- `devtrack add "Fix login" -p alta -t auth backend` funciona.
- `devtrack list --status pendente` filtra corretamente.
- `devtrack list --json | node -e "..."` funciona sem erros.
- Spinner aparece durante o fetch do GitHub e fecha com `succeed` ou `fail`.

### Tarefa 08 — Formulários Guiados com Inquirer

**Contexto:** `devtrack new` é o modo guiado — coleta os dados da tarefa passo a passo, com
validação inline e listas dinâmicas baseadas nos dados existentes.

**O que implementar:**
- Crie `devtrack new` com `inquirer.prompt()`.
- Campos: input de título (validação 3–100 chars), input de descrição, list de prioridade, list
  de projeto (carregado do `db.json`, mais opção "Criar novo projeto"), checkbox de tags
  pré-definidas.
- Se "Criar novo projeto" for escolhido, um segundo prompt pergunta o nome.
- Exiba um resumo antes de salvar e peça confirmação.
- Capture `ExitPromptError` do Inquirer (Ctrl+C durante prompt) e encerre limpo.
- Após criar, exiba o ID gerado com Chalk e quantas tarefas o projeto tem.

**Critérios de aceite:**
- Lista de projetos carrega dinamicamente do `db.json`.
- Título com menos de 3 caracteres: erro inline no prompt.
- Ctrl+C durante qualquer prompt: encerramento limpo sem stack trace.
- Resumo exibido antes de salvar, com todos os campos preenchidos.

### Tarefa 09 — Servidor HTTP Local — API REST

**Contexto:** além do CLI, o DevTrack pode expor uma API REST local para integrações externas.

**O que implementar:**
- Crie `src/server/index.js` e o comando `devtrack serve [--porta]`.
- Rotas: `GET /tasks`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`, `GET /health`.
- `GET /tasks` aceita query params: `?status=&prioridade=&projeto=`.
- Parse do corpo das requisições `POST`/`PATCH` lendo os chunks do `req` stream (sem bibliotecas
  externas).
- Sempre `Content-Type: application/json`. Trate: 400 (body inválido), 404 (tarefa não
  encontrada), 405 (método não permitido).
- Header CORS: `Access-Control-Allow-Origin: *`.
- Logue cada requisição: `[GET] /tasks → 200 (12ms)`.

**Critérios de aceite:**
- `GET /tasks` retorna array de tarefas com status 200.
- `POST /tasks` com body válido retorna 201 com a tarefa criada.
- `PATCH /tasks/id-invalido` retorna 404 com `{ error: "Tarefa não encontrada" }`.
- Cada requisição gera log com o tempo de resposta em ms.

### Tarefa 10 — Processamento Paralelo com Worker Threads

**Contexto:** o DevTrack precisa analisar grandes arquivos de log exportados. Worker threads usam
múltiplos núcleos sem bloquear a thread principal do CLI.

**O que implementar:**
- Crie `workers/fileWorker.js`: recebe `{ arquivo, tipo }` via `workerData`, retorna
  `{ linhas, tamanhoBytes, palavras, erros }`.
- Crie `devtrack analyze`: lista arquivos `.log`/`.csv` e processa em paralelo com Worker Threads.
- Máximo de workers simultâneos: `os.cpus().length`.
- Mostre progresso em tempo real (`"Processando 3/7 arquivos..."`) via `worker.on("message")`.
- Use `Promise.all()` (ou `allSettled`, ver critério abaixo) para consolidar resultados.
- Relatório final: total de arquivos, linhas, tamanho, tempo (com `perf_hooks`), número de
  workers.

**Critérios de aceite:**
- Múltiplos arquivos processados em paralelo (tempo < soma sequencial).
- Número de workers nunca excede `os.cpus().length`.
- Erro em um worker não cancela os outros (`Promise.allSettled`).
- Relatório exibe tempo total medido com `performance.now()`.

### Tarefa 11 — Sistema de Plugins via Dynamic Import

**Contexto:** o DevTrack pode ser estendido por plugins externos, sem modificar o core.

**O que implementar:**
- Ao iniciar, `cli.js` lê todos os arquivos em `plugins/*.js` e os carrega com `import()`
  dinâmico.
- Cada plugin exporta `default: { nome, versao, comandos[] }`; cada comando é registrado no
  `program` do Commander.
- Crie `plugins/devtrack-timer.js` como exemplo: adiciona `devtrack timer start`/`stop` para medir
  tempo gasto numa tarefa (salvo no `db.json`).
- Se um plugin lançar erro ao carregar, log um aviso e continue — não trave o CLI.
- Adicione o campo `plugins: []` ao `devtrack.json`.

**Critérios de aceite:**
- `plugins/devtrack-timer.js` carregado, comandos visíveis no `--help`.
- `devtrack timer start` salva `startTime` no `db.json`.
- `devtrack timer stop` calcula duração e salva.
- Plugin com erro de sintaxe: aviso no console, CLI continua funcionando.

### Tarefa 12 — Cache e Watcher: Hot Reload do Banco de Dados

**Contexto:** quando o CLI e o servidor HTTP rodam simultaneamente, mudanças de um precisam
refletir no outro sem reiniciar.

**O que implementar:**
- Adicione cache em memória ao `db.js`: objeto `{ data, timestamp }`.
- `lerDB()` usa o cache se ele tiver menos de 500ms. Se stale, relê o arquivo.
- Ao iniciar o servidor, crie um `fs.watch` no `devtrack.json`. Ao detectar mudança, invalide o
  cache.
- Ao encerrar o servidor (SIGINT/SIGTERM), feche o watcher.
- Log de debug ativado por `DEBUG=devtrack`.

**Dica:** `fs.watch` pode disparar dois eventos seguidos pra mesma mudança — use debounce (limpe
o timeout anterior e agende um novo a cada evento).

**Critérios de aceite:**
- Mudança manual no `devtrack.json` reflete em `GET /tasks` sem reiniciar servidor.
- `DEBUG=devtrack node cli.js serve` exibe logs de invalidação de cache.
- Cache reduz chamadas a `readFile`.
- Watcher fechado corretamente ao encerrar.

### Tarefa 13 — Configuração com `.env` e Variáveis de Ambiente

**Contexto:** configurações sensíveis nunca vão pro código-fonte.

**O que implementar:**
- Crie `src/utils/config.js` que lê `.env` manualmente (sem biblioteca `dotenv`: `readFileSync` +
  parse simples de `KEY=VALUE`) e exporta um objeto `config`.
- Campos: `porta` (padrão 3000), `githubToken`, `dataDir` (`./data`), `debug` (`false`),
  `maxWorkers` (`os.cpus().length`), `webhookUrl`.
- `config.js` deve ser o primeiro import de `cli.js`.
- Se `GITHUB_TOKEN` não estiver definido, desabilite o comando `github` com aviso.
- Adicione `devtrack config --list` (mascare o token com `"****"` se definido).
- Crie `.env.example` com todas as variáveis documentadas; adicione `.env` ao `.gitignore`.

**Critérios de aceite:**
- `PORT=4000 node cli.js serve` inicia na porta 4000.
- `devtrack config --list` exibe as configs sem revelar o token completo.
- `devtrack github` sem `GITHUB_TOKEN`: aviso amigável, exit code 0.
- `.env.example` contém todas as variáveis com comentários.

---

## SEÇÃO 3 — Avançado (Tarefas 14 a 20)

Estas tarefas implementam estruturas de dados do zero, usando sintaxe de classes com campos
`#privados`, integrando cada uma ao DevTrack de forma funcional e observável.

### Tarefa 14 — Stack: Histórico de Ações (Undo/Redo)

**O que implementar:**
- `src/structures/Stack.js` com `#items` privado: `push(item)`, `pop()`, `peek()`, `isEmpty()`,
  `get size`, `clear()`, `toArray()`.
- `src/services/history.js` com `undoStack`/`redoStack` (instâncias de `Stack`):
  `registrar(acao, estadoAntes)`, `desfazer()`, `refazer()`.
- `estadoAntes` é o snapshot `JSON.stringify` das tasks antes da operação.
- Antes de qualquer `add`/`update`/`remove`, registre o estado anterior.
- `desfazer()`: pop da `undoStack`, push do estado atual na `redoStack`, restaura o anterior.
- Limite de 50 entradas no histórico.
- Adicione `devtrack undo` e `devtrack redo`.

**Critérios de aceite:**
- `devtrack add "X"`, `devtrack undo`: tarefa removida do `db.json`.
- `devtrack undo` sem histórico: `"Nada para desfazer"`, exit code 0.
- `devtrack redo` após `undo`: tarefa restaurada corretamente.
- Stack implementada com `#items` privado — não array público.

### Tarefa 15 — Queue: Fila de Notificações com Retry

**O que implementar:**
- `src/structures/Queue.js` O(1): `#store` (objeto), `#head`, `#tail`: `enqueue(item)`,
  `dequeue()`, `peek()`, `isEmpty()`, `get size`.
- `src/services/notifier.js` com Queue interna. Cada evento: `tipo`, `payload`,
  `tentativas` (máx 3), `criadoEm`.
- `processar()`: dequeue do próximo evento, tenta `fetch` para `WEBHOOK_URL`. Se falhar e
  `tentativas < 3`: requeue com `tentativas++`. Se `>= 3`: move para `deadLetterQueue`.
- `iniciarProcessamento(intervaloMs)` usa `setInterval`.
- Após cada operação do CLI (`add`, `update`, `done`), enfileire o evento correspondente.
- Adicione `devtrack queue --stats`: pendentes, dead-letter, total processado.

**Critérios de aceite:**
- Queue O(1): `enqueue`/`dequeue` em tempo constante (sem `Array.shift`).
- Evento com webhook inválido: reprocessado 3x, vai para dead-letter.
- `devtrack queue --stats` exibe contagens corretas.
- `setInterval` de processamento não bloqueia o CLI.

### Tarefa 16 — Trie: Busca e Autocompletar Instantâneo

**O que implementar:**
- `src/structures/Trie.js` com `TrieNode` (filhos como `Map`, `fimDaChave`, `taskId`) e classe
  `Trie` com `#raiz` privado.
- `inserir(palavra, taskId)`, `buscarPrefixo(prefixo)` → `[{ palavra, taskId }]`,
  `remover(palavra)`.
- Normalize ao inserir/buscar: `toLowerCase().trim()`.
- Em `db.js`, inicialize a Trie ao carregar o banco; atualize ao adicionar/remover.
- Adicione `devtrack search`.
- Compare performance: `buscarPrefixo` na Trie vs `tasks.filter()` com 1000+ tarefas.

**Critérios de aceite:**
- `devtrack search "Fix"` retorna tarefas cujo título começa com "Fix".
- Inserção na Trie após `add`; remoção após `remove`.
- Benchmark mostra a Trie mais rápida que `Array.filter` para N > 500.
- `buscarPrefixo("")` retorna todas as tarefas, sem crash.

### Tarefa 17 — DoublyLinkedList: Timeline por Projeto

**O que implementar:**
- `src/structures/DoublyLinkedList.js` com nós `{ valor, prev, next }`: `pushFront(v)`,
  `pushBack(v)`, `popFront()`, `popBack()`, `buscar(pred)`, `get size`, `toArray()`,
  `toArrayReverso()`.
- `src/services/timeline.js` com `Map`. Evento: `{ tipo, taskId, descricao, timestamp }`.
- Ao criar/atualizar/concluir tarefa, adicione evento com `pushFront` (mais recente na frente).
- `devtrack timeline [--limite]`, com paginação (`--pagina`, `--por-pagina`) percorrendo a lista
  sem converter pra array.

**Critérios de aceite:**
- `devtrack timeline "meu-projeto"` exibe eventos mais recentes primeiro.
- Paginação funciona via percurso da lista.
- `toArrayReverso()` retorna do mais antigo ao mais recente.
- Timelines separadas por projeto (Map garante isolamento).

### Tarefa 18 — Graph: Dependências e Detecção de Ciclos

**O que implementar:**
- `src/structures/Graph.js` com lista de adjacência (`#adj` como `Map`): `addVertex(v)`,
  `addEdge(u,v)`, `removeEdge(u,v)`, `neighbors(v)`, `bfs(inicio)`, `temCiclo()`.
- `temCiclo()` usa DFS com coloração: 0=branco, 1=cinza (em visita), 2=preto (concluído). Nó
  cinza durante DFS = ciclo.
- Campo `dependencias: []` em cada tarefa.
- `devtrack deps add <A> <B>`: valida ciclo antes de adicionar.
- `devtrack deps show`: exibe árvore de dependências com indentação, via BFS.
- `devtrack deps check`: valida o grafo completo, reporta ciclos.
- Ao remover tarefa com dependentes, avise quem depende dela.

**Critérios de aceite:**
- `devtrack deps add A B`, `devtrack deps add B A`: segundo comando rejeitado (ciclo).
- `devtrack deps show` exibe árvore indentada por nível.
- `devtrack deps check` sem ciclos: `"Nenhum ciclo detectado"`.
- Remoção com dependentes: aviso listando quem depende.

### Tarefa 19 — MinHeap: Agendador por Prioridade e Deadline

**O que implementar:**
- `src/structures/MinHeap.js` com array interno `#heap`: `insert(item, prioridade)`,
  `extractMin()`, `peek()`, `get size`, com `_heapifyUp()`/`_heapifyDown()`.
- Score de urgência: `(peso_prioridade) + (1 / (diasAtéDeadline + 1))`. Prioridades: alta=3,
  media=2, baixa=1. Score menor = mais urgente.
- `src/services/scheduler.js`: ao iniciar, insere todas as pendentes no heap; mantém sincronizado.
- Campo `deadline` (ISO date) nas tarefas, `-D/--deadline` no `add`.
- `devtrack next` exibe a mais urgente sem remover; `devtrack next --executar` marca como
  `"em_progresso"`.

**Critérios de aceite:**
- Tarefa "baixa" sem deadline tem score maior que "alta" com deadline amanhã.
- `extractMin()` mantém propriedade heap.
- `devtrack next` sempre retorna a mesma tarefa que `--executar` mudaria.
- Inserir 1000 tarefas no heap em < 10ms.

### Tarefa 20 — LRU Cache: Cache da API GitHub com TTL

**O que implementar:**
- `src/structures/LRUCache.js` usando só `Map` (preserva ordem de inserção): `get(key)`,
  `set(key, value, ttlMs)`, `has(key)`, `delete(key)`, `get size`.
- `get(key)`: verifica TTL expirado (delete + retorna `undefined` se expirou), move item pro fim
  do Map, retorna valor.
- `set(key, value, ttlMs=300000)`: se capacidade atingida, delete o primeiro item
  (`keys().next().value`).
- Em `github.js`, cache singleton com capacidade 50, antes/depois de cada `fetch`.
- Adicione `devtrack cache --stats`: hits, misses, taxa de acerto, itens atuais.

**Critérios de aceite:**
- Segunda chamada ao mesmo repo retorna do cache.
- Item com TTL expirado é tratado como cache miss.
- LRU evicta o item menos recente ao atingir capacidade 50.
- `get()` em O(1) — não percorre o Map.

---

## SEÇÃO 4 — Projeto Final (Tarefas 21 a 24)

As últimas quatro tarefas consolidam tudo: criptografia real no servidor, benchmarks das
estruturas de dados, testes de integração, documentação e empacotamento.

### Tarefa 21 — `crypto`: Tokens, HMAC e Verificação de Integridade

**O que implementar:**
- `src/utils/crypto.js`: `gerarToken(bytes=32)`, `hashArquivo(caminho)`,
  `criarHMAC(payload, segredo)`, `verificarHMAC(payload, hmac, segredo)`.
- `verificarHMAC` usa `crypto.timingSafeEqual` (evita timing attacks).
- No servidor HTTP, proteja todas as rotas exceto `/health`: header `Authorization: Bearer
  <token>`, 401 se ausente/inválido.
- Token gerado na primeira execução de `devtrack serve`, salvo em `.devtrack-token` (no
  `.gitignore`).
- `devtrack token --gerar`: gera novo token, invalida o anterior.
- Ao iniciar, calcule hash SHA-256 do `devtrack.json`; se diferir do anterior, avise "modificado
  externamente".

**Critérios de aceite:**
- `GET /tasks` sem `Authorization`: 401.
- `GET /tasks` com token válido: retorna as tarefas.
- `devtrack token --gerar` invalida o anterior.
- Modificação manual do JSON é detectada no próximo start.

### Tarefa 22 — `perf_hooks`: Benchmark das Estruturas de Dados

**O que implementar:**
- Comando `devtrack benchmark`, rodando uma suite completa.
- Para cada estrutura, meça com `performance.mark()`/`performance.measure()`: inserção de 10.000
  itens, busca aleatória de 1.000, remoção de 1.000.
- Compare explicitamente: `Trie.buscarPrefixo()` vs `Array.filter()` para N=10.000.
- Compare: Queue O(1) vs Queue ingênua com `Array.shift()` para N=10.000.
- Resultados em tabela formatada com Chalk.
- Execute em um Worker Thread, sem bloquear o event loop.

**Critérios de aceite:**
- Benchmark exibe tempo em ms (2 casas decimais) por operação.
- Trie comprovadamente mais rápida que `Array.filter` para N >= 1.000.
- Queue O(1) comprovadamente mais rápida que `Array.shift` para N >= 1.000.

### Tarefa 23 — Testes de Fumaça: Integração Completa

**O que implementar:**
- `scripts/smoke-test.js` executando: (1) limpar `devtrack.json`; (2) criar 5 tarefas com
  prioridades/projetos diferentes; (3) buscar por prefixo via Trie; (4) adicionar dependência
  entre tarefas e verificar detecção de ciclo; (5) desfazer uma ação com undo; (6) exportar CSV e
  verificar o arquivo; (7) checar benchmark (Trie mais rápida que `Array.filter`).
- Cada verificação usa `console.assert()` ou `throw new Error()` se falhar.
- `"test": "node scripts/smoke-test.js"` no `package.json`.

**Critérios de aceite:**
- `npm test` passa sem erros em ambiente limpo.
- Sequência completa executa em menos de 10 segundos.
- Falha em qualquer etapa: mensagem clara indicando qual falhou.
- `devtrack --help` lista todos os comandos de todas as tarefas anteriores.

### Tarefa 24 — Documentação, Empacotamento e Publicação

**O que implementar:**
- `README.md` completo: instalação, todos os comandos com exemplos, variáveis de ambiente,
  arquitetura e estruturas de dados usadas.
- `CHANGELOG.md` com as 24 tarefas organizadas por versão semântica (seguindo o Módulo 02).
- `docs/structures.md`: complexidade de tempo/espaço (Big O) de cada estrutura, quando usar,
  trade-offs.
- `docs/api.md`: todas as rotas HTTP — método, path, params, body, resposta de sucesso/erro.
- Campo `"files"` no `package.json`: só `src/`, `cli.js`, `README.md`, `CHANGELOG.md`.
- Rode `npm pack` e inspecione o `.tgz` gerado.

**Critérios de aceite:**
- README permite instalar e usar o DevTrack do zero, sem conhecimento prévio.
- `docs/structures.md` tem complexidade correta para as 7 estruturas.
- `npm pack` gera `.tgz` sem `node_modules/`, `data/`, `exports/` ou `.env`.
- `npm test` passa em ambiente limpo, seguindo só o README.

---

## Critérios de entrega

- Projeto completo publicado num repositório GitHub, com um commit por tarefa concluída.
- `README.md`, `CHANGELOG.md` e `docs/structures.md` presentes na entrega final.
- Nenhuma tarefa anterior descartada — cada uma continua funcionando nas seguintes.

## Checklist de entrega

- [ ] Seção 1 — Básico (Tarefas 01-06): armazenamento, CLI readline, streams/export, GitHub,
      Git — todas funcionando.
- [ ] Seção 2 — Intermediário (Tarefas 07-13): Commander/Chalk, Inquirer, servidor REST, Worker
      Threads, plugins, cache/watcher, `.env`.
- [ ] Seção 3 — Avançado (Tarefas 14-20): Stack, Queue, Trie, DoublyLinkedList, Graph, MinHeap,
      LRUCache, todas integradas ao CLI.
- [ ] Seção 4 — Projeto Final (Tarefas 21-24): crypto/auth, benchmark, smoke test, documentação e
      empacotamento.
- [ ] `npm test` passa em ambiente limpo.
- [ ] Publicado no GitHub com histórico de commits por tarefa.
