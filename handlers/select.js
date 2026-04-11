"use strict";

const { CatalogPublish } = require("../db");
const { COMMITMENT_CTX, CONSIDERATION_CTX } = require("../catalog");
const { generateContext } = require("../heandler/functions/generateContext");

// ---------------------------------------------------------------------------
// Pricing constants
// ---------------------------------------------------------------------------
const PACKING_CHARGE = 25; // INR, per order
const DELIVERY_CHARGE = 49; // INR, flat fee
const GST_RATE = 0.05; // 5% on food

// ---------------------------------------------------------------------------
// lookupCatalog
//   Queries catalog_publishes for a document containing a catalog that
//   matches both providerId and resourceId.
//   Returns { resource, offer, catalog } or null if not found.
// ---------------------------------------------------------------------------
async function lookupCatalog(resourceId, offerId) {
  const doc = await CatalogPublish.findOne({
    "message.catalogs": {
      $elemMatch: {
        offers: { $elemMatch: { id: offerId } },
        resources: { $elemMatch: { id: resourceId } },
      },
    },
  }).lean();

  if (!doc) return null;

  const catalog = (doc.message.catalogs || []).find(
    (cat) =>
      (cat.offers || []).some((o) => o.id === offerId) &&
      (cat.resources || []).some((r) => r.id === resourceId),
  );
  if (!catalog) return null;

  const resource = (catalog.resources || []).find((r) => r.id === resourceId);

  // Build the set of resource IDs that actually exist in this catalog
  const existingResourceIds = new Set(
    (catalog.resources || []).map((r) => r.id),
  );

  // Find the offer for this resource, then:
  // 1. Strip resourceIds that have no matching resource in the catalog
  // 2. Discard the offer entirely if the requested resourceId is not in the filtered list
  const rawOffer = (catalog.offers || []).find((o) =>
    (o.resourceIds || []).includes(resourceId),
  );

  let offer = null;
  if (rawOffer) {
    const filteredResourceIds = (rawOffer.resourceIds || []).filter((id) =>
      existingResourceIds.has(id),
    );
    if (filteredResourceIds.includes(resourceId)) {
      offer = { ...rawOffer, resourceIds: filteredResourceIds };
    }
  }

  return { resource, offer, catalog };
}

