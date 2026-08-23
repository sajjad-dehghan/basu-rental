import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CATALOG,
  GOWN_TIERS,
  findCatalogItem,
  quoteLine,
  resolveUnitPriceThousands,
  type Audience,
} from '../app/lib/catalog.ts';

const fixedPrices: Array<[string, number, number]> = [
  ['eq-grad', 999, 799],
  ['eq-1400', 999, 799],
  ['eq-combo', 1799, 1699],
  ['eq-bouquet', 299, 199],
  ['eq-easel', 149, 99],
];

describe('قیمت‌های استخراج‌شده از شیت قیمت‌ها', () => {
  it('هر پنج قیمت ثابت را بدون تغییر نگه می‌دارد', () => {
    for (const [id, publicPrice, basuPrice] of fixedPrices) {
      const item = findCatalogItem(id);
      assert.ok(item);
      assert.equal(resolveUnitPriceThousands(item, 1, 'public'), publicPrice);
      assert.equal(resolveUnitPriceThousands(item, 1, 'basu'), basuPrice);
    }
  });

  it('تمام ردیف‌های پلکانی لباس را به ترتیب منبع نگه می‌دارد', () => {
    assert.deepEqual(
      GOWN_TIERS.map((tier) => [tier.min, tier.max, tier.publicThousands, tier.basuThousands]),
      [
        [1, 1, 399, 359],
        [2, 3, 389, 349],
        [4, 6, 379, 329],
        [6, 10, 359, 319],
        [10, 20, 339, 309],
        [20, 30, null, 299],
      ],
    );
  });

  it('همپوشانی تعداد ۶ را با اولویت اولین ردیف منبع حل می‌کند', () => {
    const gown = findCatalogItem('eq-gown');
    assert.ok(gown);
    assert.equal(resolveUnitPriceThousands(gown, 6, 'public'), 379);
    assert.equal(resolveUnitPriceThousands(gown, 6, 'basu'), 329);
    assert.equal(resolveUnitPriceThousands(gown, 7, 'public'), 359);
  });

  it('همپوشانی تعداد ۱۰ و ۲۰ نیز deterministic است', () => {
    const gown = findCatalogItem('graduation-gown');
    assert.ok(gown);
    assert.equal(resolveUnitPriceThousands(gown, 10, 'public'), 359);
    assert.equal(resolveUnitPriceThousands(gown, 20, 'public'), 339);
    assert.equal(resolveUnitPriceThousands(gown, 21, 'public'), null);
    assert.equal(resolveUnitPriceThousands(gown, 21, 'basu'), 299);
  });

  it('جمع هر خط و الزام استعلام را درست محاسبه می‌کند', () => {
    const gown = findCatalogItem('eq-gown');
    assert.ok(gown);
    assert.deepEqual(quoteLine(gown, 4, 'basu'), {
      itemId: 'eq-gown',
      quantity: 4,
      unitThousands: 329,
      totalThousands: 1316,
      quoteRequired: false,
    });
    assert.equal(quoteLine(gown, 25, 'public').quoteRequired, true);
  });

  it('ورودی تعداد نامعتبر را رد می‌کند', () => {
    const item = CATALOG[0];
    for (const audience of ['public', 'basu'] satisfies Audience[]) {
      assert.throws(() => resolveUnitPriceThousands(item, 0, audience));
      assert.throws(() => resolveUnitPriceThousands(item, 1.5, audience));
    }
  });
});
