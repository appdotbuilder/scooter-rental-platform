
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const result = await db.select()
      .from(usersTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch all users:', error);
    throw error;
  }
};
