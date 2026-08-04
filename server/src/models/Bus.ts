import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  BUS_STATUSES,
  baseSchemaOptions,
  complianceItemSchema,
  type BusStatus,
  type ComplianceItem,
} from "./common";

export type BusDoc = {
  _id: Types.ObjectId;
  regNumber: string;
  type: string;
  capacity: number;
  isAc: boolean;
  organizationId?: Types.ObjectId;
  routeId?: Types.ObjectId;
  driverId?: Types.ObjectId;
  status: BusStatus;
  insurance?: ComplianceItem;
  permit?: ComplianceItem;
  fitness?: ComplianceItem;
  puc?: ComplianceItem;
  createdAt: Date;
  updatedAt: Date;
};

const busSchema = new Schema<BusDoc>(
  {
    regNumber: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1, max: 100 },
    isAc: { type: Boolean, default: false },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    routeId: { type: Schema.Types.ObjectId, ref: "Route" },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver" },
    status: { type: String, enum: BUS_STATUSES, default: "Active" },
    insurance: { type: complianceItemSchema },
    permit: { type: complianceItemSchema },
    fitness: { type: complianceItemSchema },
    puc: { type: complianceItemSchema },
  },
  baseSchemaOptions,
);

busSchema.index({ regNumber: 1 }, { unique: true });
busSchema.index({ organizationId: 1, status: 1 });
busSchema.index({ routeId: 1 });
busSchema.index({ driverId: 1 });
// The compliance dashboard and reminder engine sort on these expiry dates.
busSchema.index({ "insurance.expiryDate": 1 });
busSchema.index({ "fitness.expiryDate": 1 });
busSchema.index({ "permit.expiryDate": 1 });

export const Bus: Model<BusDoc> =
  (models.Bus as Model<BusDoc>) ?? model<BusDoc>("Bus", busSchema);
