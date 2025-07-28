
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, paymentCardsTable } from '../db/schema';
import { getUserPaymentCards } from '../handlers/get_user_payment_cards';

describe('getUserPaymentCards', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return payment cards for a user', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        phone: '1234567890',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test payment cards
    await db.insert(paymentCardsTable)
      .values([
        {
          user_id: userId,
          card_token: 'token123',
          last_four: '1234',
          brand: 'visa',
          is_default: true
        },
        {
          user_id: userId,
          card_token: 'token456',
          last_four: '5678',
          brand: 'mastercard',
          is_default: false
        }
      ])
      .execute();

    const result = await getUserPaymentCards(userId);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toBe(userId);
    expect(result[0].card_token).toBe('token123');
    expect(result[0].last_four).toBe('1234');
    expect(result[0].brand).toBe('visa');
    expect(result[0].is_default).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].user_id).toBe(userId);
    expect(result[1].card_token).toBe('token456');
    expect(result[1].last_four).toBe('5678');
    expect(result[1].brand).toBe('mastercard');
    expect(result[1].is_default).toBe(false);
  });

  it('should return empty array for user with no payment cards', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        phone: '1234567890',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getUserPaymentCards(userId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return cards for the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        full_name: 'User One',
        phone: '1111111111',
        is_admin: false
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        full_name: 'User Two',
        phone: '2222222222',
        is_admin: false
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create payment cards for both users
    await db.insert(paymentCardsTable)
      .values([
        {
          user_id: user1Id,
          card_token: 'user1_token',
          last_four: '1111',
          brand: 'visa',
          is_default: true
        },
        {
          user_id: user2Id,
          card_token: 'user2_token',
          last_four: '2222',
          brand: 'mastercard',
          is_default: true
        }
      ])
      .execute();

    const result = await getUserPaymentCards(user1Id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(user1Id);
    expect(result[0].card_token).toBe('user1_token');
    expect(result[0].last_four).toBe('1111');
  });
});
