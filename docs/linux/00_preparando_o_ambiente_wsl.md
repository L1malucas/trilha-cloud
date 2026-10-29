---
id: "00_preparando_o_ambiente_wsl"
title: "Módulo 00 — Instalando e configurando o WSL2 no Windows"
sidebar_label: "00 · Instalando o WSL2"
sidebar_position: 0
---

# Módulo 00 — Instalando e configurando o WSL2 no Windows

> **Objetivo**: instalar um Linux de verdade dentro do Windows (WSL2), configurá-lo para estudo e criar o laboratório que será usado em **todos** os módulos desta trilha — com a trilha numa tela e o terminal Linux na outra.
>
> **Pré-requisitos**: Windows 10 (versão 2004+) ou Windows 11, virtualização habilitada na BIOS/UEFI e permissão de administrador.
>
> **Tempo de referência (não prazo)**: meio dia.
>
> Este módulo não cai em prova, mas sem ele nenhum laboratório funciona. Documentação oficial: https://learn.microsoft.com/windows/wsl/

---

## Por que praticar num Linux de verdade

Linux se aprende com as mãos: ninguém aprende `grep`, permissões ou `systemd` só lendo. O WSL2 (*Windows Subsystem for Linux*) dá, no seu próprio computador, um **kernel Linux real** rodando numa VM leve integrada ao Windows. Você abre um terminal e está num Ubuntu de verdade, sem dual boot e sem instalar VirtualBox.

Compare as versões:

| | WSL 1 | **WSL 2** (use este) |
|---|---|---|
| Kernel | Camada de tradução para o Windows | Kernel Linux real (VM leve) |
| Compatibilidade | Parcial | Quase total (inclui Docker, systemd) |
| Arquivos Linux | Mais lento | Rápido (sistema ext4 próprio) |
| Arquivos do Windows (`/mnt/c`) | Rápido | Mais lento |

> `[TEORIA]` O layout de estudo desta trilha é **duas telas**: a trilha aberta no navegador de um lado e o terminal do outro. Leia um passo, execute na hora, observe o resultado. Isso vale mais do que ler o módulo inteiro e praticar depois.

## Passo 1 — Instalar o WSL e o Ubuntu

Abra o **PowerShell como administrador** (botão direito no menu Iniciar → "Terminal (Administrador)"):

```powershell
wsl --install -d Ubuntu-24.04
```

Esse único comando habilita os recursos do Windows, instala o kernel do WSL e baixa o Ubuntu. **Reinicie o computador** quando pedir. Depois, abra "Ubuntu" no menu Iniciar: na primeira vez ele pede para criar um **usuário e senha** (da distro, sem relação com a conta do Windows).

Comandos úteis de gestão (no PowerShell, fora do Linux):

```powershell
wsl --status                    # versão padrão e estado
wsl -l -v                       # distros instaladas e versão (deve mostrar VERSION 2)
wsl -l -o                       # distros disponíveis para instalar
wsl --set-default-version 2     # garante WSL 2 para novas instalações
wsl --update                    # atualiza o kernel do WSL
wsl --shutdown                  # desliga TODAS as distros (reinício limpo)
```

> `[ATENÇÃO]` Se `wsl --install` falhar com erro de virtualização, entre na BIOS/UEFI e habilite **Intel VT-x / AMD-V (SVM)**. Em notebooks, o nome pode ser "Virtualization Technology". Sem isso o WSL2 não inicia.

![PowerShell mostrando a saída de `wsl -l -v` com Ubuntu-24.04 na VERSION 2 e estado Running](screenshots/00-preparando-o-ambiente-wsl/01-wsl-lista-versao.png)
> `[PRINT]` Passo a passo para capturar: abrir o PowerShell, rodar `wsl -l -v` com o Ubuntu aberto em outra janela. Capturar a tabela com NAME, STATE e VERSION.

