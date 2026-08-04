import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  ORGANIZATION_TYPES,
  baseSchemaOptions,
  storedDocumentSchema,
  type OrganizationType,
  type StoredDocument,
} from "./common";

export type OrganizationDoc = {
  _id: Types.ObjectId;
  name: string;
  type: OrganizationType;
  location?: string;
  clientSince?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  gstNumber?: string;
  documents: StoredDocument[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const organizationSchema = new Schema<OrganizationDoc>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ORGANIZATION_TYPES, required: true },
    location: { type: String, trim: true },
    // Free text on purpose — the profile records things like "2021 – Present".
    clientSince: { type: String, trim: true },
    contactName: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    documents: { type: [storedDocumentSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

// Natural key — the seed upserts on it, and two organizations may not share a name.
organizationSchema.index({ name: 1 }, { unique: true });
organizationSchema.index({ type: 1 });
organizationSchema.index({ isActive: 1 });

export const Organization: Model<OrganizationDoc> =
  (models.Organization as Model<OrganizationDoc>) ??
  model<OrganizationDoc>("Organization", organizationSchema);
