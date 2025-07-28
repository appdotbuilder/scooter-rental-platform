
import { db } from '../db';
import { paymentsTable, paymentCardsTable, ridesTable, usersTable } from '../db/schema';
import { type CreatePaymentInput, type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export const createPayment = async (input: CreatePaymentInput): Promise<Payment> => {
  try {
    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Verify that the ride exists
    const ride = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.id, input.ride_id))
      .execute();

    if (ride.length === 0) {
      throw new Error('Ride not found');
    }

    // Verify that the payment method belongs to the user
    const paymentCard = await db.select()
      .from(paymentCardsTable)
      .where(eq(paymentCardsTable.id, input.payment_method_id))
      .execute();

    if (paymentCard.length === 0) {
      throw new Error('Payment method not found');
    }

    if (paymentCard[0].user_id !== input.user_id) {
      throw new Error('Payment method does not belong to user');
    }

    // Insert payment record
    const result = await db.insert(paymentsTable)
      .values({
        ride_id: input.ride_id,
        user_id: input.user_id,
        amount: input.amount.toString(), // Convert number to string for numeric column
        payment_method_id: input.payment_method_id
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const payment = result[0];
    return {
      ...payment,
      amount: parseFloat(payment.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw error;
  }
};
