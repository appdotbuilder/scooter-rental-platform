
import { db } from '../db';
import { scootersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Scooter } from '../schema';

export const getAvailableScooters = async (): Promise<Scooter[]> => {
  try {
    const results = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.status, 'available'))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(scooter => ({
      ...scooter,
      latitude: parseFloat(scooter.latitude),
      longitude: parseFloat(scooter.longitude)
    }));
  } catch (error) {
    console.error('Failed to fetch available scooters:', error);
    throw error;
  }
};
