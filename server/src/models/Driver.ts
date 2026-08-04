import { Schema, model, models, type Model, type Types } from "mongoose";
import { baseSchemaOptions, storedDocumentSchema, type StoredDocument } from "./common";

export type DriverDoc = {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  licenceNumber: string;
  licenceExpiry: Date;
  /** Stored for compliance. Never returned to a non-admin caller. */
  aadhaar?: string;
  organizationId?: Types.ObjectId;
  documents: StoredDocument[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const driverSchema = new Schema<DriverDoc>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenceNumber: { type: String, required: true, trim: true, uppercase: true },
    licenceExpiry: { type: Date, required: true },
    aadhaar: { type: String, trim: true, select: false },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    documents: { type: [storedDocumentSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

driverSchema.index({ licenceNumber: 1 }, { unique: true });
driverSchema.index({ organizationId: 1 });
// The reminder engine (Phase 9) scans for licences expiring soon.
driverSchema.index({ licenceExpiry: 1 });

export const Driver: Model<DriverDoc> =
  (models.Driver as Model<DriverDoc>) ?? model<DriverDoc>("Driver", driverSchema);
