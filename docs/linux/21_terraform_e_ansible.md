---
id: "21_terraform_e_ansible"
title: "Módulo 21 — Terraform e Ansible"
sidebar_label: "21 · Terraform e Ansible"
sidebar_position: 21
---

# Módulo 21 — Terraform e Ansible

> **Objetivo**: provisionar e configurar infraestrutura por código — **Terraform** (cria recursos: redes, VMs, containers) e **Ansible** (configura máquinas: pacotes, arquivos, serviços) — entender a diferença entre eles e usar os dois juntos, tudo praticável no WSL sem gastar com nuvem.
>
> **Pré-requisitos**: módulos 11, 15, 19 e 20.
>
> **Tempo de referência (não prazo)**: duas a três semanas.
>
> Prepara a certificação **HashiCorp Terraform Associate**. Documentação: https://developer.hashicorp.com/terraform/docs · https://docs.ansible.com/

---

## Dois problemas diferentes

IaC resolve dois problemas, e cada ferramenta é melhor em um:

| | **Terraform** | **Ansible** |
|---|---|---|
| Foco | **Provisionar** infraestrutura (criar a VM, a rede, o banco gerenciado) | **Configurar** o que roda dentro (instalar nginx, ajustar arquivos, usuários) |
| Estilo | Declarativo, com **estado** (*state*) | Declarativo/procedural em **playbooks YAML**, sem estado persistente |
| Como conecta | Chama **APIs** (providers: AWS, Azure, GCP, Docker...) | **SSH** (sem agente) na máquina |
| Quando | "Quero 3 VMs e 1 VNet" | "Todas devem ter nginx e este usuário" |

Analogia: Terraform constrói o **prédio** (estrutura, hidráulica); Ansible faz a **mobília e a decoração** de cada apartamento. Na prática, usa-se juntos: Terraform cria as máquinas e entrega os IPs; Ansible as configura.

---

# Parte 1 — Terraform

## Como funciona

Você escreve arquivos `.tf` (linguagem **HCL**) descrevendo o **estado desejado**. O Terraform compara com o **state** (o que ele sabe que existe) e com a realidade, e calcula o **plano** de mudanças.

Ciclo: `init` → `plan` → `apply` → (`destroy`).

```bash
# Instalação (Ubuntu) — siga o guia atual em https://developer.hashicorp.com/terraform/install
sudo apt install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install -y terraform
terraform version
```

(OpenTofu, o fork open source, usa os mesmos conceitos e comandos `tofu`.)

## Primeiro projeto sem custo (provider `local` e `docker`)

Para aprender sem nuvem, usamos providers locais:

```bash
mkdir -p ~/lab/tf-basico && cd ~/lab/tf-basico
cat > main.tf <<'EOF'
terraform {
  required_providers {
    local = { source = "hashicorp/local", version = "~> 2.5" }
  }
}

variable "nome" {
  type    = string
  default = "Mundo"
}

resource "local_file" "saudacao" {
  filename = "${path.module}/saida/ola.txt"
  content  = "Olá, ${var.nome}!\n"
}

output "caminho" {
  value = local_file.saudacao.filename
}
EOF

terraform init              # baixa providers
terraform fmt && terraform validate
terraform plan              # + local_file.saudacao will be created
terraform apply             # digite 'yes' (ou -auto-approve em labs)
cat saida/ola.txt
terraform plan              # "No changes": idempotência
terraform apply -var nome=Lucas
terraform state list        # o que o Terraform gerencia
terraform destroy
```

Leia o `plan`: `+` criar, `~` alterar, `-` apagar, `-/+` **recriar** (substituir). **Sempre leia o plano** antes de aplicar, principalmente os `-` e `-/+`.

## Blocos essenciais

| Bloco | Função |
|---|---|
| `terraform { required_providers }` | Quais providers (e versões) usar |
| `provider "x" {}` | Configuração do provider (região, credenciais) |
| `resource "tipo" "nome" {}` | Cria/gerencia um recurso |
| `data "tipo" "nome" {}` | **Lê** algo que já existe (não cria) |
| `variable` | Entradas parametrizáveis |
| `locals` | Valores calculados internos |
| `output` | Valores exibidos/exportados |
| `module` | Reutiliza um conjunto de recursos |

```hcl
variable "portas" {
  type    = list(number)
  default = [80, 443]
}

locals {
  tags = { projeto = "trilhashop", ambiente = terraform.workspace }
}

resource "local_file" "regras" {
  for_each = toset([for p in var.portas : tostring(p)])
  filename = "${path.module}/saida/porta-${each.key}.txt"
  content  = "porta ${each.key} liberada\n"
}
```

`for_each` e `count` criam **múltiplas** instâncias a partir de uma lista/mapa. Dependências são **implícitas** (ao referenciar `recurso.atributo`) ou explícitas (`depends_on`).

## Infraestrutura real com o provider Docker

