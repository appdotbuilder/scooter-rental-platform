
import { db } from '../db';
import { scootersTable } from '../db/schema';
import { type UpdateScooterLocationInput, type Scooter } from '../schema';
import { eq } from 'drizzle-orm';

export const updateScooterLocation = async (input: UpdateScooterLocationInput): Promise<Scooter> => {
  try {
    // Update scooter location, battery level, and last_ping timestamp
    const result = await db.update(scootersTable)
      .set({
        latitude: input.latitude.toString(), // Convert number to string for numeric column
        longitude: input.longitude.toString(), // Convert number to string for numeric column
        battery_level: input.battery_level, // Integer column - no conversion needed
        last_ping: new Date(), // Update last_ping to current timestamp
        updated_at: new Date() // Update the updated_at timestamp
      })
      .where(eq(scootersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Scooter with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const scooter = result[0];
    return {
      ...scooter,
      latitude: parseFloat(scooter.latitude), // Convert string back to number
      longitude: parseFloat(scooter.longitude) // Convert string back to number
    };
  } catch (error) {
    console.error('Scooter location update failed:', error);
    throw error;
  }
};
