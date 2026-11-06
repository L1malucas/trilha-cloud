---
id: "26_contexto_de_infra_windows_server_ad_e_virtualizacao"
title: "Módulo 26 — Contexto de Infra: Windows Server, AD e Virtualização"
sidebar_label: "26 · Windows Server, AD e Virtualização"
sidebar_position: 26
---

# Módulo 26 — Contexto de Infra: Windows Server, AD e Virtualização

> **Objetivo**: conhecer o que cerca o Linux num ambiente corporativo real — Windows Server, Active Directory, GPO, PowerShell, hipervisores (Hyper-V, VMware, KVM, Proxmox) e a integração Linux ↔ AD — para conversar com times de infra Windows e entender como on-premises se liga à nuvem.
>
> **Pré-requisitos**: módulos 05, 09, 14 e 17.
>
> **Tempo de referência (não prazo)**: uma a duas semanas. Módulo de **contexto**: o objetivo é alfabetização e prática leve, não substituir um curso de Windows Server.
>
> Prepara o terreno para **Entra ID** (Azure, Módulo 04), **AZ-104** e conversas de migração. Documentação: https://learn.microsoft.com/windows-server/

---

## Por que um módulo sobre Windows numa trilha Linux

Na maioria das empresas, infraestrutura é **heterogênea**: servidores Linux convivem com Windows Server, os usuários se autenticam em um **Active Directory**, e as máquinas rodam em hipervisores como VMware ou Hyper-V antes (ou em vez de) irem para a nuvem. Quem trabalha em infra precisa falar essas duas línguas. E como **você já usa Windows com WSL**, tem o laboratório pronto.

## Active Directory (AD DS)

O **Active Directory Domain Services** é o **serviço de diretório** da Microsoft: um banco centralizado de **identidades e recursos** (usuários, grupos, computadores) e o ponto único de **autenticação e autorização** da rede corporativa.

| Conceito | O que é |
|---|---|
| **Domínio** | Fronteira administrativa (`empresa.local`) |
| **Controlador de domínio (DC)** | Servidor que guarda o AD e autentica (replicado entre vários DCs) |
| **OU (Unidade Organizacional)** | "Pasta" para organizar objetos e aplicar políticas |
| **Floresta / árvore** | Conjunto de domínios |
| **Objetos** | Usuários, grupos, computadores, impressoras |
| **Kerberos / LDAP** | Protocolos de autenticação e consulta do diretório |
| **DNS** | **Indispensável**: o AD depende do DNS para localizar DCs |

> `[TEORIA]` **AD DS ≠ Entra ID** (o Módulo 04 do Azure alertou). O AD DS é *on-premises*, baseado em Kerberos/LDAP, com OUs e GPOs. O **Entra ID** é identidade **na nuvem** (OAuth/OIDC/SAML), sem OUs nem GPOs. Ambientes híbridos os sincronizam com o **Entra Connect**.

## GPO — Group Policy

**Group Policy Objects** aplicam **configurações em massa** a usuários e computadores de um domínio ou OU: política de senha, bloquear o painel de controle, mapear unidades de rede, instalar software, configurar o firewall. É a automação de configuração do mundo Windows corporativo — equivalente conceitual ao Ansible/Puppet no Linux.

Ordem de aplicação (**LSDOU**): *Local → Site → Domain → OU* (a mais próxima do objeto vence, salvo imposição). Diagnóstico: `gpresult /r` e `gpupdate /force` num cliente.

> `[TENTE VOCÊ]` Uma GPO no domínio bloqueia o painel de controle, e outra na OU "TI" libera. A pessoa da OU "TI" consegue abrir? Resposta: sim. Pela ordem LSDOU, a GPO da **OU** é aplicada por último e vence a do domínio, salvo se a do domínio estiver marcada como *Enforced*. Para conferir no cliente, `gpresult /r` lista as GPOs aplicadas e as negadas, em ordem.

> `[ATENÇÃO]` Uma GPO só vale para objetos **dentro** da OU em que está vinculada. Criar a GPO e não vinculá-la (ou colocar o computador numa OU diferente do usuário) é o erro nº 1 de "a política não pegou". Lembre: política de **computador** segue o objeto computador; política de **usuário** segue o objeto usuário.

## PowerShell: o shell orientado a objetos

Enquanto o bash passa **texto** por pipes, o **PowerShell** passa **objetos** (com propriedades e métodos), e seus comandos seguem o padrão **Verbo-Substantivo** (`Get-Process`, `Stop-Service`). É multiplataforma (**`pwsh`** roda no Linux) e é a base do `Az` (Azure) e da automação do Windows Server.

