'use strict';

const { resources, COMMITMENT_CTX, CONSIDERATION_CTX } = require('../catalog');

// ---------------------------------------------------------------------------
// Pricing constants
// ---------------------------------------------------------------------------
const PACKING_CHARGE  = 25;   // INR, per order
const DELIVERY_CHARGE = 49;   // INR, flat fee
const GST_RATE        = 0.05; // 5% on food

// ---------------------------------------------------------------------------
// handleSelect
//   Receives: Beckn select message from ONIX BPP Receiver
//   Returns:  on_select message ready to send to ONIX BPP Caller
// ---------------------------------------------------------------------------
function handleSelect(body) {
  const ctx      = body.context;
  const contract = body.message.contract;

  let subtotal = 0;

  const pricedCommitments = (contract.commitments || []).map((c, idx) => {
    // resolve resourceId — commitmentAttributes.resourceId is canonical;
    // fall back to resources[0].id for minimal payloads
    const resourceId = c.commitmentAttributes?.resourceId
      || c.resources?.[0]?.id
      || '';

    const catalogItem = resources[resourceId];
    const qty         = Number(c.commitmentAttributes?.quantity?.unitQuantity ?? 1);
    const unitPrice   = catalogItem?.unitPrice ?? 0;
    const lineTotal   = Math.round(unitPrice * qty * 100) / 100;
    subtotal += lineTotal;

    const lineSummary = catalogItem
      ? `${catalogItem.name} × ${qty} @ ₹${unitPrice}`
      : `${resourceId} × ${qty}`;

    return {
      ...c,
      status: { descriptor: { code: 'QUOTED' } },
      commitmentAttributes: {
        '@context': COMMITMENT_CTX,
        '@type':    'rccma:RetailCommitment',
        lineId:      c.commitmentAttributes?.lineId ?? `line-${String(idx + 1).padStart(3, '0')}`,
        resourceId,
        offerId:     c.commitmentAttributes?.offerId ?? catalogItem?.offerId,
        quantity:    c.commitmentAttributes?.quantity ?? { unitCode: 'EA', unitQuantity: qty },
        price: {
          currency:       'INR',
          consideredValue: lineTotal,
          components: [
            {
              lineId:       `price-${c.id ?? idx}`,
              lineSummary,
              value:         lineTotal,
              currency:      'INR',
              quantity:      c.commitmentAttributes?.quantity ?? { unitCode: 'EA', unitQuantity: qty }
            }
          ]
        },
        ...(c.commitmentAttributes?.specialInstructions
          ? { specialInstructions: c.commitmentAttributes.specialInstructions }
          : {})
      }
    };
  });

  const gst   = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = Math.round((subtotal + PACKING_CHARGE + DELIVERY_CHARGE + gst) * 100) / 100;

  const consideration = [
    {
      '@context': CONSIDERATION_CTX,
      '@type':    'beckn:MonetaryConsideration',
      id:     'cons-001',
      status: { descriptor: { code: 'DRAFT' } },
      considerationAttributes: {
        '@context': CONSIDERATION_CTX,
        '@type':    'rccna:RetailConsideration',
        currency:   'INR',
        breakup: [
          { title: 'Food items',       amount: subtotal,       type: 'BASE_PRICE' },
          { title: 'GST (5%)',         amount: gst,            type: 'TAX' },
          { title: 'Packing charge',   amount: PACKING_CHARGE, type: 'PACKING_CHARGE' },
          { title: 'Delivery charge',  amount: DELIVERY_CHARGE, type: 'DELIVERY_CHARGE' }
        ],
        totalAmount: total
      }
    }
  ];

  return {
    context: {
      ...ctx,
      action:    'on_select',
      timestamp: new Date().toISOString()
    },
    message: {
      contract: {
        ...contract,
        status:       { code: 'QUOTED' },
        commitments:  pricedCommitments,
        consideration
      }
    }
  };
}

module.exports = { handleSelect };
