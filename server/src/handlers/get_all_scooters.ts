
import { db } from '../db';
import { scootersTable } from '../db/schema';
import { type Scooter } from '../schema';

export const getAllScooters = async (): Promise<Scooter[]> => {
  try {
    const results = await db.select()
      .from(scootersTable)
      .execute();

    // Convert numeric fields back to numbers for Zod schema compliance
    return results.map(scooter => ({
      ...scooter,
      latitude: parseFloat(scooter.latitude),
      longitude: parseFloat(scooter.longitude)
    }));
  } catch (error) {
    console.error('Failed to fetch scooters:', error);
    throw error;
  }
};