```hcl
terraform {
  required_providers {
    docker = { source = "kreuzwerker/docker", version = "~> 3.0" }
  }
}
provider "docker" {}

resource "docker_image" "nginx" {
  name         = "nginx:1.27"
  keep_locally = true
}

resource "docker_container" "web" {
  name  = "web-tf"
  image = docker_image.nginx.image_id
  ports {
    internal = 80
    external = 8085
  }
}
```

`terraform apply` → `curl localhost:8085`. Alterou a porta no arquivo? O `plan` mostra a **recriação** do container — é o comportamento declarativo.

## State: a memória do Terraform

O **state** (`terraform.tfstate`) mapeia seus recursos do código ao mundo real, e inclui **dados sensíveis**. Regras de ouro:

> `[ATENÇÃO]` **Nunca** versione o `*.tfstate` nem `.terraform/` (coloque no `.gitignore`). Em equipe, use **backend remoto com bloqueio** (S3+DynamoDB, Azure Storage, GCS, Terraform Cloud) para que duas pessoas não apliquem ao mesmo tempo e o state não se perca.

```bash
terraform state list
terraform state show local_file.saudacao
terraform import ...             # traz um recurso existente para o state
terraform plan -refresh-only     # detecta drift (mudanças feitas fora do Terraform)
```

**Workspaces** (`terraform workspace new prod`) separam states para ambientes; **módulos** empacotam padrões reutilizáveis (`module "rede" { source = "./modulos/rede" ... }`).

## Na nuvem (visão)

Com `provider "azurerm"` (Azure, veja o Módulo 14 da trilha Azure) ou `provider "google"` (GCP), os mesmos comandos criam VNets, VMs e bancos reais. Autenticação por `az login`/`gcloud auth application-default login` ou *service principal*/variáveis de ambiente — **nunca** credenciais no código. Os recursos de nuvem custam dinheiro: sempre `terraform destroy` ao fim do laboratório.

---

# Parte 2 — Ansible

## Como funciona

O Ansible roda **no seu computador** (o *control node*), conecta por **SSH** nas máquinas-alvo (*managed nodes*) e executa **tarefas** descritas em YAML. Não precisa instalar agente nos alvos.

```bash
sudo apt install -y ansible          # ou: pipx install ansible-core
ansible --version
```

### Inventário: quais máquinas

```bash
mkdir -p ~/lab/ansible && cd ~/lab/ansible
cat > inventario.ini <<'EOF'
[web]
localhost ansible_connection=local

[todos:children]
web
EOF
ansible all -i inventario.ini -m ping              # teste de conectividade
ansible web -i inventario.ini -m command -a "uptime"
ansible web -i inventario.ini -b -m apt -a "name=htop state=present"   # -b = become (sudo)
```

Para máquinas remotas: `servidor1 ansible_host=10.0.0.10 ansible_user=deploy ansible_ssh_private_key_file=~/.ssh/id_ed25519`. Para treinar com "várias máquinas" no WSL, use **containers com sshd** ou uma segunda distro WSL.

### Playbook: a receita em YAML

```yaml
# site.yml
- name: Configurar servidor web
  hosts: web
  become: true
  vars:
    pagina_titulo: "TrilhaShop"
  tasks:
    - name: Instalar nginx
      ansible.builtin.apt:
        name: nginx
        state: present
        update_cache: true

    - name: Publicar página
      ansible.builtin.template:
        src: index.html.j2
        dest: /var/www/html/index.html
        mode: "0644"
      notify: Recarregar nginx

    - name: Garantir nginx habilitado e ativo
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true

  handlers:
    - name: Recarregar nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded
```

```bash
echo '<h1>{{ pagina_titulo }} — {{ ansible_hostname }}</h1>' > index.html.j2
ansible-playbook -i inventario.ini site.yml --check --diff     # SIMULA e mostra a diferença
ansible-playbook -i inventario.ini site.yml                    # aplica
ansible-playbook -i inventario.ini site.yml                    # 2ª vez: changed=0 (idempotência)
```

Conceitos-chave:

- **Módulos** (`apt`, `service`, `template`, `copy`, `user`, `lineinfile`): unidades de trabalho **idempotentes**. Prefira-os a `shell`/`command`.
- **`state: present/absent/started`**: você descreve o estado, não o comando.
- **Handlers**: rodam só se algo mudou (`notify`) — recarregar nginx apenas quando o arquivo mudou.
- **Templates Jinja2**: arquivos com variáveis (`{{ var }}`).
- **Variáveis e facts**: `ansible_hostname`, `ansible_distribution` (coletados automaticamente).

> `[TEORIA]` Idempotência é o coração do Ansible: o resultado `changed=0` na segunda execução prova que a máquina **já está** no estado desejado. Se uma tarefa mostra `changed` sempre, provavelmente usa `shell`/`command` sem `creates:`/`changed_when:`.

### Roles: organização e reuso

Uma **role** agrupa tarefas, templates, variáveis e handlers numa estrutura padrão:

```bash
ansible-galaxy init roles/nginx
# roles/nginx/{tasks,handlers,templates,defaults,vars,files,meta}/
```

