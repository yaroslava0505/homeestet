# HomeEstet

Сервіс для створення естетичного та затишного дому. Головна функція: **«Фото → план»**, користувач фотографує кут
кімнати і отримує діагноз, 5 конкретних кроків і покупки в межах бюджету. Допоміжні: майстер «Зроби цю зону»,
тест стилю, рішення для маленьких та орендованих квартир, план на 30 днів і лайфхаки. Українська мова.
Усе, що користувач зберігає, лежить у `localStorage` його браузера; єдиний серверний компонент — функція аналізу фото.

Стек: React 19, Vite 8, Tailwind CSS 4, TypeScript (strict), Vitest, Cloudflare Pages + Pages Functions,
Anthropic SDK (модель Claude).

## Запуск

```bash
npm install
npm run dev        # http://localhost:3000
```

## Скрипти

| Команда             | Що робить                                                                 |
| ------------------- | ------------------------------------------------------------------------- |
| `npm run dev`       | Dev-сервер з панеллю перегляду макетів 1440/375 (тільки в development)    |
| `npm run build`     | Production-збірка в `dist/`                                               |
| `npm run preview`   | Перегляд production-збірки                                                |
| `npm run typecheck` | `tsc --noEmit`, має бути 0 помилок                                        |
| `npm test`          | Юніт-тести движка рішень і тесту стилю (`src/__tests__`)                  |
| `npm run images`    | Перегенерувати WebP з оригіналів у `assets-src/images` (потрібен `sharp`) |
| `npm run shop`      | Зібрати `src/data/shopCatalog.ts` з `assets-src/shop/*.json` (варіанти товарів) |
| `npm run shop:fetch`| Оновити `assets-src/shop/epicentr.json` зі сторінок категорій Епіцентру     |
| `npm run dev:cf`    | Збірка + локальний Cloudflare Pages з функцією `/api/analyze` на :8788   |

## Аналіз фото («Фото → план»)

```
браузер                          Cloudflare Pages Function            Anthropic API
AnalyzePage ──prepareImage──►  POST /api/analyze (functions/api/)  ──►  claude-haiku-4-5 (vision,
 стискає до 1024px, JPEG         перевіряє тіло, квоти, промпт          structured output)
 ◄── PhotoPlan (JSON) ◄──────  normalizePlan: товари ≤ бюджету  ◄──────  ModelPlanSchema (zod)
```

- `src/lib/photoPlan.ts`: системний промпт з каталогом товарів, zod-схема відповіді, нормалізація (ніколи не
  перевищує бюджет, відкидає невідомі товари). Покрито тестами в `src/__tests__/photoPlan.test.ts`.
- `functions/api/analyze.ts`: приймає `{ image: { data, mediaType }, budgetId, rental, note }`, повертає
  `AnalyzeResponse`. Ключ API існує лише на сервері. Фото не зберігається.
- `src/lib/analyzeClient.ts`: валідація файлу, стискання в браузері, запит.
- Збережені аналізи: `homeestet_photo_plans` у localStorage (до 12, з мініатюрою).

**Варіанти з магазинів.** Крім 5 кроків, модель називає 2–4 категорії речей (`shopping`: органайзери, плед,
картина, лампа тощо з переліку `src/data/shopCategories.ts`), а сторінка показує для кожної кілька реальних
товарів у різних цінах у межах бюджету, з посиланням у магазин. Каталог: `src/data/shopCatalog.ts`,
генерується з `assets-src/shop/sinsay.json` (зібрано вручну, сайт рендериться скриптами) і
`assets-src/shop/epicentr.json` (`npm run shop:fetch` читає JSON-LD зі сторінок категорій). Картинки
завантажуються з CDN магазинів, у репозиторій не копіюються. Для аналізів, збережених до появи блоку, беруться
типові категорії зони (`ZONE_SHOP_DEFAULTS`). Партнерські посилання: коли буде акаунт Admitad (Sinsay UA,
AliExpress, Temu, Rozetka), префікс deeplink прописується в `AFFILIATE_PREFIX` у `src/lib/shop.ts`, і всі
посилання стають відстежуваними без змін у каталозі.

