
import { db } from '../db';
import { paymentCardsTable } from '../db/schema';
import { type PaymentCard } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserPaymentCards = async (userId: number): Promise<PaymentCard[]> => {
  try {
    const result = await db.select()
      .from(paymentCardsTable)
      .where(eq(paymentCardsTable.user_id, userId))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get user payment cards:', error);
    throw error;
  }
};
