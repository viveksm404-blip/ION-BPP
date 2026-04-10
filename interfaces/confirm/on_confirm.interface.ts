// ─────────────────────────────────────────────────────────────────────────────
// Beckn FnB — on_confirm response interfaces
// Source: static/confirm/on_confirm-response.json
// ─────────────────────────────────────────────────────────────────────────────

import type { BecknContext, Participant, Offer } from '../select/select.interface';
import type { OnSelectCommitmentAttributes, BreakupLine } from '../select/on_select.interface';
import type { Sla, ContractAttributes } from '../init/init.interface';

// ── Commitment ────────────────────────────────────────────────────────────────

export interface OnConfirmCommitment {
  id: string;
  status: { descriptor: { code: 'ACTIVE' } };
  resources: Array<{ id: string }>;
  offer?: Offer;
  commitmentAttributes: OnSelectCommitmentAttributes;
}

// ── Consideration — AGREED, single chosen payment method ─────────────────────

export interface OnConfirmConsiderationAttributes {
  '@context': string;
  '@type': string;
  paymentMethods: [string];   // exactly one — the chosen method
  currency: string;
  breakup: BreakupLine[];
  totalAmount: number;
}

export interface OnConfirmConsideration {
  '@context'?: string;
  '@type'?: string;
  id: string;
  status: { descriptor: { code: 'AGREED' } };
  considerationAttributes: OnConfirmConsiderationAttributes;
}

// ── Performance — ORDER_PLACED, full sla + handling ───────────────────────────

export interface OnConfirmPerformanceAttributes {
  '@context': string;
  '@type': string;
  supportedPerformanceModes: string[];
  deliveryDetails?: {
    address: {
      streetAddress: string;
      addressLocality: string;
      addressRegion: string;
      postalCode: string;
      addressCountry: string;
    };
    contact: { name: string; phone: string };
  };
  sla: Sla;
  handling: string[];
  operatingHours?: Array<{
    daysOfWeek: number[];
    timeRange: { start: string; end: string };
  }>;
  installationScheduling?: { available: boolean };
}

export interface OnConfirmPerformance {
  id: string;
  status: { code: 'ORDER_PLACED' };
  commitmentIds: string[];
  performanceAttributes: OnConfirmPerformanceAttributes;
}

// ── Contract ──────────────────────────────────────────────────────────────────

export interface OnConfirmContract {
  id: string;                   // BPP-generated order ID (e.g. ORD-FNB-…)
  status: { code: 'ACTIVE' };
  participants: Participant[];
  commitments: OnConfirmCommitment[];
  consideration: OnConfirmConsideration[];
  performance: OnConfirmPerformance[];
  contractAttributes?: ContractAttributes;
}

// ── Response envelope ─────────────────────────────────────────────────────────

export interface OnConfirmResponse {
  context: BecknContext;
  message: { contract: OnConfirmContract };
}