```powershell
# No Windows (PowerShell) ou no WSL após instalar o pwsh
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, CPU
Get-Service | Where-Object Status -eq Running | Measure-Object
Get-ChildItem C:\Windows -File | Where-Object Length -gt 1MB | Select Name, Length
Get-Help Get-Process -Examples
Get-Command -Verb Get -Noun *Service*
```

Comparação direta com o que você já sabe:

| Tarefa | Bash | PowerShell |
|---|---|---|
| Listar processos | `ps aux` | `Get-Process` |
| Filtrar linhas | `grep` | `Where-Object` / `Select-String` |
| Ordenar | `sort` | `Sort-Object` |
| Serviços | `systemctl status` | `Get-Service` |
| Variáveis | `$VAR` | `$Var` |
| Ajuda | `man ls` | `Get-Help Get-ChildItem` |

Instalar `pwsh` no Ubuntu (WSL): siga https://learn.microsoft.com/powershell/scripting/install/install-ubuntu e rode `pwsh`.

> `[TENTE VOCÊ]` Sem instalar nada no WSL, dá para testar um comando PowerShell? Resposta: sim, por container: `docker run --rm mcr.microsoft.com/powershell pwsh -NoProfile -Command 'Get-Date; $PSVersionTable.PSVersion'`. Útil para experimentar a sintaxe e o pipeline de objetos em qualquer máquina com Docker.

> `[TENTE VOCÊ]` Como ver que o PowerShell passa objetos e não texto? Resposta: `Get-Process | Get-Member` lista as propriedades e métodos de cada objeto (`CPU`, `Id`, `Kill()`...). No bash o `ps` só devolve linhas de texto, que você precisa fatiar com `awk`; aqui você pede a propriedade pelo nome (`Sort-Object CPU`).

> `[TENTE VOCÊ]` Mostre os 3 serviços em execução com o nome mais longo. Resposta: `Get-Service | Where Status -eq Running | Sort-Object {$_.Name.Length} -Descending | Select -First 3 Name`.

## Windows Server: o essencial

Funções (*roles*) mais comuns: **AD DS**, **DNS**, **DHCP**, **File Server** (SMB), **IIS** (web), **Hyper-V**, **WSUS** (atualizações). Administra-se por **Server Manager**, **Windows Admin Center** ou **PowerShell** (preferível: scriptável e repetível). Edições: **Standard** e **Datacenter** (diferem em direitos de virtualização). Mesmo princípio de sempre: **menor privilégio**, **patching** regular e **backup testado**.

```powershell
Install-WindowsFeature -Name Web-Server -IncludeManagementTools    # instala o IIS
Get-WindowsFeature | Where Installed
Get-NetIPAddress; Get-NetFirewallRule | Select -First 5 DisplayName,Enabled
```

(Se você tiver uma máquina/VM Windows Server de teste — a edição de avaliação é gratuita por 180 dias — pratique ali; caso contrário, o conhecimento conceitual é o objetivo.)

## Integração Linux ↔ AD

Servidores Linux podem **ingressar no domínio** e deixar usuários do AD fazerem login (SSH) e usarem recursos, centralizando a identidade:

- **SSSD** (*System Security Services Daemon*) + **realmd** ingressam o host no AD e cacheiam credenciais.
- **Kerberos** (`kinit`, `klist`) para autenticação por tíquetes; **LDAP** para consulta.
- **Samba** pode atuar como cliente (ou até como DC compatível com AD).

```bash
# Conceito (requer um domínio AD acessível):
sudo apt install -y realmd sssd sssd-tools adcli krb5-user
realm discover empresa.local
sudo realm join -U administrador empresa.local
id usuario@empresa.local
```

Vantagem: **um único lugar** para criar, desativar e auditar contas — vital para offboarding e conformidade.

## Virtualização: onde tudo isso roda

| Plataforma | Tipo | Característica |
|---|---|---|
| **VMware vSphere/ESXi** | Tipo 1 | Líder histórico corporativo; vCenter para gerenciar |
| **Microsoft Hyper-V** | Tipo 1 | Incluído no Windows Server/Windows Pro; integrado ao AD |
| **KVM/libvirt** | Tipo 1 (no kernel) | Padrão no Linux e base de muitas nuvens |
| **Proxmox VE** | Plataforma sobre KVM + LXC | Open source, interface web, HA, backup |
| **VirtualBox / VMware Workstation** | Tipo 2 | Desktop e estudo |

