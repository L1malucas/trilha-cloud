---
id: index
title: Trilha Linux
sidebar_label: Visão geral
sidebar_position: -1
slug: /
---

**Certificações-alvo:** LPIC-1 (101/102) e CompTIA Linux+ (XK0-005), com base para RHCSA. Os módulos finais cobrem o roteiro de infraestrutura moderna (CKA, Terraform Associate, Network+/Security+).

Esta trilha é **prática**: tudo é feito num Linux de verdade, dentro do **WSL2** no Windows. A trilha fica aberta numa tela e o terminal na outra — você lê um passo e executa na hora. Cada módulo traz laboratórios numerados, desafios e referências oficiais; onde o WSL tem limitação (boot, GRUB, módulos de kernel), o módulo avisa com `[WSL]` e indica a alternativa.

Os espaços marcados com `[PRINT]` são capturas de tela que ainda serão adicionadas.

## Como estudar

1. Comece pelo **Módulo 00**: instalar o WSL, habilitar o systemd, gerar os dados de treino e tirar o snapshot da distro.
2. Em cada módulo, execute os comandos no terminal enquanto lê e faça os laboratórios antes dos desafios.
3. Faça os laboratórios destrutivos (discos, firewall, quebras) numa **distro descartável** criada a partir do snapshot.
4. Feche com o **checklist de saída** antes de avançar.

## Módulos

### Base (LPIC-1 / Linux+)

* [Módulo 00: Preparando o ambiente — WSL2 no Windows](./00_preparando_o_ambiente_wsl.md) — instalação, systemd, laboratório e snapshots
* [Módulo 01: Fundamentos e Distribuições](./01_fundamentos_e_distribuicoes.md) — kernel x userland, famílias, licenças, FHS
* [Módulo 02: Linha de Comando e Shell](./02_linha_de_comando_e_shell.md) — bash, navegação, redirecionamento, pipes, variáveis, aliases, `man`
* [Módulo 03: Arquivos e Diretórios](./03_arquivos_e_diretorios.md) — `cp`, `mv`, `find`, links, `tar`/`gzip`
* [Módulo 04: Processamento de Texto](./04_processamento_de_texto.md) — `grep`, `sed`, `awk`, regex, `vim`/`nano`
* [Módulo 05: Usuários, Grupos e Permissões](./05_usuarios_grupos_e_permissoes.md) — `useradd`, `sudo`, `chmod`, `umask`, SUID/SGID, ACLs
* [Módulo 06: Processos e Serviços](./06_processos_e_servicos.md) — `ps`, sinais, jobs, `tmux`, systemd, boot
* [Módulo 07: Instalação e Gerenciamento de Pacotes](./07_instalacao_e_gerenciamento_de_pacotes.md) — apt/dpkg, dnf/rpm, repositórios, compilação
* [Módulo 08: Armazenamento e Sistemas de Arquivos](./08_armazenamento_e_sistemas_de_arquivos.md) — partições, `mount`, `fstab`, LVM, RAID, swap
* [Módulo 09: Redes no Linux](./09_redes.md) — `ip`, DNS, `ss`, SSH, `rsync`, namespaces
* [Módulo 10: Firewall e Segurança](./10_firewall_e_seguranca.md) — nftables/ufw, SSH hardening, fail2ban, SELinux, GPG
* [Módulo 11: Shell Script e Automação](./11_shell_script_e_automacao.md) — scripts, funções, `cron`, `at`, systemd timers
* [Módulo 12: Logs e Monitoramento](./12_logs_e_monitoramento.md) — `journalctl`, rsyslog, logrotate, `vmstat`, `iostat`, `sar`
* [Módulo 13: Kernel, Hardware e Dispositivos](./13_kernel_hardware_e_dispositivos.md) — módulos, `/proc`, `/sys`, udev, `dmesg`
* [Módulo 14: Containers e Virtualização](./14_containers_e_virtualizacao.md) — namespaces, cgroups, KVM, primeiros passos com Docker
* [Módulo 15: Infraestrutura como Código e Git (introdução)](./15_infraestrutura_como_codigo_e_git.md) — IaC, Git básico
* [Módulo 16: Troubleshooting e Recuperação](./16_troubleshooting_e_recuperacao.md) — método, `fsck`, senha de root, caixa de quebras
* [Módulo 17: Servidores e Serviços](./17_servidores_e_servicos.md) — Nginx, TLS, DNS, NFS/Samba, PostgreSQL

### Infraestrutura moderna e DevOps

* [Módulo 18: Redes para Infra](./18_redes_para_infra.md) — OSI/TCP-IP, CIDR, DNS/DHCP, TLS, NAT, VPN, balanceadores
* [Módulo 19: Git e GitOps](./19_git_e_gitops.md) — objetos, rebase, PRs, estratégias, hooks, GitOps
* [Módulo 20: Docker e Podman](./20_docker_e_podman.md) — Dockerfile, multi-stage, volumes, Compose, segurança
* [Módulo 21: Terraform e Ansible](./21_terraform_e_ansible.md) — state, módulos, playbooks, roles, Vault
* [Módulo 22: CI/CD](./22_ci_cd.md) — GitHub Actions, estratégias de deploy, artefatos
* [Módulo 23: Kubernetes](./23_kubernetes.md) — Pods, Deployments, Services, Ingress, RBAC, troubleshooting (CKA)
* [Módulo 24: Observabilidade](./24_observabilidade.md) — Prometheus, Grafana, Loki, OpenTelemetry, SLOs
* [Módulo 25: Segurança (DevSecOps) e SRE](./25_seguranca_devsecops_e_sre.md) — Vault, Trivy, Kyverno, incidentes, postmortems
* [Módulo 26: Contexto de Infra — Windows Server, AD e Virtualização](./26_contexto_de_infra_windows_server_ad_e_virtualizacao.md) — AD, GPO, PowerShell, hipervisores
* [Módulo 27: Projeto final e preparação para certificação](./27_projeto_final_e_preparacao_para_certificacao.md) — TrilhaShop em Linux e plano de provas
