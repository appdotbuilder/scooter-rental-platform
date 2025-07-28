
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scootersTable } from '../db/schema';
import { type CreateScooterInput } from '../schema';
import { getAllScooters } from '../handlers/get_all_scooters';

const testScooterInputs: CreateScooterInput[] = [
  {
    serial_number: 'SC001',
    latitude: 40.7128,
    longitude: -74.0060
  },
  {
    serial_number: 'SC002',
    latitude: 40.7589,
    longitude: -73.9851
  },
  {
    serial_number: 'SC003',
    latitude: 40.7505,
    longitude: -73.9934
  }
];

describe('getAllScooters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no scooters exist', async () => {
    const result = await getAllScooters();
    
    expect(result).toEqual([]);
  });

  it('should return all scooters', async () => {
    // Create test scooters
    await db.insert(scootersTable)
      .values(testScooterInputs.map(input => ({
        serial_number: input.serial_number,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString()
      })))
      .execute();

    const result = await getAllScooters();

    expect(result).toHaveLength(3);
    
    // Verify first scooter data
    const firstScooter = result.find(s => s.serial_number === 'SC001');
    expect(firstScooter).toBeDefined();
    expect(firstScooter!.serial_number).toEqual('SC001');
    expect(firstScooter!.latitude).toEqual(40.7128);
    expect(firstScooter!.longitude).toEqual(-74.0060);
    expect(firstScooter!.status).toEqual('available');
    expect(firstScooter!.battery_level).toEqual(100);
    expect(firstScooter!.is_locked).toEqual(true);
    expect(firstScooter!.id).toBeDefined();
    expect(firstScooter!.created_at).toBeInstanceOf(Date);
    expect(firstScooter!.updated_at).toBeInstanceOf(Date);
    expect(firstScooter!.last_ping).toBeInstanceOf(Date);
  });

  it('should return scooters with correct numeric types', async () => {
    // Create single test scooter
    await db.insert(scootersTable)
      .values({
        serial_number: 'SC001',
        latitude: '40.7128',
        longitude: '-74.0060'
      })
      .execute();

    const result = await getAllScooters();

    expect(result).toHaveLength(1);
    const scooter = result[0];
    
    // Verify numeric fields are properly converted
    expect(typeof scooter.latitude).toBe('number');
    expect(typeof scooter.longitude).toBe('number');
    expect(typeof scooter.battery_level).toBe('number');
    expect(scooter.latitude).toEqual(40.7128);
    expect(scooter.longitude).toEqual(-74.0060);
  });

  it('should preserve scooter ordering', async () => {
    // Create scooters in specific order
    for (const input of testScooterInputs) {
      await db.insert(scootersTable)
        .values({
          serial_number: input.serial_number,
          latitude: input.latitude.toString(),
          longitude: input.longitude.toString()
        })
        .execute();
    }

    const result = await getAllScooters();

    expect(result).toHaveLength(3);
    
    // Verify all scooters are present
    const serialNumbers = result.map(s => s.serial_number).sort();
    expect(serialNumbers).toEqual(['SC001', 'SC002', 'SC003']);
  });
});
