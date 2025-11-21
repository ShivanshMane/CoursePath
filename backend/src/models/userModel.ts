import  pool  from '../config/database';
import { User } from '../types/database';

export class UserModel {
  // Create a new user
  static async create(email: string, name: string): Promise<User> {
    const query = `
      INSERT INTO users (email, name)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [email, name];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  // Find user by ID
  static async findById(userId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  // Update user
  static async update(userId: string, updates: Partial<Pick<User, 'email' | 'name'>>): Promise<User> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete user
  static async delete(userId: string): Promise<void> {
    const query = 'DELETE FROM users WHERE user_id = $1';
    await pool.query(query, [userId]);
  }
}