## Passo 2 — Primeiro acesso e sanidade

Dentro do Ubuntu (agora você está no Linux):

```bash
whoami                       # seu usuário
cat /etc/os-release          # qual distro e versão
uname -a                     # kernel (note a palavra "microsoft")
pwd                          # onde você está (deve ser /home/seu-usuario)

sudo apt update && sudo apt upgrade -y
```

`sudo` executa um comando como administrador (root); a senha que você digita é a do usuário que criou. O `apt` é o gerenciador de pacotes do Ubuntu (Módulo 07).

> `[TENTE VOCÊ]` Descubra quanta memória e quantos núcleos o Linux enxerga. Resposta: `free -h` e `nproc`.

## Passo 3 — Trabalhar no lugar certo

O WSL2 enxerga o disco do Windows em `/mnt/c`. É prático, mas **lento** para muitos arquivos pequenos (Git, `node_modules`, compilação). Regra de ouro:

- **Projetos e laboratórios ficam no sistema de arquivos Linux**: `~` (`/home/seu-usuario`).
- Use `/mnt/c` só para trocar arquivos com o Windows.

Ponte entre os dois mundos:

```bash
explorer.exe .               # abre a pasta atual no Explorador do Windows
code .                       # abre o VS Code do Windows conectado ao WSL (após instalar a extensão)
wslpath -w ~/lab             # converte caminho Linux -> Windows
wslpath -u 'C:\Users'        # converte caminho Windows -> Linux
cmd.exe /c ver               # executa um comando do Windows de dentro do Linux
```

## Passo 4 — Conforto de trabalho

