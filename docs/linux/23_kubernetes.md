---
id: "23_kubernetes"
title: "Módulo 23 — Kubernetes"
sidebar_label: "23 · Kubernetes"
sidebar_position: 23
---

# Módulo 23 — Kubernetes

> **Objetivo**: entender e operar Kubernetes — arquitetura, Pods, Deployments, Services, Ingress, ConfigMaps/Secrets, volumes (PV/PVC), namespaces, RBAC, probes, HPA, StatefulSets/DaemonSets/Jobs, networking e troubleshooting com `kubectl` — num cluster local (kind) rodando no WSL.
>
> **Pré-requisitos**: módulos 14, 20 e 21 (containers, Compose, YAML/IaC).
>
> **Tempo de referência (não prazo)**: três a quatro semanas.
>
> Prepara as certificações **CKA** (administrador) e **CKAD** (desenvolvedor). Documentação: https://kubernetes.io/docs/

---

## Por que Kubernetes existe

Docker Compose sobe containers **em uma máquina**. Em produção você precisa de: várias máquinas, recuperar-se sozinho quando um container ou nó cai, escalar com a carga, atualizar sem derrubar, descobrir serviços e distribuir tráfego. Fazer isso à mão é inviável. O **Kubernetes (K8s)** é um **orquestrador**: você **declara o estado desejado** ("quero 3 réplicas desta imagem, acessíveis na porta 80") e ele trabalha continuamente para **fazer a realidade igualar a declaração**.

> `[TEORIA]` A ideia central é o **laço de reconciliação**: controladores comparam o estado **desejado** (declarado em YAML) com o **atual** e agem para igualá-los, sem parar. Se um Pod morrer, o controlador cria outro — não porque você mandou, mas porque o estado desejado diz "3 réplicas". É o mesmo raciocínio declarativo do Terraform (Módulo 21).

## Arquitetura

```
        ┌───────────── Control plane ─────────────┐
        │ kube-apiserver  (a porta de entrada)    │
        │ etcd            (banco do estado)       │
        │ scheduler       (decide em que nó)      │
        │ controller-mgr  (laços de reconciliação)│
        └──────────────────────────────────────────┘
                  │ API
   ┌──────────────┼──────────────┐
 Nó worker 1    Nó worker 2    Nó worker N
 kubelet (agente) · container runtime · kube-proxy
   [Pod][Pod]      [Pod]          [Pod]
```

- **API Server**: único ponto de comunicação; `kubectl`, controladores e kubelets falam com ele.
- **etcd**: armazena todo o estado do cluster (faça backup!).
- **Scheduler**: escolhe o nó para cada Pod novo (recursos, afinidades).
- **kubelet**: agente em cada nó que roda os containers do Pod.
- **kube-proxy / CNI**: rede de serviços e de Pods.

## Cluster local no WSL: kind

O **kind** (*Kubernetes IN Docker*) cria um cluster usando containers Docker como nós — perfeito para estudo e para CI.

```bash
# kubectl e kind (siga https://kubernetes.io/docs/tasks/tools/ e https://kind.sigs.k8s.io/docs/user/quick-start/)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/ && kubectl version --client
curl -Lo kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64 && sudo install kind /usr/local/bin/

cat > kind.yaml <<'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30080
        hostPort: 30080
  - role: worker
  - role: worker
EOF
kind create cluster --name lab --config kind.yaml
kubectl cluster-info --context kind-lab
kubectl get nodes -o wide
```

(Alternativa: `minikube start --driver=docker`.) `kind delete cluster --name lab` apaga tudo.

Um alias e autocompletar poupam tempo (e valem na prova CKA):

```bash
echo 'alias k=kubectl' >> ~/.bashrc
echo 'source <(kubectl completion bash); complete -o default -F __start_kubectl k' >> ~/.bashrc && source ~/.bashrc
```

## Pod: a menor unidade

Um **Pod** é um (ou poucos) container(s) que compartilham rede (um IP) e volumes. É **efêmero**: morre e é substituído por outro, com **outro IP**. Por isso você raramente cria Pods diretamente.

```bash
k run nginx --image=nginx:1.27
k get pods -o wide
k describe pod nginx            # eventos no final: a primeira coisa a ler quando algo falha
k logs nginx
k exec -it nginx -- sh
k delete pod nginx
k run teste --image=nginx --dry-run=client -o yaml > pod.yaml     # gera YAML sem criar
```

