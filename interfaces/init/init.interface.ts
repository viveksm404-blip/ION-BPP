// ─────────────────────────────────────────────────────────────────────────────
// Beckn FnB — Init / on_init interfaces
// Source: static/init/init-request.json + static/init/on_init-response.json
// ─────────────────────────────────────────────────────────────────────────────

import type {
  BecknContext,
  Descriptor,
  Quantity,
  Address,
  Contact,
  DeliveryDetails,
  TimeRange,
  OperatingHour,
  Person,
  Participant,
  Offer,
  CommitmentPrice,
  BreakupLine,
  Consideration,
  ConsiderationAttributes,
} from '../select/select.interface';

export type {
  BecknContext,
  Descriptor,
  Quantity,
  Address,
  Contact,
  DeliveryDetails,
  TimeRange,
  OperatingHour,
  Person,
  Participant,
  Offer,
  CommitmentPrice,
  BreakupLine,
  Consideration,
  ConsiderationAttributes,
};

// ── Commitment (carries price from on_select) ─────────────────────────────────

export interface InitCommitmentAttributes {
  '@context': string;
  '@type': string;
  lineId: string;
  resourceId: string;
  offerId?: string;
  quantity: Quantity;
  price?: CommitmentPrice;
  specialInstructions?: string;
}

export interface InitCommitment {
  id: string;
  status: { descriptor: { code: 'QUOTED' | 'DRAFT' } };
  resources: Array<{ id: string }>;
  offer?: Offer;
  commitmentAttributes: InitCommitmentAttributes;
}

// ── Performance ───────────────────────────────────────────────────────────────

export interface Sla {
  min: string;
  max: string;
  unitBasis: string;
}

export interface InitPerformanceAttributes {
  '@context': string;
  '@type': string;
  supportedPerformanceModes: string[];
  deliveryDetails?: DeliveryDetails;
  sla?: Sla;
  handling?: string[];
  operatingHours?: OperatingHour[];
  installationScheduling?: { available: boolean };
}

export interface InitPerformance {
  id: string;
  status: { code: string };
  commitmentIds: string[];
  performanceAttributes: InitPerformanceAttributes;
}

// ── ContractAttributes (appears in on_init response) ─────────────────────────

export interface ContractAttributes {
  '@context': string;
  '@type': string;
  buyerInstructions?: string;
  deliveryPreferences?: {
    leaveAtDoor: boolean;
    contactless: boolean;
    preferredTimeSlot?: TimeRange;
  };
  gift?: { isGift: boolean };
  invoicePreferences?: {
    taxId?: { scheme: string; country: string; value: string };
    companyName?: string;
    email?: string;
  };
  source?: { channel: string; campaignId?: string };
  loyalty?: { programId: string; pointsRedeemed: number };
}

// ── init request ──────────────────────────────────────────────────────────────

export interface InitContract {
  status: { code: string };
  participants: Participant[];
  commitments: InitCommitment[];
  consideration?: Consideration[];
  performance: InitPerformance[];
}

export interface InitRequest {
  context: BecknContext;
  message: { contract: InitContract };
}

// ── on_init response — consideration gains paymentMethods (PENDING_PAYMENT) ──

export interface OnInitConsiderationAttributes extends ConsiderationAttributes {
  paymentMethods: string[];
}

export interface OnInitConsideration extends Omit<Consideration, 'status' | 'considerationAttributes'> {
  status: { descriptor: { code: 'PENDING_PAYMENT' } };
  considerationAttributes: OnInitConsiderationAttributes;
}

export interface OnInitCommitment extends Omit<InitCommitment, 'status'> {
  status: { descriptor: { code: 'DRAFT' } };
}

export interface OnInitContract {
  id?: string;
  status: { code: 'DRAFT' };
  participants: Participant[];
  commitments: OnInitCommitment[];
  consideration: OnInitConsideration[];
  performance: InitPerformance[];
  contractAttributes?: ContractAttributes;
}

export interface OnInitResponse {
  context: BecknContext;
  message: { contract: OnInitContract };
}
