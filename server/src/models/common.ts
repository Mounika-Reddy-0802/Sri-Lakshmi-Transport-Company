// Shared enums and sub-schemas used across collections.
import { Schema } from "mongoose";

export const ROLES = ["admin", "org", "student"] as const;
export type Role = (typeof ROLES)[number];

export const ORGANIZATION_TYPES = ["School", "University", "Corporate", "Pharma", "Other"] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const BUS_STATUSES = ["Active", "Maintenance", "Inactive"] as const;
export type BusStatus = (typeof BUS_STATUSES)[number];

export const INVOICE_STATUSES = ["paid", "pending", "overdue"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const REMINDER_TYPES = [
  "emi",
  "tax",
  "insurance",
  "licence",
  "fitness",
  "permit",
  "puc",
] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

export const REMINDER_STATUSES = ["open", "resolved", "dismissed"] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

/** A stored document (RC, insurance, licence, agreement...). */
export type StoredDocument = {
  kind: string;
  number?: string;
  url?: string;
  issuedAt?: Date;
  expiresAt?: Date;
};

export const storedDocumentSchema = new Schema<StoredDocument>(
  {
    kind: { type: String, required: true, trim: true },
    number: { type: String, trim: true },
    url: { type: String, trim: true },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { _id: false },
);

/** A statutory item on a vehicle that carries an expiry date. */
export type ComplianceItem = {
  number?: string;
  expiryDate?: Date;
  documentUrl?: string;
};

export const complianceItemSchema = new Schema<ComplianceItem>(
  {
    number: { type: String, trim: true },
    expiryDate: { type: Date },
    documentUrl: { type: String, trim: true },
  },
  { _id: false },
);

/** Options shared by every top-level collection. */
export const baseSchemaOptions = {
  timestamps: true,
  versionKey: false,
} as const;
