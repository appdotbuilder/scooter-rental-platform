
import { db } from '../db';
import { scootersTable } from '../db/schema';
import { type ScooterCommandInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function sendScooterCommand(input: ScooterCommandInput): Promise<{ success: boolean; message: string }> {
  try {
    // First, verify the scooter exists
    const scooters = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.id, input.scooter_id))
      .execute();

    if (scooters.length === 0) {
      return {
        success: false,
        message: `Scooter with ID ${input.scooter_id} not found`
      };
    }

    const scooter = scooters[0];

    // Check if the command would result in a state change
    const shouldBeLocked = input.command === 'lock';
    if (scooter.is_locked === shouldBeLocked) {
      return {
        success: true,
        message: `Scooter ${input.scooter_id} is already ${input.command}ed`
      };
    }

    // Simulate sending command to scooter hardware
    // In a real implementation, this would involve:
    // - Making an API call to the scooter's IoT endpoint
    // - Handling network timeouts and retries
    // - Verifying command acknowledgment from the hardware
    
    // Update the scooter's lock status in the database
    await db.update(scootersTable)
      .set({
        is_locked: shouldBeLocked,
        updated_at: new Date()
      })
      .where(eq(scootersTable.id, input.scooter_id))
      .execute();

    return {
      success: true,
      message: `Scooter ${input.scooter_id} ${input.command} command sent successfully`
    };

  } catch (error) {
    console.error('Scooter command failed:', error);
    return {
      success: false,
      message: `Failed to send ${input.command} command to scooter ${input.scooter_id}`
    };
  }
}
