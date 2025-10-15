import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async findByEmail(email: string) {


    const res = await this.db.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
console.log(res,'res');

    return res.rows[0];
  }

  async createUser(email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const res = await this.db.query(
      `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email`,
      [email, hashed],
    );
    return res.rows[0];
  }
}
