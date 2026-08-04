import { Schema, model, models, type Model, type Types } from "mongoose";
import { baseSchemaOptions } from "./common";

export type PickupPoint = {
  name: string;
  /** Minutes from the start of the route; used to render the timetable. */
  pickupTime?: string;
  dropTime?: string;
  distanceKm?: number;
};

const pickupPointSchema = new Schema<PickupPoint>(
  {
    name: { type: String, required: true, trim: true },
    pickupTime: { type: String, trim: true },
    dropTime: { type: String, trim: true },
    distanceKm: { type: Number, min: 0 },
  },
  { _id: false },
);

export type RouteDoc = {
  _id: Types.ObjectId;
  code: string;
  name: string;
  pickupPoints: PickupPoint[];
  distanceKm: number;
  organizationId: Types.ObjectId;
  busId?: Types.ObjectId;
  driverId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const routeSchema = new Schema<RouteDoc>(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    pickupPoints: { type: [pickupPointSchema], default: [] },
    distanceKm: { type: Number, required: true, min: 0 },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    busId: { type: Schema.Types.ObjectId, ref: "Bus" },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver" },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

routeSchema.index({ code: 1 }, { unique: true });
routeSchema.index({ organizationId: 1, isActive: 1 });
routeSchema.index({ busId: 1 });
routeSchema.index({ driverId: 1 });

export const Route: Model<RouteDoc> =
  (models.Route as Model<RouteDoc>) ?? model<RouteDoc>("Route", routeSchema);
