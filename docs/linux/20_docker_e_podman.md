---
id: "20_docker_e_podman"
title: "Módulo 20 — Docker e Podman"
sidebar_label: "20 · Docker e Podman"
sidebar_position: 20
---

# Módulo 20 — Docker e Podman

> **Objetivo**: dominar containers no dia a dia de infra — imagens e camadas, `Dockerfile` e *multi-stage build*, volumes, redes, Docker Compose, registries, segurança (não-root, imagens enxutas, scan) e Podman rootless.
>
> **Pré-requisitos**: módulo 14 (namespaces/cgroups e primeiros passos), 09 e 17.
>
> **Tempo de referência (não prazo)**: duas semanas.
>
> Base prática do **CKA/CKAD** (Módulo 23) e dos serviços de container do Azure (Módulo 09) e do GCP. Documentação: https://docs.docker.com/

---

## Revisão rápida e vocabulário

Do Módulo 14, você já sabe que um container é um **processo isolado** por namespaces/cgroups. Agora o foco é **empacotar e operar** aplicações:

- **Imagem**: pacote imutável e em **camadas** (sistema de arquivos + metadados) — o molde.
- **Container**: instância em execução de uma imagem.
- **Registry**: servidor de imagens (Docker Hub, GHCR, ACR, Artifact Registry).
- **Tag**: nome/versão da imagem (`nginx:1.27`). `latest` é só uma convenção — evite em produção.
- **Dockerfile**: a receita que constrói a imagem.

```bash
docker version && docker info | head -15
docker run --rm hello-world
docker images && docker ps -a
docker system df                    # espaço usado por imagens, containers e volumes
```

## Camadas e cache: por que a ordem do Dockerfile importa

Cada instrução do Dockerfile gera uma **camada** reutilizável (cache). Quando você reconstrói, o Docker só refaz **a partir da primeira camada que mudou**. Então: coloque o que **muda pouco** (dependências) **antes** do que muda muito (seu código).

Aplicação de exemplo (Python/Flask) para treinar:

```bash
mkdir -p ~/lab/app && cd ~/lab/app
cat > app.py <<'EOF'
from flask import Flask, jsonify
app = Flask(__name__)

@app.get("/saude")
def saude():
    return jsonify(status="ok")

@app.get("/")
def raiz():
    return "TrilhaShop API"
EOF
echo "flask==3.0.3
gunicorn==22.0.0" > requirements.txt
```

### Dockerfile (versão ingênua)

```dockerfile
FROM python:3.12
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
```

Problema: **qualquer** mudança em `app.py` invalida o `COPY . /app` e reinstala todas as dependências.

### Dockerfile bom (cache + segurança)

```dockerfile
FROM python:3.12-slim
WORKDIR /app

# 1) dependências primeiro: mudam pouco -> camada fica em cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2) código depois: muda sempre
COPY app.py .

# 3) não rode como root
RUN useradd -r -u 10001 appuser
USER appuser

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request as u; u.urlopen('http://localhost:8080/saude')"
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
```

Acrescente um `.dockerignore` para não enviar lixo ao build:

```
.git
__pycache__
*.pyc
.env
```

```bash
docker build -t trilhashop-api:v1 .
docker run -d --name api -p 8080:8080 trilhashop-api:v1
curl localhost:8080/saude
docker logs api
docker history trilhashop-api:v1          # as camadas e seus tamanhos
docker image ls trilhashop-api
```

> `[ATENÇÃO]` Dockerfile bom: imagem base **enxuta e com versão fixa** (`python:3.12-slim`, não `latest`), `COPY` só do necessário, `--no-cache-dir`, **usuário não-root**, sem segredos (nada de `ENV SENHA=...` nem `COPY .env`). Segredos entram em tempo de execução, nunca na imagem.

## Multi-stage build: compilar num lugar, rodar em outro

Muitas linguagens precisam de ferramentas pesadas para **compilar** que não são necessárias para **rodar**. O *multi-stage* usa um estágio para construir e copia só o resultado para uma imagem final mínima:

```dockerfile
# Estágio 1: build (tem compilador e ferramentas)
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /out/servidor .

# Estágio 2: runtime (mínimo)
FROM gcr.io/distroless/static-debian12
COPY --from=build /out/servidor /servidor
USER 65532:65532
ENTRYPOINT ["/servidor"]
```

A imagem final pode cair de ~1 GB para ~10 MB: menos para baixar, **menor superfície de ataque**.

## Volumes: dados que sobrevivem ao container

O sistema de arquivos do container é **efêmero**: ao removê-lo, o que foi gravado se perde. Para persistir:

