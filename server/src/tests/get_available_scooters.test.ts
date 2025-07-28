
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scootersTable } from '../db/schema';
import { getAvailableScooters } from '../handlers/get_available_scooters';

const testScooter1 = {
  serial_number: 'SCT001',
  status: 'available' as const,
  battery_level: 85,
  latitude: '37.7749',
  longitude: '-122.4194',
  is_locked: true
};

const testScooter2 = {
  serial_number: 'SCT002',
  status: 'available' as const,
  battery_level: 92,
  latitude: '37.7849',
  longitude: '-122.4094',
  is_locked: true
};

const testScooterInUse = {
  serial_number: 'SCT003',
  status: 'in_use' as const,
  battery_level: 67,
  latitude: '37.7649',
  longitude: '-122.4294',
  is_locked: false
};

describe('getAvailableScooters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all available scooters', async () => {
    // Create test scooters
    await db.insert(scootersTable)
      .values([testScooter1, testScooter2, testScooterInUse])
      .execute();

    const result = await getAvailableScooters();

    expect(result).toHaveLength(2);
    
    // Verify only available scooters are returned
    const serialNumbers = result.map(s => s.serial_number);
    expect(serialNumbers).toContain('SCT001');
    expect(serialNumbers).toContain('SCT002');
    expect(serialNumbers).not.toContain('SCT003');
  });

  it('should return scooters with correct data types and fields', async () => {
    await db.insert(scootersTable)
      .values(testScooter1)
      .execute();

    const result = await getAvailableScooters();

    expect(result).toHaveLength(1);
    const scooter = result[0];

    // Verify all required fields are present
    expect(scooter.id).toBeDefined();
    expect(scooter.serial_number).toEqual('SCT001');
    expect(scooter.status).toEqual('available');
    expect(scooter.battery_level).toEqual(85);
    expect(scooter.is_locked).toEqual(true);
    expect(scooter.last_ping).toBeInstanceOf(Date);
    expect(scooter.created_at).toBeInstanceOf(Date);
    expect(scooter.updated_at).toBeInstanceOf(Date);

    // Verify numeric conversion for coordinates
    expect(typeof scooter.latitude).toBe('number');
    expect(typeof scooter.longitude).toBe('number');
    expect(scooter.latitude).toEqual(37.7749);
    expect(scooter.longitude).toEqual(-122.4194);
  });

  it('should return empty array when no available scooters exist', async () => {
    // Only create non-available scooters
    await db.insert(scootersTable)
      .values([
        { ...testScooterInUse },
        { ...testScooterInUse, serial_number: 'SCT004', status: 'maintenance' }
      ])
      .execute();

    const result = await getAvailableScooters();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return multiple available scooters with different battery levels', async () => {
    const lowBatteryScooter = {
      ...testScooter1,
      serial_number: 'SCT005',
      battery_level: 15
    };

    await db.insert(scootersTable)
      .values([testScooter1, testScooter2, lowBatteryScooter])
      .execute();

    const result = await getAvailableScooters();

    expect(result).toHaveLength(3);
    
    // Verify all have available status regardless of battery level
    result.forEach(scooter => {
      expect(scooter.status).toEqual('available');
      expect(scooter.battery_level).toBeGreaterThanOrEqual(0);
      expect(scooter.battery_level).toBeLessThanOrEqual(100);
    });

    const batteryLevels = result.map(s => s.battery_level);
    expect(batteryLevels).toContain(85);
    expect(batteryLevels).toContain(92);
    expect(batteryLevels).toContain(15);
  });
});
