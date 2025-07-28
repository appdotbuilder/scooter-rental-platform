
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pricingTable } from '../db/schema';
import { getActivePricing } from '../handlers/get_active_pricing';

describe('getActivePricing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no active pricing exists', async () => {
    const result = await getActivePricing();
    expect(result).toBeNull();
  });

  it('should return active pricing configuration', async () => {
    // Create an active pricing record
    await db.insert(pricingTable).values({
      base_price: '2.50',
      price_per_minute: '0.25',
      is_active: true
    }).execute();

    const result = await getActivePricing();

    expect(result).not.toBeNull();
    expect(result!.base_price).toEqual(2.50);
    expect(result!.price_per_minute).toEqual(0.25);
    expect(result!.is_active).toBe(true);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return most recent active pricing when multiple exist', async () => {
    // Create older active pricing
    await db.insert(pricingTable).values({
      base_price: '2.00',
      price_per_minute: '0.20',
      is_active: true
    }).execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create newer active pricing
    await db.insert(pricingTable).values({
      base_price: '3.00',
      price_per_minute: '0.30',
      is_active: true
    }).execute();

    const result = await getActivePricing();

    expect(result).not.toBeNull();
    expect(result!.base_price).toEqual(3.00);
    expect(result!.price_per_minute).toEqual(0.30);
  });

  it('should ignore inactive pricing configurations', async () => {
    // Create inactive pricing
    await db.insert(pricingTable).values({
      base_price: '1.00',
      price_per_minute: '0.10',
      is_active: false
    }).execute();

    // Create active pricing
    await db.insert(pricingTable).values({
      base_price: '2.50',
      price_per_minute: '0.25',
      is_active: true
    }).execute();

    const result = await getActivePricing();

    expect(result).not.toBeNull();
    expect(result!.base_price).toEqual(2.50);
    expect(result!.price_per_minute).toEqual(0.25);
    expect(result!.is_active).toBe(true);
  });

  it('should return null when only inactive pricing exists', async () => {
    // Create only inactive pricing
    await db.insert(pricingTable).values({
      base_price: '2.50',
      price_per_minute: '0.25',
      is_active: false
    }).execute();

    const result = await getActivePricing();
    expect(result).toBeNull();
  });
});
