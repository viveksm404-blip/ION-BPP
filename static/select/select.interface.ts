// -----------------------------------------------------------------------
// Shared base types
// -----------------------------------------------------------------------

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

export interface StatusWithCode {
  code: string;
}

export interface StatusWithDescriptor {
  descriptor: { code: string };
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

// -----------------------------------------------------------------------
// Participant
// -----------------------------------------------------------------------

export interface ParticipantAttributes {
  '@context': string;
  '@type': string;
  id?: string;
  role?: string;
  descriptor?: Descriptor;
  person?: {
    '@context'?: string;
    '@type'?: string;
    id?: string;
    name: string;
    email?: string;
    telephone?: string;
    address?: Address;
    knowsLanguage?: string[];
  };
}

export interface Participant {
  id: string;
  descriptor: Descriptor;
  participantAttributes: ParticipantAttributes;
}

// -----------------------------------------------------------------------
// Offer
// -----------------------------------------------------------------------

export interface OfferPolicy {
  allowed: boolean;
  window: string;
  method?: string;
  cutoffEvent?: string;
  subjectToAvailability?: boolean;
}

export interface OfferAttributes {
  '@context': string;
  '@type': string;
  policies?: {
    returns?: OfferPolicy;
    cancellation?: OfferPolicy;
    replacement?: OfferPolicy;
  };
  paymentConstraints?: { codAvailable: boolean };
  serviceability?: {
    distanceConstraint?: { maxDistance: number; unit: string };
    timing?: Array<{ daysOfWeek: string[]; timeRange: TimeRange }>;
  };
  timeRange?: TimeRange;
  holidays?: string[];
}

export interface Offer {
  id: string;
  resourceIds: string[];
  descriptor: Descriptor;
  provider: { id: string; descriptor: Descriptor };
  offerAttributes?: OfferAttributes;
}

// -----------------------------------------------------------------------
// Commitment (select request — no price on commitmentAttributes)
// -----------------------------------------------------------------------

export interface SelectCommitmentAttributes {
  '@context': string;
  '@type': string;
  lineId: string;
  resourceId: string;
  quantity: Quantity;
}

export interface SelectCommitment {
  id: string;
  status: StatusWithDescriptor;
  resources: Array<{ id: string }>;
  offer?: Offer;
  commitmentAttributes: SelectCommitmentAttributes;
}

// -----------------------------------------------------------------------
// Performance (select request)
// -----------------------------------------------------------------------

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
  status: StatusWithCode;
  commitmentIds: string[];
  performanceAttributes: SelectPerformanceAttributes;
}

// -----------------------------------------------------------------------
// Select request
// -----------------------------------------------------------------------

export interface SelectContract {
  status: StatusWithCode;
  participants: Participant[];
  commitments: SelectCommitment[];
  performance: SelectPerformance[];
}

export interface SelectRequest {
  context: BecknContext;
  message: { contract: SelectContract };
}

// -----------------------------------------------------------------------
// on_select response — commitmentAttributes gain price
// -----------------------------------------------------------------------

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

export interface OnSelectCommitment extends Omit<SelectCommitment, 'commitmentAttributes'> {
  commitmentAttributes: OnSelectCommitmentAttributes;
}

// -----------------------------------------------------------------------
// Consideration (on_select)
// -----------------------------------------------------------------------

export interface BreakupLine {
  title: string;
  amount: number;
  type: string;
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
  status: StatusWithCode | StatusWithDescriptor;
  considerationAttributes: ConsiderationAttributes;
}

export interface OnSelectContract {
  status: StatusWithCode;
  participants: Participant[];
  commitments: OnSelectCommitment[];
  consideration: Consideration[];
  performance: SelectPerformance[];
}

export interface OnSelectResponse {
  context: BecknContext;
  message: { contract: OnSelectContract };
}
