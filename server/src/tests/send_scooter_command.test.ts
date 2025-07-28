
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scootersTable } from '../db/schema';
import { type ScooterCommandInput } from '../schema';
import { sendScooterCommand } from '../handlers/send_scooter_command';
import { eq } from 'drizzle-orm';

describe('sendScooterCommand', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testScooterId: number;

  beforeEach(async () => {
    // Create a test scooter
    const result = await db.insert(scootersTable)
      .values({
        serial_number: 'TEST-001',
        status: 'available',
        battery_level: 85,
        latitude: '40.7128',
        longitude: '-74.0060',
        is_locked: true
      })
      .returning()
      .execute();

    testScooterId = result[0].id;
  });

  it('should unlock a locked scooter', async () => {
    const input: ScooterCommandInput = {
      scooter_id: testScooterId,
      command: 'unlock'
    };

    const result = await sendScooterCommand(input);

    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Scooter ${testScooterId} unlock command sent successfully`);

    // Verify database was updated
    const scooters = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.id, testScooterId))
      .execute();

    expect(scooters[0].is_locked).toBe(false);
    expect(scooters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should lock an unlocked scooter', async () => {
    // First unlock the scooter
    await db.update(scootersTable)
      .set({ is_locked: false })
      .where(eq(scootersTable.id, testScooterId))
      .execute();

    const input: ScooterCommandInput = {
      scooter_id: testScooterId,
      command: 'lock'
    };

    const result = await sendScooterCommand(input);

    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Scooter ${testScooterId} lock command sent successfully`);

    // Verify database was updated
    const scooters = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.id, testScooterId))
      .execute();

    expect(scooters[0].is_locked).toBe(true);
  });

  it('should return success when scooter is already in the desired state', async () => {
    const input: ScooterCommandInput = {
      scooter_id: testScooterId,
      command: 'lock'
    };

    const result = await sendScooterCommand(input);

    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Scooter ${testScooterId} is already locked`);

    // Verify no unnecessary database update occurred
    const scooters = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.id, testScooterId))
      .execute();

    expect(scooters[0].is_locked).toBe(true);
  });

  it('should return error when scooter does not exist', async () => {
    const input: ScooterCommandInput = {
      scooter_id: 99999,
      command: 'unlock'
    };

    const result = await sendScooterCommand(input);

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Scooter with ID 99999 not found');
  });

  it('should handle unlock command for already unlocked scooter', async () => {
    // First unlock the scooter
    await db.update(scootersTable)
      .set({ is_locked: false })
      .where(eq(scootersTable.id, testScooterId))
      .execute();

    const input: ScooterCommandInput = {
      scooter_id: testScooterId,
      command: 'unlock'
    };

    const result = await sendScooterCommand(input);

    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Scooter ${testScooterId} is already unlocked`);
  });

  it('should update the updated_at timestamp when state changes', async () => {
    const originalTime = new Date('2023-01-01T00:00:00Z');
    
    // Set an old timestamp
    await db.update(scootersTable)
      .set({ updated_at: originalTime })
      .where(eq(scootersTable.id, testScooterId))
      .execute();

    const input: ScooterCommandInput = {
      scooter_id: testScooterId,
      command: 'unlock'
    };

    await sendScooterCommand(input);

    // Verify timestamp was updated
    const scooters = await db.select()
      .from(scootersTable)
      .where(eq(scootersTable.id, testScooterId))
      .execute();

    expect(scooters[0].updated_at.getTime()).toBeGreaterThan(originalTime.getTime());
  });
});