> `[TENTE VOCÊ]` Apague um Pod criado com `k run` e depois um Pod de um Deployment. Qual volta? Resposta: só o do Deployment. O Pod "solto" não tem controlador cuidando dele; o do Deployment é recriado pelo ReplicaSet para manter o número de réplicas. É o laço de reconciliação visível: `k delete pod <pod-do-deploy>; k get pods -w`.

> `[TENTE VOCÊ]` Como ver o YAML completo de um recurso que já existe? Resposta: `k get pod nginx -o yaml` mostra tudo (inclusive `status`); para uma explicação dos campos use `k explain pod.spec.containers.resources`, que serve até na prova CKA.

## Deployment: o que você usa de verdade

Um **Deployment** declara "quero N réplicas deste Pod" e cuida de **atualizações graduais** (*rolling update*) e **rollback**. Ele cria um **ReplicaSet**, que mantém os Pods.

```yaml
# deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels: { app: api }
spec:
  replicas: 3
  selector:
    matchLabels: { app: api }
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxUnavailable: 1, maxSurge: 1 }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
        - name: api
          image: nginx:1.26
          ports: [{ containerPort: 80 }]
          resources:
            requests: { cpu: 100m, memory: 64Mi }
            limits:   { cpu: 250m, memory: 128Mi }
          readinessProbe:
            httpGet: { path: /, port: 80 }
            initialDelaySeconds: 3
            periodSeconds: 5
          livenessProbe:
            httpGet: { path: /, port: 80 }
            initialDelaySeconds: 10
```

```bash
k apply -f deploy.yaml
k get deploy,rs,pods
k scale deploy api --replicas=5
k set image deploy/api api=nginx:1.27          # dispara rolling update
k rollout status deploy/api
k rollout history deploy/api
k rollout undo deploy/api                      # rollback
k delete pod <um-pod>                          # veja o controlador recriar
```

> `[ATENÇÃO]` Os rótulos (`labels`) do `template` **devem casar** com o `selector.matchLabels`, ou o Deployment não gerencia os Pods. É um dos erros mais comuns ao escrever YAML na mão.

**requests** são o que o scheduler **reserva** para o Pod; **limits** são o teto (CPU é *throttled*; memória acima do limite causa **OOMKilled**). Sem `requests`, o scheduler decide às cegas; sem `limits`, um Pod pode esgotar o nó.

**Probes**: **readiness** diz se o Pod está **pronto para receber tráfego** (falhou → sai do Service, sem reiniciar); **liveness** diz se está **vivo** (falhou → o kubelet reinicia o container); **startup** protege aplicações lentas na inicialização.

> `[TENTE VOCÊ]` Troque a imagem para uma que não existe (`k set image deploy/api api=nginx:9.99`) e observe `k get pods` e `k rollout status deploy/api`. Resposta: aparecem Pods novos em `ErrImagePull`/`ImagePullBackOff`, mas os **antigos continuam Running**, porque `maxUnavailable: 1` impede o Deployment de derrubar tudo. Volte com `k rollout undo deploy/api`. É por isso que o rolling update protege você de uma versão quebrada.

> `[ATENÇÃO]` Uma `readinessProbe` apontando para o caminho ou porta errados não reinicia nada: o Pod fica `Running` com `READY 0/1` para sempre e o Service não manda tráfego para ele. O erro nasce quando você olha só o STATUS e esquece a coluna READY.

## Service: um endereço estável

Pods mudam de IP; o **Service** dá um **IP/nome estáveis** e balanceia entre os Pods que casam com o seu `selector`.

```yaml
apiVersion: v1
kind: Service
metadata: { name: api }
spec:
  selector: { app: api }
  ports: [{ port: 80, targetPort: 80 }]
  type: ClusterIP
```

| Tipo | Alcance |
|---|---|
| **ClusterIP** | Só dentro do cluster (padrão) |
| **NodePort** | Abre uma porta em cada nó (30000–32767) |
| **LoadBalancer** | IP externo via nuvem (no kind, use MetalLB) |
| **ExternalName** | Apelido DNS para algo externo |

```bash
k expose deploy api --port=80 --type=NodePort --dry-run=client -o yaml
k get svc,endpoints                              # endpoints = IPs dos Pods atrás do service
k run -it --rm tmp --image=busybox -- wget -qO- http://api       # DNS interno: <svc>.<ns>.svc.cluster.local
k port-forward svc/api 8080:80                   # acessa pelo seu localhost
```

