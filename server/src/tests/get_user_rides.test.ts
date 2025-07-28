
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, scootersTable, ridesTable } from '../db/schema';
import { getUserRides } from '../handlers/get_user_rides';

describe('getUserRides', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no rides', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const rides = await getUserRides(userId);

    expect(rides).toEqual([]);
  });

  it('should return user rides ordered by created_at descending', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a scooter
    const scooterResult = await db.insert(scootersTable)
      .values({
        serial_number: 'SC001',
        latitude: '40.7128',
        longitude: '-74.0060'
      })
      .returning()
      .execute();

    const scooterId = scooterResult[0].id;

    // Create multiple rides with different timestamps
    const ride1 = await db.insert(ridesTable)
      .values({
        user_id: userId,
        scooter_id: scooterId,
        status: 'completed',
        start_latitude: '40.7128',
        start_longitude: '-74.0060',
        end_latitude: '40.7589',
        end_longitude: '-73.9851',
        distance_km: '5.5',
        duration_minutes: 25,
        total_cost: '12.50',
        started_at: new Date('2024-01-01T10:00:00Z'),
        ended_at: new Date('2024-01-01T10:25:00Z')
      })
      .returning()
      .execute();

    const ride2 = await db.insert(ridesTable)
      .values({
        user_id: userId,
        scooter_id: scooterId,
        status: 'active',
        start_latitude: '40.7589',
        start_longitude: '-73.9851',
        started_at: new Date('2024-01-02T14:00:00Z')
      })
      .returning()
      .execute();

    const rides = await getUserRides(userId);

    expect(rides).toHaveLength(2);

    // Verify ordering (most recent first)
    expect(rides[0].id).toEqual(ride2[0].id);
    expect(rides[1].id).toEqual(ride1[0].id);

    // Verify first ride (more recent)
    expect(rides[0].user_id).toEqual(userId);
    expect(rides[0].scooter_id).toEqual(scooterId);
    expect(rides[0].status).toEqual('active');
    expect(rides[0].start_latitude).toEqual(40.7589);
    expect(rides[0].start_longitude).toEqual(-73.9851);
    expect(rides[0].end_latitude).toBeNull();
    expect(rides[0].end_longitude).toBeNull();
    expect(rides[0].distance_km).toBeNull();
    expect(rides[0].total_cost).toBeNull();

    // Verify second ride (older)
    expect(rides[1].user_id).toEqual(userId);
    expect(rides[1].status).toEqual('completed');
    expect(rides[1].start_latitude).toEqual(40.7128);
    expect(rides[1].start_longitude).toEqual(-74.0060);
    expect(rides[1].end_latitude).toEqual(40.7589);
    expect(rides[1].end_longitude).toEqual(-73.9851);
    expect(rides[1].distance_km).toEqual(5.5);
    expect(rides[1].total_cost).toEqual(12.50);
    expect(rides[1].duration_minutes).toEqual(25);
  });

  it('should convert numeric fields to numbers', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    const scooterResult = await db.insert(scootersTable)
      .values({
        serial_number: 'SC001',
        latitude: '40.7128',
        longitude: '-74.0060'
      })
      .returning()
      .execute();

    // Create ride with numeric values
    await db.insert(ridesTable)
      .values({
        user_id: userResult[0].id,
        scooter_id: scooterResult[0].id,
        status: 'completed',
        start_latitude: '40.7128',
        start_longitude: '-74.0060',
        end_latitude: '40.7589',
        end_longitude: '-73.9851',
        distance_km: '5.500',
        duration_minutes: 25,
        total_cost: '12.50'
      })
      .returning()
      .execute();

    const rides = await getUserRides(userResult[0].id);

    expect(rides).toHaveLength(1);
    
    // Verify all numeric fields are proper numbers
    expect(typeof rides[0].start_latitude).toBe('number');
    expect(typeof rides[0].start_longitude).toBe('number');
    expect(typeof rides[0].end_latitude).toBe('number');
    expect(typeof rides[0].end_longitude).toBe('number');
    expect(typeof rides[0].distance_km).toBe('number');
    expect(typeof rides[0].total_cost).toBe('number');

    // Verify exact values
    expect(rides[0].start_latitude).toEqual(40.7128);
    expect(rides[0].start_longitude).toEqual(-74.0060);
    expect(rides[0].end_latitude).toEqual(40.7589);
    expect(rides[0].end_longitude).toEqual(-73.9851);
    expect(rides[0].distance_km).toEqual(5.5);
    expect(rides[0].total_cost).toEqual(12.5);
  });

  it('should only return rides for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        full_name: 'User One'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        full_name: 'User Two'
      })
      .returning()
      .execute();

    // Create scooter
    const scooterResult = await db.insert(scootersTable)
      .values({
        serial_number: 'SC001',
        latitude: '40.7128',
        longitude: '-74.0060'
      })
      .returning()
      .execute();

    // Create rides for both users
    await db.insert(ridesTable)
      .values({
        user_id: user1Result[0].id,
        scooter_id: scooterResult[0].id,
        status: 'completed',
        start_latitude: '40.7128',
        start_longitude: '-74.0060'
      })
      .returning()
      .execute();

    await db.insert(ridesTable)
      .values({
        user_id: user2Result[0].id,
        scooter_id: scooterResult[0].id,
        status: 'active',
        start_latitude: '40.7589',
        start_longitude: '-73.9851'
      })
      .returning()
      .execute();

    // Get rides for user1 only
    const user1Rides = await getUserRides(user1Result[0].id);

    expect(user1Rides).toHaveLength(1);
    expect(user1Rides[0].user_id).toEqual(user1Result[0].id);
    expect(user1Rides[0].status).toEqual('completed');

    // Get rides for user2 only
    const user2Rides = await getUserRides(user2Result[0].id);

    expect(user2Rides).toHaveLength(1);
    expect(user2Rides[0].user_id).toEqual(user2Result[0].id);
    expect(user2Rides[0].status).toEqual('active');
  });
});
