'use strict';

const { COMMITMENT_CTX, CONSIDERATION_CTX, PERFORMANCE_CTX } = require('../catalog');

// ---------------------------------------------------------------------------
// handleInit
//   Receives: Beckn init message (contract with delivery address in performance)
//   Returns:  on_init message with payment options appended to consideration
//
//   on_init finalises the draft: carries forward pricing from select and adds
//   the supported payment methods so the buyer can choose at confirm.
// ---------------------------------------------------------------------------
function handleInit(body) {
  const ctx      = body.context;
  const contract = body.message.contract;

  // ---- consideration: carry forward, add paymentMethods ------------------
  const prevConsAttr = contract.consideration?.[0]?.considerationAttributes ?? {};

  const consideration = [
    {
      '@context': CONSIDERATION_CTX,
      '@type':    'beckn:MonetaryConsideration',
      id:     'cons-001',
      status: { descriptor: { code: 'PENDING_PAYMENT' } },
      considerationAttributes: {
        '@context':     CONSIDERATION_CTX,
        '@type':        'rccna:RetailConsideration',
        // Supported instrument types (RetailConsideration enum: PREPAID COD WALLET UPI)
        paymentMethods: ['WALLET', 'COD', 'UPI'],
        currency:       prevConsAttr.currency    ?? 'INR',
        breakup:        prevConsAttr.breakup      ?? [],
        totalAmount:    prevConsAttr.totalAmount  ?? 0
      }
    }
  ];

  // ---- commitments: mark DRAFT -------------------------------------------
  const commitments = (contract.commitments ?? []).map(c => ({
    ...c,
    status: { descriptor: { code: 'DRAFT' } },
    commitmentAttributes: {
      '@context': COMMITMENT_CTX,
      '@type':    'rccma:RetailCommitment',
      ...c.commitmentAttributes
    }
  }));

  // ---- performance: carry delivery address, add BPP SLA hint -------------
  const performance = (contract.performance ?? []).map(p => ({
    ...p,
    status: { code: 'PENDING' },
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
      action:    'on_init',
      timestamp: new Date().toISOString()
    },
    message: {
      contract: {
        ...contract,
        status:       { code: 'DRAFT' },
        commitments,
        consideration,
        performance
      }
    }
  };
}

module.exports = { handleInit };
