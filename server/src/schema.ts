
import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  phone: z.string().nullable(),
  is_admin: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  phone: z.string().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Payment Card schemas
export const paymentCardSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  card_token: z.string(),
  last_four: z.string(),
  brand: z.string(),
  is_default: z.boolean(),
  created_at: z.coerce.date()
});

export type PaymentCard = z.infer<typeof paymentCardSchema>;

export const createPaymentCardInputSchema = z.object({
  user_id: z.number(),
  card_token: z.string(),
  last_four: z.string(),
  brand: z.string(),
  is_default: z.boolean().optional()
});

export type CreatePaymentCardInput = z.infer<typeof createPaymentCardInputSchema>;

// Scooter schemas
export const scooterStatusEnum = z.enum(['available', 'in_use', 'maintenance', 'charging']);
export type ScooterStatus = z.infer<typeof scooterStatusEnum>;

export const scooterSchema = z.object({
  id: z.number(),
  serial_number: z.string(),
  status: scooterStatusEnum,
  battery_level: z.number().int().min(0).max(100),
  latitude: z.number(),
  longitude: z.number(),
  is_locked: z.boolean(),
  last_ping: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Scooter = z.infer<typeof scooterSchema>;

export const createScooterInputSchema = z.object({
  serial_number: z.string(),
  latitude: z.number(),
  longitude: z.number()
});

export type CreateScooterInput = z.infer<typeof createScooterInputSchema>;

export const updateScooterLocationInputSchema = z.object({
  id: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  battery_level: z.number().int().min(0).max(100)
});

export type UpdateScooterLocationInput = z.infer<typeof updateScooterLocationInputSchema>;

export const scooterCommandInputSchema = z.object({
  scooter_id: z.number(),
  command: z.enum(['lock', 'unlock'])
});

export type ScooterCommandInput = z.infer<typeof scooterCommandInputSchema>;

// Ride schemas
export const rideStatusEnum = z.enum(['active', 'completed', 'cancelled']);
export type RideStatus = z.infer<typeof rideStatusEnum>;

export const rideSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  scooter_id: z.number(),
  status: rideStatusEnum,
  start_latitude: z.number(),
  start_longitude: z.number(),
  end_latitude: z.number().nullable(),
  end_longitude: z.number().nullable(),
  distance_km: z.number().nullable(),
  duration_minutes: z.number().int().nullable(),
  total_cost: z.number().nullable(),
  started_at: z.coerce.date(),
  ended_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type Ride = z.infer<typeof rideSchema>;

export const startRideInputSchema = z.object({
  user_id: z.number(),
  scooter_id: z.number(),
  start_latitude: z.number(),
  start_longitude: z.number()
});

export type StartRideInput = z.infer<typeof startRideInputSchema>;

export const endRideInputSchema = z.object({
  ride_id: z.number(),
  end_latitude: z.number(),
  end_longitude: z.number(),
  distance_km: z.number(),
  duration_minutes: z.number().int()
});

export type EndRideInput = z.infer<typeof endRideInputSchema>;

// Pricing schemas
export const pricingSchema = z.object({
  id: z.number(),
  base_price: z.number(),
  price_per_minute: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Pricing = z.infer<typeof pricingSchema>;

export const createPricingInputSchema = z.object({
  base_price: z.number().positive(),
  price_per_minute: z.number().positive()
});

export type CreatePricingInput = z.infer<typeof createPricingInputSchema>;

// Geofence schemas
export const geofenceSchema = z.object({
  id: z.number(),
  name: z.string(),
  polygon_coordinates: z.string(), // JSON string of coordinate array
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Geofence = z.infer<typeof geofenceSchema>;

export const createGeofenceInputSchema = z.object({
  name: z.string(),
  polygon_coordinates: z.string() // JSON string of coordinate array
});

export type CreateGeofenceInput = z.infer<typeof createGeofenceInputSchema>;

// Payment schemas
export const paymentStatusEnum = z.enum(['pending', 'completed', 'failed', 'refunded']);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export const paymentSchema = z.object({
  id: z.number(),
  ride_id: z.number(),
  user_id: z.number(),
  amount: z.number(),
  status: paymentStatusEnum,
  payment_method_id: z.number(),
  transaction_id: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Payment = z.infer<typeof paymentSchema>;

export const createPaymentInputSchema = z.object({
  ride_id: z.number(),
  user_id: z.number(),
  amount: z.number().positive(),
  payment_method_id: z.number()
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

// Dashboard metrics schema
export const dashboardMetricsSchema = z.object({
  total_users: z.number().int(),
  active_rides: z.number().int(),
  total_scooters: z.number().int(),
  available_scooters: z.number().int(),
  total_revenue: z.number(),
  rides_today: z.number().int(),
  revenue_today: z.number()
});

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;
