// ─────────────────────────────────────────────────────────────────────────────
// Beckn FnB — Select / on_select interfaces
// Source: static/select/select-request.json + static/select/on_select-response.json
// ─────────────────────────────────────────────────────────────────────────────

// ── Common ────────────────────────────────────────────────────────────────────

export interface BecknContext {
  version: string;
  action: string;
  timestamp: string;
  messageId: string;
  transactionId: string;
  bapId: string;
  bapUri: string;
  bppId: string;
  bppUri: string;
  ttl: string;
  networkId: string;
}

export interface Descriptor {
  name: string;
  shortDesc?: string;
}

export interface Quantity {
  unitCode: string;
  unitQuantity: number;
}

export interface Address {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
}

export interface Contact {
  name: string;
  phone: string;
}

export interface DeliveryDetails {
  address: Address;
  contact: Contact;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface OperatingHour {
  daysOfWeek: number[];
  timeRange: TimeRange;
}

// ── Participant ───────────────────────────────────────────────────────────────

export interface Person {
  '@context'?: string;
  '@type'?: string;
  id?: string;
  name: string;
  email?: string;
  telephone?: string;
  address?: Address;
  knowsLanguage?: string[];
}

export interface ParticipantAttributes {
  '@context': string;
  '@type': string;
  id?: string;
  role?: string;
  descriptor?: Descriptor;
  person?: Person;
}

export interface Participant {
  id: string;
  descriptor: Descriptor;
  participantAttributes: ParticipantAttributes;
}

// ── Offer ─────────────────────────────────────────────────────────────────────

export interface OfferPolicy {
  allowed: boolean;
  window: string;
  method?: string;
  cutoffEvent?: string;
}

export interface OfferAttributes {
  '@context': string;
  '@type': string;
  policies?: {
    returns?: OfferPolicy;
    cancellation?: OfferPolicy;
  };
}

export interface Offer {
  id: string;
  resourceIds: string[];
  descriptor: Descriptor;
  provider: { id: string; descriptor: Descriptor };
  offerAttributes?: OfferAttributes;
}

// ── Commitment ────────────────────────────────────────────────────────────────

/** Shape in the select request — no price yet */
export interface SelectCommitmentAttributes {
  '@context': string;
  '@type': string;
  lineId: string;
  resourceId: string;
  quantity: Quantity;
}

export interface SelectCommitment {
  id: string;
  status: { descriptor: { code: 'DRAFT' } };
  resources: Array<{ id: string }>;
  offer?: Offer;
  commitmentAttributes: SelectCommitmentAttributes;
}

/** Price added by the BPP in on_select */
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

export interface OnSelectCommitmentAttributes extends SelectCommitmentAttributes {
  offerId: string;
  price: CommitmentPrice;
  specialInstructions?: string;
}

export interface OnSelectCommitment extends Omit<SelectCommitment, 'status' | 'commitmentAttributes'> {
  status: { descriptor: { code: 'QUOTED' } };
  commitmentAttributes: OnSelectCommitmentAttributes;
}

// ── Performance ───────────────────────────────────────────────────────────────

export interface SelectPerformanceAttributes {
  '@context': string;
  '@type': string;
  supportedPerformanceModes: string[];
  deliveryDetails?: DeliveryDetails;
  operatingHours?: OperatingHour[];
  installationScheduling?: { available: boolean };
}

export interface SelectPerformance {
  id: string;
  status: { code: string };
  commitmentIds: string[];
  performanceAttributes: SelectPerformanceAttributes;
}

// ── Consideration (only in on_select response) ────────────────────────────────

export interface BreakupLine {
  title: string;
  amount: number;
  type: 'BASE_PRICE' | 'TAX' | 'PACKING_CHARGE' | 'DELIVERY_CHARGE' | string;
}

export interface ConsiderationAttributes {
  '@context': string;
  '@type': string;
  currency: string;
  breakup: BreakupLine[];
  totalAmount: number;
  paymentMethods?: string[];
}

export interface Consideration {
  '@context'?: string;
  '@type'?: string;
  id: string;
  status: { code: string } | { descriptor: { code: string } };
  considerationAttributes: ConsiderationAttributes;
}

// ── Request / Response envelopes ──────────────────────────────────────────────

export interface SelectContract {
  status: { code: string };
  participants: Participant[];
  commitments: SelectCommitment[];
  performance: SelectPerformance[];
}

export interface SelectRequest {
  context: BecknContext;
  message: { contract: SelectContract };
}

export interface OnSelectContract {
  status: { code: 'QUOTED' };
  participants: Participant[];
  commitments: OnSelectCommitment[];
  consideration: Consideration[];
  performance: SelectPerformance[];
}

export interface OnSelectResponse {
  context: BecknContext;
  message: { contract: OnSelectContract };
}