```yaml
# site.yml com role
- hosts: web
  become: true
  roles:
    - nginx
```

### Segredos: Ansible Vault

```bash
ansible-vault create group_vars/all/segredos.yml        # cria arquivo criptografado
ansible-vault edit group_vars/all/segredos.yml
ansible-playbook site.yml --ask-vault-pass
```

> `[ATENÇÃO]` Nunca deixe senhas em texto no playbook ou no repositório. Use Vault (ou um cofre externo, Módulo 25). E lembre: `become: true` sem necessidade viola o menor privilégio.

## Juntando os dois

Fluxo típico: **Terraform cria** (VMs/containers) e exporta IPs via `output`; um script/*template* gera o **inventário** do Ansible; o **Ansible configura**. Em ambientes simples, o provisionador do Terraform pode chamar `ansible-playbook`, mas o recomendado é **etapas separadas** (pipeline do Módulo 22).

![Saída do ansible-playbook na segunda execução, com "ok" e changed=0, provando idempotência](screenshots/21-terraform-e-ansible/01-ansible-idempotencia-changed0.png)
> `[PRINT]` Passo a passo para capturar: rodar o `ansible-playbook` duas vezes. Capturar o PLAY RECAP da segunda execução com `changed=0`.

## Laboratórios

### Lab 1 — Terraform básico
Projeto `local_file` com variável, output, `for_each`; `plan`/`apply`/`destroy`, edição e novo `plan` para observar o diff.

### Lab 2 — Terraform com Docker
Suba o nginx por Terraform, altere a porta externa e leia o `plan` (recriação).

### Lab 3 — Ansible no localhost
Playbook que instala nginx, publica uma página por template e usa handler; rode com `--check --diff`, depois aplique duas vezes.

### Lab 4 — Role e inventário com 2 hosts
Crie **dois containers com sshd** (ou duas distros WSL), configure o inventário e aplique a role `nginx` em ambos.

### Lab 5 — Os dois juntos
Terraform sobe 2 containers com SSH; um script gera o inventário a partir de `terraform output -json`; Ansible os configura.

### Desafios

- **Desafio 1:** módulo Terraform reutilizável `modulos/app` (container + volume + rede) chamado duas vezes (dev e prod) com variáveis diferentes.
- **Desafio 2:** role Ansible `hardening` que aplica o SSH endurecido do Módulo 10 (idempotente, com handler de reload) e prove com `--check`.
- **Desafio 3:** detecte *drift*: altere manualmente o container criado pelo Terraform (`docker exec`/`stop`) e mostre o `terraform plan` detectando a diferença.

**Limpeza:** `terraform destroy` em cada projeto; `docker rm -f` dos containers de teste.

## Erros comuns nesta fase

- Versionar `terraform.tfstate`/`.terraform/` ou segredos.
- Aplicar sem ler o `plan` (especialmente `-/+` e `-`).
- Editar na mão o que o Terraform gerencia (drift).
- Usar `shell`/`command` no Ansible onde existe módulo (perde idempotência).
- Esquecer `--check` antes de rodar em produção.
- Playbook que só roda bem a primeira vez.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Terraform no pipeline | CI/CD — Módulo 22 |
| Ansible Vault, segredos | Segurança — Módulo 25 |
| Terraform nas nuvens | Módulo 14 (Azure); trilha GCP, Módulo 14 |
| IaC para Kubernetes | Helm/Kustomize, GitOps — Módulo 23 |
| Idempotência | Scripts — Módulo 11 |

## `[REFERÊNCIA]`

- Terraform — documentação e tutoriais: https://developer.hashicorp.com/terraform/docs · https://developer.hashicorp.com/terraform/tutorials
- Terraform — *Associate (003) exam content*: https://developer.hashicorp.com/terraform/tutorials/certification-003/associate-study-003
- OpenTofu: https://opentofu.org/docs/
- Ansible — documentação: https://docs.ansible.com/ansible/latest/
- Ansible — *Best practices*: https://docs.ansible.com/ansible/latest/tips_tricks/ansible_tips_tricks.html
- Jeff Geerling — *Ansible for DevOps* (referência): https://www.ansiblefordevops.com/
- Registry do Terraform: https://registry.terraform.io/

**Como aprofundar:** estude `terraform test`, módulos do Registry e backends remotos; em Ansible, *collections*, `ansible-lint` e Molecule (testes de roles).

## Checklist de saída

- [ ] Diferenciar provisionar (Terraform) de configurar (Ansible).
- [ ] Executar `init`, `plan`, `apply` e `destroy` e interpretar o plano (`+`, `~`, `-`, `-/+`).
- [ ] Usar variáveis, outputs, `for_each` e módulos no Terraform.
- [ ] Explicar o state, seus riscos e backends remotos com bloqueio.
- [ ] Escrever inventário, playbook, handler e template no Ansible.
- [ ] Provar idempotência (`changed=0`) e usar `--check --diff`.
- [ ] Organizar uma role e proteger segredos com Vault.
- [ ] Combinar Terraform e Ansible num fluxo único.
