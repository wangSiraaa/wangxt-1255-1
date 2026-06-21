export * from './common';

export enum OrderStatus {
  Draft = 0,
  Submitted = 1,
  Approved = 2,
  Rejected = 3,
  InTransit = 4,
  Received = 5,
  Cancelled = 6
}

export enum BatchStatus {
  Pending = 0,
  Quarantining = 1,
  Active = 2,
  Closed = 3
}

export enum EthicsApprovalStatus {
  Draft = 0,
  Submitted = 1,
  Approved = 2,
  Rejected = 3,
  Expired = 4
}

export enum CageStatus {
  Empty = 0,
  Partial = 1,
  Full = 2
}

export enum DeathType {
  Normal = 0,
  Abnormal = 1,
  Euthanasia = 2,
  Unknown = 3
}

export enum InvestigationStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Closed = 3
}

export enum Gender {
  Male = 0,
  Female = 1,
  Unknown = 2
}

export interface ResearchGroup extends BaseEntity {
  name: string;
  code: string;
  principalInvestigator: string;
  department: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
}

export interface ResearchGroupCreateDto {
  name: string;
  code: string;
  principalInvestigator: string;
  department: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
}

export interface ResearchGroupUpdateDto {
  name: string;
  code: string;
  principalInvestigator: string;
  department: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
}

export interface EthicsApproval extends BaseEntity {
  researchGroupId: string;
  researchGroup?: ResearchGroup;
  approvalNumber: string;
  title: string;
  approvalDate: Date | string;
  expiryDate: Date | string;
  animalTypes: string;
  maxAnimalCount: number;
  usedAnimalCount: number;
  status: EthicsApprovalStatus;
  attachmentUrl?: string;
  remarks?: string;
  isExpired: boolean;
  isValid: boolean;
  remainingDays: number;
}

export interface EthicsApprovalCreateDto {
  researchGroupId: string;
  approvalNumber: string;
  title: string;
  approvalDate: Date | string;
  expiryDate: Date | string;
  animalTypes: string;
  maxAnimalCount: number;
  attachmentUrl?: string;
  remarks?: string;
}

export interface EthicsApprovalUpdateDto {
  researchGroupId: string;
  approvalNumber: string;
  title: string;
  approvalDate: Date | string;
  expiryDate: Date | string;
  animalTypes: string;
  maxAnimalCount: number;
  status: EthicsApprovalStatus;
  attachmentUrl?: string;
  remarks?: string;
}

export interface AnimalOrder extends BaseEntity {
  researchGroupId: string;
  researchGroup?: ResearchGroup;
  ethicsApprovalId: string;
  ethicsApproval?: EthicsApproval;
  orderNumber: string;
  supplier: string;
  species: string;
  strain: string;
  gender: Gender;
  ageWeeks: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  expectedArrivalDate: Date | string;
  status: OrderStatus;
  rejectionReason?: string;
  approvalRemarks?: string;
  remarks?: string;
}

export interface AnimalOrderCreateDto {
  researchGroupId: string;
  ethicsApprovalId: string;
  supplier: string;
  species: string;
  strain: string;
  gender: Gender;
  ageWeeks: number;
  quantity: number;
  unitPrice: number;
  expectedArrivalDate: Date | string;
  remarks?: string;
}

export interface AnimalOrderUpdateDto {
  researchGroupId: string;
  ethicsApprovalId: string;
  supplier: string;
  species: string;
  strain: string;
  gender: Gender;
  ageWeeks: number;
  quantity: number;
  unitPrice: number;
  expectedArrivalDate: Date | string;
  remarks?: string;
}

export interface AnimalOrderApproveDto {
  remarks?: string;
}

export interface AnimalOrderRejectDto {
  rejectionReason: string;
}

export interface AnimalOrderReceiveDto {
  actualArrivalDate: Date | string;
  actualQuantity: number;
  batchCode: string;
  location: string;
  remarks?: string;
}

export interface AnimalBatch extends BaseEntity {
  researchGroupId: string;
  researchGroup?: ResearchGroup;
  orderId?: string;
  order?: AnimalOrder;
  batchCode: string;
  species: string;
  strain: string;
  gender: Gender;
  ageWeeks: number;
  totalQuantity: number;
  currentQuantity: number;
  deathCount: number;
  arrivalDate: Date | string;
  location: string;
  status: BatchStatus;
  closedDate?: Date | string;
  closeReason?: string;
  remarks?: string;
  canClose: boolean;
  cageOccupancyCount: number;
  ethicsApprovalNumber?: string;
  ethicsApprovalExpiryDate?: Date | string;
  ethicsApprovalRemainingDays?: number;
}

export interface AnimalBatchCreateDto {
  researchGroupId: string;
  orderId?: string;
  batchCode: string;
  species: string;
  strain: string;
  gender: Gender;
  ageWeeks: number;
  totalQuantity: number;
  arrivalDate: Date | string;
  location: string;
  remarks?: string;
}