- **Volume** (gerenciado pelo Docker): `docker volume create dados`
- **Bind mount**: monta uma pasta do host (ótimo para desenvolvimento).
- **tmpfs**: em memória.

```bash
docker volume create pgdados
docker run -d --name pg -e POSTGRES_PASSWORD=lab -v pgdados:/var/lib/postgresql/data postgres:16
docker exec -it pg psql -U postgres -c "CREATE TABLE t(id int); INSERT INTO t VALUES (1);"
docker rm -f pg                                   # o container some...
docker run -d --name pg -e POSTGRES_PASSWORD=lab -v pgdados:/var/lib/postgresql/data postgres:16
docker exec -it pg psql -U postgres -c "SELECT * FROM t;"      # ...e os dados continuam
docker run --rm -v ~/lab/app:/dados:ro alpine ls /dados        # bind mount somente leitura
```

## Redes

Containers na mesma **rede definida pelo usuário** se enxergam **pelo nome** (DNS interno):

```bash
docker network create trilha
docker run -d --network trilha --name banco -e POSTGRES_PASSWORD=lab postgres:16
docker run --rm --network trilha alpine sh -c "ping -c 2 banco"     # resolve 'banco' pelo nome
docker network ls && docker network inspect trilha | head -20
docker run -d -p 127.0.0.1:8080:8080 trilhashop-api:v1               # publica SÓ no localhost
```

Tipos: `bridge` (padrão, NAT), `host` (usa a rede do host), `none`. `-p HOSTA:CONTAINER` **publica** a porta; sem isso, o serviço só é acessível dentro da rede Docker.

## Docker Compose: a stack inteira em um arquivo

O **Compose** descreve vários containers, redes e volumes em um `compose.yaml`, e sobe tudo com um comando. É IaC para containers (Módulo 15).

```yaml
# compose.yaml
services:
  api:
    build: .
    ports: ["8080:8080"]
    environment:
      DB_HOST: banco
      DB_PASSWORD_FILE: /run/secrets/db_senha
    secrets: [db_senha]
    depends_on:
      banco:
        condition: service_healthy
    restart: unless-stopped

  banco:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_senha
      POSTGRES_DB: catalogo
    secrets: [db_senha]
    volumes: [pgdados:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

  proxy:
    image: nginx:1.27
    ports: ["80:80"]
    volumes: ["./nginx.conf:/etc/nginx/conf.d/default.conf:ro"]
    depends_on: [api]

volumes:
  pgdados:

secrets:
  db_senha:
    file: ./db_senha.txt
```

```bash
echo "troque-esta-senha" > db_senha.txt && chmod 600 db_senha.txt
docker compose up -d --build
docker compose ps
docker compose logs -f api
docker compose exec banco psql -U postgres -d catalogo
docker compose down            # derruba (mantém volumes); -v apaga também os volumes
```

> `[ATENÇÃO]` Prefira `secrets` ou variáveis vindas do ambiente a chumbar senhas no `compose.yaml`; e nunca versione `db_senha.txt` (`.gitignore`). Em produção, use um cofre (Módulo 25).

## Registries: guardar e distribuir imagens

```bash
docker tag trilhashop-api:v1 ghcr.io/SEU_USUARIO/trilhashop-api:v1
echo $GITHUB_TOKEN | docker login ghcr.io -u SEU_USUARIO --password-stdin
docker push ghcr.io/SEU_USUARIO/trilhashop-api:v1
docker pull ghcr.io/SEU_USUARIO/trilhashop-api:v1
```

Registry local para testes: `docker run -d -p 5000:5000 --name registry registry:2` e `docker push localhost:5000/trilhashop-api:v1`. Em nuvem: ACR (Azure, Módulo 09), Artifact Registry (GCP), ECR (AWS).

## Segurança de imagens e containers

```bash
docker run --rm -u 1000 --read-only --cap-drop ALL --security-opt no-new-privileges \
  -p 8080:8080 trilhashop-api:v1        # privilégios mínimos
docker scout quickview trilhashop-api:v1   # ou:  trivy image trilhashop-api:v1
```

Checklist: usuário **não-root**; `--read-only` (filesystem imutável); `--cap-drop ALL`; imagens **oficiais e fixadas por versão (ou digest)**; **scan de vulnerabilidades** (Trivy, Módulo 25); **nunca** `--privileged` nem montar `/var/run/docker.sock` sem necessidade; pequenas, com o mínimo instalado.

> `[TEORIA]` Quem acessa o socket do Docker controla a máquina inteira. Por isso o **Podman rootless** (sem daemon, sem root) é tão valorizado em ambientes sensíveis.

