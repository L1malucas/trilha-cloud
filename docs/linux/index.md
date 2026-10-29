---
id: index
title: Trilha Linux
sidebar_label: Visão geral
sidebar_position: 0
slug: /
---

**Certificações-alvo:** LPIC-1 (101/102) e CompTIA Linux+ (XK0-005). A trilha também serve de base para RHCSA.

Trilha de estudo em módulos, na mesma ordem de aprendizado das demais trilhas do projeto.

## Módulos

* [Módulo 01: Fundamentos e Distribuições](./01_fundamentos_e_distribuicoes.md) — kernel x userland, famílias Debian/RHEL/SUSE, licenças, FHS, instalação
* [Módulo 02: Linha de Comando e Shell](./02_linha_de_comando_e_shell.md) — bash, navegação, redirecionamento, pipes, variáveis, aliases, `man`/`info`
* [Módulo 03: Arquivos e Diretórios](./03_arquivos_e_diretorios.md) — `ls`, `cp`, `mv`, `find`, `locate`, links simbólicos e físicos, compactação com `tar`/`gzip`
* [Módulo 04: Processamento de Texto](./04_processamento_de_texto.md) — `grep`, `sed`, `awk`, `cut`, `sort`, `uniq`, regex, `vi`/`vim`/`nano`
* [Módulo 05: Usuários, Grupos e Permissões](./05_usuarios_grupos_e_permissoes.md) — `useradd`, `passwd`, `sudo`, `chmod`, `chown`, umask, SUID/SGID/sticky bit, ACLs
* [Módulo 06: Processos e Serviços](./06_processos_e_servicos.md) — `ps`, `top`, `kill`, `nice`, jobs, systemd, `systemctl`, `journalctl`, targets, boot process e GRUB
* [Módulo 07: Instalação e Gerenciamento de Pacotes](./07_instalacao_e_gerenciamento_de_pacotes.md) — apt/dpkg, dnf/yum/rpm, zypper, repositórios, compilação do código-fonte
* [Módulo 08: Armazenamento e Sistemas de Arquivos](./08_armazenamento_e_sistemas_de_arquivos.md) — partições MBR/GPT, `fdisk`, ext4/xfs/btrfs, `mount`, `/etc/fstab`, LVM, RAID, quotas, swap
* [Módulo 09: Redes](./09_redes.md) — IPv4/IPv6, `ip`, NetworkManager, DNS, `ss`, `ping`, `traceroute`, `/etc/hosts`, `/etc/resolv.conf`, SSH, `scp`/`rsync`
* [Módulo 10: Firewall e Segurança](./10_firewall_e_seguranca.md) — iptables/nftables, firewalld, ufw, SELinux/AppArmor, hardening, SSH keys, fail2ban, GPG
* [Módulo 11: Shell Script e Automação](./11_shell_script_e_automacao.md) — variáveis, condicionais, loops, funções, `cron`, `at`, systemd timers
* [Módulo 12: Logs e Monitoramento](./12_logs_e_monitoramento.md) — `/var/log`, rsyslog, journald, logrotate, `vmstat`, `iostat`, `sar`, `lsof`
* [Módulo 13: Kernel, Hardware e Dispositivos](./13_kernel_hardware_e_dispositivos.md) — módulos, `lsmod`, `modprobe`, `/proc`, `/sys`, udev, `dmesg`
* [Módulo 14: Containers e Virtualização](./14_containers_e_virtualizacao.md) — Docker/Podman, namespaces e cgroups, KVM/libvirt, noções de Kubernetes
* [Módulo 15: Infraestrutura como Código e Git](./15_infraestrutura_como_codigo_e_git.md) — Ansible, Terraform, Git, CI/CD básico
* [Módulo 16: Troubleshooting e Recuperação](./16_troubleshooting_e_recuperacao.md) — rescue mode, recuperação de senha do root, fsck, falhas de boot, análise de logs e performance
* [Módulo 17: Servidores e Serviços](./17_servidores_e_servicos.md) — Apache/Nginx, DNS BIND, NFS/Samba, e-mail, banco de dados básico

## Cobertura do Linux Essentials (LINUXtips)

A trilha cobre os 7 blocos do curso [Linux Essentials da LINUXtips](https://linuxtips.io/treinamento/linux-essentials/):

| Bloco do curso | Módulos |
| --- | --- |
| Introdução ao Universo Linux | [01](./01_fundamentos_e_distribuicoes.md) |
| Primeiros Passos no Terminal | [02](./02_linha_de_comando_e_shell.md) |
| Comandos Essenciais do Linux | [03](./03_arquivos_e_diretorios.md), [04](./04_processamento_de_texto.md) |
| Produtividade na Linha de Comando | [02](./02_linha_de_comando_e_shell.md), [04](./04_processamento_de_texto.md) |
| Processos e Terminais | [06](./06_processos_e_servicos.md) |
| Discos e Partições | [08](./08_armazenamento_e_sistemas_de_arquivos.md) |
| Hardware e Dispositivos | [13](./13_kernel_hardware_e_dispositivos.md) |