> `[TENTE VOCÊ]` O Service existe, mas `k run -it --rm tmp --image=busybox -- wget -qO- http://api` dá timeout. Qual o primeiro comando? Resposta: `k get endpoints api`. Se a coluna ENDPOINTS está `<none>`, o `selector` do Service não casa com os labels dos Pods (ou os Pods não estão Ready). Compare com `k get pods --show-labels`.

## Ingress: HTTP para fora

O **Ingress** define regras HTTP(S) (host/caminho → Service), executadas por um **Ingress Controller** (ex.: **ingress-nginx**). É o "proxy reverso" do Módulo 17, agora declarativo.

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: api }
spec:
  ingressClassName: nginx
  rules:
    - host: api.lab
      http:
        paths:
          - path: /
            pathType: Prefix
            backend: { service: { name: api, port: { number: 80 } } }
```

(Para TLS automático, **cert-manager** com Let's Encrypt — conhecer o conceito.)

## Configuração: ConfigMap e Secret

Separe **configuração** da imagem: a mesma imagem roda em dev e prod com configs diferentes.

```bash
k create configmap app-config --from-literal=LOG_LEVEL=info --from-file=app.properties
k create secret generic db --from-literal=senha='s3gredo'
```

```yaml
        env:
          - name: LOG_LEVEL
            valueFrom: { configMapKeyRef: { name: app-config, key: LOG_LEVEL } }
          - name: DB_SENHA
            valueFrom: { secretKeyRef: { name: db, key: senha } }
        volumeMounts:
          - { name: cfg, mountPath: /etc/app }
      volumes:
        - name: cfg
          configMap: { name: app-config }
```

> `[ATENÇÃO]` Um **Secret não é criptografado**, só codificado em base64 (`echo c2VncmVkbw== | base64 -d`). Qualquer um com acesso de leitura ao Secret lê o valor. Para segurança real: criptografia em repouso do etcd, **RBAC restritivo** e cofre externo (Vault, External Secrets, SOPS — Módulo 25).

> `[TENTE VOCÊ]` Mudei o ConfigMap, mas a aplicação continua com o valor antigo. Por quê? Resposta: variáveis de ambiente vindas de ConfigMap/Secret são lidas **na criação do Pod**. Depois de `k edit`/`apply` no ConfigMap, force novos Pods com `k rollout restart deploy/api`. Já os arquivos montados como volume são atualizados sozinhos (após alguns segundos).

## Armazenamento: PV, PVC e StorageClass

Pods são efêmeros; dados persistentes precisam de **volumes**. A **PVC** (*PersistentVolumeClaim*) é o **pedido** de armazenamento; o **PV** é o recurso que o atende; a **StorageClass** provisiona PVs dinamicamente.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: dados }
spec:
  accessModes: [ReadWriteOnce]
  resources: { requests: { storage: 1Gi } }
```

```bash
k get storageclass,pv,pvc
```

## Outros workloads

| Recurso | Para quê |
|---|---|
| **StatefulSet** | Apps com **identidade e armazenamento estáveis** (bancos): Pods `db-0`, `db-1`, volumes próprios |
| **DaemonSet** | **Um Pod por nó** (agentes de log/monitoramento) |
| **Job** | Tarefa que roda **até concluir** (migração, batch) |
| **CronJob** | Job **agendado** (como o cron) |

```bash
k create job migra --image=busybox -- sh -c "echo migrando; sleep 5"
k create cronjob relatorio --image=busybox --schedule="*/1 * * * *" -- date
k get jobs,cronjobs
```

## Namespaces, RBAC e escalonamento

**Namespaces** dividem o cluster logicamente (ambientes, times), com cotas e permissões próprias.

```bash
k create ns dev
k config set-context --current --namespace=dev       # muda o padrão
k get pods -A                                        # todos os namespaces
k create quota limite --hard=pods=10,requests.cpu=2 -n dev
```

**RBAC** define **quem** pode fazer **o quê**: `Role`/`ClusterRole` (permissões) + `RoleBinding`/`ClusterRoleBinding` (a quem).

```bash
k create sa leitor -n dev
k create role ver-pods --verb=get,list,watch --resource=pods -n dev
k create rolebinding leitor-ver-pods --role=ver-pods --serviceaccount=dev:leitor -n dev
k auth can-i list pods -n dev --as=system:serviceaccount:dev:leitor    # yes
k auth can-i delete pods -n dev --as=system:serviceaccount:dev:leitor  # no
```

