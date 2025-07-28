
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const scooterStatusEnum = pgEnum('scooter_status', ['available', 'in_use', 'maintenance', 'charging']);
export const rideStatusEnum = pgEnum('ride_status', ['active', 'completed', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  phone: text('phone'),
  is_admin: boolean('is_admin').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Payment cards table
export const paymentCardsTable = pgTable('payment_cards', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  card_token: text('card_token').notNull(),
  last_four: text('last_four').notNull(),
  brand: text('brand').notNull(),
  is_default: boolean('is_default').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Scooters table
export const scootersTable = pgTable('scooters', {
  id: serial('id').primaryKey(),
  serial_number: text('serial_number').notNull().unique(),
  status: scooterStatusEnum('status').notNull().default('available'),
  battery_level: integer('battery_level').notNull().default(100),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
  is_locked: boolean('is_locked').notNull().default(true),
  last_ping: timestamp('last_ping').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Rides table
export const ridesTable = pgTable('rides', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  scooter_id: integer('scooter_id').notNull().references(() => scootersTable.id),
  status: rideStatusEnum('status').notNull().default('active'),
  start_latitude: numeric('start_latitude', { precision: 10, scale: 7 }).notNull(),
  start_longitude: numeric('start_longitude', { precision: 10, scale: 7 }).notNull(),
  end_latitude: numeric('end_latitude', { precision: 10, scale: 7 }),
  end_longitude: numeric('end_longitude', { precision: 10, scale: 7 }),
  distance_km: numeric('distance_km', { precision: 8, scale: 3 }),
  duration_minutes: integer('duration_minutes'),
  total_cost: numeric('total_cost', { precision: 10, scale: 2 }),
  started_at: timestamp('started_at').defaultNow().notNull(),
  ended_at: timestamp('ended_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Pricing table
export const pricingTable = pgTable('pricing', {
  id: serial('id').primaryKey(),
  base_price: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  price_per_minute: numeric('price_per_minute', { precision: 10, scale: 2 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Geofences table
export const geofencesTable = pgTable('geofences', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  polygon_coordinates: text('polygon_coordinates').notNull(), // JSON string of coordinate array
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Payments table
export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  ride_id: integer('ride_id').notNull().references(() => ridesTable.id),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  payment_method_id: integer('payment_method_id').notNull().references(() => paymentCardsTable.id),
  transaction_id: text('transaction_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  paymentCards: many(paymentCardsTable),
  rides: many(ridesTable),
  payments: many(paymentsTable)
}));

export const paymentCardsRelations = relations(paymentCardsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [paymentCardsTable.user_id],
    references: [usersTable.id]
  }),
  payments: many(paymentsTable)
}));

export const scootersRelations = relations(scootersTable, ({ many }) => ({
  rides: many(ridesTable)
}));

export const ridesRelations = relations(ridesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [ridesTable.user_id],
    references: [usersTable.id]
  }),
  scooter: one(scootersTable, {
    fields: [ridesTable.scooter_id],
    references: [scootersTable.id]
  }),
  payment: one(paymentsTable, {
    fields: [ridesTable.id],
    references: [paymentsTable.ride_id]
  })
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  ride: one(ridesTable, {
    fields: [paymentsTable.ride_id],
    references: [ridesTable.id]
  }),
  user: one(usersTable, {
    fields: [paymentsTable.user_id],
    references: [usersTable.id]
  }),
  paymentMethod: one(paymentCardsTable, {
    fields: [paymentsTable.payment_method_id],
    references: [paymentCardsTable.id]
  })
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  paymentCards: paymentCardsTable,
  scooters: scootersTable,
  rides: ridesTable,
  pricing: pricingTable,
  geofences: geofencesTable,
  payments: paymentsTable
};
