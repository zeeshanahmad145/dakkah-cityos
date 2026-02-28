import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/client.js";

export type ServiceProvider = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  is_active: boolean;
  services: string[]; // product IDs
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Availability = {
  id: string;
  provider_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  slot_duration: number; // minutes
  buffer_time: number; // minutes
  capacity: number;
  is_active: boolean;
};

export type AvailabilityException = {
  id: string;
  provider_id: string;
  date: string;
  is_available: boolean;
  start_time?: string;
  end_time?: string;
  reason?: string;
};

export type Booking = {
  id: string;
  customer_id: string;
  provider_id?: string;
  order_id?: string;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  booking_date: string;
  start_time: string;
  end_time: string;
  duration: number; // minutes
  customer?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  provider?: ServiceProvider;
  items: BookingItem[];
  notes?: string;
  cancellation_reason?: string;
  reminder_sent_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type BookingItem = {
  id: string;
  booking_id: string;
  product_id: string;
  variant_id?: string;
  title: string;
  duration: number;
  price: number;
};

export type AvailableSlot = {
  date: string;
  start_time: string;
  end_time: string;
  provider_id: string;
  provider_name: string;
  available_capacity: number;
};

export type BookingMetrics = {
  total_bookings: number;
  completed_bookings: number;
  canceled_bookings: number;
  no_show_rate: number;
  average_booking_value: number;
  utilization_rate: number;
  popular_times: { hour: number; bookings: number }[];
  bookings_by_status: Record<string, number>;
};

// Service providers hooks
export function useServiceProviders(params?: {
  is_active?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ["service-providers", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.is_active !== undefined)
        searchParams.set("is_active", String(params.is_active));
      if (params?.search) searchParams.set("q", params.search);

      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/service-providers${query ? `?${query}` : ""}`,
      );
      return response as { providers: ServiceProvider[] };
    },
  });
}

export function useServiceProvider(id: string) {
  return useQuery({
    queryKey: ["service-providers", id],
    queryFn: async () => {
      const response = await sdk.client.fetch(`/admin/service-providers/${id}`);
      return response as { provider: ServiceProvider };
    },
    enabled: !!id,
  });
}

export function useCreateServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ServiceProvider>) => {
      const response = await sdk.client.fetch(`/admin/service-providers`, {
        method: "POST",
        body: data,
      });
      return response as { provider: ServiceProvider };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
    },
  });
}

export function useUpdateServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ServiceProvider> & { id: string }) => {
      const response = await sdk.client.fetch(
        `/admin/service-providers/${id}`,
        {
          method: "PUT",
          body: data,
        },
      );
      return response as { provider: ServiceProvider };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
      queryClient.invalidateQueries({
        queryKey: ["service-providers", variables.id],
      });
    },
  });
}

// Availability hooks
export function useProviderAvailability(providerId: string) {
  return useQuery({
    queryKey: ["service-providers", providerId, "availability"],
    queryFn: async () => {
      const response = await sdk.client.fetch(
        `/admin/service-providers/${providerId}/availability`,
      );
      return response as {
        availability: Availability[];
        exceptions: AvailabilityException[];
      };
    },
    enabled: !!providerId,
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      availability,
    }: {
      providerId: string;
      availability: Partial<Availability>[];
    }) => {
      const response = await sdk.client.fetch(
        `/admin/service-providers/${providerId}/availability`,
        {
          method: "PUT",
          body: { availability },
        },
      );
      return response as { availability: Availability[] };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service-providers", variables.providerId, "availability"],
      });
    },
  });
}

export function useAddAvailabilityException() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      ...data
    }: Partial<AvailabilityException> & { providerId: string }) => {
      const response = await sdk.client.fetch(
        `/admin/service-providers/${providerId}/availability/exceptions`,
        {
          method: "POST",
          body: data,
        },
      );
      return response as { exception: AvailabilityException };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service-providers", variables.providerId, "availability"],
      });
    },
  });
}

// Bookings hooks
export function useBookings(params?: {
  status?: string;
  provider_id?: string;
  date_from?: string;
  date_to?: string;
  customer_id?: string;
}) {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.provider_id)
        searchParams.set("provider_id", params.provider_id);
      if (params?.date_from) searchParams.set("date_from", params.date_from);
      if (params?.date_to) searchParams.set("date_to", params.date_to);
      if (params?.customer_id)
        searchParams.set("customer_id", params.customer_id);

      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/bookings${query ? `?${query}` : ""}`,
      );
      return response as { bookings: Booking[] };
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["bookings", id],
    queryFn: async () => {
      const response = await sdk.client.fetch(`/admin/bookings/${id}`);
      return response as { booking: Booking };
    },
    enabled: !!id,
  });
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/bookings/${id}/confirm`, {
        method: "POST",
      });
      return response as { booking: Booking };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCompleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await sdk.client.fetch(
        `/admin/bookings/${id}/complete`,
        {
          method: "POST",
          body: { notes },
        },
      );
      return response as { booking: Booking };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await sdk.client.fetch(`/admin/bookings/${id}/cancel`, {
        method: "POST",
        body: { reason },
      });
      return response as { booking: Booking };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      booking_date,
      start_time,
      provider_id,
    }: {
      id: string;
      booking_date: string;
      start_time: string;
      provider_id?: string;
    }) => {
      const response = await sdk.client.fetch(
        `/admin/bookings/${id}/reschedule`,
        {
          method: "POST",
          body: { booking_date, start_time, provider_id },
        },
      );
      return response as { booking: Booking };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useMarkNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await sdk.client.fetch(`/admin/bookings/${id}/no-show`, {
        method: "POST",
      });
      return response as { booking: Booking };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// Available slots
export function useAvailableSlots(params: {
  service_id: string;
  date: string;
  provider_id?: string;
}) {
  return useQuery({
    queryKey: ["available-slots", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("service_id", params.service_id);
      searchParams.set("date", params.date);
      if (params.provider_id)
        searchParams.set("provider_id", params.provider_id);

      const response = await sdk.client.fetch(
        `/admin/bookings/available-slots?${searchParams.toString()}`,
      );
      return response as { slots: AvailableSlot[] };
    },
    enabled: !!params.service_id && !!params.date,
  });
}

// Booking metrics
export function useBookingMetrics(params?: {
  date_from?: string;
  date_to?: string;
}) {
  return useQuery({
    queryKey: ["booking-metrics", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.date_from) searchParams.set("date_from", params.date_from);
      if (params?.date_to) searchParams.set("date_to", params.date_to);

      const query = searchParams.toString();
      const response = await sdk.client.fetch(
        `/admin/bookings/metrics${query ? `?${query}` : ""}`,
      );
      return response as { metrics: BookingMetrics };
    },
  });
}
