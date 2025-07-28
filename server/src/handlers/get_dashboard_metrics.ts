
import { db } from '../db';
import { usersTable, ridesTable, scootersTable, paymentsTable } from '../db/schema';
import { type DashboardMetrics } from '../schema';
import { eq, count, sum, gte, and } from 'drizzle-orm';

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // Get total users count
    const totalUsersResult = await db.select({ count: count() })
      .from(usersTable)
      .execute();
    const total_users = totalUsersResult[0]?.count || 0;

    // Get active rides count
    const activeRidesResult = await db.select({ count: count() })
      .from(ridesTable)
      .where(eq(ridesTable.status, 'active'))
      .execute();
    const active_rides = activeRidesResult[0]?.count || 0;

    // Get total scooters count
    const totalScootersResult = await db.select({ count: count() })
      .from(scootersTable)
      .execute();
    const total_scooters = totalScootersResult[0]?.count || 0;

    // Get available scooters count
    const availableScootersResult = await db.select({ count: count() })
      .from(scootersTable)
      .where(eq(scootersTable.status, 'available'))
      .execute();
    const available_scooters = availableScootersResult[0]?.count || 0;

    // Get total revenue from completed payments
    const totalRevenueResult = await db.select({ total: sum(paymentsTable.amount) })
      .from(paymentsTable)
      .where(eq(paymentsTable.status, 'completed'))
      .execute();
    const total_revenue = totalRevenueResult[0]?.total ? parseFloat(totalRevenueResult[0].total) : 0;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get rides today count
    const ridesTodayResult = await db.select({ count: count() })
      .from(ridesTable)
      .where(gte(ridesTable.created_at, today))
      .execute();
    const rides_today = ridesTodayResult[0]?.count || 0;

    // Get revenue today from completed payments
    const revenueTodayResult = await db.select({ total: sum(paymentsTable.amount) })
      .from(paymentsTable)
      .where(
        and(
          eq(paymentsTable.status, 'completed'),
          gte(paymentsTable.created_at, today)
        )
      )
      .execute();
    const revenue_today = revenueTodayResult[0]?.total ? parseFloat(revenueTodayResult[0].total) : 0;

    return {
      total_users,
      active_rides,
      total_scooters,
      available_scooters,
      total_revenue,
      rides_today,
      revenue_today
    };
  } catch (error) {
    console.error('Dashboard metrics retrieval failed:', error);
    throw error;
  }
}
