
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { paymentCardsTable, usersTable } from '../db/schema';
import { type CreatePaymentCardInput } from '../schema';
import { createPaymentCard } from '../handlers/create_payment_card';
import { eq } from 'drizzle-orm';

describe('createPaymentCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        phone: '1234567890',
        is_admin: false
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  const testInput: CreatePaymentCardInput = {
    user_id: 0, // Will be set in tests
    card_token: 'tok_1234567890abcdef',
    last_four: '4242',
    brand: 'visa',
    is_default: false
  };

  it('should create a payment card', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createPaymentCard(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.card_token).toEqual('tok_1234567890abcdef');
    expect(result.last_four).toEqual('4242');
    expect(result.brand).toEqual('visa');
    expect(result.is_default).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save payment card to database', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createPaymentCard(input);

    const cards = await db.select()
      .from(paymentCardsTable)
      .where(eq(paymentCardsTable.id, result.id))
      .execute();

    expect(cards).toHaveLength(1);
    expect(cards[0].user_id).toEqual(testUserId);
    expect(cards[0].card_token).toEqual('tok_1234567890abcdef');
    expect(cards[0].last_four).toEqual('4242');
    expect(cards[0].brand).toEqual('visa');
    expect(cards[0].is_default).toEqual(false);
    expect(cards[0].created_at).toBeInstanceOf(Date);
  });

  it('should create default payment card', async () => {
    const input = { ...testInput, user_id: testUserId, is_default: true };
    const result = await createPaymentCard(input);

    expect(result.is_default).toEqual(true);

    const cards = await db.select()
      .from(paymentCardsTable)
      .where(eq(paymentCardsTable.id, result.id))
      .execute();

    expect(cards[0].is_default).toEqual(true);
  });

  it('should unset other default cards when creating new default card', async () => {
    // Create first default card
    const firstInput = { ...testInput, user_id: testUserId, is_default: true };
    const firstCard = await createPaymentCard(firstInput);

    // Create second default card
    const secondInput = { 
      ...testInput, 
      user_id: testUserId, 
      card_token: 'tok_0987654321fedcba',
      last_four: '1234',
      is_default: true 
    };
    const secondCard = await createPaymentCard(secondInput);

    // Verify first card is no longer default
    const firstCardUpdated = await db.select()
      .from(paymentCardsTable)
      .where(eq(paymentCardsTable.id, firstCard.id))
      .execute();

    expect(firstCardUpdated[0].is_default).toEqual(false);

    // Verify second card is default
    const secondCardFromDb = await db.select()
      .from(paymentCardsTable)
      .where(eq(paymentCardsTable.id, secondCard.id))
      .execute();

    expect(secondCardFromDb[0].is_default).toEqual(true);
  });

  it('should throw error for non-existent user', async () => {
    const input = { ...testInput, user_id: 99999 };
    
    await expect(createPaymentCard(input)).rejects.toThrow(/user not found/i);
  });

  it('should handle multiple non-default cards for same user', async () => {
    const firstInput = { ...testInput, user_id: testUserId };
    const secondInput = { 
      ...testInput, 
      user_id: testUserId, 
      card_token: 'tok_0987654321fedcba',
      last_four: '1234'
    };

    const firstCard = await createPaymentCard(firstInput);
    const secondCard = await createPaymentCard(secondInput);

    expect(firstCard.is_default).toEqual(false);
    expect(secondCard.is_default).toEqual(false);

    const allCards = await db.select()
      .from(paymentCardsTable)
      .where(eq(paymentCardsTable.user_id, testUserId))
      .execute();

    expect(allCards).toHaveLength(2);
    expect(allCards.every(card => !card.is_default)).toBe(true);
  });
});
