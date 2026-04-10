// ─────────────────────────────────────────────────────────────────────────────
// Beckn FnB — on_init response interfaces
// Source: static/init/on_init-response.json
// ─────────────────────────────────────────────────────────────────────────────

import type { BecknContext, Participant, Offer } from '../select/select.interface';
import type { OnSelectCommitmentAttributes, BreakupLine } from '../select/on_select.interface';
import type { Sla, InitPerformance, ContractAttributes } from './init.interface';

// ── Commitment ────────────────────────────────────────────────────────────────

export interface OnInitCommitment {
  id: string;
  status: { descriptor: { code: 'DRAFT' } };
  resources: Array<{ id: string }>;
  offer?: Offer;
  commitmentAttributes: OnSelectCommitmentAttributes;
}

// ── Consideration — adds paymentMethods, PENDING_PAYMENT status ───────────────

export interface OnInitConsiderationAttributes {
  '@context': string;
  '@type': string;
  paymentMethods: string[];
  currency: string;
  breakup: BreakupLine[];
  totalAmount: number;
}

export interface OnInitConsideration {
  '@context'?: string;
  '@type'?: string;
  id: string;
  status: { descriptor: { code: 'PENDING_PAYMENT' } };
  considerationAttributes: OnInitConsiderationAttributes;
}

// ── Performance — adds sla + handling ────────────────────────────────────────

export interface OnInitPerformanceAttributes {
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

export interface OnInitPerformance {
  id: string;
  status: { code: 'PENDING' };
  commitmentIds: string[];
  performanceAttributes: OnInitPerformanceAttributes;
}

// ── Contract ──────────────────────────────────────────────────────────────────

export interface OnInitContract {
  id?: string;
  status: { code: 'DRAFT' };
  participants: Participant[];
  commitments: OnInitCommitment[];
  consideration: OnInitConsideration[];
  performance: OnInitPerformance[];
  contractAttributes?: ContractAttributes;
}

// ── Response envelope ─────────────────────────────────────────────────────────

export interface OnInitResponse {
  context: BecknContext;
  message: { contract: OnInitContract };
}
