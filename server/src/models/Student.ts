import { Schema, model, models, type Model, type Types } from "mongoose";
import { baseSchemaOptions } from "./common";

export type Parent = {
  name?: string;
  phone?: string;
  email?: string;
};

const parentSchema = new Schema<Parent>(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: false },
);

export type StudentDoc = {
  _id: Types.ObjectId;
  /** Human-facing id shown in the portals, e.g. "SV-1042". */
  studentCode: string;
  name: string;
  class: string;
  parent: Parent;
  pickupPoint: string;
  routeId?: Types.ObjectId;
  organizationId: Types.ObjectId;
  /** Monthly fee = route.distanceKm x ratePerKm (see the student portal). */
  ratePerKm: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const studentSchema = new Schema<StudentDoc>(
  {
    studentCode: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    parent: { type: parentSchema, default: {} },
    pickupPoint: { type: String, required: true, trim: true },
    routeId: { type: Schema.Types.ObjectId, ref: "Route" },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    ratePerKm: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

studentSchema.index({ studentCode: 1 }, { unique: true });
// The single most common query in the app: "this organization's students".
studentSchema.index({ organizationId: 1, isActive: 1 });
studentSchema.index({ routeId: 1 });
studentSchema.index({ name: 1 });

export const Student: Model<StudentDoc> =
  (models.Student as Model<StudentDoc>) ?? model<StudentDoc>("Student", studentSchema);
