import type { Article } from '../types.ts';
import { IMAGES } from './images.ts';
import { getProduct } from './products.ts';

export const ARTICLES_CATALOG: Article[] = [
  {
    id: '12-spice-organization-ideas',
    slug: '12-idei-dlya-organizatsii-spetsiy',
    title: '12 ідей для організації спецій, які виглядають на мільйон',
    categoryId: 'kitchen',
    categoryLabel: 'Кухня',
    tags: ['Спеції', 'Маленька кухня', 'Скляні баночки', 'Бамбук'],
    excerpt: 'Як перетворити хаос у кухонній шухляді на витвір естетичного мистецтва за допомогою бамбукових вставок, уніфікованих баночок та водостійких етикеток.',
    readTime: '3 хв',
    date: '12 травня 2026',
    author: {
      name: 'Олена Мельник',
      role: 'Професійний організатор простору та стиліст інтер’єру',
    },
    coverImage: IMAGES.kitchenAesthetic,
    zoneId: 'kitchen',
    intro: 'Спеції — це смакова душа будь-якої кухні, проте саме вони найчастіше стають головним джерелом безладу. Різнокаліберні пластикові та паперові пакети, розсипана паприка та марні пошуки потрібної баночки під час смаження цибулі — знайомий сценарій. Ми зібрали перевірені скандинавські прийоми, які створять відчуття спокою та дорогого готельного порядку.',
    sections: [
      {
        step: 1,
        title: 'Горизонтальна шухляда з лотками-сходинками та скляними флаконами',
        description: 'Замість глибоких вертикальних полиць, де задні ряди губляться на роки, оберіть неглибоку шухляду біля плити. Східчасті вставки під нахилом дозволяють миттєво зчитати кожну етикетку та дістати потрібний флакон однією рукою.',
        image: IMAGES.spicesDrawer,
        imageAlt: 'Бамбукова шухляда з ідеально розкладеними баночками спецій',
        products: [getProduct('prod-bamboo-tray'), getProduct('prod-glass-jars'), getProduct('prod-spice-labels')],
      },
      {
        step: 2,
        title: 'Обертова таця Lazy Susan для щоденних соусів та олій',
        description: 'Пляшки з оливковою олією, бальзамічним оцтом і млинки для солі не повинні займати робочу поверхню стільниці. Обертова таця з масиву акації тримає все разом в одній красивій групі та захищає поверхню меблів від випадкових крапель.',
        image: IMAGES.kitchenAesthetic,
        imageAlt: 'Обертова таця з дерев’яними та скляними баночками біля кухонної мийки',
        products: [getProduct('prod-lazy-susan'), getProduct('prod-oil-cruet')],
      },
      {
        step: 3,
        title: 'Уніфікована комора з прозорими боксами та плетеними кошиками',
        description: 'Коли крупи, сухі трави та запасні упаковки пересипані в прозорі герметичні ємності, ви завжди бачите залишки перед походом до магазину. Нижні полиці наповніть плетеними кошиками з водного гіацинта: вони приховують візуальний шум пакетів із борошном чи сухарями.',
        image: IMAGES.pantryHero,
        imageAlt: 'Світла комора з плетеними кошиками та скляними банками',
        products: [getProduct('prod-hyacinth-basket'), getProduct('prod-glass-jars')],
      },
    ],
    beforeAfter: {
      title: 'Трансформація простору: До і Після організації шафи',
      subtitle: 'Переміщуйте бігунок, щоб порівняти хаотичне зберігання із системою категорій за зонами',
      beforeImg: IMAGES.pantryBefore,
      afterImg: IMAGES.pantryHero,
      beforeLabel: 'До: візуальний шум і пакети',
      afterLabel: 'Після: скандинавський порядок',
      notes: 'Час виконання: 2 години. Використано: 12 скляних банок, 2 плетені кошики та бамбуковий лоток.',
    },
    relatedArticleIds: ['capsule-wardrobe-organizing', 'small-kitchen-storage-hacks'],
  },
  {
    id: 'capsule-wardrobe-organizing',
    slug: 'kapsulnyy-harderob-orhanizatsiya',
    title: 'Капсульний гардероб: 7 правил впорядкування сезонних речей',
    categoryId: 'wardrobe',
    categoryLabel: 'Гардероб',
    tags: ['Капсула', 'Сезонні речі', 'Вішалки'],
    excerpt: 'Як звільнити до 40 % площі шафи, перейти на єдині дерев’яні плічка та насолоджуватися ранковим вибором одягу без стресу.',
    readTime: '4 хв',
    date: '10 травня 2026',
    author: {
      name: 'Марта Ковальчук',
      role: 'Стиліст гардеробу',
    },
    coverImage: IMAGES.wardrobeCapsule,
    zoneId: 'bedroom',
    intro: 'Більшість людей носять лише 20 % свого гардеробу 80 % часу. Решта речей створюють тиск і візуальний хаос. Впровадження методу сезонної ротації у поєднанні з однаковими вішалками творить справжні дива з ранковим настроєм.',
    sections: [
      {
        step: 1,
        title: 'Уніфікація вішалок: чому це змінює все',
        description: 'Різнокольорові дротяні та пластикові вішалки з магазинів руйнують геометрію гардеробу. Заміна їх на тонкі дерев’яні або оксамитові плічка одного тону опускає плечі одягу на один рівень.',
        image: IMAGES.wardrobeCapsule,
        products: [getProduct('prod-linen-boxes')],
      },
    ],
    relatedArticleIds: ['12-spice-organization-ideas', 'rental-apartment-makeover'],
  },
  {
    id: 'small-kitchen-storage-hacks',
    slug: 'kukhnya-6-metriv-laifkhaky',
    title: 'Як вмістити все на кухні 6 кв.м: 10 прихованих резервів зберігання',
    categoryId: 'small-spaces',
    categoryLabel: 'Маленькі площі',
    tags: ['Маленька кухня', 'Вертикальне зберігання', 'Студія'],
    excerpt: 'Використання внутрішніх боків дверцят, магнітних планок для ножів та підвісних кошиків під полицями.',
    readTime: '4 хв',
    date: '05 травня 2026',
    author: {
      name: 'Олег Савченко',
      role: 'Архітектор компактних просторів',
    },
    coverImage: IMAGES.smallStudio,
    zoneId: 'kitchen',
    intro: 'Маленька площа — це не вирок, а привід підійти до кожного сантиметра з повагою. Ми покажемо, де знайти 30 % додаткового об’єму без ремонту.',
    sections: [
      {
        step: 1,
        title: 'Підвісні дротяні полиці другого ярусу',
        description: 'Високі проміжки між полицями часто пустують. Металеві підвісні кошики створюють другий рівень для мисок або обробних дощок без свердління.',
        image: IMAGES.kitchenAesthetic,
        products: [getProduct('prod-bamboo-tray'), getProduct('prod-magnetic-strip')],
      },
    ],
    relatedArticleIds: ['12-spice-organization-ideas', 'rental-apartment-makeover'],
  },
  {
    id: 'rental-apartment-makeover',
    slug: 'orendovana-kvartyra-bez-sverdlinnya',
    title: 'Орендована квартира: як створити затишок без свердління та згоди господаря',
    categoryId: 'small-spaces',
    categoryLabel: 'Оренда та лайфхаки',
    tags: ['Оренда', 'Без свердління', 'DIY'],
    excerpt: 'Повний гід: текстиль, клейкі кріплення Command, заміна ручок меблів і правильне світло 2700K.',
    readTime: '5 хв',
    date: '01 травня 2026',
    author: {
      name: 'Юлія Демчук',
      role: 'Декоратор інтер’єрів',
    },
    coverImage: IMAGES.sofaLiving,
    zoneId: 'sofa',
    intro: 'Жити в орендованому житлі часто означає миритися з чужими смаками, шпалерами «в квіточку» та суворою забороною забивати цвяхи. Проте дім — це те, що дає вам сили щодня. Є десятки способів трансформувати його без шкоди для стін.',
    sections: [
      {
        step: 1,
        title: 'Заміна візуального центру кімнати пледом і подушками',
        description: 'Не дивіться на стару оббивку. Якісний випраний льон та вафельний плед закривають 80 % поверхні.',
        image: IMAGES.sofaLiving,
        products: [getProduct('prod-linen-cushions'), getProduct('prod-waffle-throw')],
      },
    ],
    relatedArticleIds: ['capsule-wardrobe-organizing', '12-spice-organization-ideas'],
  },
];

export function findArticle(id: string): Article | undefined {
  return ARTICLES_CATALOG.find((a) => a.id === id);
}
