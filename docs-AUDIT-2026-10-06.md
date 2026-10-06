# Аудит проєкту HomeEstet (home-organization)

Дата: 6 жовтня 2026. Джерело: архів `home-organizationта.zip` (58 файлів, ~9 000 рядків TS/TSX, 13 JPEG на 9,9 МБ).
Стек: React 19, Vite 8, Tailwind 4, TypeScript 7, lucide-react. Експорт із Google AI Studio.

## 1. Резюме

Це робочий клікабельний прототип сервісу з послідовною візуальною мовою. У поточному вигляді випускати його не можна з чотирьох причин:

1. У production-збірці немає жодної картинки: 13 із 13 зображень не завантажуються. У dev-режимі все виглядає нормально, тому помилку легко пропустити.
2. `npm install` падає з конфліктом peer-залежностей. Проєкт не встановлюється «з коробки».
3. Приблизно третина коду (легасі від попередньої версії «журналу») не використовується, але лежить у репозиторії та дає 55 помилок TypeScript. `npm run lint` червоний.
4. Головна функція «Зроби цю зону» не враховує вибраний бюджет і настрій, а стиль майже не впливає на результат. «AI-аналіз фото» є заглушкою з таймером і не приймає файл. Продукт обіцяє те, чого не робить.

Що перевірено: прочитано весь код; запущено `tsc --noEmit` і `vite build`; prod-збірка відкрита через `vite preview` у браузері; dev-сервер перевірено вручну (майстер «Зроби цю зону», чекбокси); в'юпорт 375px.

## 2. Що зроблено добре

- Візуальна система послідовна: палітра, Cormorant + Plus Jakarta, відступи, картки. Виглядає як дизайнерський продукт, а не шаблон.
- Українські тексти живі й конкретні (кроки, бюджети, «без свердління»).
- Дані відокремлені від компонентів (`src/data/homeestetData.ts`), типи описані (`src/types.ts`).
- Потік майстра (зона → стиль → настрій → бюджет → що вже є → результат) логічний і відповідає ідеї «спочатку використай те, що маєш».
- Живі файли (App, 8 сторінок, 5 компонентів, engine) типізуються без помилок.

## 3. Знахідки

### P0. Блокери релізу

**3.1. Усі зображення зламані в production.**
Шляхи задані рядками `'/src/assets/images/….jpg'`: `homeestetData.ts:11-21`, `content.ts:14-24`, `PhotoAIAnalyzerModal.tsx:19,100,106,112`, `BeforeAfterSlider.tsx:87,103`. Vite копіює в `dist` лише імпортовані файли, тому в `dist/` нуль `.jpg`, а сервер на ці URL віддає `index.html`. Перевірено: `vite preview` → 13/13 `<img>` мають `naturalWidth === 0`.
Виправлення: перенести файли в `public/images/` і писати `/images/x.jpg`, або імпортувати кожне зображення (`import sofa from '../assets/images/….jpg'`). Для 13 файлів простіший варіант з `public/`.