Conceitos que aparecem em entrevista/prova: **hipervisor** tipo 1 x 2, **snapshot** (e por que não é backup), **vMotion/Live Migration** (mover VM em execução entre hosts), **HA** (reiniciar VMs de um host que caiu), **thin x thick provisioning**, **overcommit** de CPU/memória, **P2V** (converter físico em virtual), **template/clone**.

### Praticando com Multipass (VMs Linux leves)

```powershell
# No Windows: instale o Multipass (https://multipass.run) e use no PowerShell
multipass launch --name vm1 --cpus 2 --memory 2G --disk 10G 24.04
multipass list
multipass shell vm1
multipass snapshot vm1 --name limpo
multipass delete vm1 --purge
```

Útil para o que o WSL não cobre: **boot, GRUB e `rescue.target`** (Módulo 16), `kvm` real e `/etc/fstab` de verdade.

> `[TENTE VOCÊ]` Seu Linux está dentro de uma VM, de um container ou direto no hardware? Resposta: `systemd-detect-virt` imprime o tipo (`wsl`, `kvm`, `microsoft`, `docker`...) ou `none` em máquina física. É o primeiro comando para saber "em cima do quê" você está rodando antes de investigar desempenho.

> `[ATENÇÃO]` Snapshot **não é backup**: ele depende do disco original (guarda só a diferença). Se o disco ou o datastore falhar, o snapshot vai junto. Além disso, snapshots antigos degradam o desempenho da VM. Use-os para voltar de uma mudança arriscada em minutos, e backup (em outro lugar) para desastre.

## Hardware e armazenamento (para a conversa de infra)

CPU/RAM/disco/NIC, **RAID** (Módulo 08) em **controladoras** físicas (hardware) x software, **SAN** (rede de armazenamento em blocos, iSCSI/FC) x **NAS** (arquivos, NFS/SMB), **IPMI/iDRAC/iLO** (gerência remota fora de banda), **fontes/UPS redundantes**. Mesmo migrando para a nuvem, esses termos aparecem em levantamentos e **migrações** (Azure Migrate, GCP Migrate to Virtual Machines).

## Ponte para a nuvem

| Mundo on-premises | Equivalente em nuvem |
|---|---|
| AD DS | **Microsoft Entra ID** (+ Entra DS gerenciado) |
| GPO | Azure Policy / Intune; Ansible/Terraform |
| Hyper-V / VMware / KVM | VMs do Azure (que roda sobre Hyper-V) / Compute Engine (KVM) |
| SAN/NAS | Managed Disks / Storage Accounts / Filestore |
| DNS/DHCP do Windows | Azure DNS / Cloud DNS |
| IPMI | Console serial, Run Command |

![Saída do PowerShell com `Get-Process | Sort-Object CPU -Descending | Select-Object -First 5`](screenshots/26-contexto-de-infra-windows-server-ad-e-virtualizacao/01-powershell-get-process.png)
> `[PRINT]` Passo a passo para capturar: no PowerShell (Windows ou `pwsh` no WSL), rodar o primeiro comando do bloco de PowerShell. Capturar a saída.

## Laboratórios

### Lab 1 — PowerShell
Resolva em PowerShell as mesmas 5 tarefas que você já fez em bash (listar processos pesados, serviços ativos, arquivos grandes, contar linhas, filtrar texto) e escreva a tabela de equivalências.

### Lab 2 — `pwsh` no WSL
Instale `pwsh` no Ubuntu e rode um script que lista os 5 maiores arquivos de `~/lab` usando objetos.

### Lab 3 — VM com Multipass
Crie uma VM, tire um snapshot, quebre algo, restaure o snapshot e destrua.

### Lab 4 — AD conceitual
Desenhe (papel ou diagrama) um domínio `empresa.local` com 2 DCs, OUs por departamento e 3 GPOs (senha, bloqueio de USB, mapeamento de pasta), indicando onde cada política é aplicada.

### Lab 5 — PowerShell em container: relatório dos usuários do laboratório
Cenário: o RH mandou o `usuarios.csv` e você precisa de um resumo por departamento, mais os comandos que criariam as contas no AD (sem executar nada).

