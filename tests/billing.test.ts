import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  finalInvoiceTotalThousands,
  invoiceRequiresReview,
} from "../app/lib/billing";

describe("فاکتور نهایی و هزینه ارسال", () => {
  it("برای دریافت حضوری همان جمع تجهیزات را نهایی می‌کند", () => {
    const input = {
      subtotalThousands: 1_316,
      deliveryMethod: "pickup" as const,
    };
    assert.equal(finalInvoiceTotalThousands(input), 1_316);
    assert.equal(invoiceRequiresReview(input), false);
  });

  it("ارسال بررسی‌نشده را قابل پرداخت نمی‌کند", () => {
    const input = {
      subtotalThousands: 1_316,
      deliveryMethod: "delivery" as const,
      deliveryQuoteStatus: "pending" as const,
      deliveryFeeThousands: null,
    };
    assert.equal(finalInvoiceTotalThousands(input), null);
    assert.equal(invoiceRequiresReview(input), true);
  });

  it("هزینه ارسال نهایی را به جمع تجهیزات اضافه می‌کند", () => {
    const input = {
      subtotalThousands: 1_316,
      deliveryMethod: "delivery" as const,
      deliveryQuoteStatus: "finalized" as const,
      deliveryFeeThousands: 180,
    };
    assert.equal(finalInvoiceTotalThousands(input), 1_496);
    assert.equal(invoiceRequiresReview(input), false);
  });

  it("استعلام بازِ اقلام را حتی پس از تعیین ارسال باز نگه می‌دارد", () => {
    assert.equal(
      finalInvoiceTotalThousands({
        subtotalThousands: null,
        deliveryMethod: "delivery",
        deliveryQuoteStatus: "finalized",
        deliveryFeeThousands: 180,
      }),
      null,
    );
  });
});
