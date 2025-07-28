
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pricingTable } from '../db/schema';
import { type CreatePricingInput } from '../schema';
import { createPricing } from '../handlers/create_pricing';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreatePricingInput = {
  base_price: 2.50,
  price_per_minute: 0.15
};

describe('createPricing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pricing configuration', async () => {
    const result = await createPricing(testInput);

    // Basic field validation
    expect(result.base_price).toEqual(2.50);
    expect(result.price_per_minute).toEqual(0.15);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.base_price).toBe('number');
    expect(typeof result.price_per_minute).toBe('number');
  });

  it('should save pricing to database', async () => {
    const result = await createPricing(testInput);

    // Query using proper drizzle syntax
    const pricings = await db.select()
      .from(pricingTable)
      .where(eq(pricingTable.id, result.id))
      .execute();

    expect(pricings).toHaveLength(1);
    expect(parseFloat(pricings[0].base_price)).toEqual(2.50);
    expect(parseFloat(pricings[0].price_per_minute)).toEqual(0.15);
    expect(pricings[0].is_active).toEqual(true);
    expect(pricings[0].created_at).toBeInstanceOf(Date);
    expect(pricings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle decimal values correctly', async () => {
    const decimalInput: CreatePricingInput = {
      base_price: 1.99,
      price_per_minute: 0.05
    };

    const result = await createPricing(decimalInput);

    expect(result.base_price).toEqual(1.99);
    expect(result.price_per_minute).toEqual(0.05);

    // Verify in database
    const pricings = await db.select()
      .from(pricingTable)
      .where(eq(pricingTable.id, result.id))
      .execute();

    expect(parseFloat(pricings[0].base_price)).toEqual(1.99);
    expect(parseFloat(pricings[0].price_per_minute)).toEqual(0.05);
  });

  it('should set is_active to true by default', async () => {
    const result = await createPricing(testInput);

    expect(result.is_active).toEqual(true);

    // Verify in database
    const pricings = await db.select()
      .from(pricingTable)
      .where(eq(pricingTable.id, result.id))
      .execute();

    expect(pricings[0].is_active).toEqual(true);
  });
});
