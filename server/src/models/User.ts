import { Schema, model, models, type Model, type Types } from "mongoose";
import { ROLES, baseSchemaOptions, type Role } from "./common";

export type UserDoc = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  /** Required for `org` and `student` users; absent for `admin` (who sees everything). */
  organizationId?: Types.ObjectId;
  /** Set for `student` users so the portal can resolve the logged-in profile. */
  studentId?: Types.ObjectId;
  isActive: boolean;
  lastLoginAt?: Date;
  /**
   * Bumped on logout. Refresh tokens embed the value they were issued with, so
   * incrementing it invalidates every outstanding refresh token for this user
   * without needing a token store.
   */
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    // Never the plaintext password, and never returned by default — every
    // query must opt in with .select("+passwordHash").
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    studentId: { type: Schema.Types.ObjectId, ref: "Student" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    tokenVersion: { type: Number, default: 0 },
  },
  baseSchemaOptions,
);

// A non-admin user without an organization would escape tenant scoping, so the
// invariant is enforced at the schema level rather than trusted to callers.
userSchema.pre("validate", function enforceTenant(next) {
  if (this.role !== "admin" && !this.organizationId) {
    next(new Error(`A '${this.role}' user must belong to an organization.`));
    return;
  }
  if (this.role === "admin" && this.organizationId) {
    next(new Error("An 'admin' user must not be scoped to an organization."));
    return;
  }
  next();
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ studentId: 1 });

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) ?? model<UserDoc>("User", userSchema);
