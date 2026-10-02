import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "node:http";
import sharp from "sharp";
import { db } from "../src/lib/db";
import { listingRepository } from "../src/modules/listings/repositories/listing-repository";
import { applyPayment } from "../src/modules/listings/services/promotion-payment";
import { putMedia, readMedia, mediaExists } from "../src/lib/media-storage";
import { favoriteRepository } from "../src/modules/favorites/repositories/favorite-repository";
import { reportRepository } from "../src/modules/reports/repositories/report-repository";
import { userRepository } from "../src/modules/users/repositories/user-repository";

// Uses only temporary records; never deletes application users or categories.
test("database and local storage: ownership, concurrency, publication and metrics", async () => {
  const previousDriver = process.env.MEDIA_DRIVER;
  process.env.MEDIA_DRIVER = "local";
  const category = await db.category.findFirst({ where: { active: true, slug: { not: "contas-digitais" } } });
  assert.ok(category, "Run npm run db:seed first");
  const owner = await db.user.create({
    data: {
      name: "Integration check",
      email: `test-${randomUUID()}@example.invalid`,
      passwordHash: "test-only",
      whatsapp: "5592999999999",
    },
  });
  const intruder = await db.user.create({
    data: {
      name: "Other test user",
      email: `test-${randomUUID()}@example.invalid`,
      passwordHash: "test-only",
      whatsapp: "5592999999999",
    },
  });
  const key = `listings/${owner.id}/${randomUUID()}.webp`;
  let listingId: string | undefined;
  try {
    const bytes = await sharp({
      create: { width: 24, height: 24, channels: 3, background: "#146b50" },
    })
      .webp()
      .toBuffer();
    assert.equal(await mediaExists(key), false);
    await putMedia(key, bytes);
    assert.equal(await mediaExists(key), true);
    assert.deepEqual(Buffer.from((await readMedia(key)) as Uint8Array), bytes);
    const data = {
      title: "Produto de integração",
      description: "Descrição do produto para verificação local.",
      price: "123.45",
      categoryId: category.id,
      condition: "USED" as const,
      city: "Manaus",
      state: "AM" as const,
      neighborhood: "Centro",
      images: [key],
    };
    const emptyDraft = await listingRepository.save(
      owner.id,
      { ...data, title: "Rascunho sem fotos", images: [] },
      "DRAFT",
      `draft-${randomUUID()}`,
    );
    await db.listing.delete({ where: { id: emptyDraft.id } });
    const draft = await listingRepository.save(
      owner.id,
      data,
      "DRAFT",
      `test-${randomUUID()}`,
    );
    listingId = draft.id;
    assert.equal(
      await listingRepository.findOwned(draft.id, intruder.id),
      null,
    );
    assert.equal(await listingRepository.findPublic(draft.slug), null);
    await assert.rejects(
      listingRepository.save(intruder.id, data, "ACTIVE", draft.slug, {
        id: draft.id,
        updatedAt: draft.updatedAt,
      }),
    );
    await assert.rejects(
      listingRepository.changeStatus(
        draft.id,
        intruder.id,
        "DRAFT",
        "ACTIVE",
        draft.updatedAt,
      ),
    );
    const edited = await listingRepository.save(
      owner.id,
      { ...data, title: "Produto editado" },
      "DRAFT",
      draft.slug,
      { id: draft.id, updatedAt: draft.updatedAt },
    );
    await assert.rejects(
      listingRepository.save(owner.id, data, "DRAFT", draft.slug, {
        id: draft.id,
        updatedAt: draft.updatedAt,
      }),
    );
    await listingRepository.changeStatus(
      edited.id,
      owner.id,
      "DRAFT",
      "ACTIVE",
      edited.updatedAt,
    );
    const active = await listingRepository.findPublic(draft.slug);
    assert.ok(active);
    assert.equal(active.price.toFixed(2), "123.45");
    assert.ok(await listingRepository.findPublicImage(key));
    const searchResults = await listingRepository.searchPublic({
      query: "editado",
      categorySlug: category.slug,
      city: "Manaus",
      state: "AM",
      condition: "USED",
    });
    assert.deepEqual(
      searchResults.map((listing) => listing.id),
      [active.id],
    );
    const seller = await listingRepository.findPublicSeller(owner.id);
    assert.ok(seller);
    assert.deepEqual(
      seller.listings.map((listing) => listing.id),
      [active.id],
    );
    assert.equal(await favoriteRepository.toggle(intruder.id, active.id), true);
    assert.ok(await favoriteRepository.find(intruder.id, active.id));
    assert.equal((await favoriteRepository.list(intruder.id)).length, 1);
    assert.equal(
      await favoriteRepository.toggle(intruder.id, active.id),
      false,
    );
    await assert.rejects(favoriteRepository.toggle(owner.id, active.id));
    const report = await reportRepository.create(intruder.id, {
      listingId: active.id,
      reason: "SCAM",
      details: "Verificação de integração.",
    });
    await reportRepository.updateStatus(report.id, owner.id, "REVIEWING");
    assert.equal(
      (await db.report.findUniqueOrThrow({ where: { id: report.id } })).status,
      "REVIEWING",
    );
    await assert.rejects(
      reportRepository.create(intruder.id, {
        listingId: active.id,
        reason: "SCAM",
        details: null,
      }),
    );
    await assert.rejects(
      reportRepository.create(owner.id, {
        listingId: active.id,
        reason: "SCAM",
        details: null,
      }),
    );
    await userRepository.setStatus(intruder.id, "SUSPENDED");
    assert.equal(
      (await userRepository.findById(intruder.id))?.status,
      "SUSPENDED",
    );
    await userRepository.setStatus(intruder.id, "ACTIVE");
    await listingRepository.recordView(active.id);
    await listingRepository.recordContact(active.id);
    const metrics = await db.listing.findUniqueOrThrow({
      where: { id: active.id },
      include: { _count: { select: { contacts: true } } },
    });
    assert.equal(metrics.views, 1);
    assert.equal(metrics._count.contacts, 1);
    await listingRepository.changeStatus(
      active.id,
      owner.id,
      "ACTIVE",
      "PAUSED",
      metrics.updatedAt,
    );
    assert.equal(await listingRepository.findPublic(active.slug), null);
    assert.equal(await listingRepository.findPublicImage(key), null);
    await assert.rejects(listingRepository.recordContact(active.id));
    const paused = await listingRepository.findOwned(active.id, owner.id);
    assert.ok(paused);
    await listingRepository.changeStatus(
      paused.id,
      owner.id,
      "PAUSED",
      "ACTIVE",
      paused.updatedAt,
    );
    const reactivated = await listingRepository.findOwned(active.id, owner.id);
    assert.ok(reactivated);
    await listingRepository.changeStatus(
      reactivated.id,
      owner.id,
      "ACTIVE",
      "SOLD",
      reactivated.updatedAt,
    );
    assert.equal(await listingRepository.findPublic(active.slug), null);
    await assert.rejects(
      listingRepository.save(owner.id, data, "ACTIVE", active.slug, {
        id: reactivated.id,
        updatedAt: reactivated.updatedAt,
      }),
    );
    const sold = await listingRepository.findOwned(active.id, owner.id);
    assert.ok(sold);
    await listingRepository.changeStatus(
      sold.id,
      owner.id,
      "SOLD",
      "REMOVED",
      sold.updatedAt,
    );
    assert.equal(await listingRepository.findOwned(active.id, owner.id), null);
  } finally {
    if (listingId) {
      await db.report.deleteMany({ where: { listingId } });
      await db.favorite.deleteMany({ where: { listingId } });
      await db.listingContact.deleteMany({ where: { listingId } });
      await db.listing.delete({ where: { id: listingId } });
    }
    await db.user.deleteMany({
      where: { id: { in: [owner.id, intruder.id] } },
    });
    await rm(
      resolve(
        process.env.MEDIA_LOCAL_DIR ?? ".data/media",
        "listings",
        owner.id,
      ),
      { recursive: true, force: true },
    );
    if (previousDriver === undefined) delete process.env.MEDIA_DRIVER;
    else process.env.MEDIA_DRIVER = previousDriver;
  }
});

