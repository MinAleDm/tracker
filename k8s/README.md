# Kubernetes

Базовые манифесты лежат в [`k8s/base`](./base) и повторяют docker-compose контур:

- PostgreSQL 16
- Redis 7
- API на `3001`
- Web на `3000`
- Nginx reverse proxy на `80`

## Локальный запуск

Соберите образы с именами, которые указаны в base-манифестах:

```bash
docker build -f apps/api/Dockerfile -t tracker-api:latest .
docker build -f apps/web/Dockerfile -t tracker-web:latest .
```

Для `kind` загрузите локальные образы в кластер:

```bash
kind load docker-image tracker-api:latest
kind load docker-image tracker-web:latest
```

Примените манифесты:

```bash
kubectl apply -k k8s/base
```

Откройте приложение через port-forward:

```bash
kubectl -n tracker port-forward svc/nginx 8080:80
```

После этого web доступен на `http://localhost:8080`, API на `http://localhost:8080/api`, Swagger на `http://localhost:8080/api/docs`.

## Переопределение образов

Для registry-образов используйте overlay или временно отредактируйте kustomization:

```bash
cd k8s/base
kustomize edit set image tracker-api:latest=registry.example.com/tracker/api:TAG
kustomize edit set image tracker-web:latest=registry.example.com/tracker/web:TAG
```

## Секреты

[`secret.yaml`](./base/secret.yaml) содержит dev-значения. Перед деплоем в общий или production-кластер замените:

- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DEMO_USER_PASSWORD`

Можно заменить файл на `kubectl create secret generic tracker-secret ... --dry-run=client -o yaml` или подключить внешний secret manager.

## Важные ограничения

- API deployment оставлен в `replicas: 1`, потому что текущий entrypoint выполняет `prisma db push` и seed при старте контейнера.
- `NEXT_PUBLIC_*` значения для Next.js в основном вшиваются на этапе сборки образа. Для другого публичного URL пересоберите `tracker-web` с нужными build args.

