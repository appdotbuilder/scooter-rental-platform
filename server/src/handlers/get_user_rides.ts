
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type Ride } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserRides(userId: number): Promise<Ride[]> {
  try {
    const results = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.user_id, userId))
      .orderBy(desc(ridesTable.created_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(ride => ({
      ...ride,
      start_latitude: parseFloat(ride.start_latitude),
      start_longitude: parseFloat(ride.start_longitude),
      end_latitude: ride.end_latitude ? parseFloat(ride.end_latitude) : null,
      end_longitude: ride.end_longitude ? parseFloat(ride.end_longitude) : null,
      distance_km: ride.distance_km ? parseFloat(ride.distance_km) : null,
      total_cost: ride.total_cost ? parseFloat(ride.total_cost) : null
    }));
  } catch (error) {
    console.error('Failed to get user rides:', error);
    throw error;
  }
}
