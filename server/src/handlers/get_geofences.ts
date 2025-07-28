
import { db } from '../db';
import { geofencesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Geofence } from '../schema';

export const getGeofences = async (): Promise<Geofence[]> => {
  try {
    const results = await db
      .select()
      .from(geofencesTable)
      .where(eq(geofencesTable.is_active, true))
      .execute();

    return results.map(geofence => ({
      ...geofence,
      // No numeric fields to convert in geofences table
    }));
  } catch (error) {
    console.error('Failed to fetch geofences:', error);
    throw error;
  }
};
