import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { validMercadoPagoSignature } from "../src/modules/listings/utils/promotion-webhook";
import { publicationText } from "../src/modules/listings/utils/publication-text";
import {
  assertMediaKey,
  assertUploadFile,
  MAX_IMAGE_BYTES,
} from "../src/modules/listings/utils/media-policy";
import {
  saveListingSchema,
  changeStatusSchema,
} from "../src/modules/listings/schemas/listing";
import { assertStatusTransition } from "../src/modules/listings/utils/listing-policy";
import { parseListingSearch } from "../src/modules/listings/schemas/search";
import { assertAccountListingContent, assertAccountListingReady } from "../src/modules/listings/utils/account-policy";
const owner = "c123456789012345678901234";
const key = `listings/${owner}/12345678-1234-1234-1234-123456789abc.webp`;
test("Mercado Pago webhook requires valid recent signature and payment ID", () => {
  const now = Date.now();
  const ts = String(now);
  const secret = "test-webhook-secret";
  const requestId = "request-123";
  const dataId = "987654321";
  const hash = createHmac("sha256", secret).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest("hex");
  const signature = `ts=${ts},v1=${hash}`;
  assert.equal(validMercadoPagoSignature(signature, requestId, dataId, secret, now), true);
  assert.equal(validMercadoPagoSignature(signature, requestId, "987654322", secret, now), false);
  assert.equal(validMercadoPagoSignature(signature, requestId, dataId, "wrong", now), false);
  assert.equal(validMercadoPagoSignature(signature, requestId, dataId, secret, now + 11 * 60_000), false);
});
test("publication kit includes price, location and public URL", () => {
  const output = publicationText({ title: "Bicicleta", description: "Bem conservada", price: "199.90", city: "Manaus", state: "AM", condition: "USED" }, "https://perto.example/anuncio/bicicleta");
  assert.match(output, /Bicicleta/);
  assert.match(output, /R\$\s?199,90/);
  assert.match(output, /Manaus, AM/);
  assert.match(output, /https:\/\/perto.example\/anuncio\/bicicleta/);
});
test("listing boundary: media ownership, files and inputs", () => {
  assert.doesNotThrow(() => assertMediaKey(key, owner));
  for (const invalid of [
    "../private.webp",
    key.replace(owner, "c987654321098765432109876"),
    key.replace(".webp", ".svg"),
  ])
    assert.throws(() => assertMediaKey(invalid, owner));
  assert.doesNotThrow(() =>
    assertUploadFile(new File(["test"], "test.jpg", { type: "image/jpeg" })),
  );
  assert.throws(() =>
    assertUploadFile(new File(["svg"], "image.svg", { type: "image/svg+xml" })),
  );
  assert.throws(() =>
    assertUploadFile(
      new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.jpg", {
        type: "image/jpeg",
      }),
    ),
  );
  const data = {
    title: "Bicicleta de teste",
    description: "Produto em bom estado de conservação.",
    price: "123,45",
    categoryId: owner,
    condition: "USED",
    city: "Manaus",
    state: "AM",
    neighborhood: "Centro",
    images: [key],
    intent: "DRAFT",
  };
  assert.equal(saveListingSchema.parse(data).price, "123.45");
  assert.equal(
    saveListingSchema.safeParse({ ...data, sellerId: "forged" }).success,
    false,
  );
  assert.equal(
    saveListingSchema.safeParse({ ...data, images: [key, key] }).success,
    false,
  );
  assert.equal(
    saveListingSchema.safeParse({
      ...data,
      images: ["https://external.invalid/image.webp"],
    }).success,
    false,
  );
  assert.equal(
    saveListingSchema.safeParse({ ...data, state: "XX" }).success,
    false,
  );
  assert.equal(
    changeStatusSchema.safeParse({
      id: owner,
      updatedAt: new Date().toISOString(),
      status: "DRAFT",
    }).success,
    false,
  );
  assert.doesNotThrow(() => assertStatusTransition("DRAFT", "ACTIVE"));
  assert.doesNotThrow(() => assertStatusTransition("DRAFT", "PENDING_REVIEW"));
  assert.throws(() => assertStatusTransition("PENDING_REVIEW", "ACTIVE"));
  assert.doesNotThrow(() => assertStatusTransition("ACTIVE", "PAUSED"));
  assert.doesNotThrow(() => assertStatusTransition("PAUSED", "ACTIVE"));
  assert.doesNotThrow(() => assertStatusTransition("ACTIVE", "SOLD"));
  assert.throws(() => assertStatusTransition("SOLD", "ACTIVE"));
});

test("account listings require permitted transfer and never expose credentials", () => {
  const account = {
    title: "Conta profissional de teste",
    description: "Perfil criado para demonstração com histórico de uso regular.",
    accountPlatform: "Plataforma de teste",
    accountType: "PROFESSIONAL",
    accountPolicyUrl: "https://example.com/regras-de-transferencia",
    accountTransferConfirmed: true,
  };
  assert.doesNotThrow(() => assertAccountListingReady(account));
  assert.throws(() => assertAccountListingReady({ ...account, accountPlatform: "Steam" }));
  assert.throws(() => assertAccountListingReady({ ...account, accountPlatform: "Epic Games" }));
  assert.throws(() => assertAccountListingReady({ ...account, accountTransferConfirmed: false }));
  assert.throws(() => assertAccountListingReady({ ...account, accountPolicyUrl: "http://example.com" }));
  assert.throws(() => assertAccountListingContent({ ...account, description: "Senha: segredo123" }));
  assert.throws(() => assertAccountListingContent({ ...account, description: "Acesso: pessoa@example.com" }));
});

test("listing search: only known, bounded public filters are accepted", () => {
  assert.deepEqual(
    parseListingSearch({
      q: " bicicleta ",
      categoria: "esportes-e-lazer",
      cidade: " Manaus ",
      estado: "AM",
      condicao: "USED",
      pagina: "2",
    }),
    {
      q: "bicicleta",
      categoria: "esportes-e-lazer",
      cidade: "Manaus",
      estado: "AM",
      condicao: "USED",
      pagina: 2,
    },
  );
  const invalid = parseListingSearch({
    categoria: "../forged",
    estado: "XX",
    condicao: "OLD",
    pagina: "0",
  });
  assert.equal(invalid.categoria, undefined);
  assert.equal(invalid.estado, undefined);
  assert.equal(invalid.condicao, undefined);
  assert.equal(invalid.pagina, 1);
});