test("digital account listings require review before appearing publicly", async () => {
  const previousDriver = process.env.MEDIA_DRIVER;
  process.env.MEDIA_DRIVER = "local";
  const category = await db.category.findUnique({ where: { slug: "contas-digitais" } });
  assert.ok(category?.active, "Run npm run db:seed first");
  const owner = await db.user.create({
    data: {
      name: "Account review check",
      email: `test-${randomUUID()}@example.invalid`,
      passwordHash: "test-only",
      whatsapp: "5592999999999",
    },
  });
  const key = `listings/${owner.id}/${randomUUID()}.webp`;
  let listingId: string | undefined;
  try {
    await putMedia(key, await sharp({
      create: { width: 24, height: 24, channels: 3, background: "#146b50" },
    }).webp().toBuffer());
    const data = {
      title: "Conta digital de demonstração",
      description: "Perfil de teste para validar a revisão dos anúncios digitais.",
      price: "200.00",
      categoryId: category.id,
      condition: "USED" as const,
      city: "Manaus",
      state: "AM" as const,
      neighborhood: "Centro",
      images: [key],
      accountPlatform: "Plataforma de teste",
      accountType: "PROFESSIONAL" as const,
      accountPolicyUrl: "https://example.com/transferencia",
      accountTransferConfirmed: true,
    };
    const slug = `account-review-${randomUUID()}`;
    await assert.rejects(listingRepository.save(owner.id, data, "ACTIVE", slug));
    const pending = await listingRepository.save(owner.id, data, "PENDING_REVIEW", slug);
    listingId = pending.id;
    assert.equal(await listingRepository.findPublic(slug), null);
    await assert.rejects(listingRepository.changeStatus(pending.id, owner.id, "PENDING_REVIEW", "ACTIVE", pending.updatedAt));
    await listingRepository.reviewAccountListing(pending.id, pending.updatedAt, false, "Revisar as regras da plataforma.");
    const rejected = await listingRepository.findOwned(pending.id, owner.id);
    assert.equal(rejected?.status, "DRAFT");
    assert.equal(rejected?.moderationNote, "Revisar as regras da plataforma.");
    const resubmitted = await listingRepository.save(owner.id, data, "PENDING_REVIEW", slug, {
      id: pending.id,
      updatedAt: rejected!.updatedAt,
    });
    assert.equal(resubmitted.moderationNote, null);
    await listingRepository.reviewAccountListing(resubmitted.id, resubmitted.updatedAt, true, "");
    assert.ok(await listingRepository.findPublic(slug));
  } finally {
    if (listingId) await db.listing.delete({ where: { id: listingId } });
    await db.user.delete({ where: { id: owner.id } });
    await rm(resolve(process.env.MEDIA_LOCAL_DIR ?? ".data/media", "listings", owner.id), { recursive: true, force: true });
    if (previousDriver === undefined) delete process.env.MEDIA_DRIVER;
    else process.env.MEDIA_DRIVER = previousDriver;
  }
});

