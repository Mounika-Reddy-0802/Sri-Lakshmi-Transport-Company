"use client";
// React Query hooks over the Phase 4 resource API.
//
// Every list endpoint returns the same envelope and every write is admin-only
// (the server enforces it; the UI simply hides the buttons), so one set of
// hooks serves all seven collections.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ListEnvelope } from "./api";

export type ListParams = {
  page?: number;
  limit?: number;
  q?: string;
  /** Extra equality filters the endpoint supports, e.g. status. */
  filters?: Record<string, string | undefined>;
};

function toQueryString({ page = 1, limit = 20, q, filters = {} }: ListParams): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (q) params.set("q", q);
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

/** Paginated, searchable list for a resource path such as "buses". */
export function useResourceList<T>(resource: string, params: ListParams = {}) {
  return useQuery({
    queryKey: [resource, params],
    queryFn: () => api.get<ListEnvelope<T>>(`/${resource}?${toQueryString(params)}`),
    // Keeps the previous page on screen while the next one loads, instead of
    // collapsing the table to a skeleton on every keystroke.
    placeholderData: (previous) => previous,
  });
}

/** Small unpaginated fetch used to populate select boxes. */
export function useOptions<T>(resource: string, enabled = true) {
  return useQuery({
    queryKey: [resource, "options"],
    queryFn: () => api.get<ListEnvelope<T>>(`/${resource}?page=1&limit=100`),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateResource(resource: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post(`/${resource}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [resource] }),
  });
}

export function useUpdateResource(resource: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/${resource}/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [resource] }),
  });
}

export function useDeleteResource(resource: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/${resource}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [resource] }),
  });
}

// ------------------------------------------------------------- record shapes

export type BusRecord = {
  _id: string;
  regNumber: string;
  type: string;
  capacity: number;
  isAc?: boolean;
  status: string;
  organizationId?: { _id: string; name: string } | string | null;
  routeId?: { _id: string; name: string; code: string } | string | null;
  driverId?: { _id: string; name: string } | string | null;
  insurance?: { number?: string; expiryDate?: string };
  permit?: { number?: string; expiryDate?: string };
  fitness?: { number?: string; expiryDate?: string };
  puc?: { number?: string; expiryDate?: string };
};

export type DriverRecord = {
  _id: string;
  name: string;
  phone: string;
  licenceNumber: string;
  licenceExpiry: string;
  isActive?: boolean;
  organizationId?: string | null;
};

export type RouteRecord = {
  _id: string;
  code: string;
  name: string;
  distanceKm: number;
  organizationId?: string | null;
  busId?: { _id: string; regNumber: string } | string | null;
  driverId?: { _id: string; name: string } | string | null;
  pickupPoints?: { name: string; pickupTime?: string; dropTime?: string }[];
  isActive?: boolean;
};

export type OrganizationRecord = {
  _id: string;
  name: string;
  type: string;
  location?: string;
  clientSince?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  gstNumber?: string;
  isActive?: boolean;
};

export type StudentRecord = {
  _id: string;
  studentCode: string;
  name: string;
  class: string;
  pickupPoint: string;
  ratePerKm: number;
  organizationId?: string | null;
  routeId?: { _id: string; name: string; code: string } | string | null;
  parent?: { name?: string; phone?: string; email?: string };
  isActive?: boolean;
};

export type InvoiceRecord = {
  _id: string;
  invoiceNumber: string;
  period: string;
  amount: number;
  status: string;
  dueDate: string;
  paidAt?: string | null;
  studentId?: { _id: string; name: string; studentCode: string } | string | null;
  organizationId?: string | null;
  receiptUrl?: string | null;
};

export type UserRecord = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "org" | "student";
  organizationId: string | null;
  organizationName: string | null;
  studentId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};

export type ReminderRecord = {
  _id: string;
  type: string;
  title: string;
  detail?: string;
  dueDate: string;
  amount?: number;
  status: string;
};

/** Populated refs come back as objects; unpopulated as plain ids. */
export function refName(value: unknown, key = "name"): string {
  if (value && typeof value === "object" && key in value) {
    return String((value as Record<string, unknown>)[key] ?? "—");
  }
  return "—";
}

export function refId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id ?? "");
  }
  return "";
}
