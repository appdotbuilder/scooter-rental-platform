
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { paymentsTable, usersTable, paymentCardsTable, ridesTable, scootersTable } from '../db/schema';
import { type CreatePaymentInput } from '../schema';
import { createPayment } from '../handlers/create_payment';
import { eq } from 'drizzle-orm';

describe('createPayment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testPaymentCardId: number;
  let testRideId: number;

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

    // Create test payment card
    const cardResult = await db.insert(paymentCardsTable)
      .values({
        user_id: testUserId,
        card_token: 'tok_visa',
        last_four: '4242',
        brand: 'visa',
        is_default: true
      })
      .returning()
      .execute();
    testPaymentCardId = cardResult[0].id;

    // Create test scooter
    const scooterResult = await db.insert(scootersTable)
      .values({
        serial_number: 'SC001',
        latitude: '40.7128',
        longitude: '-74.0060'
      })
      .returning()
      .execute();

    // Create test ride
    const rideResult = await db.insert(ridesTable)
      .values({
        user_id: testUserId,
        scooter_id: scooterResult[0].id,
        start_latitude: '40.7128',
        start_longitude: '-74.0060',
        status: 'completed'
      })
      .returning()
      .execute();
    testRideId = rideResult[0].id;
  });

  const testInput: CreatePaymentInput = {
    ride_id: 0, // Will be set in tests
    user_id: 0, // Will be set in tests
    amount: 15.50,
    payment_method_id: 0 // Will be set in tests
  };

  it('should create a payment', async () => {
    const input = {
      ...testInput,
      ride_id: testRideId,
      user_id: testUserId,
      payment_method_id: testPaymentCardId
    };

    const result = await createPayment(input);

    // Basic field validation
    expect(result.ride_id).toEqual(testRideId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.amount).toEqual(15.50);
    expect(typeof result.amount).toBe('number');
    expect(result.status).toEqual('pending');
    expect(result.payment_method_id).toEqual(testPaymentCardId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.transaction_id).toBeNull();
  });

  it('should save payment to database', async () => {
    const input = {
      ...testInput,
      ride_id: testRideId,
      user_id: testUserId,
      payment_method_id: testPaymentCardId
    };

    const result = await createPayment(input);

    // Query using proper drizzle syntax
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(payments).toHaveLength(1);
    expect(payments[0].ride_id).toEqual(testRideId);
    expect(payments[0].user_id).toEqual(testUserId);
    expect(parseFloat(payments[0].amount)).toEqual(15.50);
    expect(payments[0].status).toEqual('pending');
    expect(payments[0].payment_method_id).toEqual(testPaymentCardId);
    expect(payments[0].created_at).toBeInstanceOf(Date);
    expect(payments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const input = {
      ...testInput,
      ride_id: testRideId,
      user_id: 99999,
      payment_method_id: testPaymentCardId
    };

    await expect(createPayment(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when ride does not exist', async () => {
    const input = {
      ...testInput,
      ride_id: 99999,
      user_id: testUserId,
      payment_method_id: testPaymentCardId
    };

    await expect(createPayment(input)).rejects.toThrow(/ride not found/i);
  });

  it('should throw error when payment method does not exist', async () => {
    const input = {
      ...testInput,
      ride_id: testRideId,
      user_id: testUserId,
      payment_method_id: 99999
    };

    await expect(createPayment(input)).rejects.toThrow(/payment method not found/i);
  });

  it('should throw error when payment method does not belong to user', async () => {
    // Create another user
    const anotherUserResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        password_hash: 'hashed_password',
        full_name: 'Other User'
      })
      .returning()
      .execute();

    // Create payment card for the other user
    const otherCardResult = await db.insert(paymentCardsTable)
      .values({
        user_id: anotherUserResult[0].id,
        card_token: 'tok_mastercard',
        last_four: '5555',
        brand: 'mastercard',
        is_default: true
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      ride_id: testRideId,
      user_id: testUserId,
      payment_method_id: otherCardResult[0].id
    };

    await expect(createPayment(input)).rejects.toThrow(/payment method does not belong to user/i);
  });
});
