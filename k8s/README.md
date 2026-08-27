# Kubernetes baseline

`k8s/base` — локальный/reference контур Tracker: PostgreSQL 16, Redis 7, API, Web и unprivileged Nginx.
Он демонстрирует probes, resource limits, NetworkPolicy и restricted workload security context, но не
является production-ready платформой.

## Локальный запуск

```bash
docker build -f apps/api/Dockerfile -t tracker-api:latest .
docker build -f apps/web/Dockerfile -t tracker-web:latest .
```

Для kind:

```bash
kind load docker-image tracker-api:latest
kind load docker-image tracker-web:latest
```

Создайте локальный secret-файл из шаблона, заполните четыре независимых сильных значения и не
добавляйте файл в Git:

```bash
cp k8s/secret.env.example k8s/secret.env
kubectl create namespace tracker --dry-run=client -o yaml | kubectl apply -f -
kubectl -n tracker create secret generic tracker-secret \
  --from-env-file=k8s/secret.env \
  --dry-run=client -o yaml | kubectl apply -f -
```

Примените base и откройте edge service:

```bash
kubectl apply -k k8s/base
kubectl -n tracker port-forward svc/nginx 8080:80
```

- Web: `http://localhost:8080`;
- API: `http://localhost:8080/api/v1`;
- Swagger: `http://localhost:8080/api/docs`;
- Readiness: `http://localhost:8080/api/health/ready`.

Проверка рендера без применения:

```bash
kubectl kustomize k8s/base >/tmp/tracker-k8s.yaml
```

## Security baseline

- Service account tokens не монтируются.
- API, Web и Nginx запускаются non-root, без capabilities/privilege escalation, с read-only root fs.
- PostgreSQL и Redis доступны только разрешённым pods через NetworkPolicy.
- Nginx ограничивает request body, строгий login/invitation rate, общий API rate и число Socket.IO connections;
  refresh/logout дополнительно ограничены policy API.
- Secret manifest отсутствует в Git; `k8s/secret.env` игнорируется.
- Demo seed и Swagger выключены в base config.

## Production overlay

Production overlay должен заменить локальные data services и секреты:

1. immutable registry tags/digests вместо `latest`;
2. TLS ingress и корректные public CORS/socket URLs;
3. External Secrets/Vault/KMS и credential rotation;
4. managed PostgreSQL/Redis с TLS, HA, backup и restore drills;
5. отдельный single-run `prisma migrate deploy` job;
6. replicas/HPA/PDB и distributed rate limiting;
7. centralized logs, metrics, traces, alerts и SLO;
8. namespace policy под возможности конкретного cluster CNI.

`NEXT_PUBLIC_*` встраиваются при сборке Web image. Для другого публичного URL пересоберите образ с
соответствующими build args.

Эксплуатационные процедуры: [`../docs/operations/runbook.md`](../docs/operations/runbook.md).