> `[TENTE VOCÊ]` Como listar tudo o que uma ServiceAccount pode fazer? Resposta: `k auth can-i --list -n dev --as=system:serviceaccount:dev:leitor` mostra a tabela de verbos/recursos permitidos. Útil para auditar: se aparecer `*` em recursos, o RBAC está largo demais.

**HPA** (*Horizontal Pod Autoscaler*) ajusta réplicas pela carga (exige o *metrics-server*):

```bash
k autoscale deploy api --cpu-percent=70 --min=2 --max=8
k get hpa
```

## Rede: como Pods se falam (CNI) e NetworkPolicy

Todo Pod pode falar com qualquer outro por padrão (rede plana, implementada pelo plugin **CNI**: Calico, Cilium, Flannel). **NetworkPolicy** restringe isso (exige CNI que a suporte, como Calico/Cilium).

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: so-api-acessa-banco, namespace: dev }
spec:
  podSelector: { matchLabels: { app: banco } }
  ingress:
    - from: [{ podSelector: { matchLabels: { app: api } } }]
      ports: [{ port: 5432 }]
```

## Helm e Kustomize

- **Helm**: gerenciador de pacotes — *charts* com templates e `values.yaml`. `helm repo add`, `helm install meu-release chart`, `helm upgrade`, `helm rollback`.
- **Kustomize** (embutido no `kubectl -k`): personaliza YAMLs por *overlays* (dev/prod) **sem templates**.

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install meu-nginx bitnami/nginx --set service.type=ClusterIP
helm list && helm uninstall meu-nginx
kubectl apply -k overlays/prod
```

## Troubleshooting: o roteiro do `kubectl`

Em 90% dos casos, estes quatro comandos resolvem:

```bash
k get pods                      # STATUS: Pending, CrashLoopBackOff, ImagePullBackOff, Error...
k describe pod <pod>            # leia a seção EVENTS (no final)
k logs <pod> [-c container] [--previous]      # --previous: logs do container que caiu
k get events --sort-by=.lastTimestamp
```

| Status | Causa provável | Onde olhar |
|---|---|---|
| **Pending** | Sem recursos/nó; PVC não vinculada; taint | `describe` → Events |
| **ImagePullBackOff** | Imagem/tag errada, registry privado sem credencial | `describe` → Events |
| **CrashLoopBackOff** | A aplicação cai ao iniciar (config, segredo, porta) | `logs --previous` |
| **OOMKilled** | Estourou o `limit` de memória | `describe` → Last State |
| **Running mas sem tráfego** | Readiness falhando; `selector` do Service errado | `get endpoints`, `describe svc` |

> `[TEORIA]` O método é o do Módulo 16, agora em K8s: **estado → eventos → logs → configuração**. Service sem tráfego? `k get endpoints api`: vazio significa que o selector não casa com os labels dos Pods ou que os Pods não estão `Ready`.

![Saída de `kubectl get pods -o wide` mostrando três réplicas do Deployment api em Running, distribuídas entre os nós](screenshots/23-kubernetes/01-get-pods-wide.png)
> `[PRINT]` Passo a passo para capturar: após `k apply -f deploy.yaml`, rodar `k get pods -o wide`. Capturar a tabela com nós e IPs.

## Laboratórios

### Lab 1 — Cluster e Pods
Crie o cluster kind de 3 nós; rode um Pod, entre nele, leia os logs; gere YAML com `--dry-run=client -o yaml`.

### Lab 2 — Deployment, update e rollback
Deployment de 3 réplicas; atualize a imagem, acompanhe o rollout, force erro (imagem inexistente) e faça `rollout undo`.

### Lab 3 — Service e Ingress
Exponha o Deployment por Service ClusterIP, teste com `port-forward` e por Pod temporário; instale o ingress-nginx e acesse por `api.lab`.

### Lab 4 — Config e persistência
Injete ConfigMap e Secret; suba um Postgres com PVC; apague o Pod e prove que os dados persistem.

### Lab 5 — Quebrar e consertar
Provoque, de propósito: `ImagePullBackOff`, `CrashLoopBackOff`, `Pending` (requests enormes) e probe falhando; diagnostique cada um só com `get`/`describe`/`logs`.

### Lab 6 — Config mudou, Pods não: rollout restart
Cenário: o time mudou o nível de log no ConfigMap e "nada aconteceu".

