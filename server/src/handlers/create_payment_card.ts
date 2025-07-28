
import { db } from '../db';
import { paymentCardsTable, usersTable } from '../db/schema';
import { type CreatePaymentCardInput, type PaymentCard } from '../schema';
import { eq } from 'drizzle-orm';

export const createPaymentCard = async (input: CreatePaymentCardInput): Promise<PaymentCard> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // If this card should be default, unset other default cards for this user
    if (input.is_default) {
      await db.update(paymentCardsTable)
        .set({ is_default: false })
        .where(eq(paymentCardsTable.user_id, input.user_id))
        .execute();
    }

    // Insert payment card record
    const result = await db.insert(paymentCardsTable)
      .values({
        user_id: input.user_id,
        card_token: input.card_token,
        last_four: input.last_four,
        brand: input.brand,
        is_default: input.is_default || false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Payment card creation failed:', error);
    throw error;
  }
};
