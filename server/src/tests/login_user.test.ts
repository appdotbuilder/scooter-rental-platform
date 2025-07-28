
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'testpassword123',
  full_name: 'Test User',
  phone: '+1234567890',
  is_admin: false
};

const loginInput: LoginInput = {
  email: 'test@example.com',
  password: 'testpassword123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user data for valid credentials', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
    expect(result!.full_name).toEqual('Test User');
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.is_admin).toEqual(false);
    expect(result!.password_hash).toEqual('testpassword123');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for invalid email', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'testpassword123'
    };

    const result = await loginUser(invalidInput);

    expect(result).toBeNull();
  });

  it('should return null for invalid password', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const result = await loginUser(invalidInput);

    expect(result).toBeNull();
  });

  it('should return null when no users exist', async () => {
    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should handle admin user login correctly', async () => {
    // Create admin user
    const adminUser = {
      ...testUser,
      email: 'admin@example.com',
      is_admin: true
    };

    await db.insert(usersTable)
      .values(adminUser)
      .execute();

    const adminLoginInput: LoginInput = {
      email: 'admin@example.com',
      password: 'testpassword123'
    };

    const result = await loginUser(adminLoginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('admin@example.com');
    expect(result!.is_admin).toEqual(true);
  });
});