```bash
docker run --rm -v ~/lab/dados:/dados:ro mcr.microsoft.com/powershell pwsh -NoProfile -Command '
$u = Import-Csv /dados/usuarios.csv
$u | Group-Object dept | Sort-Object Count -Descending | Select-Object Name, Count
$u | Where-Object { [int]$_.salario -gt 8000 } | Select-Object nome, dept, salario
foreach ($x in $u) { "New-ADUser -Name {0} -SamAccountName {0} -Department {1} -Path ''OU={1},DC=empresa,DC=local''" -f $x.nome, $x.dept }
'
```

Compare com o que você faria em bash (`cut`, `sort`, `uniq -c`, módulo 04): a lógica é a mesma, mas aqui cada coluna do CSV já é uma **propriedade** do objeto. As linhas `New-ADUser` só são impressas, e é isso que se revisa antes de rodar em um DC real.

### Lab 6 — LDAP de verdade em container (a "língua" do diretório)
Cenário: entender o que o Linux pergunta ao AD, usando um OpenLDAP local como diretório de treino.

```bash
docker run -d --name ldap -e LDAP_ADMIN_PASSWORD=lab-troque -p 127.0.0.1:3389:389 osixia/openldap:1.5.0
sleep 8
cat > /tmp/ou.ldif <<'EOF'
dn: ou=ti,dc=example,dc=org
objectClass: organizationalUnit
ou: ti

dn: uid=ana,ou=ti,dc=example,dc=org
objectClass: inetOrgPerson
cn: Ana
sn: Silva
uid: ana
EOF
docker cp /tmp/ou.ldif ldap:/tmp/ou.ldif
docker exec ldap ldapadd -x -D "cn=admin,dc=example,dc=org" -w lab-troque -f /tmp/ou.ldif
docker exec ldap ldapsearch -x -b "dc=example,dc=org" -D "cn=admin,dc=example,dc=org" -w lab-troque "(uid=ana)" dn cn
docker rm -f ldap
```

O `dn` (Distinguished Name) é o caminho do objeto na árvore: `uid=ana,ou=ti,dc=example,dc=org`, o mesmo raciocínio das OUs do AD. O filtro `(uid=ana)` é o que o SSSD envia quando alguém tenta logar.

### Lab 7 — Relógio e Kerberos: por que o horário importa
Cenário: o login no domínio "do nada" para de funcionar. A primeira suspeita é o horário.

```bash
date -u; timedatectl | grep -iE 'System clock synchronized|Time zone'
docker run --rm alpine date -u                      # horário "visto" pelo container
# simule uma diferença de 10 minutos e meça
python3 - <<'PYX'
import datetime
agora = datetime.datetime.now(datetime.timezone.utc)
cliente = agora + datetime.timedelta(minutes=10)
dif = abs((cliente - agora).total_seconds()) / 60
print(f"diferença: {dif:.0f} min ->", "Kerberos REJEITA (limite ~5 min)" if dif > 5 else "ok")
PYX
```

> `[WSL]` Após suspender/hibernar o Windows, o relógio do WSL pode ficar atrasado. Corrija com `sudo hwclock -s` (se disponível) ou reiniciando a distro (`wsl --shutdown` no PowerShell do Windows).

### Desafios

- **Desafio 1:** explique, em uma página, como um funcionário do RH **é desligado** da empresa em um ambiente com AD + servidores Linux integrados por SSSD (o que muda, e onde).
- **Desafio 2:** compare AD DS e Entra ID em uma tabela (protocolos, estrutura, políticas, uso) e descreva o papel do Entra Connect.
- **Desafio 3:** monte um roteiro de **migração** de um servidor de arquivos Windows on-premises para a nuvem (inventário, rede, identidade, dados, corte, rollback).
- **Desafio 4:** com PowerShell em container, gere a partir do `usuarios.csv` um arquivo `grupos.csv` com uma linha por departamento e a lista de membros separada por `;`.

  **Verifique:** `docker run --rm -v ~/lab/dados:/dados mcr.microsoft.com/powershell pwsh -NoProfile -Command 'Import-Csv /dados/grupos.csv | Measure-Object | Select-Object -ExpandProperty Count'` imprime um número entre `1` e `4` (os departamentos distintos), e `head -2 ~/lab/dados/grupos.csv` mostra o cabeçalho e a primeira linha.

- **Desafio 5:** no OpenLDAP do Lab 6, adicione três usuários em duas OUs (`ti` e `vendas`) e liste só os usuários de `vendas`.

  **Verifique:** `docker exec ldap ldapsearch -x -b "ou=vendas,dc=example,dc=org" -D "cn=admin,dc=example,dc=org" -w lab-troque "(objectClass=inetOrgPerson)" dn | grep -c '^dn:'` imprime a quantidade de usuários que você colocou em `vendas`.