## Podman: o mesmo, sem daemon

```bash
sudo apt install -y podman
podman run -d --name web -p 8081:80 nginx
podman ps && podman logs web
podman build -t trilhashop-api:v1 .
podman generate systemd --new --name web      # gera uma unit do systemd (ou use Quadlet)
podman pod create --name meupod -p 8082:80    # pods (como no Kubernetes)
podman compose up -d                           # ou: pip install podman-compose
```

Compatível com os comandos do Docker; **rootless por padrão** (roda como seu usuário), **sem daemon** e integrado ao systemd.

![Saída do `docker compose ps` mostrando os serviços proxy, api e banco em execução, com o banco "healthy"](screenshots/20-docker-e-podman/01-compose-ps-healthy.png)
> `[PRINT]` Passo a passo para capturar: após `docker compose up -d --build`, rodar `docker compose ps`. Capturar a tabela com STATUS.

## Laboratórios

### Lab 1 — Imagem enxuta
Construa `trilhashop-api` com o Dockerfile ingênuo e com o bom; compare **tempo do segundo build** (após alterar só o `app.py`) e **tamanho** (`docker images`).

### Lab 2 — Multi-stage
Escreva um programa Go (ou outro) e compare o tamanho da imagem com e sem multi-stage.

### Lab 3 — Persistência e rede
Suba Postgres com volume, destrua o container e recupere os dados; conecte a API ao banco por **nome** numa rede definida.

### Lab 4 — Compose completo
Stack `proxy + api + banco` do exemplo, com healthcheck e `depends_on`; derrube a API (`docker compose kill api`) e veja `restart` atuar.

### Lab 5 — Registry e scan
Suba um registry local, faça push/pull e rode `trivy image` na imagem (instale o Trivy conforme a documentação).

### Desafios

- **Desafio 1:** reduza a imagem da API a **menos de 100 MB**, rodando como não-root, `--read-only`, com `HEALTHCHECK` funcional.
- **Desafio 2:** a stack Compose inteira sobe com `docker compose up` e **sem senhas em texto** no repositório.
- **Desafio 3:** repita o Lab 4 com **Podman rootless** e compare quem é o dono dos processos no host (`ps -eo user,pid,cmd | grep -E 'nginx|gunicorn'`).

## Erros comuns nesta fase

- `COPY . .` antes de instalar dependências (cache inútil).
- Usar `latest` e rodar como root.
- Colocar segredos no Dockerfile, na imagem ou no repositório.
- Perder dados por não usar volumes.
- Expor portas em `0.0.0.0` sem necessidade.
- Acumular imagens/containers/volumes (`docker system prune` com cuidado: apaga dados sem volume nomeado).
- `docker run --privileged` "para funcionar".

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Imagens e registries | ACR (Azure, Módulo 09); CI/CD — Módulo 22 |
| Compose (stack) | Kubernetes (Deployments/Services) — Módulo 23 |
| Volumes, redes | PV/PVC e Services — Módulo 23 |
| Segurança de imagens | DevSecOps (Trivy) — Módulo 25 |
| Healthchecks | Probes — Módulo 23 |

## `[REFERÊNCIA]`

- Docker — documentação: https://docs.docker.com/
- Docker — *Dockerfile best practices*: https://docs.docker.com/build/building/best-practices/
- Docker — *Multi-stage builds*: https://docs.docker.com/build/building/multi-stage/
- Docker Compose — especificação: https://docs.docker.com/compose/
- Podman — documentação: https://docs.podman.io/
- OCI — especificações: https://opencontainers.org/
- Trivy: https://aquasecurity.github.io/trivy/
- `dive` (inspecionar camadas): https://github.com/wagoodman/dive
- Docker — segurança: https://docs.docker.com/engine/security/

**Como aprofundar:** estude BuildKit (cache avançado, `--mount=type=secret`), imagens *distroless* e assinatura de imagens (cosign).

## Checklist de saída

- [ ] Diferenciar imagem, container, registry e tag.
- [ ] Explicar camadas e escrever um Dockerfile que aproveita o cache.
- [ ] Usar multi-stage build e explicar o ganho.
- [ ] Persistir dados com volumes e conectar containers por nome em rede própria.
- [ ] Subir uma stack com Docker Compose (healthcheck, depends_on, secrets).
- [ ] Publicar e baixar imagens de um registry.
- [ ] Aplicar práticas de segurança (não-root, read-only, versão fixa, scan).
- [ ] Rodar o mesmo fluxo com Podman rootless.
