# ADR-0002: Access token в памяти и refresh token в HttpOnly cookie

- Статус: принято
- Дата: 2026-08-21

## Контекст

Хранение bearer tokens в `localStorage` делает их доступными любому успешно выполненному XSS. Полностью
cookie-based access session увеличивает CSRF surface для каждого state-changing endpoint.

## Решение

- Access JWT короткоживущий, возвращается в response body и хранится только в памяти web-клиента.
- Refresh JWT находится в `HttpOnly`, `SameSite=Strict`, scoped cookie и недоступен JavaScript.
- Refresh token хранится сервером только как SHA-256 hash, ротируется и входит в family.
- Reuse отозванного token отзывает family; logout отзывает текущую family.
- JWT проверяется по signature, issuer, audience, token type и active user status.

## Последствия

- Перезагрузка страницы требует одного refresh request.
- XSS всё ещё может действовать от имени открытой сессии, но не может прочитать долгоживущий refresh JWT.
- SameSite, строгий CORS, JSON API и узкий cookie path снижают CSRF risk; TLS обязателен в production.
- Несколько вкладок не делят access token автоматически; refresh single-flight работает в пределах вкладки.
