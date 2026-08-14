# Módulo 02 — Padrões de Projeto — Prática

> **Objetivo da prática:** aplicar, em cenários concretos, as convenções de commit, branch, semver
> e PR vistas na teoria.
> **Pré-requisito:** [02_padroes-projeto-teoria.md](02_padroes-projeto-teoria.md)
> **Entregáveis:** um arquivo `respostas.md` neste módulo, no seu repositório pessoal do GitHub.
> **Formato de entrega:** publicado no GitHub, com README explicando a organização do repositório.

---

## Exercícios

### 1. Mensagens de commit

Para cada cenário abaixo, escreva a mensagem de commit correta (prefixo + descrição):

1. Você adicionou um botão de "esqueci minha senha" na tela de login.
2. Você corrigiu um erro que travava o cadastro quando o campo de e-mail estava vazio.
3. Você reorganizou as funções do módulo de autenticação sem mudar o comportamento.
4. Você atualizou o `README.md` explicando como rodar o projeto localmente.
5. Você configurou o pipeline de CI para rodar os testes automaticamente a cada push.

**Critério de aceite:** cada resposta usa um dos 11 prefixos válidos e a descrição está em
minúsculas, no passado/presente descrevendo o que foi feito.

### 2. Nomes de branch

Renomeie as branches abaixo para o padrão `PREFIXO/TASK-NOME-DA-TAREFA` (invente o número da
tarefa):

1. Uma branch para corrigir um erro crítico de autenticação em produção.
2. Uma branch para adicionar um cadastro de usuário.
3. Uma branch para adicionar testes ao módulo de pagamentos.

Depois, escreva o comando `git branch -m` que renomeia a branch atual para o nome corrigido.

**Critério de aceite:** os três nomes seguem o formato correto e o prefixo escolhido corresponde
ao tipo de mudança (ex: `hotfix` só para o cenário urgente em produção).

### 3. Versionamento semântico

Dado que a versão atual do projeto é `2.3.1`, diga qual deve ser a próxima versão em cada caso, e
por quê:

1. Você corrigiu um bug que não muda nenhuma interface pública.
2. Você adicionou um novo endpoint na API, sem alterar os existentes.
3. Você removeu um parâmetro obrigatório de uma função pública, quebrando quem já usava a versão
   anterior.

### 4. Tags

Escreva os comandos para:
1. Criar uma tag anotada `v2.4.0` na branch `main`, com a mensagem `"Lançamento da versão 2.4.0"`.
2. Enviar essa tag ao repositório remoto.
3. Enviar todas as tags locais de uma vez.

### 5. Pull Request

Escreva um Pull Request completo (título + descrição, seguindo a estrutura da teoria) para a
seguinte mudança: *"Você criou a tela de recuperação de senha, motivada por reclamações de
usuários que esqueciam a senha e não tinham como recuperar o acesso. A tela usa o mesmo
componente de formulário já existente na tela de login."*

## Critérios de entrega

- Todo o conteúdo publicado em um repositório no GitHub.
- Um `README.md` na raiz do repositório, explicando a organização dos arquivos.
- Cada exercício com o enunciado copiado junto da resposta, no mesmo arquivo (não só a resposta
  solta).

## Checklist de entrega

- [ ] Exercício 1 (commits) resolvido, com os 5 cenários.
- [ ] Exercício 2 (branches) resolvido, com os 3 nomes renomeados + comando `git branch -m`.
- [ ] Exercício 3 (semver) resolvido, com justificativa para cada caso.
- [ ] Exercício 4 (tags) resolvido, com os 3 comandos.
- [ ] Exercício 5 (Pull Request) resolvido, com título e descrição completos.
- [ ] Publicado no GitHub com README.
