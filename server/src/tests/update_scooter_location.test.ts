
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scootersTable } from '../db/schema';
import { type UpdateScooterLocationInput, type CreateScooterInput } from '../schema';
import { updateScooterLocation } from '../handlers/update_scooter_location';
import { eq } from 'drizzle-orm';

// Helper function to create a test scooter
const createTestScooter = async (): Promise<number> => {
  const result = await db.insert(scootersTable)
    .values({
      serial_number: 'TEST-001',
      latitude: '40.7128000', // NYC coordinates
      longitude: '-74.0060000',
      battery_level: 80
    })
    .returning()
    .execute();
  
  return result[0].id;
};

const testInput: UpdateScooterLocationInput = {
  id: 1, // Will be overridden in tests
  latitude: 40.7589,
  longitude: -73.9851,
  battery_level: 65
};

describe('updateScooterLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update scooter location and battery level', async () => {
    const scooterId = await createTestScooter();
    const input = { ...testInput, id: scooterId };

    const result = await updateScooterLocation(input);

    // Verify updated fields
    expect(result.id).toEqual(scooterId);
    expect(result.latitude).toEqual(40.7589);
    expect(result.longitude).toEqual(-73.9851);
    expect(result.battery_level).toEqual(65);
    expect(result.last_ping).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify numeric types
    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
    expect(typeof result.battery_level).toBe('number');
  });

  it('should save updated data to database', async () => {
    const scooterId = await createTestScooter();
    const input = { ...testInput, id: scooterId };
    
    // Store initial timestamp for comparison
    const beforeUpdate = new Date();
    
    await updateScooterLocation(input);

    // Query the database to verify changes were persisted
    const scooters = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.id, scooterId))
      .execute();

    expect(scooters).toHaveLength(1);
    const scooter = scooters[0];
    
    expect(parseFloat(scooter.latitude)).toEqual(40.7589);
    expect(parseFloat(scooter.longitude)).toEqual(-73.9851);
    expect(scooter.battery_level).toEqual(65);
    expect(scooter.last_ping).toBeInstanceOf(Date);
    expect(scooter.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps were updated
    expect(scooter.last_ping.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    expect(scooter.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
  });

  it('should preserve other scooter fields', async () => {
    const scooterId = await createTestScooter();
    const input = { ...testInput, id: scooterId };

    const result = await updateScooterLocation(input);

    // Verify fields that should not change
    expect(result.serial_number).toEqual('TEST-001');
    expect(result.status).toEqual('available'); // Default status
    expect(result.is_locked).toEqual(true); // Default locked state
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent scooter', async () => {
    const input = { ...testInput, id: 999 };

    await expect(updateScooterLocation(input)).rejects.toThrow(/not found/i);
  });

  it('should handle extreme coordinate values', async () => {
    const scooterId = await createTestScooter();
    const input = {
      id: scooterId,
      latitude: -90.0000000, // South pole
      longitude: 179.9999999, // Near international date line
      battery_level: 1 // Very low battery
    };

    const result = await updateScooterLocation(input);

    expect(result.latitude).toEqual(-90.0000000);
    expect(result.longitude).toEqual(179.9999999);
    expect(result.battery_level).toEqual(1);
  });
});
