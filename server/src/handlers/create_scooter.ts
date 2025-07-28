
import { db } from '../db';
import { scootersTable } from '../db/schema';
import { type CreateScooterInput, type Scooter } from '../schema';

export const createScooter = async (input: CreateScooterInput): Promise<Scooter> => {
  try {
    // Insert scooter record
    const result = await db.insert(scootersTable)
      .values({
        serial_number: input.serial_number,
        latitude: input.latitude.toString(), // Convert number to string for numeric column
        longitude: input.longitude.toString(), // Convert number to string for numeric column
        status: 'available', // Default status
        battery_level: 100, // Default battery level
        is_locked: true // Default locked state
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const scooter = result[0];
    return {
      ...scooter,
      latitude: parseFloat(scooter.latitude), // Convert string back to number
      longitude: parseFloat(scooter.longitude) // Convert string back to number
    };
  } catch (error) {
    console.error('Scooter creation failed:', error);
    throw error;
  }
};
