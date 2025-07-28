
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { geofencesTable } from '../db/schema';
import { type CreateGeofenceInput } from '../schema';
import { createGeofence } from '../handlers/create_geofence';
import { eq } from 'drizzle-orm';

// Test input with polygon coordinates
const testInput: CreateGeofenceInput = {
  name: 'Downtown Area',
  polygon_coordinates: JSON.stringify([
    [40.7128, -74.0060],
    [40.7580, -73.9857],
    [40.7505, -73.9934],
    [40.7128, -74.0060]
  ])
};

describe('createGeofence', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a geofence', async () => {
    const result = await createGeofence(testInput);

    // Basic field validation
    expect(result.name).toEqual('Downtown Area');
    expect(result.polygon_coordinates).toEqual(testInput.polygon_coordinates);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save geofence to database', async () => {
    const result = await createGeofence(testInput);

    // Query using proper drizzle syntax
    const geofences = await db.select()
      .from(geofencesTable)
      .where(eq(geofencesTable.id, result.id))
      .execute();

    expect(geofences).toHaveLength(1);
    expect(geofences[0].name).toEqual('Downtown Area');
    expect(geofences[0].polygon_coordinates).toEqual(testInput.polygon_coordinates);
    expect(geofences[0].is_active).toBe(true);
    expect(geofences[0].created_at).toBeInstanceOf(Date);
    expect(geofences[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle complex polygon coordinates', async () => {
    const complexInput: CreateGeofenceInput = {
      name: 'Complex Zone',
      polygon_coordinates: JSON.stringify([
        [40.748817, -73.985428],
        [40.757608, -73.986706],
        [40.754932, -73.984174],
        [40.748174, -73.985863],
        [40.748817, -73.985428]
      ])
    };

    const result = await createGeofence(complexInput);

    expect(result.name).toEqual('Complex Zone');
    expect(result.polygon_coordinates).toEqual(complexInput.polygon_coordinates);
    
    // Verify JSON can be parsed back
    const coordinates = JSON.parse(result.polygon_coordinates);
    expect(Array.isArray(coordinates)).toBe(true);
    expect(coordinates).toHaveLength(5);
    expect(coordinates[0]).toEqual([40.748817, -73.985428]);
  });

  it('should create multiple geofences with unique names', async () => {
    const input1: CreateGeofenceInput = {
      name: 'Zone A',
      polygon_coordinates: JSON.stringify([[1, 1], [2, 2], [3, 3], [1, 1]])
    };

    const input2: CreateGeofenceInput = {
      name: 'Zone B',
      polygon_coordinates: JSON.stringify([[4, 4], [5, 5], [6, 6], [4, 4]])
    };

    const result1 = await createGeofence(input1);
    const result2 = await createGeofence(input2);

    expect(result1.name).toEqual('Zone A');
    expect(result2.name).toEqual('Zone B');
    expect(result1.id).not.toEqual(result2.id);

    // Verify both exist in database
    const allGeofences = await db.select()
      .from(geofencesTable)
      .execute();

    expect(allGeofences).toHaveLength(2);
    const names = allGeofences.map(g => g.name);
    expect(names).toContain('Zone A');
    expect(names).toContain('Zone B');
  });
});
