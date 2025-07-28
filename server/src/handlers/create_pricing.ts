
import { db } from '../db';
import { pricingTable } from '../db/schema';
import { type CreatePricingInput, type Pricing } from '../schema';

export const createPricing = async (input: CreatePricingInput): Promise<Pricing> => {
  try {
    // Insert pricing record
    const result = await db.insert(pricingTable)
      .values({
        base_price: input.base_price.toString(), // Convert number to string for numeric column
        price_per_minute: input.price_per_minute.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const pricing = result[0];
    return {
      ...pricing,
      base_price: parseFloat(pricing.base_price), // Convert string back to number
      price_per_minute: parseFloat(pricing.price_per_minute) // Convert string back to number
    };
  } catch (error) {
    console.error('Pricing creation failed:', error);
    throw error;
  }
};