**Два постачальники моделі**, вибір автоматичний:

- **Cloudflare Workers AI** (типово, поки немає ключа): модель `@cf/meta/llama-4-scout-17b-16e-instruct`
  через `[ai]`-binding у `wrangler.toml`. Безкоштовна денна квота (10 000 «нейронів», це приблизно
  60–80 аналізів на день), картка не потрібна. Поради простіші, українська мова слабша за Claude.
- **Anthropic (Claude)**: щойно в Cloudflare з’являється секрет `ANTHROPIC_API_KEY` (Workers & Pages →
  homeestet → Settings → Variables and secrets → Add → тип **Secret**, значення з console.anthropic.com),
  після наступного деплою функція сама переходить на Claude. `ANALYSIS_PROVIDER=anthropic|workers-ai`
  закріплює постачальника примусово.

Без жодного з них функція відповідає 503, а сторінка показує чесне повідомлення «аналіз ще не підключено».

**Модель і вартість.** Модель задається у `wrangler.toml` (`ANALYSIS_MODEL`), типово `claude-haiku-4-5`.
Один аналіз ≈ 2,5–3 тис. вхідних токенів (фото 1024 px + промпт із каталогом) і близько 1 тис. вихідних:

| Модель            | За аналіз      | 1 000 аналізів |
| ----------------- | -------------- | -------------- |
| `claude-haiku-4-5` | ≈ $0.01, 0,4 ₴ | ≈ $10          |
| `claude-sonnet-5` | ≈ $0.02–0.03   | ≈ $25          |
| `claude-opus-5`   | ≈ $0.05–0.08   | ≈ $60          |

Запит підлаштовується під модель (`modelRequestOptions` у `src/lib/photoPlan.ts`): `effort: low` для
Sonnet/Opus, серверні fallbacks лише для Opus, Haiku без цих параметрів.

**Контроль витрат, три шари:**

1. **Ліміт витрат у кабінеті Anthropic** (console.anthropic.com → Limits): це жорстка стеля, рахунок не може
   її перевищити. Коли її вичерпано, функція відповідає 503, а сторінка показує «тимчасово недоступний».
2. **Денні квоти у функції:** `ANALYSIS_DAILY_LIMIT` (на весь сайт, типово 100) і `ANALYSIS_IP_DAILY_LIMIT`
   (на адресу, типово 5). Працюють, коли до проєкту прив’язано KV-простір `ANALYSIS_KV`, див. коментар у
   `wrangler.toml`. Додатково варто створити Rate Limiting Rule у Cloudflare (Security → WAF) для `/api/analyze`.
3. **Ліміт у браузері:** 3 аналізи на день (`DAILY_ANALYSIS_LIMIT` у `src/lib/storage.ts`), лічильник у localStorage.

**Локально:** скопіювати `.dev.vars.example` у `.dev.vars`. З `ANALYSIS_MOCK=1` функція повертає готовий
план без виклику моделі (для роботи над інтерфейсом); з `ANTHROPIC_API_KEY=` викликає модель. Запуск:
`npm run dev:cf`.

## Структура

