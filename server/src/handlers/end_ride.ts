
import { db } from '../db';
import { ridesTable, scootersTable, pricingTable } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { type EndRideInput, type Ride } from '../schema';

export const endRide = async (input: EndRideInput): Promise<Ride> => {
  try {
    // Get the current ride
    const rides = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.id, input.ride_id))
      .execute();

    if (rides.length === 0) {
      throw new Error('Ride not found');
    }

    const ride = rides[0];

    if (ride.status !== 'active') {
      throw new Error('Ride is not active');
    }

    // Get active pricing
    const pricingResults = await db.select()
      .from(pricingTable)
      .where(eq(pricingTable.is_active, true))
      .orderBy(desc(pricingTable.created_at))
      .limit(1)
      .execute();

    if (pricingResults.length === 0) {
      throw new Error('No active pricing found');
    }

    const pricing = pricingResults[0];

    // Calculate total cost
    const basePrice = parseFloat(pricing.base_price);
    const pricePerMinute = parseFloat(pricing.price_per_minute);
    const totalCost = basePrice + (pricePerMinute * input.duration_minutes);

    // Update ride record
    const updatedRides = await db.update(ridesTable)
      .set({
        status: 'completed',
        end_latitude: input.end_latitude.toString(),
        end_longitude: input.end_longitude.toString(),
        distance_km: input.distance_km.toString(),
        duration_minutes: input.duration_minutes,
        total_cost: totalCost.toString(),
        ended_at: new Date()
      })
      .where(eq(ridesTable.id, input.ride_id))
      .returning()
      .execute();

    // Lock the scooter and set status to available
    await db.update(scootersTable)
      .set({
        status: 'available',
        is_locked: true,
        updated_at: new Date()
      })
      .where(eq(scootersTable.id, ride.scooter_id))
      .execute();

    const updatedRide = updatedRides[0];
    
    // Convert numeric fields back to numbers
    return {
      ...updatedRide,
      start_latitude: parseFloat(updatedRide.start_latitude),
      start_longitude: parseFloat(updatedRide.start_longitude),
      end_latitude: updatedRide.end_latitude ? parseFloat(updatedRide.end_latitude) : null,
      end_longitude: updatedRide.end_longitude ? parseFloat(updatedRide.end_longitude) : null,
      distance_km: updatedRide.distance_km ? parseFloat(updatedRide.distance_km) : null,
      total_cost: updatedRide.total_cost ? parseFloat(updatedRide.total_cost) : null
    };
  } catch (error) {
    console.error('End ride failed:', error);
    throw error;
  }
};