- **Desafio 6:** escreva um script `diagnostico-identidade.sh` que checa, em ordem, os pontos clássicos de falha de login por domínio (DNS resolve o domínio, porta 389/88 alcançável, horário sincronizado) e sai com `1` na primeira falha, apontando qual foi.

  **Verifique:** `./diagnostico-identidade.sh localhost 3389; echo $?` (com o LDAP do Lab 6 rodando) imprime `OK` para a checagem de porta e termina com `0`; apontando para uma porta fechada (`./diagnostico-identidade.sh localhost 9`), imprime a falha e termina com `1`.

### Desafio avançado — Provisionamento em lote e offboarding auditável no diretório
**Nível:** avançado — leva de 1 a 3 horas
- **Cenário:** o RH manda toda segunda-feira o `usuarios.csv` e a TI cria as contas na mão, com erros de departamento e UID duplicado. Ao mesmo tempo, a auditoria pediu evidência de que, quando alguém é desligado, a conta some **e** some de todos os grupos, com cópia do que foi removido guardada para consulta. Usando o OpenLDAP do Lab 6 como substituto do AD, automatize o ciclo completo de entrada e saída, no estilo que um servidor Linux integrado por SSSD esperaria enxergar.
- **Requisitos:**
  1. `provisiona.sh <csv>` cria uma OU por departamento do CSV e uma conta por linha dentro da OU do departamento, com atributos POSIX (`uidNumber` derivado do `id` do CSV a partir de 10000, `gidNumber`, `homeDirectory` e `loginShell`) e `mail` vindo do CSV.
  2. Cada departamento tem um grupo com todos os seus membros.
  3. O script é idempotente: uma segunda execução com o mesmo CSV não dá erro, não duplica nada e imprime quantas contas foram criadas (`0`) e quantas já existiam.
  4. `desliga.sh <uid>` salva a entrada da conta (e a lista de grupos a que pertencia) em `auditoria/<uid>-<data>.ldif` **antes** de apagar, remove a conta e deixa nenhum grupo referenciando-a, mesmo se ela for o único membro do grupo.
  5. Se o `uid` não existir, `desliga.sh` não altera nada e sai com código `3`.
  6. `relatorio.sh` imprime o número de contas por departamento, ordenado do maior para o menor.
- **Restrições:** a senha do administrador do LDAP não pode aparecer na lista de processos (`ps`) nem ser escrita em nenhum arquivo versionável; só podem ser usadas as ferramentas `ldap*` que já existem na imagem do container e utilitários do shell (módulos 04 e 11), sem instalar nada.
- **Onde pesquisar:** `man ldapadd` (opção `-c`), `man ldapsearch` (`-LLL`, `-y`), `man ldapdelete`, `man ldapmodify` (`changetype: modify`), objectClass `posixAccount` e `groupOfNames` (RFC 2307 e o atributo obrigatório `member`).
- **Verifique:**
  - Depois de `./provisiona.sh ~/lab/dados/usuarios.csv`: `./relatorio.sh` soma 8 contas no total e bate com `cut -d, -f4 ~/lab/dados/usuarios.csv | tail -n +2 | sort | uniq -c | sort -rn`.
  - Rodar de novo imprime `criadas=0` (ou equivalente) e termina com `0`; o relatório não muda.
  - `docker exec ldap ldapsearch -x -LLL -D "cn=admin,dc=example,dc=org" -y <arquivo-de-senha> -b "dc=example,dc=org" "(uidNumber=10001)" dn | grep -c '^dn:'` imprime `1`.
  - `./desliga.sh ana` termina com `0`; existe `auditoria/ana-*.ldif` contendo `dn: uid=ana`; a busca `(uid=ana)` devolve 0 entradas e `(member=uid=ana,*)` não devolve nenhum grupo.
  - Borda: `./desliga.sh ninguem; echo $?` imprime `3` e o relatório continua igual; `ps -eo args | grep -c '[l]ab-troque'` imprime `0` durante a execução de `provisiona.sh` (rode num segundo terminal, em loop).

## Erros comuns nesta fase

