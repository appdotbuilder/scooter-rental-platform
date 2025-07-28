
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, scootersTable, ridesTable, pricingTable } from '../db/schema';
import { type EndRideInput } from '../schema';
import { endRide } from '../handlers/end_ride';
import { eq } from 'drizzle-orm';

describe('endRide', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should end a ride and calculate total cost', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    const user = users[0];

    // Create test scooter
    const scooters = await db.insert(scootersTable)
      .values({
        serial_number: 'TEST123',
        latitude: '40.7128',
        longitude: '-74.0060',
        status: 'in_use',
        is_locked: false
      })
      .returning()
      .execute();
    const scooter = scooters[0];

    // Create active pricing
    await db.insert(pricingTable)
      .values({
        base_price: '2.50',
        price_per_minute: '0.25',
        is_active: true
      })
      .execute();

    // Create active ride
    const rides = await db.insert(ridesTable)
      .values({
        user_id: user.id,
        scooter_id: scooter.id,
        status: 'active',
        start_latitude: '40.7128',
        start_longitude: '-74.0060'
      })
      .returning()
      .execute();
    const ride = rides[0];

    const input: EndRideInput = {
      ride_id: ride.id,
      end_latitude: 40.7589,
      end_longitude: -73.9851,
      distance_km: 2.5,
      duration_minutes: 15
    };

    const result = await endRide(input);

    // Verify ride completion
    expect(result.status).toEqual('completed');
    expect(result.end_latitude).toEqual(40.7589);
    expect(result.end_longitude).toEqual(-73.9851);
    expect(result.distance_km).toEqual(2.5);
    expect(result.duration_minutes).toEqual(15);
    expect(result.total_cost).toEqual(6.25); // 2.50 + (0.25 * 15)
    expect(result.ended_at).toBeInstanceOf(Date);
    expect(typeof result.total_cost).toBe('number');
  });

  it('should lock scooter and set status to available', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    const user = users[0];

    // Create test scooter
    const scooters = await db.insert(scootersTable)
      .values({
        serial_number: 'TEST123',
        latitude: '40.7128',
        longitude: '-74.0060',
        status: 'in_use',
        is_locked: false
      })
      .returning()
      .execute();
    const scooter = scooters[0];

    // Create active pricing
    await db.insert(pricingTable)
      .values({
        base_price: '2.50',
        price_per_minute: '0.25',
        is_active: true
      })
      .execute();

    // Create active ride
    const rides = await db.insert(ridesTable)
      .values({
        user_id: user.id,
        scooter_id: scooter.id,
        status: 'active',
        start_latitude: '40.7128',
        start_longitude: '-74.0060'
      })
      .returning()
      .execute();
    const ride = rides[0];

    const input: EndRideInput = {
      ride_id: ride.id,
      end_latitude: 40.7589,
      end_longitude: -73.9851,
      distance_km: 2.5,
      duration_minutes: 15
    };

    await endRide(input);

    // Verify scooter is locked and available
    const updatedScooters = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.id, scooter.id))
      .execute();

    expect(updatedScooters).toHaveLength(1);
    expect(updatedScooters[0].status).toEqual('available');
    expect(updatedScooters[0].is_locked).toBe(true);
  });

  it('should throw error for non-existent ride', async () => {
    const input: EndRideInput = {
      ride_id: 999,
      end_latitude: 40.7589,
      end_longitude: -73.9851,
      distance_km: 2.5,
      duration_minutes: 15
    };

    await expect(endRide(input)).rejects.toThrow(/ride not found/i);
  });

  it('should throw error for inactive ride', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    const user = users[0];

    // Create test scooter
    const scooters = await db.insert(scootersTable)
      .values({
        serial_number: 'TEST123',
        latitude: '40.7128',
        longitude: '-74.0060'
      })
      .returning()
      .execute();
    const scooter = scooters[0];

    // Create completed ride
    const rides = await db.insert(ridesTable)
      .values({
        user_id: user.id,
        scooter_id: scooter.id,
        status: 'completed',
        start_latitude: '40.7128',
        start_longitude: '-74.0060'
      })
      .returning()
      .execute();
    const ride = rides[0];

    const input: EndRideInput = {
      ride_id: ride.id,
      end_latitude: 40.7589,
      end_longitude: -73.9851,
      distance_km: 2.5,
      duration_minutes: 15
    };

    await expect(endRide(input)).rejects.toThrow(/ride is not active/i);
  });

  it('should throw error when no active pricing exists', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    const user = users[0];

    // Create test scooter
    const scooters = await db.insert(scootersTable)
      .values({
        serial_number: 'TEST123',
        latitude: '40.7128',
        longitude: '-74.0060',
        status: 'in_use',
        is_locked: false
      })
      .returning()
      .execute();
    const scooter = scooters[0];

    // Create active ride (but no pricing)
    const rides = await db.insert(ridesTable)
      .values({
        user_id: user.id,
        scooter_id: scooter.id,
        status: 'active',
        start_latitude: '40.7128',
        start_longitude: '-74.0060'
      })
      .returning()
      .execute();
    const ride = rides[0];

    const input: EndRideInput = {
      ride_id: ride.id,
      end_latitude: 40.7589,
      end_longitude: -73.9851,
      distance_km: 2.5,
      duration_minutes: 15
    };

    await expect(endRide(input)).rejects.toThrow(/no active pricing found/i);
  });
});
