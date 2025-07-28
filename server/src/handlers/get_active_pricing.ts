
import { db } from '../db';
import { pricingTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type Pricing } from '../schema';

export const getActivePricing = async (): Promise<Pricing | null> => {
  try {
    // Get the most recent active pricing configuration
    const result = await db.select()
      .from(pricingTable)
      .where(eq(pricingTable.is_active, true))
      .orderBy(desc(pricingTable.created_at))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const pricing = result[0];
    return {
      ...pricing,
      base_price: parseFloat(pricing.base_price),
      price_per_minute: parseFloat(pricing.price_per_minute)
    };
  } catch (error) {
    console.error('Failed to get active pricing:', error);
    throw error;
  }
};