- Confundir AD DS (on-premises) com Entra ID (nuvem).
- Achar que **snapshot é backup**.
- Esquecer que o AD depende de **DNS** funcionando.
- Administrar tudo por interface gráfica, sem PowerShell (não repetível).
- Ignorar o relógio: Kerberos exige horário sincronizado (tolerância de ~5 min).
- Criar a GPO e esquecer de vinculá-la à OU certa (ou colocar o computador em outra OU).
- Dar `Domain Admins` a contas do dia a dia em vez de uma conta administrativa separada (menor privilégio).
- Manter snapshots antigos de VM "por segurança": degradam o desempenho e dão falsa sensação de backup.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 05 (usuários, grupos, permissões) | `id usuario@dominio` e grupos vindos do AD; UID/GID mapeados pelo SSSD |
| Módulo 09 e 18 (redes, DNS) | AD depende de DNS (registros SRV); `dig -t SRV _ldap._tcp.empresa.local` |
| Módulo 14 (virtualização, containers) | Hipervisor tipo 1/2 x container; `systemd-detect-virt` |
| Módulo 17 (servidores) | Samba/NFS/SMB, DNS e DHCP existem no Windows Server também |
| Módulo 21 (Ansible) | GPO é o equivalente corporativo do playbook (política em massa) |

### Lab integrador — Descoberta de serviços de domínio e consulta ao diretório
Reuse DNS (18), contêineres (20) e o resultado do Lab 6 para ver, na prática, como um cliente Linux "acha" um domínio.

```bash
# 1) Como o cliente descobre servidores de um serviço: registros SRV
dig +short -t SRV _xmpp-server._tcp.gmail.com | head -3              # SRV de exemplo que costuma responder
# 2) Suba o LDAP de treino e consulte tudo, como o SSSD faria
docker run -d --name ldap -e LDAP_ADMIN_PASSWORD=lab-troque osixia/openldap:1.5.0 >/dev/null; sleep 8
docker exec ldap ldapsearch -x -H ldap://localhost -b "dc=example,dc=org" -D "cn=admin,dc=example,dc=org" -w lab-troque "(objectClass=*)" dn | grep -c '^dn:'
# 3) Consulta pontual, como uma checagem de existência da conta
docker exec ldap ldapsearch -x -H ldap://localhost -b "dc=example,dc=org" -D "cn=admin,dc=example,dc=org" -w lab-troque "(cn=admin)" dn | grep '^dn:'
docker rm -f ldap
```

> `[WSL]` Se `dig` não existir: `sudo apt install -y dnsutils`.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Entra ID, identidade híbrida | Azure, Módulo 04 |
| Hipervisores e VMs | VMs no Azure (Módulo 08) e no GCP (Módulo 08) |
| PowerShell | Azure PowerShell — Módulo 13 (Azure) |
| GPO/automação de config | Ansible — Módulo 21 |

## `[REFERÊNCIA]`

- Microsoft Learn — *Windows Server*: https://learn.microsoft.com/windows-server/
- Microsoft Learn — *Active Directory Domain Services*: https://learn.microsoft.com/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview
- Microsoft Learn — *Group Policy*: https://learn.microsoft.com/windows-server/identity/ad-ds/manage/group-policy/group-policy-overview
- Microsoft Learn — *PowerShell*: https://learn.microsoft.com/powershell/
- Microsoft — *Hyper-V*: https://learn.microsoft.com/virtualization/hyper-v-on-windows/
- Proxmox VE: https://pve.proxmox.com/wiki/Main_Page · KVM: https://linux-kvm.org/
- Red Hat — *Integrating with AD (SSSD/realmd)*: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/integrating_rhel_systems_directly_with_windows_active_directory/
- Multipass: https://multipass.run/docs
- Windows Server (avaliação gratuita): https://www.microsoft.com/evalcenter/

**Como aprofundar:** o curso gratuito "Windows Server Hybrid Administrator" (AZ-800/801) no Microsoft Learn e o laboratório de AD com Windows Server de avaliação.

## Checklist de saída

- [ ] Explicar domínio, DC, OU, GPO e a dependência do AD em DNS e Kerberos.
- [ ] Diferenciar AD DS de Entra ID e dizer o que o Entra Connect faz.
- [ ] Usar PowerShell (Verbo-Substantivo, pipeline de objetos) e comparar com o bash.
- [ ] Explicar como um servidor Linux se integra ao AD (SSSD/realmd/Kerberos).
- [ ] Diferenciar hipervisor tipo 1 e 2 e citar VMware, Hyper-V, KVM e Proxmox.
- [ ] Explicar snapshot x backup, HA, live migration e overcommit.
- [ ] Mapear componentes on-premises para os equivalentes em nuvem.
