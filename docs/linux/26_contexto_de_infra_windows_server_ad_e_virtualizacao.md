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

### Desafios

- **Desafio 1:** explique, em uma página, como um funcionário do RH **é desligado** da empresa em um ambiente com AD + servidores Linux integrados por SSSD (o que muda, e onde).
- **Desafio 2:** compare AD DS e Entra ID em uma tabela (protocolos, estrutura, políticas, uso) e descreva o papel do Entra Connect.
- **Desafio 3:** monte um roteiro de **migração** de um servidor de arquivos Windows on-premises para a nuvem (inventário, rede, identidade, dados, corte, rollback).

## Erros comuns nesta fase

- Confundir AD DS (on-premises) com Entra ID (nuvem).
- Achar que **snapshot é backup**.
- Esquecer que o AD depende de **DNS** funcionando.
- Administrar tudo por interface gráfica, sem PowerShell (não repetível).
- Ignorar o relógio: Kerberos exige horário sincronizado (tolerância de ~5 min).

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
