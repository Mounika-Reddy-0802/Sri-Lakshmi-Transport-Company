// Barrel for the eight core collections. Importing from here guarantees every
// model is registered before any populate() runs.
export * from "./common";
export { Organization, type OrganizationDoc } from "./Organization";
export { User, type UserDoc } from "./User";
export { Driver, type DriverDoc } from "./Driver";
export { Route, type RouteDoc, type PickupPoint } from "./Route";
export { Bus, type BusDoc } from "./Bus";
export { Student, type StudentDoc, type Parent } from "./Student";
export { Invoice, type InvoiceDoc } from "./Invoice";
export { Reminder, type ReminderDoc } from "./Reminder";
