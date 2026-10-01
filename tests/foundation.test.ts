import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
} from "../src/modules/auth/utils/password";
import { loginSchema, registerSchema } from "../src/modules/auth/schemas/auth";
import {
  priceSchema,
  listingSchema,
} from "../src/modules/listings/schemas/listing";
import {
  assertListingOwner,
  assertStatusTransition,
} from "../src/modules/listings/utils/listing-policy";
test("foundation: credentials, money and ownership", async () => {
  const hash = await hashPassword("a secure password");
  assert.equal(await verifyPassword("a secure password", hash), true);
  assert.equal(await verifyPassword("wrong password", hash), false);
  assert.equal(await verifyPassword("anything", "malformed"), false);
  assert.equal(
    loginSchema.parse({ email: " User@Example.com ", password: "secret" })
      .email,
    "user@example.com",
  );
  assert.equal(
    registerSchema.safeParse({
      name: "Ana",
      email: "ana@example.com",
      whatsapp: "92999999999",
      password: "short",
    }).success,
    false,
  );
  assert.equal(priceSchema.parse("123,45"), "123.45");
  for (const value of ["-1", "1.234,56", "1.001", "Infinity"])
    assert.equal(priceSchema.safeParse(value).success, false);
  assert.equal(listingSchema.safeParse({ sellerId: "forged" }).success, false);
  assert.doesNotThrow(() => assertListingOwner({ sellerId: "owner" }, "owner"));
  assert.throws(() => assertListingOwner({ sellerId: "owner" }, "attacker"));
  assert.doesNotThrow(() => assertStatusTransition("PAUSED", "ACTIVE"));
  assert.throws(() => assertStatusTransition("REMOVED", "ACTIVE"));
});
