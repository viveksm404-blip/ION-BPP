// -----------------------------------------------------------------------
// Shared base types (duplicated per-folder for standalone use)
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

export interface BreakupLine {
  title: string;
  amount: number;
  type: string;
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
// Commitment
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

export interface CommitmentAttributes {
  '@context': string;
  '@type': string;
  lineId: string;
  resourceId: string;
  offerId?: string;
  quantity: Quantity;
  price?: CommitmentPrice;
  specialInstructions?: string;
}

export interface Commitment {
  id: string;
  status: StatusWithDescriptor;
  resources: Array<{ id: string }>;
  offer?: Offer;
  commitmentAttributes: CommitmentAttributes;
}

// -----------------------------------------------------------------------
// Consideration
// -----------------------------------------------------------------------

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

// -----------------------------------------------------------------------
// Performance
// -----------------------------------------------------------------------

export interface Sla {
  min: string;
  max: string;
  unitBasis: string;
}

export interface PerformanceAttributes {
  '@context': string;
  '@type': string;
  supportedPerformanceModes: string[];
  deliveryDetails?: DeliveryDetails;
  sla?: Sla;
  handling?: string[];
  operatingHours?: OperatingHour[];
  installationScheduling?: { available: boolean };
}

export interface Performance {
  id: string;
  status: StatusWithCode;
  commitmentIds: string[];
  performanceAttributes: PerformanceAttributes;
}

// -----------------------------------------------------------------------
// init request — carries quoted consideration from on_select
// -----------------------------------------------------------------------

export interface InitContract {
  status: StatusWithCode;
  participants: Participant[];
  commitments: Commitment[];
  consideration?: Consideration[];
  performance: Performance[];
}

export interface InitRequest {
  context: BecknContext;
  message: { contract: InitContract };
}

// -----------------------------------------------------------------------
// on_init response — consideration gains paymentMethods, PENDING_PAYMENT
//                    performance gains sla + handling
// -----------------------------------------------------------------------

export interface OnInitConsiderationAttributes extends ConsiderationAttributes {
  paymentMethods: string[];   // required in on_init
}

export interface OnInitConsideration extends Omit<Consideration, 'considerationAttributes'> {
  considerationAttributes: OnInitConsiderationAttributes;
}

export interface OnInitContract {
  id?: string;
  status: StatusWithCode;
  participants: Participant[];
  commitments: Commitment[];
  consideration: OnInitConsideration[];
  performance: Performance[];
  contractAttributes?: ContractAttributes;
}

// -----------------------------------------------------------------------
// ContractAttributes (first appears in on_init response)
// -----------------------------------------------------------------------

export interface InvoiceTaxId {
  scheme: string;
  country: string;
  value: string;
}

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
    taxId?: InvoiceTaxId;
    companyName?: string;
    email?: string;
  };
  source?: { channel: string; campaignId?: string };
  loyalty?: { programId: string; pointsRedeemed: number };
}

export interface OnInitResponse {
  context: BecknContext;
  message: { contract: OnInitContract };
}
