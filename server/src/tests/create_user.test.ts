
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  phone: '+1234567890'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with hashed password', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.full_name).toEqual('Test User');
    expect(result.phone).toEqual('+1234567890');
    expect(result.is_admin).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Password should be hashed, not plain text
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash.length).toBeGreaterThan(0);

    // Verify password can be validated with Bun's password verification
    const isValidPassword = await Bun.password.verify('password123', result.password_hash);
    expect(isValidPassword).toBe(true);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].full_name).toEqual('Test User');
    expect(users[0].phone).toEqual('+1234567890');
    expect(users[0].is_admin).toEqual(false);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional phone field', async () => {
    const inputWithoutPhone: CreateUserInput = {
      email: 'nophone@example.com',
      password: 'password123',
      full_name: 'No Phone User'
    };

    const result = await createUser(inputWithoutPhone);

    expect(result.email).toEqual('nophone@example.com');
    expect(result.full_name).toEqual('No Phone User');
    expect(result.phone).toBeNull();
    expect(result.is_admin).toEqual(false);
  });

  it('should fail with duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com',
      password: 'different123',
      full_name: 'Different User',
      phone: '+9876543210'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should hash different passwords differently', async () => {
    const user1Input: CreateUserInput = {
      email: 'user1@example.com',
      password: 'password1',
      full_name: 'User One'
    };

    const user2Input: CreateUserInput = {
      email: 'user2@example.com',
      password: 'password2',
      full_name: 'User Two'
    };

    const user1 = await createUser(user1Input);
    const user2 = await createUser(user2Input);

    // Different passwords should produce different hashes
    expect(user1.password_hash).not.toEqual(user2.password_hash);

    // Each password should only validate against its own hash
    const user1Valid = await Bun.password.verify('password1', user1.password_hash);
    const user1Invalid = await Bun.password.verify('password2', user1.password_hash);
    expect(user1Valid).toBe(true);
    expect(user1Invalid).toBe(false);
  });
});
