// ─────────────────────────────────────────────────────────────────────────────
// Beckn FnB — on_select response interfaces
// Source: static/select/on_select-response.json
// ─────────────────────────────────────────────────────────────────────────────

import type {
  BecknContext,
  Participant,
  Quantity,
  Offer,
  SelectPerformance,
} from './select.interface';

// ── Price breakdown ───────────────────────────────────────────────────────────

export interface PriceComponent {
  lineId: string;
  lineSummary: string;
  value: number;
  currency: string;
  quantity: Quantity;
}

export interface CommitmentPrice {
  currency: string;
  consideredValue: number;
  components: PriceComponent[];
}

// ── Commitment ────────────────────────────────────────────────────────────────

export interface OnSelectCommitmentAttributes {
  '@context': string;
  '@type': string;
  lineId: string;
  resourceId: string;
  offerId: string;
  quantity: Quantity;
  price: CommitmentPrice;
  specialInstructions?: string;
}

export interface OnSelectCommitment {
  id: string;
  status: { descriptor: { code: 'QUOTED' } };
  resources: Array<{ id: string }>;
  offer?: Offer;
  commitmentAttributes: OnSelectCommitmentAttributes;
}

// ── Consideration ─────────────────────────────────────────────────────────────

export interface BreakupLine {
  title: string;
  amount: number;
  type: 'BASE_PRICE' | 'TAX' | 'PACKING_CHARGE' | 'DELIVERY_CHARGE' | string;
}

export interface OnSelectConsiderationAttributes {
  '@context': string;
  '@type': string;
  currency: string;
  breakup: BreakupLine[];
  totalAmount: number;
}

export interface OnSelectConsideration {
  '@context'?: string;
  '@type'?: string;
  id: string;
  status: { descriptor?: { code: 'DRAFT' }; code?: string };
  considerationAttributes: OnSelectConsiderationAttributes;
}

// ── Contract ──────────────────────────────────────────────────────────────────

export interface OnSelectContract {
  status: { code: 'QUOTED' };
  participants: Participant[];
  commitments: OnSelectCommitment[];
  consideration: OnSelectConsideration[];
  performance: SelectPerformance[];
}

// ── Response envelope ─────────────────────────────────────────────────────────

export interface OnSelectResponse {
  context: BecknContext;
  message: { contract: OnSelectContract };
}