test("S3 compatible storage: signed PUT, HEAD and streamed GET", async () => {
  const bytes = Buffer.from("storage integration check");
  let uploaded: Buffer | undefined;
  const calls: string[] = [];
  const server = createServer(async (request, response) => {
    assert.match(request.headers.authorization ?? "", /^AWS4-HMAC-SHA256 /);
    calls.push(request.method ?? "");
    if (request.method === "PUT") {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      uploaded = Buffer.concat(chunks);
      response.writeHead(200, { ETag: '"test"' });
      response.end();
    } else if (request.method === "HEAD") {
      response.writeHead(uploaded ? 200 : 404, {
        "Content-Length": String(uploaded?.length ?? 0),
      });
      response.end();
    } else {
      response.writeHead(200, {
        "Content-Type": "image/webp",
        "Content-Length": String(uploaded?.length ?? 0),
      });
      response.end(uploaded);
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const envNames = [
    "MEDIA_DRIVER",
    "MEDIA_S3_ENDPOINT",
    "MEDIA_S3_REGION",
    "MEDIA_S3_BUCKET",
    "MEDIA_S3_ACCESS_KEY_ID",
    "MEDIA_S3_SECRET_ACCESS_KEY",
    "MEDIA_S3_FORCE_PATH_STYLE",
  ];
  const previous = envNames.map((name) => process.env[name]);
  Object.assign(process.env, {
    MEDIA_DRIVER: "s3",
    MEDIA_S3_ENDPOINT: `http://127.0.0.1:${address.port}`,
    MEDIA_S3_REGION: "us-east-1",
    MEDIA_S3_BUCKET: "test-bucket",
    MEDIA_S3_ACCESS_KEY_ID: "test-key",
    MEDIA_S3_SECRET_ACCESS_KEY: "test-secret",
    MEDIA_S3_FORCE_PATH_STYLE: "true",
  });
  try {
    const key = `listings/c123456789012345678901234/${randomUUID()}.webp`;
    await putMedia(key, bytes);
    assert.equal(await mediaExists(key), true);
    const body = await readMedia(key);
    assert.deepEqual(
      Buffer.from(await new Response(body).arrayBuffer()),
      bytes,
    );
    assert.deepEqual(calls, ["PUT", "HEAD", "GET"]);
  } finally {
    envNames.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
test("paid promotion activates once and ranks ahead of regular listings", async () => {
  const category = await db.category.findFirstOrThrow({ where: { active: true, slug: { not: "contas-digitais" } } });
  const owner = await db.user.create({ data: { name: "Promotion test", email: `promo-${randomUUID()}@example.invalid`, passwordHash: "test-only", whatsapp: "5592999999999" } });
  const marker = `promotion-${randomUUID()}`;
  const ids: string[] = [];
  try {
    for (const index of [1, 2]) {
      const listing = await db.listing.create({ data: { slug: `${marker}-${index}`, title: `${marker} item ${index}`, description: "Temporary promotion ranking check", price: "50.00", condition: "USED", status: "ACTIVE", city: "Manaus", state: "AM", neighborhood: "Centro", sellerId: owner.id, categoryId: category.id } });
      ids.push(listing.id);
    }
    const order = await db.listingPromotion.create({ data: { listingId: ids[0], sellerId: owner.id, amountCents: 1990, durationDays: 7, providerPaymentId: "987654321" } });
    const payment = { id: 987654321, status: "approved", external_reference: order.id, transaction_amount: 19.9, payment_method_id: "pix" };
    await applyPayment({ ...payment, transaction_amount: 1 });
    assert.equal((await db.listingPromotion.findUniqueOrThrow({ where: { id: order.id } })).status, "PENDING");
    await applyPayment(payment);
    await applyPayment(payment);
    const applied = await db.listingPromotion.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(applied.status, "PAID");
    assert.ok(applied.appliedUntil && applied.appliedUntil > new Date());
    const results = await listingRepository.searchPublic({ query: marker });
    assert.deepEqual(results.map((item) => item.id), ids);
    await db.listing.update({ where: { id: ids[0] }, data: { featuredUntil: new Date(Date.now() - 1000) } });
    const expiredResults = await listingRepository.searchPublic({ query: marker });
    assert.deepEqual(expiredResults.map((item) => item.id), [ids[1], ids[0]]);
    await db.listing.update({ where: { id: ids[0] }, data: { featuredUntil: applied.appliedUntil } });
    await applyPayment({ ...payment, status: "refunded" });
    assert.equal((await db.listingPromotion.findUniqueOrThrow({ where: { id: order.id } })).status, "REVERSED");
    assert.equal((await db.listing.findUniqueOrThrow({ where: { id: ids[0] } })).featuredUntil, null);
  } finally {
    await db.listingPromotion.deleteMany({ where: { sellerId: owner.id } });
    await db.listing.deleteMany({ where: { id: { in: ids } } });
    await db.user.delete({ where: { id: owner.id } });
  }
});

after(async () => {
  await db.$disconnect();
});