export interface AnimalBatchUpdateDto {
  researchGroupId: string;
  orderId?: string;
  batchCode: string;
  species: string;
  strain: string;
  gender: Gender;
  ageWeeks: number;
  totalQuantity: number;
  arrivalDate: Date | string;
  location: string;
  remarks?: string;
}

export interface AnimalBatchCloseDto {
  closeReason: string;
  remarks?: string;
}

export interface Animal extends BaseEntity {
  batchId: string;
  batch?: AnimalBatch;
  animalNumber: string;
  tagNumber?: string;
  gender: Gender;
  ageWeeks: number;
  weight: number;
  healthStatus: string;
  remarks?: string;
}

export interface CageLocation extends BaseEntity {
  roomNumber: string;
  cageNumber: string;
  locationDescription: string;
  maxCapacity: number;
  currentOccupancy: number;
  status: CageStatus;
  speciesAllowed: string;
  availableCapacity: number;
}

export interface CageLocationCreateDto {
  roomNumber: string;
  cageNumber: string;
  locationDescription: string;
  maxCapacity: number;
  speciesAllowed: string;
}

export interface CageLocationUpdateDto {
  roomNumber: string;
  cageNumber: string;
  locationDescription: string;
  maxCapacity: number;
  status: CageStatus;
  speciesAllowed: string;
}

export interface CageAllocation extends BaseEntity {
  batchId: string;
  batch?: AnimalBatch;
  cageLocationId: string;
  cageLocation?: CageLocation;
  allocatedCount: number;
  allocationDate: Date | string;
  releasedCount: number;
  releaseDate?: Date | string;
  releaseReason?: string;
  isActive: boolean;
  remarks?: string;
}

export interface CageAllocationCreateDto {
  batchId: string;
  cageLocationId: string;
  allocatedCount: number;
  remarks?: string;
}

export interface CageAllocationReleaseDto {
  releaseCount: number;
  releaseReason?: string;
  remarks?: string;
}

export interface QuarantineRecord extends BaseEntity {
  batchId: string;
  batch?: AnimalBatch;
  startDate: Date | string;
  endDate?: Date | string;
  quarantineDays: number;
  observationItems: string;
  results: string;
  isPassed?: boolean;
  completedBy?: string;
  remarks?: string;
}

export interface QuarantineRecordCreateDto {
  batchId: string;
  startDate: Date | string;
  quarantineDays: number;
  observationItems: string;
  remarks?: string;
}

export interface QuarantineRecordUpdateDto {
  startDate: Date | string;
  quarantineDays: number;
  observationItems: string;
  results?: string;
  remarks?: string;
}

export interface QuarantineRecordCompleteDto {
  endDate: Date | string;
  results: string;
  isPassed: boolean;
  completedBy?: string;
  remarks?: string;
}

export interface DeathRecord extends BaseEntity {
  batchId: string;
  batch?: AnimalBatch;
  animalId?: string;
  animal?: Animal;
  deathDate: Date | string;
  deathType: DeathType;
  deathCount: number;
  causeOfDeath?: string;
  location: string;
  reportedBy: string;
  isInvestigated: boolean;
  investigationId?: string;
  remarks?: string;
}

export interface DeathRecordCreateDto {
  batchId: string;
  animalId?: string;
  deathDate: Date | string;
  deathType: DeathType;
  deathCount: number;
  causeOfDeath?: string;
  location: string;
  reportedBy: string;
  remarks?: string;
}

export interface DeathRecordUpdateDto {
  batchId: string;
  animalId?: string;
  deathDate: Date | string;
  deathType: DeathType;
  deathCount: number;
  causeOfDeath?: string;
  location: string;
  reportedBy: string;
  isInvestigated: boolean;
  remarks?: string;
}

export interface DeathInvestigation extends BaseEntity {
  batchId: string;
  batch?: AnimalBatch;
  deathRecordId: string;
  deathRecord?: DeathRecord;
  investigationNumber: string;
  startDate: Date | string;
  completedDate?: Date | string;
  status: InvestigationStatus;
  investigator: string;
  initialFindings?: string;
  rootCause?: string;
  correctiveActions?: string;
  conclusion?: string;
  closedBy?: string;
  closedDate?: Date | string;
  attachmentUrl?: string;
  remarks?: string;
}

export interface DeathInvestigationCreateDto {
  batchId: string;
  deathRecordId: string;
  investigationNumber: string;
  startDate: Date | string;
  investigator: string;
  initialFindings?: string;
  attachmentUrl?: string;
  remarks?: string;
}

export interface DeathInvestigationUpdateDto {
  batchId: string;
  deathRecordId: string;
  investigationNumber: string;
  startDate: Date | string;
  investigator: string;
  status: InvestigationStatus;
  initialFindings?: string;
  rootCause?: string;
  correctiveActions?: string;
  attachmentUrl?: string;
  remarks?: string;
}

export interface DeathInvestigationCompleteDto {
  completedDate: Date | string;
  rootCause: string;
  correctiveActions: string;
  conclusion: string;
  remarks?: string;
}
