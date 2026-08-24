export type Audience = 'public' | 'basu';

export type PriceTier = {
  min: number;
  max: number;
  publicThousands: number | null;
  basuThousands: number;
  note: string;
  priority: number;
};

export type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: 'decor' | 'flower' | 'display' | 'gown';
  description: string;
  capacity: number;
  publicThousands: number | null;
  basuThousands: number | null;
  art: string;
  accent: 'blue' | 'coral' | 'lime' | 'violet' | 'amber' | 'ink';
  tiers?: PriceTier[];
};

export const SOURCE_WORKBOOK = 'رزرو و قیمت ها.xlsx#قیمت ها!A1:D26';

export const GOWN_TIERS: PriceTier[] = [
  { min: 1, max: 1, publicThousands: 399, basuThousands: 359, note: 'یک دست', priority: 1 },
  { min: 2, max: 3, publicThousands: 389, basuThousands: 349, note: '۲ تا ۳ دست', priority: 2 },
  { min: 4, max: 6, publicThousands: 379, basuThousands: 329, note: '۴ تا ۶ دست', priority: 3 },
  { min: 6, max: 10, publicThousands: 359, basuThousands: 319, note: '۶ تا ۱۰ دست', priority: 4 },
  { min: 10, max: 20, publicThousands: 339, basuThousands: 309, note: '۱۰ تا ۲۰ دست', priority: 5 },
  { min: 20, max: 30, publicThousands: null, basuThousands: 299, note: 'ویژه انجمن‌ها؛ قیمت آزاد نیازمند استعلام', priority: 6 },
];

export const CATALOG: CatalogItem[] = [
  {
    id: 'eq-grad', slug: 'grad-letters', name: 'استند حروف GRAD', shortName: 'GRAD', category: 'decor',
    description: 'حروف مستقل و خوش‌خوان برای قاب‌های فارغ‌التحصیلی و ورودی رویداد.', capacity: 4,
    publicThousands: 999, basuThousands: 799, art: 'GRAD', accent: 'blue',
  },
  {
    id: 'eq-1400', slug: '1400-numbers', name: 'استند اعداد ۱۴۰۰', shortName: '۱۴۰۰', category: 'decor',
    description: 'اعداد بزرگ مناسب جشن ورودی، فارغ‌التحصیلی و کمپین‌های دانشجویی.', capacity: 4,
    publicThousands: 999, basuThousands: 799, art: '۱۴۰۰', accent: 'amber',
  },
  {
    id: 'eq-combo', slug: 'grad-1400-combo', name: 'استند اعداد و حروف', shortName: 'GRAD + ۱۴۰۰', category: 'decor',
    description: 'بسته کامل حروف و اعداد با چیدمان هماهنگ و قیمت یکپارچه.', capacity: 2,
    publicThousands: 1799, basuThousands: 1699, art: 'G + 14', accent: 'violet',
  },
  {
    id: 'eq-bouquet', slug: 'bouquet', name: 'دسته‌گل', shortName: 'دسته‌گل', category: 'flower',
    description: 'دسته‌گل مناسب عکس و مراسم؛ تحویل هم‌زمان با سایر تجهیزات.', capacity: 20,
    publicThousands: 299, basuThousands: 199, art: '✿', accent: 'coral',
  },
  {
    id: 'eq-easel', slug: 'easel', name: 'سه‌پایه بوم', shortName: 'سه‌پایه', category: 'display',
    description: 'برای نمایش پوستر، بوم، راهنما یا تابلوی خوش‌آمدگویی رویداد.', capacity: 12,
    publicThousands: 149, basuThousands: 99, art: 'A', accent: 'lime',
  },
  {
    id: 'eq-gown', slug: 'graduation-gown', name: 'لباس فارغ‌التحصیلی', shortName: 'لباس', category: 'gown',
    description: 'لباس کامل فارغ‌التحصیلی با قیمت پلکانی بر اساس تعداد گروه.', capacity: 30,
    publicThousands: 399, basuThousands: 359, art: '🎓', accent: 'ink', tiers: GOWN_TIERS,
  },
];

export function findCatalogItem(idOrSlug: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
}

export function resolveUnitPriceThousands(item: CatalogItem, quantity: number, audience: Audience): number | null {
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error('تعداد باید یک عدد صحیح مثبت باشد.');
  if (item.tiers) {
    const tier = [...item.tiers].sort((a, b) => a.priority - b.priority)
      .find((candidate) => quantity >= candidate.min && quantity <= candidate.max);
    if (!tier) return null;
    return audience === 'basu' ? tier.basuThousands : tier.publicThousands;
  }
  return audience === 'basu' ? item.basuThousands : item.publicThousands;
}

export function quoteLine(item: CatalogItem, quantity: number, audience: Audience) {
  const unitThousands = resolveUnitPriceThousands(item, quantity, audience);
  return {
    itemId: item.id,
    quantity,
    unitThousands,
    totalThousands: unitThousands === null ? null : unitThousands * quantity,
    quoteRequired: unitThousands === null,
  };
}

export type TierPricingInsight = {
  baseUnitThousands: number | null;
  currentUnitThousands: number | null;
  savingPerUnitThousands: number | null;
  totalSavingThousands: number | null;
  nextQuantity: number | null;
  nextUnitThousands: number | null;
};

export function tierPricingInsight(
  item: CatalogItem,
  quantity: number,
  audience: Audience,
): TierPricingInsight | null {
  if (!item.tiers || !Number.isInteger(quantity) || quantity < 1) return null;

  const baseUnitThousands = resolveUnitPriceThousands(item, 1, audience);
  const currentUnitThousands = resolveUnitPriceThousands(item, quantity, audience);
  const savingPerUnitThousands =
    baseUnitThousands !== null && currentUnitThousands !== null
      ? Math.max(0, baseUnitThousands - currentUnitThousands)
      : null;

  let nextQuantity: number | null = null;
  let nextUnitThousands: number | null = null;
  if (currentUnitThousands !== null) {
    for (let candidate = quantity + 1; candidate <= item.capacity; candidate += 1) {
      const candidateUnit = resolveUnitPriceThousands(item, candidate, audience);
      if (candidateUnit !== null && candidateUnit < currentUnitThousands) {
        nextQuantity = candidate;
        nextUnitThousands = candidateUnit;
        break;
      }
    }
  }

  return {
    baseUnitThousands,
    currentUnitThousands,
    savingPerUnitThousands,
    totalSavingThousands:
      savingPerUnitThousands === null ? null : savingPerUnitThousands * quantity,
    nextQuantity,
    nextUnitThousands,
  };
}

export function formatTomanFromThousands(value: number | null): string {
  if (value === null) return 'نیازمند استعلام';
  return `${new Intl.NumberFormat('fa-IR').format(value)} هزار تومان`;
}
