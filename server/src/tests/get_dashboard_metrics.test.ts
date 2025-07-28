
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, ridesTable, scootersTable, paymentsTable, paymentCardsTable } from '../db/schema';
import { getDashboardMetrics } from '../handlers/get_dashboard_metrics';

describe('getDashboardMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero metrics when no data exists', async () => {
    const result = await getDashboardMetrics();

    expect(result.total_users).toEqual(0);
    expect(result.active_rides).toEqual(0);
    expect(result.total_scooters).toEqual(0);
    expect(result.available_scooters).toEqual(0);
    expect(result.total_revenue).toEqual(0);
    expect(result.rides_today).toEqual(0);
    expect(result.revenue_today).toEqual(0);
  });

  it('should calculate metrics correctly with sample data', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@test.com',
          password_hash: 'hash1',
          full_name: 'User One'
        },
        {
          email: 'user2@test.com',
          password_hash: 'hash2',
          full_name: 'User Two'
        }
      ])
      .returning()
      .execute();

    // Create test scooters
    const scooters = await db.insert(scootersTable)
      .values([
        {
          serial_number: 'SC001',
          status: 'available',
          latitude: '40.7128',
          longitude: '-74.0060'
        },
        {
          serial_number: 'SC002',
          status: 'in_use',
          latitude: '40.7589',
          longitude: '-73.9851'
        },
        {
          serial_number: 'SC003',
          status: 'available',
          latitude: '40.7505',
          longitude: '-73.9934'
        }
      ])
      .returning()
      .execute();

    // Create test rides
    const rides = await db.insert(ridesTable)
      .values([
        {
          user_id: users[0].id,
          scooter_id: scooters[0].id,
          status: 'active',
          start_latitude: '40.7128',
          start_longitude: '-74.0060'
        },
        {
          user_id: users[1].id,
          scooter_id: scooters[1].id,
          status: 'completed',
          start_latitude: '40.7589',
          start_longitude: '-73.9851',
          end_latitude: '40.7505',
          end_longitude: '-73.9934',
          distance_km: '2.5',
          duration_minutes: 15,
          total_cost: '8.50'
        }
      ])
      .returning()
      .execute();

    // Create payment card for payments
    const paymentCard = await db.insert(paymentCardsTable)
      .values({
        user_id: users[1].id,
        card_token: 'token123',
        last_four: '1234',
        brand: 'visa'
      })
      .returning()
      .execute();

    // Create test payments
    await db.insert(paymentsTable)
      .values([
        {
          ride_id: rides[1].id,
          user_id: users[1].id,
          amount: '8.50',
          status: 'completed',
          payment_method_id: paymentCard[0].id
        }
      ])
      .execute();

    const result = await getDashboardMetrics();

    expect(result.total_users).toEqual(2);
    expect(result.active_rides).toEqual(1);
    expect(result.total_scooters).toEqual(3);
    expect(result.available_scooters).toEqual(2);
    expect(result.total_revenue).toEqual(8.50);
    expect(result.rides_today).toEqual(2);
    expect(result.revenue_today).toEqual(8.50);
  });

  it('should only count completed payments for revenue', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hash',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test scooter
    const scooter = await db.insert(scootersTable)
      .values({
        serial_number: 'SC001',
        status: 'available',
        latitude: '40.7128',
        longitude: '-74.0060'
      })
      .returning()
      .execute();

    // Create test ride
    const ride = await db.insert(ridesTable)
      .values({
        user_id: user[0].id,
        scooter_id: scooter[0].id,
        status: 'completed',
        start_latitude: '40.7128',
        start_longitude: '-74.0060',
        end_latitude: '40.7589',
        end_longitude: '-73.9851',
        distance_km: '1.5',
        duration_minutes: 10,
        total_cost: '5.25'
      })
      .returning()
      .execute();

    // Create payment card
    const paymentCard = await db.insert(paymentCardsTable)
      .values({
        user_id: user[0].id,
        card_token: 'token123',
        last_four: '1234',
        brand: 'visa'
      })
      .returning()
      .execute();

    // Create payments with different statuses
    await db.insert(paymentsTable)
      .values([
        {
          ride_id: ride[0].id,
          user_id: user[0].id,
          amount: '5.25',
          status: 'completed',
          payment_method_id: paymentCard[0].id
        },
        {
          ride_id: ride[0].id,
          user_id: user[0].id,
          amount: '10.00',
          status: 'pending',
          payment_method_id: paymentCard[0].id
        },
        {
          ride_id: ride[0].id,
          user_id: user[0].id,
          amount: '15.75',
          status: 'failed',
          payment_method_id: paymentCard[0].id
        }
      ])
      .execute();

    const result = await getDashboardMetrics();

    // Should only count completed payment
    expect(result.total_revenue).toEqual(5.25);
    expect(result.revenue_today).toEqual(5.25);
  });

  it('should filter today metrics correctly', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hash',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test scooter
    const scooter = await db.insert(scootersTable)
      .values({
        serial_number: 'SC001',
        status: 'available',
        latitude: '40.7128',
        longitude: '-74.0060'
      })
      .returning()
      .execute();

    // Create ride from yesterday (should not count in today's metrics)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(ridesTable)
      .values({
        user_id: user[0].id,
        scooter_id: scooter[0].id,
        status: 'completed',
        start_latitude: '40.7128',
        start_longitude: '-74.0060',
        end_latitude: '40.7589',
        end_longitude: '-73.9851',
        distance_km: '1.5',
        duration_minutes: 10,
        total_cost: '5.25',
        created_at: yesterday
      })
      .execute();

    const result = await getDashboardMetrics();

    // Today's metrics should be zero since ride was yesterday
    expect(result.rides_today).toEqual(0);
    expect(result.revenue_today).toEqual(0);
    // Total metrics should still count the ride
    expect(result.total_users).toEqual(1);
    expect(result.total_scooters).toEqual(1);
  });
});