// ---------------------------------------------------------------------------
// handleSelect
//   Receives: Beckn select message from ONIX BPP Receiver
//   Returns:  on_select message ready to send to ONIX BPP Caller
// ---------------------------------------------------------------------------
async function handleSelect(body) {
  const ctx = body.context;
  const contract = body.message.contract;

  let subtotal = 0;

  const pricedCommitments = await Promise.all(
    (contract.commitments || []).map(async (c, idx) => {
      const resourceId =
        c.commitmentAttributes?.resourceId || c.resources?.[0]?.id || "";
      const offerId = c.commitmentAttributes?.offerId || c.offer?.id || "";

      const match = await lookupCatalog(resourceId, offerId);

      if (!match) {
        console.warn(
          `[select] no catalog match for offerId="${offerId}" resourceId="${resourceId}"`,
        );
      }

      const { resource, offer } = match || {};
      console.log("resource", JSON.stringify(resource));
      console.log("offer", JSON.stringify(offer));
      const unitPrice =
        offer?.offerAttributes?.price?.value ?? resource?.price?.amount ?? 0;
      const currency =
        offer?.offerAttributes?.price?.currency ??
        resource?.currency ??
        resource?.price?.currency ??
        "INR";
      const qty = Number(c.commitmentAttributes?.quantity?.unitQuantity ?? 1);
      const lineTotal = Math.round(unitPrice * qty * 100) / 100;
      subtotal += lineTotal;

      const itemName =
        resource?.descriptor?.name ?? resource?.name ?? resourceId;
      const lineSummary = `${itemName} × ${qty} @ ₹${unitPrice}`;
      const resolvedOfferId = offer?.id ?? offerId;
      const lineId =
        c.commitmentAttributes?.lineId ??
        `line-${String(idx + 1).padStart(3, "0")}`;

      // Build enriched resources array — pick only schema-allowed Descriptor fields
      const pickDescriptor = (d) =>
        d
          ? {
              ...(d.code !== undefined && { code: d.code }),
              ...(d.name !== undefined && { name: d.name }),
              ...(d.shortDesc !== undefined && { shortDesc: d.shortDesc }),
              ...(d.longDesc !== undefined && { longDesc: d.longDesc }),
            }
          : undefined;

      const pickProvider = (p) =>
        p
          ? {
              id: p.id,
              descriptor: pickDescriptor(p.descriptor),
              ...(p.providerAttributes && {
                providerAttributes: p.providerAttributes,
              }),
            }
          : undefined;

      const enrichedResources = resource
        ? [
            {
              id: resource.id,
              ...(resource.descriptor && {
                descriptor: pickDescriptor(resource.descriptor),
              }),
              // resourceAttributes intentionally omitted — the network validator has no schema
              // for domain-specific @types (e.g. GroceryResourceAttributes)
            },
          ]
        : c.resources;

      // Build enriched offer — pick only schema-allowed fields
      const enrichedOffer = offer
        ? {
            id: offer.id,
            resourceIds: offer.resourceIds,
            ...(offer.descriptor && {
              descriptor: pickDescriptor(offer.descriptor),
            }),
            ...(offer.provider && { provider: pickProvider(offer.provider) }),
            // ...(offer.offerAttributes && { offerAttributes: offer.offerAttributes }),
          }
        : c.offer;

      return {
        id: c.id,
        status: { descriptor: { code: "DRAFT" } },
        resources: enrichedResources,
        offer: enrichedOffer,
        commitmentAttributes: {
          "@context": COMMITMENT_CTX,
          "@type": "rccma:RetailCommitment",
          lineId,
          resourceId,
          offerId: resolvedOfferId,
          quantity: c.commitmentAttributes?.quantity ?? {
            unitCode: "EA",
            unitQuantity: qty,
          },
          price: {
            currency,
            consideredValue: lineTotal,
            components: [
              {
                lineId: `price-${c.id ?? idx}`,
                lineSummary,
                value: lineTotal,
                currency,
                quantity: c.commitmentAttributes?.quantity ?? {
                  unitCode: "EA",
                  unitQuantity: qty,
                },
              },
            ],
          },
          ...(c.commitmentAttributes?.specialInstructions
            ? {
                specialInstructions: c.commitmentAttributes.specialInstructions,
              }
            : {}),
        },
      };
    }),
  );

  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const total =
    Math.round((subtotal + PACKING_CHARGE + DELIVERY_CHARGE + gst) * 100) / 100;

  const consideration = [
    {
      id: "cons-001",
      status: { code: "DRAFT" },
      considerationAttributes: {
        "@context": CONSIDERATION_CTX,
        "@type": "rccna:RetailConsideration",
        currency: "INR",
        breakup: [
          { title: "Food items", amount: subtotal, type: "BASE_PRICE" },
          { title: "GST (5%)", amount: gst, type: "TAX" },
          {
            title: "Packing charge",
            amount: PACKING_CHARGE,
            type: "PACKING_CHARGE",
          },
          {
            title: "Delivery charge",
            amount: DELIVERY_CHARGE,
            type: "DELIVERY_CHARGE",
          },
        ],
        totalAmount: total,
      },
    },
  ];

  return {
    context: generateContext(
      ctx.bapId,
      ctx.bapUri,
      ctx.bppId,
      ctx.bppUri,
      "on_select",
      ctx.transactionId,
      ctx.messageId,
    ),
    message: {
      contract: {
        // Explicit pick — no spread — so no stray fields breach additionalProperties:false
        ...(contract.id && { id: contract.id }),
        ...(contract.descriptor && { descriptor: contract.descriptor }),
        ...(contract.participants && { participants: contract.participants }),
        ...(contract.performance && { performance: contract.performance }),
        ...(contract.settlements && { settlements: contract.settlements }),
        ...(contract.contractAttributes && {
          contractAttributes: contract.contractAttributes,
        }),
        status: { code: "DRAFT" },
        commitments: pricedCommitments,
        consideration,
      },
    },
  };
}

module.exports = { handleSelect };