```
assets-src/images/      оригінальні JPEG (не потрапляють у збірку)
assets-src/shop/        сирі вивантаження каталогів магазинів (JSON, не потрапляють у збірку)
public/images/          згенеровані WebP у двох розмірах (640 / 1200–1280 px)
scripts/optimize-images.mjs  генерує public/images та src/data/images.ts
src/
  App.tsx               стан застосунку, роутинг, збереження в localStorage
  lib/router.ts         мінімальний history-роутер (див. маршрути нижче)
  lib/storage.ts        усі ключі localStorage та helper-функції
  utils/solutionEngine.ts  підбір рішення для зони (стиль, настрій, бюджет, наявні речі)
  utils/quizEngine.ts   питання тесту стилю та підрахунок балів
  data/products.ts      єдиний каталог товарів з атрибутами для движка
  data/shopCategories.ts категорії магазинів для блоку «варіанти» та типові категорії зон
  data/shopCatalog.ts   згенерований каталог реальних товарів Sinsay та Епіцентру (не редагувати вручну)
  lib/shop.ts           вибір варіантів у бюджет, посилання в магазин (місце для партнерського префікса)
  data/homeestetData.ts зони, стилі, настрої, бюджети, кейси, план, ідеї
  data/articles.ts      статті журналу
  data/images.ts        згенерована мапа зображень (не редагувати вручну)
  components/           Modal, AppImage, ProductMiniCard, модалки, хедер, футер
  pages/                сторінки
```

## Маршрути

| URL                          | Сторінка                                      |
| ---------------------------- | --------------------------------------------- |
| `/`                          | Головна                                       |
| `/analyze`                   | Аналіз фото; `/analyze/:id` збережений аналіз |
| `/zones`                     | Майстер «Зроби цю зону», вибір зони           |
| `/zones/:zoneId`             | Майстер для зони (`?style=` підставляє стиль) |
| `/zones/:zoneId/result?…`    | Готове рішення; посилання можна ділитися      |
| `/style`                     | Тест стилю                                    |
| `/small-spaces`, `/rented`   | Маленький дім, орендована квартира            |
| `/plan`                      | План на 30 днів                               |
| `/lifehacks`, `/lifehacks/:articleId` | Лайфхаки простору (стара адреса `/inspiration` працює) |
| `/saved`                     | Мій HomeEstet (стиль, збережене, товари)      |

Це SPA: хостинг має віддавати `index.html` для всіх шляхів (SPA fallback / rewrite на `/index.html`).
`vite preview` робить це автоматично.

## Деплой на Cloudflare Pages

Проєкт готовий до Cloudflare Pages: SPA-fallback там працює автоматично (у збірці немає `404.html`),
заголовки кешування лежать у `public/_headers`, версія Node задана в `.node-version`.

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → репозиторій `homeestet`.
2. Налаштування збірки:

   | Поле                  | Значення        |
   | --------------------- | --------------- |
   | Framework preset      | Vite            |
   | Build command         | `npm run build` |
   | Build output directory| `dist`          |

3. **Save and Deploy**. Кожен push у `main` публікує нову версію, pull request отримує preview-адресу.

Основний домен сайту: **https://homeestet.com** (підключається в проєкті Pages → Custom domains).
Адреса прописана в `index.html` (og:url, og:image, canonical), `public/robots.txt` і `public/sitemap.xml`;
при зміні домену оновити ці три файли.

## Дані користувача (localStorage)

| Ключ                        | Вміст                                   |
| --------------------------- | --------------------------------------- |
| `homeestet_preferences`     | обраний стиль                           |
| `homeestet_saved_ideas`     | збережені рішення та ідеї               |
| `homeestet_plan`            | виконані завдання і додані в план рішення |
| `homeestet_saved_products`  | id збережених товарів                   |
| `homeestet_quiz`            | останній результат тесту стилю          |
| `homeestet_photo_plans`     | збережені аналізи за фото               |

Усі операції зібрані в `src/lib/storage.ts`.

## Що ще не підключено

- **Партнерські посилання.** Блок «варіанти з магазинів» веде прямо на сторінки Sinsay та Епіцентру; відстеження
  (Admitad) підключається одним префіксом у `src/lib/shop.ts`. Поле `affiliateUrl` у внутрішньому каталозі
  `products.ts` порожнє; кнопка показує статус замість переходу.
- **Temu і AliExpress.** Їхні сайти закриті перевіркою «я не робот», товари звідти з’являться через партнерський
  фід Admitad після схвалення акаунта.
- **Фото «до/після».** Для кейсів оренди використано різні сцени; потрібні парні знімки однієї кімнати.
