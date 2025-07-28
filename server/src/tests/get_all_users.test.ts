
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getAllUsers } from '../handlers/get_all_users';

describe('getAllUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getAllUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        email: 'user1@example.com',
        password_hash: 'hashed_password_1',
        full_name: 'User One',
        phone: '123-456-7890',
        is_admin: false
      },
      {
        email: 'admin@example.com',
        password_hash: 'hashed_password_2',
        full_name: 'Admin User',
        phone: null,
        is_admin: true
      }
    ]).execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(2);

    // Check first user
    const user1 = result.find(u => u.email === 'user1@example.com');
    expect(user1).toBeDefined();
    expect(user1!.full_name).toEqual('User One');
    expect(user1!.phone).toEqual('123-456-7890');
    expect(user1!.is_admin).toEqual(false);
    expect(user1!.id).toBeDefined();
    expect(user1!.created_at).toBeInstanceOf(Date);
    expect(user1!.updated_at).toBeInstanceOf(Date);

    // Check admin user
    const admin = result.find(u => u.email === 'admin@example.com');
    expect(admin).toBeDefined();
    expect(admin!.full_name).toEqual('Admin User');
    expect(admin!.phone).toBeNull();
    expect(admin!.is_admin).toEqual(true);
    expect(admin!.id).toBeDefined();
    expect(admin!.created_at).toBeInstanceOf(Date);
    expect(admin!.updated_at).toBeInstanceOf(Date);
  });

  it('should return users in database order', async () => {
    // Create test users with specific order
    await db.insert(usersTable).values([
      {
        email: 'first@example.com',
        password_hash: 'hash1',
        full_name: 'First User',
        is_admin: false
      },
      {
        email: 'second@example.com',
        password_hash: 'hash2',
        full_name: 'Second User',
        is_admin: false
      },
      {
        email: 'third@example.com',
        password_hash: 'hash3',
        full_name: 'Third User',
        is_admin: true
      }
    ]).execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(3);
    
    // Users should be returned in creation order (by id)
    expect(result[0].email).toEqual('first@example.com');
    expect(result[1].email).toEqual('second@example.com');
    expect(result[2].email).toEqual('third@example.com');
    
    // Verify IDs are in ascending order
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });
});
