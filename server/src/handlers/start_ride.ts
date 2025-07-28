
import { db } from '../db';
import { ridesTable, scootersTable, usersTable } from '../db/schema';
import { type StartRideInput, type Ride } from '../schema';
import { eq, and } from 'drizzle-orm';

export const startRide = async (input: StartRideInput): Promise<Ride> => {
  try {
    // Verify user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    // Verify scooter exists and is available
    const scooters = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.id, input.scooter_id))
      .execute();

    if (scooters.length === 0) {
      throw new Error('Scooter not found');
    }

    const scooter = scooters[0];
    if (scooter.status !== 'available') {
      throw new Error('Scooter is not available');
    }

    // Check if user already has an active ride
    const activeRides = await db.select()
      .from(ridesTable)
      .where(and(
        eq(ridesTable.user_id, input.user_id),
        eq(ridesTable.status, 'active')
      ))
      .execute();

    if (activeRides.length > 0) {
      throw new Error('User already has an active ride');
    }

    // Update scooter status to in_use and unlock it
    await db.update(scootersTable)
      .set({
        status: 'in_use',
        is_locked: false,
        updated_at: new Date()
      })
      .where(eq(scootersTable.id, input.scooter_id))
      .execute();

    // Create ride record
    const result = await db.insert(ridesTable)
      .values({
        user_id: input.user_id,
        scooter_id: input.scooter_id,
        status: 'active',
        start_latitude: input.start_latitude.toString(),
        start_longitude: input.start_longitude.toString(),
        started_at: new Date()
      })
      .returning()
      .execute();

    const ride = result[0];
    return {
      ...ride,
      start_latitude: parseFloat(ride.start_latitude),
      start_longitude: parseFloat(ride.start_longitude),
      end_latitude: ride.end_latitude ? parseFloat(ride.end_latitude) : null,
      end_longitude: ride.end_longitude ? parseFloat(ride.end_longitude) : null,
      distance_km: ride.distance_km ? parseFloat(ride.distance_km) : null,
      total_cost: ride.total_cost ? parseFloat(ride.total_cost) : null
    };
  } catch (error) {
    console.error('Ride start failed:', error);
    throw error;
  }
};
