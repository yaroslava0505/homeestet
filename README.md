# HomeEstet

Сервіс для створення естетичного та затишного дому: майстер «Зроби цю зону», тест стилю, рішення для маленьких
та орендованих квартир, план на 30 днів і журнал ідей. Українська мова, без бекенду: усе, що користувач зберігає,
лежить у `localStorage` його браузера.

Стек: React 19, Vite 8, Tailwind CSS 4, TypeScript (strict), Vitest.

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

## Структура

```
assets-src/images/      оригінальні JPEG (не потрапляють у збірку)
public/images/          згенеровані WebP у двох розмірах (640 / 1200–1280 px)
scripts/optimize-images.mjs  генерує public/images та src/data/images.ts
src/
  App.tsx               стан застосунку, роутинг, збереження в localStorage
  lib/router.ts         мінімальний history-роутер (див. маршрути нижче)
  lib/storage.ts        усі ключі localStorage та helper-функції
  utils/solutionEngine.ts  підбір рішення для зони (стиль, настрій, бюджет, наявні речі)
  utils/quizEngine.ts   питання тесту стилю та підрахунок балів
  data/products.ts      єдиний каталог товарів з атрибутами для движка
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
| `/zones`                     | Майстер «Зроби цю зону», вибір зони           |
| `/zones/:zoneId`             | Майстер для зони (`?style=` підставляє стиль) |
| `/zones/:zoneId/result?…`    | Готове рішення; посилання можна ділитися      |
| `/style`                     | Тест стилю                                    |
| `/small-spaces`, `/rented`   | Маленький дім, орендована квартира            |
| `/plan`                      | План на 30 днів                               |
| `/inspiration`, `/inspiration/:articleId` | Журнал                           |
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

Усі операції зібрані в `src/lib/storage.ts`.

## Що ще не підключено

- **Аналіз фото.** Модель не підключена: діалог приймає фото (перевірка типу і розміру, прев’ю локально),
  показує чесний статус «готується» і приклад майбутнього звіту. Для реального аналізу потрібен серверний
  ендпоінт, ключ API не має потрапляти у фронтенд.
- **Посилання на магазини.** Поле `affiliateUrl` у товарів порожнє до запуску каталогу партнерів; кнопка
  показує статус замість переходу.
- **Фото «до/після».** Для кейсів оренди використано різні сцени; потрібні парні знімки однієї кімнати.