1. **Windows Terminal** (Microsoft Store): abas, perfis, cores e fontes. Defina o Ubuntu como perfil padrão.
2. **VS Code** + extensão **WSL** (https://code.visualstudio.com/docs/remote/wsl): edita arquivos do Linux com a interface do Windows.
3. **Limitar recursos** do WSL criando `C:\Users\<voce>\.wslconfig`:

```ini
[wsl2]
memory=6GB
processors=4
swap=2GB
```

Aplique com `wsl --shutdown` e abrindo o Ubuntu de novo.

4. **Habilitar systemd** (necessário para `systemctl`, serviços e timers dos Módulos 06, 11 e 17). Dentro do Ubuntu:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

No PowerShell: `wsl --shutdown`. Abra o Ubuntu e confirme:

```bash
systemctl is-system-running      # running (ou degraded, também aceitável)
ps -p 1 -o comm=                 # deve mostrar: systemd
```

> `[ATENÇÃO]` O `/etc/wsl.conf` é lido **só na inicialização da distro**. Sem o `wsl --shutdown`, a alteração não vale. É o erro mais comum aqui.

## Passo 5 — O laboratório da trilha

Todos os módulos usam os mesmos dados de treino, para você obter os mesmos resultados dos exemplos. Crie a estrutura e o gerador:

```bash
mkdir -p ~/lab && cd ~/lab
cat > gera-lab.sh <<'EOF'
#!/usr/bin/env bash
# Gera dados de treino: access.log (5000 linhas), usuarios.csv e app.log
set -euo pipefail
DIR=${1:-$HOME/lab/dados}
mkdir -p "$DIR"
python3 - "$DIR" <<'PY'
import random, sys, datetime
d = sys.argv[1]
random.seed(42)
ips = [f"192.168.{random.randint(0,3)}.{random.randint(1,254)}" for _ in range(40)]
paths = ["/", "/produtos", "/produtos/42", "/carrinho", "/login", "/api/pedidos", "/admin", "/favicon.ico"]
codes = [200]*80 + [301]*5 + [404]*8 + [500]*4 + [403]*3
t = datetime.datetime(2026, 1, 10, 0, 0, 0)
with open(f"{d}/access.log", "w") as f:
    for _ in range(5000):
        t += datetime.timedelta(seconds=random.randint(1, 40))
        f.write(f'{random.choice(ips)} - - [{t:%d/%b/%Y:%H:%M:%S} +0000] '
                f'"GET {random.choice(paths)} HTTP/1.1" {random.choice(codes)} {random.randint(200, 50000)}\n')
nomes = ["ana","bruno","carla","diego","elisa","fabio","gabi","henrique"]
depts = ["ti","vendas","rh","financeiro"]
with open(f"{d}/usuarios.csv", "w") as f:
    f.write("id,nome,email,dept,salario\n")
    for i, n in enumerate(nomes, 1):
        f.write(f"{i},{n},{n}@exemplo.com,{random.choice(depts)},{random.randint(3000, 12000)}\n")
niveis = ["INFO"]*8 + ["WARN"]*2 + ["ERROR"]
with open(f"{d}/app.log", "w") as f:
    t = datetime.datetime(2026, 1, 10, 8, 0, 0)
    for _ in range(2000):
        t += datetime.timedelta(seconds=random.randint(1, 30))
        f.write(f"{t:%Y-%m-%d %H:%M:%S} {random.choice(niveis)} servico-{random.randint(1,3)} mensagem {random.randint(1000,9999)}\n")
PY
echo "Dados gerados em $DIR"
EOF
chmod +x gera-lab.sh && ./gera-lab.sh
ls -lh dados/ && head -3 dados/access.log
```

> `[TEORIA]` Não se preocupe em entender o script agora: ele usa conceitos dos Módulos 02 a 04 e 11. Por ora, ele só prepara o terreno. Você volta a ele ao final da trilha.

![Terminal mostrando a listagem da pasta ~/lab/dados com os arquivos access.log, app.log e usuarios.csv](screenshots/00-preparando-o-ambiente-wsl/02-lab-dados-gerados.png)
> `[PRINT]` Passo a passo para capturar: rodar `ls -lh ~/lab/dados` e `head -3 ~/lab/dados/access.log`. Capturar o terminal com tamanhos e as 3 primeiras linhas do log.

## Passo 6 — Snapshots: errar sem medo

Vários módulos pedem laboratórios "destrutivos" (quebrar `fstab`, remover pacotes). Em vez de ter medo, faça **backup** da distro pronta e restaure quando quiser. No PowerShell:

```powershell
mkdir C:\wsl
wsl --export Ubuntu-24.04 C:\wsl\ubuntu-base.tar                # snapshot (tire AGORA, ambiente limpo)
wsl --import ubuntu-lab C:\wsl\ubuntu-lab C:\wsl\ubuntu-base.tar # clona como nova distro 'ubuntu-lab'
wsl -d ubuntu-lab                                                # entra na cópia
wsl --unregister ubuntu-lab                                      # APAGA a cópia (irreversível)
```

A ideia: quebre à vontade na `ubuntu-lab`, apague e reimporte. Sua distro principal fica intacta.

> `[ATENÇÃO]` `wsl --unregister` apaga a distro **e todos os arquivos dentro dela, sem lixeira**. Confira o nome com `wsl -l -v` antes de rodar. Se importar a cópia, defina o usuário padrão com `wsl -d ubuntu-lab -u root` e `echo -e "[user]\ndefault=SEU_USUARIO" >> /etc/wsl.conf`.

## O que o WSL NÃO faz (e como a trilha contorna)

| Limitação | O que a trilha faz |
|---|---|
| Não há boot nem GRUB reais | Boot e recuperação são estudados na teoria, com simulações e, opcionalmente, uma VM (Multipass/VirtualBox) |
| Kernel é o da Microsoft; módulos limitados | Módulo 13 mostra `/proc`, `/sys` e o que é possível |
| Discos físicos extras só via `wsl --mount` | Partições, LVM e RAID são feitos com **arquivos de imagem em loop** (`losetup`) |
| Rede em NAT por padrão | Módulos de redes usam namespaces e uma segunda distro |

## Práticas

### Prática isolada

1. Instale o WSL2 + Ubuntu, atualize o sistema e habilite o systemd.
2. Crie `~/lab` e gere os dados com `gera-lab.sh`.
3. Tire o snapshot `ubuntu-base.tar` e crie a cópia `ubuntu-lab`.

### Desafio — quebre e recupere

Na `ubuntu-lab`, apague de propósito o arquivo `/etc/wsl.conf` e o `/etc/hosts` e reinicie a distro (`wsl --terminate ubuntu-lab`). Observe o que mudou (systemd voltou a ser desligado?). Recupere restaurando um desses arquivos à mão e **depois** reimportando a distro do snapshot para comparar os dois caminhos.

### Contribuição ao projeto de estudo

A cada módulo você deixará registros em `~/lab`. Inicie o repositório de estudo para versionar scripts e anotações:

```bash
cd ~/lab && git init && git config user.name "Seu Nome" && git config user.email "voce@exemplo.com"
printf 'dados/\n' > .gitignore && git add . && git commit -m "Laboratório inicial"
```

`[CUSTO]` Gratuito. O disco virtual do WSL cresce conforme o uso e **não encolhe sozinho**; acompanhe o tamanho em `C:\Users\<voce>\AppData\Local\...\ext4.vhdx`.

## Erros comuns nesta fase

- Trabalhar em `/mnt/c` e achar o Linux "lento".
- Esquecer o `wsl --shutdown` depois de editar `wsl.conf` ou `.wslconfig`.
- Instalar WSL 1 sem querer (confira `wsl -l -v`).
- Rodar `wsl --unregister` na distro principal.
- Não tirar o snapshot do ambiente limpo antes dos labs destrutivos.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| `sudo`, `apt`, `uname`, `/etc/os-release` | Módulos 01 e 07 |
| `~/lab`, `gera-lab.sh` | Todos os módulos práticos; `grep`/`awk` no 04 |
| systemd habilitado | Módulo 06 e 17 |
| Snapshots (`--export/--import`) | Labs destrutivos dos Módulos 08, 10 e 16 |
| Git inicial | Módulos 15 e 19 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Instalar o WSL*: https://learn.microsoft.com/windows/wsl/install
- Microsoft Learn — *Comandos básicos do WSL*: https://learn.microsoft.com/windows/wsl/basic-commands
- Microsoft Learn — *Definições de configuração do WSL (`wsl.conf`, `.wslconfig`)*: https://learn.microsoft.com/windows/wsl/wsl-config
- Microsoft Learn — *systemd no WSL*: https://learn.microsoft.com/windows/wsl/systemd
- Microsoft Learn — *Boas práticas de ambiente de desenvolvimento*: https://learn.microsoft.com/windows/wsl/setup/environment
- VS Code — *Desenvolvimento no WSL*: https://code.visualstudio.com/docs/remote/wsl
- Ubuntu — documentação oficial: https://ubuntu.com/server/docs

**Como aprofundar:** leia a seção "Comparing WSL 1 and WSL 2" na documentação da Microsoft e explore o Windows Terminal (perfis e atalhos), que você usará todos os dias.

## Checklist de saída

Você está pronto para o módulo 01 quando consegue, sem consultar:

- [ ] Explicar a diferença entre WSL 1 e WSL 2 e confirmar que está na versão 2.
- [ ] Abrir o Ubuntu, atualizar o sistema e usar `sudo`.
- [ ] Explicar por que trabalhar em `~` e não em `/mnt/c`.
- [ ] Ter habilitado o systemd e provado com `systemctl is-system-running`.
- [ ] Ter gerado os dados de `~/lab/dados`.
- [ ] Ter feito `wsl --export` e criado/apagado uma cópia com `--import`/`--unregister`.
- [ ] Listar o que o WSL não faz e como a trilha contorna cada caso.
