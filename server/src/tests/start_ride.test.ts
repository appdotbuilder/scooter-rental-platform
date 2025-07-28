
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, scootersTable, ridesTable } from '../db/schema';
import { type StartRideInput } from '../schema';
import { startRide } from '../handlers/start_ride';
import { eq, and } from 'drizzle-orm';

describe('startRide', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testScooterId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        phone: '+1234567890'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test scooter
    const scooterResult = await db.insert(scootersTable)
      .values({
        serial_number: 'SC001',
        status: 'available',
        battery_level: 80,
        latitude: '40.7128',
        longitude: '-74.0060',
        is_locked: true
      })
      .returning()
      .execute();
    testScooterId = scooterResult[0].id;
  });

  const testInput: StartRideInput = {
    user_id: 0, // Will be set in beforeEach
    scooter_id: 0, // Will be set in beforeEach
    start_latitude: 40.7589,
    start_longitude: -73.9851
  };

  it('should start a ride successfully', async () => {
    const input = { ...testInput, user_id: testUserId, scooter_id: testScooterId };
    const result = await startRide(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.scooter_id).toEqual(testScooterId);
    expect(result.status).toEqual('active');
    expect(result.start_latitude).toEqual(40.7589);
    expect(result.start_longitude).toEqual(-73.9851);
    expect(result.end_latitude).toBeNull();
    expect(result.end_longitude).toBeNull();
    expect(result.distance_km).toBeNull();
    expect(result.duration_minutes).toBeNull();
    expect(result.total_cost).toBeNull();
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.ended_at).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.id).toBeDefined();
  });

  it('should save ride to database', async () => {
    const input = { ...testInput, user_id: testUserId, scooter_id: testScooterId };
    const result = await startRide(input);

    const rides = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.id, result.id))
      .execute();

    expect(rides).toHaveLength(1);
    expect(rides[0].user_id).toEqual(testUserId);
    expect(rides[0].scooter_id).toEqual(testScooterId);
    expect(rides[0].status).toEqual('active');
    expect(parseFloat(rides[0].start_latitude)).toEqual(40.7589);
    expect(parseFloat(rides[0].start_longitude)).toEqual(-73.9851);
  });

  it('should update scooter status to in_use and unlock it', async () => {
    const input = { ...testInput, user_id: testUserId, scooter_id: testScooterId };
    await startRide(input);

    const scooters = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.id, testScooterId))
      .execute();

    expect(scooters).toHaveLength(1);
    expect(scooters[0].status).toEqual('in_use');
    expect(scooters[0].is_locked).toBe(false);
  });

  it('should throw error if user does not exist', async () => {
    const input = { ...testInput, user_id: 99999, scooter_id: testScooterId };
    
    await expect(startRide(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error if scooter does not exist', async () => {
    const input = { ...testInput, user_id: testUserId, scooter_id: 99999 };
    
    await expect(startRide(input)).rejects.toThrow(/scooter not found/i);
  });

  it('should throw error if scooter is not available', async () => {
    // Update scooter status to maintenance
    await db.update(scootersTable)
      .set({ status: 'maintenance' })
      .where(eq(scootersTable.id, testScooterId))
      .execute();

    const input = { ...testInput, user_id: testUserId, scooter_id: testScooterId };
    
    await expect(startRide(input)).rejects.toThrow(/scooter is not available/i);
  });

  it('should throw error if user already has active ride', async () => {
    // Create another scooter
    const anotherScooterResult = await db.insert(scootersTable)
      .values({
        serial_number: 'SC002',
        status: 'available',
        battery_level: 75,
        latitude: '40.7500',
        longitude: '-74.0000',
        is_locked: true
      })
      .returning()
      .execute();
    const anotherScooterId = anotherScooterResult[0].id;

    // Start first ride
    const firstInput = { ...testInput, user_id: testUserId, scooter_id: testScooterId };
    await startRide(firstInput);

    // Try to start second ride
    const secondInput = { ...testInput, user_id: testUserId, scooter_id: anotherScooterId };
    
    await expect(startRide(secondInput)).rejects.toThrow(/user already has an active ride/i);
  });
});
