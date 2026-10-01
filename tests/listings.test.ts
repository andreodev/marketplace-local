import { test } from "node:test";
import assert from "node:assert/strict";
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
const owner = "c123456789012345678901234";
const key = `listings/${owner}/12345678-1234-1234-1234-123456789abc.webp`;
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
  assert.doesNotThrow(() => assertStatusTransition("ACTIVE", "PAUSED"));
  assert.doesNotThrow(() => assertStatusTransition("PAUSED", "ACTIVE"));
  assert.doesNotThrow(() => assertStatusTransition("ACTIVE", "SOLD"));
  assert.throws(() => assertStatusTransition("SOLD", "ACTIVE"));
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
