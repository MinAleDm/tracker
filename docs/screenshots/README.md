# Documentation screenshots

Галерея фиксирует production build через публичную Compose-точку `http://127.0.0.1:8080`.
Authenticated screens снимаются на demo-проекте `CORE · Core Platform`; пароль не хранится в Git.

Из корня репозитория:

```bash
docker compose up --build -d --wait
pnpm dlx playwright@1.51.1 install chromium
DOCS_DEMO_EMAIL='owner@tracker.local' \
DOCS_DEMO_PASSWORD='<local demo password>' \
pnpm dlx @playwright/test@1.51.1 test docs-screenshots.spec.ts --workers=1
```

Сценарий обновляет desktop/mobile gallery, `apps/web/public/preview.png` и PNG fallback логотипа.
Мастер логотипа — `apps/web/public/logo.svg`; вручную править растровую копию не нужно.

Перед коммитом визуально проверьте все PNG и убедитесь, что в кадрах нет паролей, cookies, tokens,
персональных данных или внутренних URL production-среды.
