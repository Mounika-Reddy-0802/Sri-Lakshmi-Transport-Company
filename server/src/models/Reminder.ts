import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  REMINDER_STATUSES,
  REMINDER_TYPES,
  baseSchemaOptions,
  type ReminderStatus,
  type ReminderType,
} from "./common";

export type ReminderDoc = {
  _id: Types.ObjectId;
  type: ReminderType;
  title: string;
  detail?: string;
  dueDate: Date;
  amount?: number;
  status: ReminderStatus;
  /** Whichever entity the reminder is about; all optional. */
  busId?: Types.ObjectId;
  driverId?: Types.ObjectId;
  organizationId?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const reminderSchema = new Schema<ReminderDoc>(
  {
    type: { type: String, enum: REMINDER_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    detail: { type: String, trim: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, min: 0 },
    status: { type: String, enum: REMINDER_STATUSES, default: "open" },
    busId: { type: Schema.Types.ObjectId, ref: "Bus" },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver" },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    resolvedAt: { type: Date },
  },
  baseSchemaOptions,
);

// "What is open and due soonest" — the admin dashboard's alert panel.
reminderSchema.index({ status: 1, dueDate: 1 });
reminderSchema.index({ type: 1, status: 1 });
reminderSchema.index({ organizationId: 1 });
reminderSchema.index({ busId: 1 });
reminderSchema.index({ driverId: 1 });

export const Reminder: Model<ReminderDoc> =
  (models.Reminder as Model<ReminderDoc>) ?? model<ReminderDoc>("Reminder", reminderSchema);