```bash
kubectl create ns lab6
kubectl -n lab6 create configmap app-config --from-literal=LOG_LEVEL=info
kubectl -n lab6 create deployment web --image=busybox:1.36 --replicas=1 -- sh -c 'while true; do echo "nivel=$LOG_LEVEL"; sleep 5; done'
kubectl -n lab6 set env deployment/web --from=configmap/app-config
kubectl -n lab6 rollout status deploy/web
kubectl -n lab6 logs deploy/web --tail=2                  # nivel=info
kubectl -n lab6 create configmap app-config --from-literal=LOG_LEVEL=debug --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab6 logs deploy/web --tail=1                  # continua nivel=info
kubectl -n lab6 rollout restart deploy/web && kubectl -n lab6 rollout status deploy/web
kubectl -n lab6 logs deploy/web --tail=1                  # agora nivel=debug
kubectl delete ns lab6
```

### Lab 7 — Readiness falhando: Running mas sem tráfego
Cenário: o deploy "subiu", mas o site está fora do ar.

```bash
kubectl create ns lab7
cat <<'EOF' | kubectl -n lab7 apply -f -
apiVersion: apps/v1
kind: Deployment
metadata: { name: site }
spec:
  replicas: 2
  selector: { matchLabels: { app: site } }
  template:
    metadata: { labels: { app: site } }
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          readinessProbe:
            httpGet: { path: /nao-existe, port: 80 }
            periodSeconds: 3
---
apiVersion: v1
kind: Service
metadata: { name: site }
spec:
  selector: { app: site }
  ports: [{ port: 80 }]
EOF
sleep 10
kubectl -n lab7 get pods                       # READY 0/1, STATUS Running
kubectl -n lab7 get endpoints site             # ENDPOINTS <none>
kubectl -n lab7 describe pod -l app=site | grep -A3 'Readiness probe failed'
kubectl -n lab7 patch deploy site --type=json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/path","value":"/"}]'
kubectl -n lab7 rollout status deploy/site
kubectl -n lab7 get endpoints site             # agora com 2 IPs
kubectl delete ns lab7
```

### Lab 8 — Job com dados do laboratório
Cenário: rodar um processamento em lote sobre o `usuarios.csv` do `~/lab`, sem montar disco do host.

```bash
kubectl create ns lab8
kubectl -n lab8 create configmap usuarios --from-file=$HOME/lab/dados/usuarios.csv
cat <<'EOF' | kubectl -n lab8 apply -f -
apiVersion: batch/v1
kind: Job
metadata: { name: conta-usuarios }
spec:
  backoffLimit: 2
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: conta
          image: busybox:1.36
          command: ["sh", "-c", "tail -n +2 /dados/usuarios.csv | wc -l"]
          volumeMounts: [{ name: d, mountPath: /dados }]
      volumes:
        - name: d
          configMap: { name: usuarios }
EOF
kubectl -n lab8 wait --for=condition=complete job/conta-usuarios --timeout=60s
kubectl -n lab8 logs job/conta-usuarios       # 8
kubectl -n lab8 get job                        # COMPLETIONS 1/1
kubectl delete ns lab8
```

### Desafios

- **Desafio 1:** o **TrilhaShop** em Kubernetes: Deployment da API, Service, Ingress, ConfigMap/Secret e StatefulSet (ou Deployment+PVC) do Postgres, com probes e requests/limits.
- **Desafio 2:** RBAC: um usuário (ServiceAccount) que só **lê** Pods no namespace `dev`; prove com `can-i`.
- **Desafio 3:** HPA com carga: gere tráfego (`hey`/`ab`) e observe o escalonamento de 2 para N réplicas.
- **Desafio 4 (CKA):** em 15 minutos, crie um Deployment, escale, atualize e faça rollback **só com comandos `kubectl` imperativos**.
- **Desafio 5:** crie um namespace `time-a` com `ResourceQuota` de no máximo 3 Pods e tente subir um Deployment de 5 réplicas; explique o que aconteceu e corrija.

  **Verifique:** `kubectl -n time-a get pods --no-headers | wc -l` imprime `3` e `kubectl -n time-a describe rs | grep -i 'exceeded quota'` mostra a mensagem de quota excedida; depois do ajuste da quota (ou das réplicas), `kubectl -n time-a get deploy` mostra `READY` completo.