**3.2. `npm install` не проходить (ERESOLVE).**
`devDependencies.esbuild ^0.25` і `tsx` (тягне esbuild 0.25) конфліктують з peer-вимогою `vite@8` (`esbuild ^0.27 || ^0.28`). Встановлюється тільки з `--legacy-peer-deps`.
Виправлення: видалити `esbuild`, `tsx`; прибрати невикористані `express`, `dotenv`, `@google/genai`, `motion`, `@types/express`; перенести `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `autoprefixer` у `devDependencies`; дати пакету ім'я (зараз `react-example`).

**3.3. 55 помилок TypeScript, усі в мертвому коді.**
Файли: `MakeThisZone.tsx` (23), `data/content.ts` (19), `StyleGeneratorModal.tsx` (8), `ChecklistModal.tsx` (3), `ServiceHeroNav.tsx` (2). Причини: `content.ts` імпортує з `types.ts` неіснуючі типи `QuizQuestion`, `StyleQuizResult`, `PlanWeek`, `RentalLifeHack`; `ZONE_SOLUTIONS` у `content.ts` має іншу форму, ніж `ZoneSolution` у `types.ts`; навігація на неіснуючі сторінки `'plan-30-days'` і `'rental-home'`; `FREE_CHECKLIST` не існує.
Виправлення: видалити легасі (3.4). Після цього `tsc` зелений без правок живого коду.

**3.4. Третина коду не використовується (легасі «журналу»).**
Ніде не імпортуються: `ServiceHeroNav`, `ChecklistModal`, `Hero`, `CategoryGrid`, `UIKitView`, `MakeThisZone`, `SavedArticlesModal`, `ShopTheLook`, `NewsletterSection`, `StyleGeneratorModal`, `SearchModal`, сторінки `CategoryPage` і `ArticlePage`. `IdeaSectionWidget` та `ArticleCard` потрібні лише цим мертвим сторінкам. У `content.ts` живі тільки `IMAGES`, `PRODUCTS_CATALOG` і `ARTICLES_CATALOG` (через HomePage та InspirationPage); `CATEGORIES`, `ZONE_SOLUTIONS`, `STYLE_QUIZ_*`, `PLAN_30_DAYS_DATA`, `SMALL_SPACES_SOLUTIONS`, `RENTAL_LIFEHACKS` мертві. Разом ≈ 3 300 рядків із 9 000.
Наслідок: дві паралельні моделі даних (два `PRODUCTS_CATALOG` з різними товарами; два набори зон з різними id: `sofa` проти `sofa-lounge`, `coffee` проти `coffee-corner`) і всі 55 помилок типів.
Виправлення: видалити перелічені файли; з `content.ts` залишити лише `ARTICLES_CATALOG` з його товарами, або перенести статті у `homeestetData.ts` і об'єднати каталоги.

**3.5. Внутрішні посилання на ТЗ видно користувачам.**
`SmallSpacesPage.tsx:37` «Розділ 8 ТЗ», `RentedHomePage.tsx:22` «Розділ 9 ТЗ», `PersonalPlanPage.tsx:48` «Розділ 10 ТЗ», `InspirationPage.tsx:108` «Розділ 13 ТЗ», `MyHomeEstetPage.tsx:37` «(Розділ 20 ТЗ)», `PhotoAIAnalyzerModal.tsx:54` «(Розділ 21 ТЗ)».
Виправлення: замінити на користувацькі підзаголовки.

**3.6. Панель перегляду макетів (`DevicePreviewBar`) входить у продакшен.**
Темна панель «fluid / 1440px / 375px» над кожною сторінкою: це інструмент дизайн-рев'ю, а не частина сервісу. Через неї ж зламаний sticky-хедер (3.10).
Виправлення: рендерити лише за `import.meta.env.DEV` або параметром `?preview=1`; у `Header` поставити `top-0`.

### P1. Функціональні баги в живому коді (підтверджені)

**3.7. Майстер ігнорує бюджет і настрій; стиль майже не впливає** (`utils/solutionEngine.ts`).
`BUDGET_TIERS.limit` ніде не читається: вибір «До 1 000 ₴» для диванної зони дає рішення на 2 290 ₴ (плед 650 + лампа 890 + ваза 450 + олива 300). `mood` потрапляє лише в тегалайн. Фільтр стилю (рядки 92-94) пропускає все, що має тег `warm-minimalism`, а це 8 із 8 товарів. У підсумку для будь-якої зони беруться перші 4 товари каталогу в порядку оголошення.
Виправлення: (а) підбирати товари під `limit` бюджету, додаючи за пріоритетом, доки сума в межах; (б) фільтрувати за `styles.includes(style.id)` без запасного `warm-minimalism`, з фолбеком за зоною, якщо кандидатів мало; (в) використовувати `mood` хоча б для порядку кроків; (г) пояснювати користувачу, чому обрано саме ці речі.

**3.8. «Що вже є» підставляє чужі предмети при вході з параметром зони** (`ZoneBuilderPage.tsx:42,133`).
`existingItems` ініціалізується як `['диван','журнальний столик','подушки']` і оновлюється лише кліком на зону в кроці 0. При вході з картки «Кухня» на головній або з футера користувач бачить «(3 відмічено)», хоча жоден чекбокс не позначений, і ці «диван, подушки» потрапляють у рішення для кухні. Перевірено в браузері.
Виправлення: `useState(() => selectedZone.commonExistingItems.slice(0,3))` і скидання при зміні `selectedZoneId`.

**3.9. Клік по тексту чекбокса не працює** (`ZoneBuilderPage.tsx:375-396`).
`<label onClick={toggle}>` плюс `<input checked onChange={() => {}}>`: клік по тексту викликає `toggle` двічі (спливання події та активація label), стан повертається назад. Клік точно по квадратику працює. Перевірено: після кліку по тексту `checked` лишається `false`.
Виправлення: прибрати `onClick` з label, логіку перенести в `onChange` інпута.

**3.10. Sticky-хедер ховається на мобільному** (`Header.tsx:41`).
`top-[41px]` захардкоджено під висоту `DevicePreviewBar` на десктопі. На 375px панель переносить рядки і має висоту 108px, тому при скролі хедер (меню, кабінет) повністю накривається. Перевірено: перекриття 67px. Та сама проблема в `CategoryPage.tsx:96` (`top-[113px]`).
Виправлення: див. 3.6.

**3.11. Майстер і «Натхнення» не реагують на повторну навігацію** (`App.tsx:68-78,108-115`).
`ZoneBuilderPage` рендериться без `key`, тому при переході «Зроби цю зону» → футер «Спальня» компонент не перемонтовується і зона не змінюється. Те саме з `InspirationPage`: з відкритої статті клік «Натхнення» у хедері не повертає до списку.
Виправлення: `key` із параметрів `pageView` або синхронізація через `useEffect`.

**3.12. Збережене рішення неможливо відкрити.**
«Відкрити» у «Мій HomeEstet» (`MyHomeEstetPage.tsx:153`) веде на початок майстра, а не на результат. Тип `'solution-view'` оголошений у `PageView`, але не реалізований. Збереження живе лише в пам'яті вкладки: перезавантаження обнуляє `savedSolutions`, `completedTaskIds`, `userStyleId`.
Виправлення: `localStorage` через невеликий хук `usePersistedState`; сторінка `solution-view` або передача готового `ZoneSolution` у майстер.

**3.13. Підроблені початкові дані** (`App.tsx:25-26`).
Новий користувач стартує з двома «виконаними» завданнями плану (2 з 12, 17 %) і двома «збереженими» товарами. `savedProductIds` не має сеттера; `savedProducts` у `MyHomeEstetPage.tsx:26` обчислюється, але не рендериться.
Виправлення: стартувати з порожніх масивів; або реалізувати збереження товарів (кнопка в `ProductModal`, секція в кабінеті), або прибрати поле.

**3.14. Кнопки, які нічого не роблять (живий код).**
- `ProductModal.tsx:16-22` «Переглянути в магазині»: показує «Перехід…» і нікуди не переходить; усі `affiliateUrl` мають вигляд `'#…'`.
- `ProductModal.tsx:99-102` «В наявності на складі» показується завжди; поле `inStock` не читається.
- `SurpriseModal.tsx:38-41` «Зберегти ідею»: імітація успіху; «Спробувати сьогодні» просто закриває; проп `onApplyZone` ніколи не викликається.
- `ZoneBuilderPage.tsx:686-692` «Перенести в План на 30 днів»: лише навігація, у план нічого не додається.
- `ZoneBuilderPage.tsx:72-76`, `ProductModal.tsx:24-28` «Поділитися»: копіює `window.location.href`, а це завжди корінь сайту.
- `Footer.tsx:152-154` «Політика конфіденційності», «Партнерська угода»: `<span>` без посилань.
Виправлення: реалізувати або прибрати. Нечесний стан гірший за відсутність функції.

**3.15. «AI-аналіз фото» є імітацією** (`PhotoAIAnalyzerModal.tsx`).
Дропзона без `<input type="file">` і без обробника drop; будь-який клік запускає `setTimeout(1200)` і показує один захардкоджений результат («Диванна зона · Студія», «шум 58 %»), навіть для зразка «Кухонна стільниця». `metadata.json` декларує `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`, `.env.example` просить `GEMINI_API_KEY`, пакет `@google/genai` встановлений, і нічого з цього не використовується.
Виправлення (рішення продуктове): (а) реальний аналіз: серверний ендпоінт приймає зображення, викликає модель, повертає JSON `{zone, style, noiseLevel, actions[]}`; клієнт показує завантаження та помилки; або (б) прибрати «AI» з назв, кнопок і метаданих і назвати це «Приклад аналізу». Поточний варіант вводить в оману.

**3.16. Тест стилю визначає результат лише четвертим питанням** (`StyleQuizPage.tsx:24-40`).
`selectedVisualSpace` має дефолт `'warm-minimalism'` і завжди truthy, тому інші гілки `calculateResult` недосяжні; відповіді на 5 із 6 питань ігноруються. У питанні 4 показано лише 4 з 8 стилів (`STYLES.slice(0, 4)`), тож `modern`, `cozy`, `classic`, `contemporary` ніколи не можуть стати результатом.
Виправлення: ваги «відповідь → бали по стилях» для всіх 6 питань, сума, максимум; показати всі 8 стилів у питанні 4.

**3.17. «До / Після» порівнює різні кімнати.**
`BeforeAfterSlider.tsx:87,103` на головній: «до» це комора, «після» це диванна зона. `RentedHomePage`: у всіх трьох кейсах `beforeImage` одна й та сама комора. Список змін і бюджет «2 500 ₴» у слайдері захардкоджені й не залежать від `data`.
Виправлення: парні фото однієї сцени; `changesList` і бюджет винести в дані.

**3.18. Дрібний хардкод.** `RentedHomePage.tsx:75` «ТАК (100 % мобільно)» не читає `canTakeWhenMoving`; `MyHomeEstetPage.tsx:176` «з 12» замість `PLAN_TASKS.length`.

### P2. Продукт і UX

**3.19. Три з шести карток на головній ведуть в одне місце.** «Зробити красивіше», «Оновити кімнату», «Вкластися в бюджет» → `zone-builder` без параметрів; «Навести порядок» → список статей. Намір користувача втрачається на першому ж кліку.
Виправлення: передавати намір у майстер (`intent: 'budget'` → одразу крок бюджету з «До 1 000»; `intent: 'beautify'` → крок стилю); «Навести порядок» → план, тиждень 1.

**3.20. Немає URL-адрес.** Уся навігація в `useState`: кнопка «Назад» браузера виходить із сайту, оновлення сторінки скидає все, статті не мають адрес. Для сервісу, який у `metadata.json` названо «онлайн-журналом», це критично для SEO та шерингу.
Виправлення: `react-router` або мінімальний роутер: `/zone/:zoneId`, `/style-quiz`, `/plan`, `/inspiration/:articleId`, `/me`.

**3.21. Модалки без базової поведінки.** Esc не закриває; клік по фону не закриває (на оверлеї немає `onClick`, хоча всередині є `stopPropagation`); немає `role="dialog"` і `aria-modal`; фокус не переноситься; скрол сторінки не блокується.
Виправлення: один компонент `Modal` (або нативний `<dialog>`), три живі модалки на ньому.

**3.22. Ціни без форматування.** `1850 ₴` поряд із `1 200 – 2 400 ₴`. Потрібен `formatUAH` на `Intl.NumberFormat('uk-UA')`.

**3.23. Статті в «Натхненні» без товарів.** `ARTICLES_CATALOG` має `sections[].products` (6 блоків), але `InspirationPage` їх не рендерить; готовий `IdeaSectionWidget` не підключений.

**3.24. Одне фото для різних сутностей.** Зона «Ванна» показує кухню, «Балкон» і стиль Contemporary показують диванну зону, стиль Natural показує комору. Для продукту про візуальний стиль це помітно.

### P3. Якість коду

**3.25. 536 захардкоджених hex-кольорів** (`[#967259]` ×168, `[#2C2C2C]` ×107, `[#FAF8F5]` ×61, `[#ECE8E1]` ×49…), хоча в `index.css` оголошені токени `--color-wood`, `--color-graphite`, `--color-warm-bg`, `--color-sage`, `--color-warm-border`. Заміна на `text-wood`, `bg-warm-bg` тощо: sed по 12 значеннях закриває 95 %.

**3.26. Класи анімацій без плагіна.** `animate-in` (28), `fade-in` (26), `zoom-in-95`, `slide-in-from-top`, `animate-spin-slow`, `no-scrollbar` ніде не визначені (плагін `tailwindcss-animate` не встановлений). Або поставити `tw-animate-css` (сумісний з Tailwind 4) і визначити `no-scrollbar`, або видалити класи.

**3.27. tsconfig.** Немає `strict` і `include`; `paths` `@/*` вказує на корінь репо й не використовується; `experimentalDecorators` і `useDefineForClassFields: false` без потреби. Рекомендація: `strict: true`, `include: ["src"]`, прибрати зайве.

**3.28. vite.config.ts.** `__dirname` в ESM-проєкті (Vite попереджає про майбутню несумісність); alias `@` не використовується. Коментарі про AI Studio (`DISABLE_HMR`) прибрати разом із README-шаблоном.

**3.29. Невикористані імпорти.** `Sparkles`, `Layers`, `Palette`, `Dices`, `DollarSign`, `ShieldCheck`, `Check`, `ExternalLink` у HomePage; схоже в Header, Footer, MyHomeEstetPage, InspirationPage, PersonalPlanPage, StyleQuizPage. Потрібен ESLint; зараз `lint` це лише `tsc`.

**3.30. Типи.** `PageView` містить 5 нереалізованих варіантів (`solution-view`, `article`, `category`, `products`, `ai-analyzer`); `UserProfile` не використовується; `as any` у `PersonalPlanPage.tsx:97`. `App.tsx` для невідомого типу мовчки показує головну; краще вичерпний `switch` з `never`.

**3.31. solutionEngine.** `id` з `Date.now()` (щоразу новий, тому «Збережено» губиться після регенерації того самого набору); `freeTips` обчислюються, але не показуються; `renterFriendly` завжди `true`.

**3.32. Немає ESLint, Prettier, тестів, CI.** Мінімум: ESLint і 5 юніт-тестів на `generateZoneSolution` (ліміт бюджету, виключення наявних речей, фільтр стилю) через Vitest.

### P4. Продуктивність, доступність, SEO

**3.33. Зображення: 9,9 МБ JPEG, 660-870 КБ кожне при 1200-1376px.** Норма для таких розмірів 120-200 КБ у WebP. Жоден `<img>` не має `width`/`height` (CLS); `loading="lazy"` лише на 4 з 34 `<img>` у коді. На мобільному при скролі видно довге порожнє поле замість карток зон, поки вантажаться файли.
Виправлення: WebP (q≈80) у двох розмірах (800/1400), `srcset` і `sizes`, `width`/`height`, lazy для всього нижче першого екрана, `fetchpriority="high"` на hero.

**3.34. Доступність.** Картки зон на головній, товари, рядки плану, картки стилів це `<div onClick>` без `role`, `tabIndex`, `onKeyDown` (недоступні з клавіатури); кнопка меню без `aria-expanded`; слайдер «До/Після» керується лише мишею і тачем; `text-stone-400` на білому (≈2,5:1) нижче AA для підписів.

**3.35. SEO та мета.** Немає favicon, `og:image`, `canonical`, `robots.txt`; одна URL на весь сайт (3.20). `lang="uk"`, `title` і `description` на місці.

**3.36. `window.scrollTo({behavior:'smooth'})` на кожну зміну `pageView`,** включно з повторним вибором тієї самої сторінки. Після роутингу замінити на скрол при зміні `pathname` і поважати `prefers-reduced-motion`.

## 4. Список конкретних змін

Порядок дорівнює рекомендованій послідовності. Оцінка в годинах орієнтовна.

### Етап A. Збірність і чесність (≈ 1 день)

| # | Файл(и) | Що зробити | Год |
|---|---|---|---|
| A1 | `src/assets/images/*` → `public/images/*`; `homeestetData.ts:11-21`, `content.ts:14-24`, `PhotoAIAnalyzerModal.tsx:19,100,106,112`, `BeforeAfterSlider.tsx:87,103` | Перенести картинки в `public/images`, замінити `/src/assets/images/` на `/images/`. Перевірити `vite build && vite preview`. | 0,5 |
| A2 | `package.json` | Видалити `esbuild`, `tsx`, `express`, `dotenv`, `@google/genai`, `motion`, `@types/express`; перенести `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `autoprefixer` у `devDependencies`; `"name": "homeestet"`; скрипт `clean` без `server.js`. Перевірити чистий `npm install`. | 0,5 |
| A3 | `components/{ServiceHeroNav,ChecklistModal,Hero,CategoryGrid,UIKitView,MakeThisZone,SavedArticlesModal,ShopTheLook,NewsletterSection,StyleGeneratorModal,SearchModal}.tsx`, `pages/{CategoryPage,ArticlePage}.tsx`, `components/ArticleCard.tsx` | Видалити. `IdeaSectionWidget.tsx` залишити для B6. | 0,5 |
| A4 | `data/content.ts` | Залишити `IMAGES`, `PRODUCTS_CATALOG` (для статей) і `ARTICLES_CATALOG`; видалити `CATEGORIES`, `ZONE_SOLUTIONS`, `STYLE_QUIZ_QUESTIONS`, `STYLE_QUIZ_RESULTS`, `PLAN_30_DAYS_DATA`, `SMALL_SPACES_SOLUTIONS`, `RENTAL_LIFEHACKS` і зайві імпорти типів. Прибрати з об'єктів `Article` поля `isRentalSpecific`, `isSmallSpaceSpecific` або додати їх у тип. Перейменувати файл на `articlesData.ts`. | 1 |
| A5 | `types.ts` | Прибрати з `PageView` варіанти `article`, `category`, `products`, `ai-analyzer` (`solution-view` залишити під C3); видалити `UserProfile`. | 0,25 |
| A6 | `tsconfig.json` | `"strict": true`, `"include": ["src"]`; прибрати `paths`, `experimentalDecorators`, `useDefineForClassFields`. Виправити те, що підсвітить strict. | 1 |
| A7 | Шість файлів з 3.5 | Замінити «Розділ N ТЗ» на користувацькі підзаголовки. | 0,25 |
| A8 | `App.tsx:142-149`, `Header.tsx:41` | `DevicePreviewBar` лише під `import.meta.env.DEV`; `Header` → `top-0`. | 0,25 |
| A9 | `README.md`, `metadata.json`, `.env.example`, `vite.config.ts` | README під проєкт; прибрати `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` і `GEMINI_API_KEY`, поки немає бекенду; `__dirname` → `import.meta.dirname`; прибрати alias `@`. | 0,5 |
| A10 | новий `eslint.config.js` | ESLint flat config: `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`; `"lint": "eslint . && tsc --noEmit"`. Прибрати невикористані імпорти. | 1 |

### Етап B. Живі баги (≈ 2 дні)

| # | Файл(и) | Що зробити | Год |
|---|---|---|---|
| B1 | `utils/solutionEngine.ts` | Підбір під `budget.limit`: кандидати за пріоритетом (освітлення → текстиль → органайзер → декор → рослина), додавати, доки сума в межах ліміту. Стиль: `product.styles.includes(style.id)` без запасного `warm-minimalism`; якщо кандидатів менше 2, добирати за зоною. Повертати `whySelected`. Стабільний `id` без `Date.now()` (з параметрів). | 3 |
| B2 | `ZoneBuilderPage.tsx:42,133,375-396` | `existingItems` ініціалізувати зі `selectedZone` і скидати при зміні зони. Чекбокс: прибрати `onClick` з `<label>`, перенести в `onChange`. | 0,5 |
| B3 | `App.tsx:68-78,108-115` | `key` на `ZoneBuilderPage` і `InspirationPage` з параметрів `pageView`. | 0,25 |
| B4 | `App.tsx:23-26`, новий `hooks/usePersistedState.ts` | `userStyleId`, `savedSolutions`, `completedTaskIds` у `localStorage`; стартові значення порожні; прибрати seed `['task-w1-1','task-w1-2']` і `['prod-waffle-throw','prod-ceramic-lamp']`. | 1 |
| B5 | `StyleQuizPage.tsx:24-40,220` | Ваги для всіх 6 питань → сума по 8 стилях → максимум. У питанні 4 показати всі стилі (сітка 2×4). | 2 |
| B6 | `InspirationPage.tsx:61-76` | Рендерити `sec.products` через `IdeaSectionWidget`. | 0,5 |
| B7 | `ProductModal.tsx:16-22,64-69,99-102` | «Переглянути в магазині» → `window.open(url, '_blank', 'noopener')` і `rel="sponsored"`; бейдж наявності з `inStock`; `rating` тільки разом із `reviewsCount`. Доки `affiliateUrl` це `'#'`, кнопку не показувати. | 0,5 |
| B8 | `SurpriseModal.tsx`, `App.tsx:187-194`, `homeestetData.ts` (SURPRISE_IDEAS) | «Зберегти ідею» → реальне додавання в план (`customTasks` у стані і `localStorage`); «Спробувати сьогодні» → перехід у відповідну зону через `onApplyZone` (додати `zoneId` у `SurpriseIdea`). | 1,5 |
| B9 | `ZoneBuilderPage.tsx:686-692` | «Перенести в План» → створити 4 задачі зі `steps` (тиждень за категорією), показати підтвердження. | 1 |
| B10 | `BeforeAfterSlider.tsx` | `changesList`, бюджет, підписи брати з `data`; парні фото однієї сцени; керування через `<input type="range">` (клавіатура); `clientWidth` через `ResizeObserver`, не в рендері. | 1,5 |
| B11 | `RentedHomePage.tsx:75`, `MyHomeEstetPage.tsx:176` | Читати `canTakeWhenMoving`; `PLAN_TASKS.length`. | 0,25 |
| B12 | `MyHomeEstetPage.tsx:26`, `ProductModal.tsx` | Або секція «Збережені товари» плюс кнопка «Зберегти» в модалці товару, або прибрати `savedProductIds`. | 1 |
| B13 | новий `components/Modal.tsx` | Esc, клік по фону, `role="dialog" aria-modal="true"`, фокус на перший елемент і повернення, блокування скролу body. Перевести `SurpriseModal`, `PhotoAIAnalyzerModal`, `ProductModal`. | 1,5 |
| B14 | новий `utils/format.ts` | `formatUAH(n)` через `Intl.NumberFormat('uk-UA')`; замінити всі `{x} ₴`. | 0,5 |

### Етап C. Продукт (за пріоритетом бізнесу)

| # | Що зробити | Год |
|---|---|---|
| C1 | Роутер з URL для всіх сторінок і статей (`react-router` v7); скрол при зміні `pathname`; `prefers-reduced-motion`. | 4 |
| C2 | Головна: передавати намір у майстер (`intent`); «Навести порядок» → план, тиждень 1; «Вкластися в бюджет» → крок бюджету з «До 1 000». | 1,5 |
| C3 | Сторінка збереженого рішення (`/me/solutions/:id`) замість перезапуску майстра. | 2 |
| C4 | AI-аналіз: (а) бекенд-ендпоінт, реальний `<input type="file" accept="image/*">`, стани завантаження і помилок, ліміт 5 МБ; або (б) прибрати «AI» з назв і метаданих, лишити «Приклад аналізу». | 8 або 0,5 |
| C5 | Футер: сторінки «Політика конфіденційності», «Партнерська угода», контакти; реальні партнерські URL і текст розкриття. | 2 |
| C6 | Унікальні фото для ванни, балкона, стилів Natural і Contemporary; парні «до/після». | контент |

### Етап D. Продуктивність і доступність

| # | Що зробити | Год |
|---|---|---|
| D1 | 13 JPEG → WebP 800/1400px (`sharp`), `srcset`/`sizes`, `width`/`height`, lazy нижче фолда, `fetchpriority="high"` на hero. Ціль: до 1,5 МБ на головну. | 2 |
| D2 | `<div onClick>` → `<button>`/`<a>` (картки зон, товари, стилі, рядки плану); `aria-expanded` на меню; `aria-pressed` на фільтрах. | 2 |
| D3 | Токени кольорів: `[#967259]`→`wood`, `[#2C2C2C]`→`graphite`, `[#FAF8F5]`→`warm-bg`, `[#ECE8E1]`→`warm-border`, `[#8A9A86]`→`sage`; додати в `@theme` `--color-wood-dark: #7e5f49`, `--color-cream: #FAF2EB`, `--color-ink: #1C1A18`. | 1,5 |
| D4 | `tw-animate-css` або видалити `animate-in`/`fade-in`/…; визначити `no-scrollbar` в `index.css`. | 0,5 |
| D5 | `favicon.svg`, `og:image`, `canonical`, `robots.txt`; sitemap після C1. | 1 |
| D6 | Vitest: 5 тестів на `generateZoneSolution`, 1 на квіз. | 2 |

## 5. Результати інструментальних перевірок

- `tsc --noEmit`: 55 помилок (п. 3.3).
- `vite build`: успішно; `dist` = 409 КБ JS (113 КБ gzip), 69 КБ CSS, 0 зображень; у бандлі 13 рядкових шляхів `/src/assets/images/…`.
- `vite preview` у браузері: 13 із 13 `<img>` зламані.
- Dev-сервер, майстер з картки «Кухня» → крок «Що вже є»: 0 відмічених чекбоксів, напис «(3 відмічено)»; клік по тексту чекбокса не змінює стан, клік по квадратику змінює.
- В'юпорт 375px: панель макетів 108px, хедер `top: 41px`, перекриття 67px при скролі.
- Зображення: 13 файлів, 660-870 КБ, 1200×896 або 1376×768, дублікатів немає.
