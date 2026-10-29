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

### Desafios

- **Desafio 1:** o **TrilhaShop** em Kubernetes: Deployment da API, Service, Ingress, ConfigMap/Secret e StatefulSet (ou Deployment+PVC) do Postgres, com probes e requests/limits.
- **Desafio 2:** RBAC: um usuário (ServiceAccount) que só **lê** Pods no namespace `dev`; prove com `can-i`.
- **Desafio 3:** HPA com carga: gere tráfego (`hey`/`ab`) e observe o escalonamento de 2 para N réplicas.
- **Desafio 4 (CKA):** em 15 minutos, crie um Deployment, escale, atualize e faça rollback **só com comandos `kubectl` imperativos**.

**Limpeza:** `kind delete cluster --name lab`.

## Erros comuns nesta fase

- Labels do Pod não casando com o `selector`.
- Esquecer `requests/limits` e probes.
- Achar que Secret é criptografado.
- Usar a tag `latest` (deploys não reprodutíveis).
- Rodar tudo no namespace `default`.
- Dar `cluster-admin` a todos por comodidade.
- Editar recursos "ao vivo" (`kubectl edit`) em vez de pelo YAML versionado.

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