- **Desafio 6:** gere um relatório de saúde do cluster num script: nós `Ready`, Pods fora de `Running`/`Completed` em todos os namespaces e Deployments com `READY` incompleto.

  **Verifique:** `./saude.sh; echo $?` imprime a lista (vazia se tudo OK) e termina com `0`; ao deixar um Pod em `ImagePullBackOff`, o mesmo script lista esse Pod e termina com `1`.

### Desafio avançado — Zero downtime de verdade: rollout e drain sem perder uma requisição
**Nível:** avançado — leva de 1 a 3 horas
- **Cenário:** o time de plataforma vai fazer manutenção nos nós do cluster e, na mesma semana, soltar uma versão nova da API. O negócio exige **zero requisições com erro** durante as duas operações, e já houve incidente porque o Kubernetes mandou tráfego para um Pod que estava sendo encerrado. Você precisa provar com medição, e não com "parece que funcionou", que o desenho aguenta um `rollout` e um `drain` de nó com carga contínua.
- **Requisitos:**
  1. Deployment `api` com 3 réplicas (nginx), distribuídas entre os dois workers do kind, com probes e `requests`/`limits`.
  2. Um `PodDisruptionBudget` que garanta pelo menos 2 Pods disponíveis durante evictions voluntárias.
  3. Encerramento gracioso configurado de modo que o Pod continue atendendo por alguns segundos depois de ser removido do Service (a propagação dos endpoints não é instantânea).
  4. Estratégia de rollout que nunca reduz a capacidade abaixo de 3 Pods prontos.
  5. Um gerador de carga dentro do cluster (Pod ou Job) que dispara requisições contínuas ao Service, por no mínimo 60 segundos, e registra o total e as falhas (timeout de 1s por requisição).
  6. Durante a carga: um `rollout` para outra tag do nginx e, em seguida, o `drain` do worker que tem mais Pods da `api`, ambos terminando com sucesso.
- **Restrições:** apenas recursos nativos do Kubernetes (sem Istio/service mesh, sem Helm); o gerador de carga não pode rodar no nó que será drenado; nada de `--force` nem `--disable-eviction` no `drain`.
- **Onde pesquisar:** `PodDisruptionBudget`, `lifecycle.preStop`, `terminationGracePeriodSeconds`, `topologySpreadConstraints`, `kubectl drain` (flags `--ignore-daemonsets`, `--delete-emptydir-data`), `kubectl uncordon`.
- **Verifique:**
  - `kubectl get pdb` mostra `ALLOWED DISRUPTIONS` maior ou igual a 1 e `kubectl -n <ns> get pods -o wide` mostra Pods da `api` em dois nós diferentes antes do teste.
  - `kubectl logs job/carga` (ou do Pod gerador) termina com algo como `total=N falhas=0` com N maior que 300, cobrindo o período do `rollout` e do `drain`.
  - `kubectl rollout status deploy/api` termina com `successfully rolled out` e `kubectl drain <worker> --ignore-daemonsets --delete-emptydir-data` termina com `drained` sem timeout.
  - `kubectl get nodes` mostra o worker drenado com `SchedulingDisabled`; depois do `kubectl uncordon`, volta a `Ready`.
  - Borda: com o worker ainda drenado, `kubectl drain` no **outro** worker não deve conseguir evictar os Pods (fica reclamando do disruption budget); mostre a mensagem `Cannot evict pod as it would violate the pod's disruption budget` (interrompa com Ctrl+C e faça `uncordon` em seguida).

**Limpeza:** `kind delete cluster --name lab`.

## Erros comuns nesta fase

- Labels do Pod não casando com o `selector`.
- Esquecer `requests/limits` e probes.
- Achar que Secret é criptografado.
- Usar a tag `latest` (deploys não reprodutíveis).
- Rodar tudo no namespace `default`.
- Dar `cluster-admin` a todos por comodidade.
- Editar recursos "ao vivo" (`kubectl edit`) em vez de pelo YAML versionado.
- Mudar um ConfigMap e esperar que as variáveis de ambiente dos Pods mudem sozinhas (precisa de `rollout restart`).
- Olhar só o STATUS `Running` e ignorar a coluna READY (`0/1` significa sem tráfego).
- Esquecer o `-n` e mexer (ou procurar) no namespace errado; confira com `k config view --minify | grep namespace`.

## Ponte com módulos anteriores

