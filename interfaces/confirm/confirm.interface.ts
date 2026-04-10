// ─────────────────────────────────────────────────────────────────────────────
// Beckn FnB — Confirm / on_confirm interfaces
// Source: static/confirm/confirm-request.json + static/confirm/on_confirm-response.json
// ─────────────────────────────────────────────────────────────────────────────

import type {
  BecknContext,
  Descriptor,
  Quantity,
  DeliveryDetails,
  TimeRange,
  OperatingHour,
  Participant,
  Offer,
  CommitmentPrice,
  BreakupLine,
  ConsiderationAttributes,
} from '../select/select.interface';

import type {
  Sla,
  InitPerformanceAttributes,
  ContractAttributes,
} from '../init/init.interface';

export type {
  BecknContext,
  Descriptor,
  Quantity,
  DeliveryDetails,
  TimeRange,
  OperatingHour,
  Participant,
  Offer,
  CommitmentPrice,
  BreakupLine,
  ConsiderationAttributes,
  Sla,
  InitPerformanceAttributes,
  ContractAttributes,
};

// ── Commitment ────────────────────────────────────────────────────────────────

export interface ConfirmCommitmentAttributes {
  '@context': string;
  '@type': string;
  lineId: string;
  resourceId: string;
  offerId?: string;
  quantity: Quantity;
  price?: CommitmentPrice;
  specialInstructions?: string;
}

export interface ConfirmCommitment {
  id: string;
  status: { descriptor: { code: string } };
  resources: Array<{ id: string }>;
  offer?: Offer;
  commitmentAttributes: ConfirmCommitmentAttributes;
}

// ── Performance ───────────────────────────────────────────────────────────────

export interface ConfirmPerformance {
  id: string;
  status: { code: string };
  commitmentIds: string[];
  performanceAttributes: InitPerformanceAttributes;
}

// ── Consideration ─────────────────────────────────────────────────────────────

export interface ConfirmConsiderationAttributes extends ConsiderationAttributes {
  paymentMethods: string[];   // buyer's chosen method as first element
}

export interface ConfirmConsideration {
  '@context'?: string;
  '@type'?: string;
  id: string;
  status: { descriptor?: { code: string }; code?: string };
  considerationAttributes: ConfirmConsiderationAttributes;
}

// ── Settlement (confirm request only) ─────────────────────────────────────────

export interface SettlementGateway {
  name: string;
  transactionId: string;
}

export interface SettlementAttributes {
  '@context': string;
  '@type': string;
  method: string;
  settledAmount: number;
  currency: string;
  settledAt: string;
  gateway?: SettlementGateway;
  reconciliationId?: string;
}

export interface Settlement {
  id: string;
  considerationId: string;
  status: string;
  settlementAttributes: SettlementAttributes;
}

// ── confirm request ───────────────────────────────────────────────────────────

export interface ConfirmContract {
  id?: string;
  status: { code: string };
  participants: Participant[];
  commitments: ConfirmCommitment[];
  consideration?: ConfirmConsideration[];
  performance: ConfirmPerformance[];
  settlements?: Settlement[];
}

export interface ConfirmRequest {
  context: BecknContext;
  message: { contract: ConfirmContract };
}

// ── on_confirm response ───────────────────────────────────────────────────────

export interface OnConfirmCommitment extends Omit<ConfirmCommitment, 'status'> {
  status: { descriptor: { code: 'ACTIVE' } };
}

export interface OnConfirmConsideration extends Omit<ConfirmConsideration, 'status'> {
  status: { descriptor: { code: 'AGREED' } };
}

export interface OnConfirmPerformance extends Omit<ConfirmPerformance, 'status'> {
  status: { code: 'ORDER_PLACED' };
}

export interface OnConfirmContract {
  id: string;                               // BPP-generated order ID
  status: { code: 'ACTIVE' };
  participants: Participant[];
  commitments: OnConfirmCommitment[];
  consideration: OnConfirmConsideration[];
  performance: OnConfirmPerformance[];
  contractAttributes?: ContractAttributes;
}

export interface OnConfirmResponse {
  context: BecknContext;
  message: { contract: OnConfirmContract };
}
