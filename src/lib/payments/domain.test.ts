import { afterEach, describe, expect, it } from "vitest";
import { getPaymentProvider, PaymentProviderNotConfiguredError } from "./domain";
const originalProvider = process.env.PAYMENT_PROVIDER;
afterEach(() => { if (originalProvider === undefined) delete process.env.PAYMENT_PROVIDER; else process.env.PAYMENT_PROVIDER = originalProvider; });
describe("payment provider boundary", () => {
  it("does not fake a production provider when merchant credentials are absent", () => { delete process.env.PAYMENT_PROVIDER; expect(() => getPaymentProvider()).toThrow(PaymentProviderNotConfiguredError); });
  it("offers a test adapter outside production", () => { process.env.PAYMENT_PROVIDER = "test"; if (process.env.NODE_ENV !== "production") expect(getPaymentProvider().name).toBe("test"); });
});
