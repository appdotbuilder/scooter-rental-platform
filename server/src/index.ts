
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import { 
  createUserInputSchema, 
  loginInputSchema,
  createPaymentCardInputSchema,
  createScooterInputSchema,
  updateScooterLocationInputSchema,
  scooterCommandInputSchema,
  startRideInputSchema,
  endRideInputSchema,
  createPricingInputSchema,
  createGeofenceInputSchema,
  createPaymentInputSchema
} from './schema';

// Handler imports
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createPaymentCard } from './handlers/create_payment_card';
import { getUserPaymentCards } from './handlers/get_user_payment_cards';
import { getAvailableScooters } from './handlers/get_available_scooters';
import { createScooter } from './handlers/create_scooter';
import { updateScooterLocation } from './handlers/update_scooter_location';
import { sendScooterCommand } from './handlers/send_scooter_command';
import { startRide } from './handlers/start_ride';
import { endRide } from './handlers/end_ride';
import { getUserRides } from './handlers/get_user_rides';
import { createPricing } from './handlers/create_pricing';
import { getActivePricing } from './handlers/get_active_pricing';
import { createGeofence } from './handlers/create_geofence';
import { getGeofences } from './handlers/get_geofences';
import { createPayment } from './handlers/create_payment';
import { getDashboardMetrics } from './handlers/get_dashboard_metrics';
import { getAllScooters } from './handlers/get_all_scooters';
import { getAllUsers } from './handlers/get_all_users';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User authentication
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Payment cards
  createPaymentCard: publicProcedure
    .input(createPaymentCardInputSchema)
    .mutation(({ input }) => createPaymentCard(input)),
  
  getUserPaymentCards: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserPaymentCards(input.userId)),

  // Scooters
  getAvailableScooters: publicProcedure
    .query(() => getAvailableScooters()),
  
  createScooter: publicProcedure
    .input(createScooterInputSchema)
    .mutation(({ input }) => createScooter(input)),
  
  updateScooterLocation: publicProcedure
    .input(updateScooterLocationInputSchema)
    .mutation(({ input }) => updateScooterLocation(input)),
  
  sendScooterCommand: publicProcedure
    .input(scooterCommandInputSchema)
    .mutation(({ input }) => sendScooterCommand(input)),

  // Rides
  startRide: publicProcedure
    .input(startRideInputSchema)
    .mutation(({ input }) => startRide(input)),
  
  endRide: publicProcedure
    .input(endRideInputSchema)
    .mutation(({ input }) => endRide(input)),
  
  getUserRides: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserRides(input.userId)),

  // Pricing
  createPricing: publicProcedure
    .input(createPricingInputSchema)
    .mutation(({ input }) => createPricing(input)),
  
  getActivePricing: publicProcedure
    .query(() => getActivePricing()),

  // Geofences
  createGeofence: publicProcedure
    .input(createGeofenceInputSchema)
    .mutation(({ input }) => createGeofence(input)),
  
  getGeofences: publicProcedure
    .query(() => getGeofences()),

  // Payments
  createPayment: publicProcedure
    .input(createPaymentInputSchema)
    .mutation(({ input }) => createPayment(input)),

  // Admin dashboard
  getDashboardMetrics: publicProcedure
    .query(() => getDashboardMetrics()),
  
  getAllScooters: publicProcedure
    .query(() => getAllScooters()),
  
  getAllUsers: publicProcedure
    .query(() => getAllUsers()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
