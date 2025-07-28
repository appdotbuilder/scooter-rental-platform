
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scootersTable } from '../db/schema';
import { type CreateScooterInput } from '../schema';
import { createScooter } from '../handlers/create_scooter';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateScooterInput = {
  serial_number: 'SC001',
  latitude: 40.7128,
  longitude: -74.0060
};

describe('createScooter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a scooter with default values', async () => {
    const result = await createScooter(testInput);

    // Basic field validation
    expect(result.serial_number).toEqual('SC001');
    expect(result.latitude).toEqual(40.7128);
    expect(result.longitude).toEqual(-74.0060);
    expect(result.status).toEqual('available');
    expect(result.battery_level).toEqual(100);
    expect(result.is_locked).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.last_ping).toBeInstanceOf(Date);
  });

  it('should save scooter to database', async () => {
    const result = await createScooter(testInput);

    // Query using proper drizzle syntax
    const scooters = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.id, result.id))
      .execute();

    expect(scooters).toHaveLength(1);
    expect(scooters[0].serial_number).toEqual('SC001');
    expect(parseFloat(scooters[0].latitude)).toEqual(40.7128);
    expect(parseFloat(scooters[0].longitude)).toEqual(-74.0060);
    expect(scooters[0].status).toEqual('available');
    expect(scooters[0].battery_level).toEqual(100);
    expect(scooters[0].is_locked).toEqual(true);
    expect(scooters[0].created_at).toBeInstanceOf(Date);
    expect(scooters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle numeric coordinate precision correctly', async () => {
    const preciseInput: CreateScooterInput = {
      serial_number: 'SC002',
      latitude: 40.7127837,
      longitude: -74.0059413
    };

    const result = await createScooter(preciseInput);

    // Verify numeric precision is maintained
    expect(typeof result.latitude).toEqual('number');
    expect(typeof result.longitude).toEqual('number');
    expect(result.latitude).toBeCloseTo(40.7127837, 7);
    expect(result.longitude).toBeCloseTo(-74.0059413, 7);

    // Verify precision in database
    const scooters = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.id, result.id))
      .execute();

    expect(parseFloat(scooters[0].latitude)).toBeCloseTo(40.7127837, 7);
    expect(parseFloat(scooters[0].longitude)).toBeCloseTo(-74.0059413, 7);
  });

  it('should handle duplicate serial number error', async () => {
    // Create first scooter
    await createScooter(testInput);

    // Attempt to create duplicate
    await expect(createScooter(testInput)).rejects.toThrow(/unique/i);
  });
});
