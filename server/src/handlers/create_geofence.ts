
import { db } from '../db';
import { geofencesTable } from '../db/schema';
import { type CreateGeofenceInput, type Geofence } from '../schema';

export const createGeofence = async (input: CreateGeofenceInput): Promise<Geofence> => {
  try {
    // Insert geofence record
    const result = await db.insert(geofencesTable)
      .values({
        name: input.name,
        polygon_coordinates: input.polygon_coordinates
      })
      .returning()
      .execute();

    const geofence = result[0];
    return geofence;
  } catch (error) {
    console.error('Geofence creation failed:', error);
    throw error;
  }
};