| Vem de | Como reaparece aqui |
|---|---|
| Módulo 14 e 20 (containers) | O Pod é o container do módulo 20; o `limit` de memória é o cgroup do módulo 14 |
| Módulo 17 (Nginx) | Ingress é o proxy reverso declarativo; o `nginx -t`/`reload` vira `rollout` |
| Módulo 09 e 18 (redes) | Service = IP virtual com balanceamento; DNS interno `<svc>.<ns>.svc.cluster.local` |
| Módulo 16 (troubleshooting) | O roteiro estado -> eventos -> logs -> configuração é o `get/describe/logs` |
| Módulo 12 (logs) | `kubectl logs` e `get events` fazem o papel do `journalctl` |
| Módulo 21 (IaC) | YAML versionado e `apply` declarativo; idempotência |

### Lab integrador — Do container ao cluster, com diagnóstico guiado
Reuse a imagem/stack do módulo 20, o roteiro do módulo 16 e o raciocínio de logs do módulo 12.

```bash
kubectl create ns integra
kubectl -n integra create deployment api --image=nginx:1.27 --replicas=2
kubectl -n integra expose deployment api --port=80
kubectl -n integra rollout status deploy/api
kubectl -n integra run tmp --rm -i --restart=Never --image=busybox:1.36 -- wget -qO- http://api | head -3
# quebre de propósito: tag que não existe
kubectl -n integra set image deploy/api nginx=nginx:9.99
sleep 15
kubectl -n integra get pods                                    # estado
kubectl -n integra get events --sort-by=.lastTimestamp | tail -5   # eventos
kubectl -n integra describe pod -l app=api | grep -iE 'Failed|BackOff' | head -3   # causa
kubectl -n integra rollout undo deploy/api                     # correção
kubectl -n integra rollout status deploy/api
kubectl -n integra logs deploy/api --tail=3                    # logs do nginx, formato do módulo 17
kubectl delete ns integra
```

Compare cada passo com o roteiro do módulo 16 (estado, eventos, logs, configuração): o método é o mesmo, só mudam os comandos.

## Conexão com os módulos seguintes

| Conceito deste módulo | Aparece novamente em |
|---|---|
| Probes, métricas, logs | Observabilidade — Módulo 24 |
| Secrets, RBAC, NetworkPolicy, Pod Security | DevSecOps — Módulo 25 |
| Deploy contínuo e GitOps (Argo CD) | CI/CD — Módulo 22 |
| AKS no Azure; GKE no GCP | Módulo 09 (Azure); trilha GCP, Módulo 09 |
| Terraform para clusters | Módulo 21 |

## `[REFERÊNCIA]`

- Kubernetes — documentação (tarefas e conceitos): https://kubernetes.io/docs/
- Kubernetes — *kubectl cheat sheet*: https://kubernetes.io/docs/reference/kubectl/quick-reference/
- kind: https://kind.sigs.k8s.io/
- CKA/CKAD/CKS — currículo oficial: https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/
- Killer Shell (simulador de prova): https://killer.sh/
- *Kubernetes the Hard Way* (Kelsey Hightower): https://github.com/kelseyhightower/kubernetes-the-hard-way
- Helm: https://helm.sh/docs/ · Kustomize: https://kustomize.io/
- CNCF — *Cloud Native Landscape*: https://landscape.cncf.io/
- Microsoft Learn — AKS: https://learn.microsoft.com/azure/aks/ · Google — GKE: https://cloud.google.com/kubernetes-engine/docs

**Como aprofundar:** pratique os simuladores do killer.sh e os labs da KodeKloud; depois estude `etcd` backup/restore, `kubeadm` e upgrade de cluster (CKA).

## Checklist de saída

- [ ] Descrever a arquitetura (API server, etcd, scheduler, kubelet) e o laço de reconciliação.
- [ ] Criar um cluster local e operar com `kubectl` (e alias `k`).
- [ ] Escrever Deployment, Service e Ingress; explicar selectors/labels.
- [ ] Explicar requests x limits e readiness x liveness x startup probes.
- [ ] Usar ConfigMap, Secret (e saber que não são criptografados), PV/PVC.
- [ ] Diferenciar StatefulSet, DaemonSet, Job e CronJob.
- [ ] Configurar namespaces, RBAC (`can-i`), HPA e NetworkPolicy.
- [ ] Diagnosticar `Pending`, `ImagePullBackOff`, `CrashLoopBackOff` e `OOMKilled`.
- [ ] Usar Helm e Kustomize.
