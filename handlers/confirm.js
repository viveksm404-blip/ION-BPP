'use strict';

const { COMMITMENT_CTX, CONSIDERATION_CTX, PERFORMANCE_CTX } = require('../catalog');

// Simple monotonic counter for order IDs (sufficient for a dev/testnet BPP)
let _seq = 1000;
function nextOrderId() {
  return `ORD-FNB-${Date.now()}-${++_seq}`;
}

// ---------------------------------------------------------------------------
// handleConfirm
//   Receives: Beckn confirm message (buyer has chosen payment method)
//   Returns:  on_confirm with ACTIVE contract, confirmed consideration, SLA
//
//   The buyer's confirm payload MAY carry a paymentMethods array in
//   considerationAttributes with their chosen instrument as first element;
//   fall back to WALLET if absent.
// ---------------------------------------------------------------------------
function handleConfirm(body) {
  const ctx      = body.context;
  const contract = body.message.contract;

  const orderId = nextOrderId();

  // ---- consideration: AGREED, echo chosen payment method -----------------
  const prevConsAttr = contract.consideration?.[0]?.considerationAttributes ?? {};
  const chosenMethod = prevConsAttr.paymentMethods?.[0] ?? 'WALLET';

  const consideration = [
    {
      '@context': CONSIDERATION_CTX,
      '@type':    'beckn:MonetaryConsideration',
      id:     'cons-001',
      status: { descriptor: { code: 'AGREED' } },
      considerationAttributes: {
        '@context':     CONSIDERATION_CTX,
        '@type':        'rccna:RetailConsideration',
        paymentMethods: [chosenMethod],
        currency:       prevConsAttr.currency   ?? 'INR',
        breakup:        prevConsAttr.breakup     ?? [],
        totalAmount:    prevConsAttr.totalAmount ?? 0
      }
    }
  ];

  // ---- commitments: ACTIVE -----------------------------------------------
  const commitments = (contract.commitments ?? []).map(c => ({
    ...c,
    status: { descriptor: { code: 'ACTIVE' } },
    commitmentAttributes: {
      '@context': COMMITMENT_CTX,
      '@type':    'rccma:RetailCommitment',
      ...c.commitmentAttributes
    }
  }));

  // ---- performance: ORDER_PLACED, full SLA + handling --------------------
  const performance = (contract.performance ?? []).map(p => ({
    ...p,
    status: { code: 'ORDER_PLACED' },
    performanceAttributes: {
      '@context': PERFORMANCE_CTX,
      '@type':    'rcpa:RetailPerformance',
      supportedPerformanceModes: ['DELIVERY', 'PICKUP'],
      ...(p.performanceAttributes?.deliveryDetails
        ? { deliveryDetails: p.performanceAttributes.deliveryDetails }
        : {}),
      sla: {
        min:       'PT30M',
        max:       'PT2H',
        unitBasis: 'ORDER_CONFIRMATION'
      },
      handling: ['PERISHABLE']
    }
  }));

  return {
    context: {
      ...ctx,
      action:    'on_confirm',
      timestamp: new Date().toISOString()
    },
    message: {
      contract: {
        ...contract,
        id:          orderId,
        status:      { code: 'ACTIVE' },
        commitments,
        consideration,
        performance
      }
    }
  };
}

module.exports = { handleConfirm };
