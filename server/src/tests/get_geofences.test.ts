
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { geofencesTable } from '../db/schema';
import { getGeofences } from '../handlers/get_geofences';

describe('getGeofences', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no geofences exist', async () => {
    const result = await getGeofences();
    expect(result).toEqual([]);
  });

  it('should return only active geofences', async () => {
    // Create test geofences
    await db.insert(geofencesTable).values([
      {
        name: 'Downtown Area',
        polygon_coordinates: JSON.stringify([[0, 0], [1, 0], [1, 1], [0, 1]]),
        is_active: true
      },
      {
        name: 'Inactive Zone',
        polygon_coordinates: JSON.stringify([[2, 2], [3, 2], [3, 3], [2, 3]]),
        is_active: false
      },
      {
        name: 'University Campus',
        polygon_coordinates: JSON.stringify([[4, 4], [5, 4], [5, 5], [4, 5]]),
        is_active: true
      }
    ]).execute();

    const result = await getGeofences();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Downtown Area');
    expect(result[0].is_active).toBe(true);
    expect(result[0].polygon_coordinates).toEqual(JSON.stringify([[0, 0], [1, 0], [1, 1], [0, 1]]));
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('University Campus');
    expect(result[1].is_active).toBe(true);
    expect(result[1].polygon_coordinates).toEqual(JSON.stringify([[4, 4], [5, 4], [5, 5], [4, 5]]));
  });

  it('should return geofences with proper field types', async () => {
    await db.insert(geofencesTable).values({
      name: 'Test Zone',
      polygon_coordinates: JSON.stringify([[10, 10], [11, 10], [11, 11], [10, 11]]),
      is_active: true
    }).execute();

    const result = await getGeofences();

    expect(result).toHaveLength(1);
    const geofence = result[0];
    
    expect(typeof geofence.id).toBe('number');
    expect(typeof geofence.name).toBe('string');
    expect(typeof geofence.polygon_coordinates).toBe('string');
    expect(typeof geofence.is_active).toBe('boolean');
    expect(geofence.created_at).toBeInstanceOf(Date);
    expect(geofence.updated_at).toBeInstanceOf(Date);
  });
});
