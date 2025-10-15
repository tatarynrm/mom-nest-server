import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateTransportationDto } from './dto/create-transportation.dto';
import { UpdateTransportationDto } from './dto/update-transportation.dto';

@Injectable()
export class TransportationService {
  constructor(private readonly db: DatabaseService) {}

  async getAll(page = 1, limit = 10, query?: string) {
    const offset = (page - 1) * limit;
    const params: any[] = [];

    // Базовий SQL
    let baseQuery = `
    SELECT a.*, b.status AS status_string
    FROM transportation a
    LEFT JOIN transportation_status_list b ON a.status = b.id
  `;

    let countQuery = `SELECT COUNT(*) FROM transportation a`;

    // Якщо є пошуковий запит
    if (query) {
      params.push(
        `%${query}%`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`,
      );
      baseQuery += `
      WHERE a.location_from ILIKE $1
         OR a.location_to ILIKE $2
         OR a.driver ILIKE $3
         OR a.truck ILIKE $4
         OR a.truck_owner ILIKE $5
    `;
      countQuery += `
      WHERE a.location_from ILIKE $1
         OR a.location_to ILIKE $2
         OR a.driver ILIKE $3
         OR a.truck ILIKE $4
         OR a.truck_owner ILIKE $5
    `;
    }

    baseQuery += ` ORDER BY a.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const data = await this.db.query(baseQuery, params);
    const totalResult = await this.db.query(
      countQuery,
      query ? params.slice(0, params.length - 2) : [],
    );

    return {
      rows: data.rows,
      total: Number(totalResult.rows[0].count),
    };
  }

  async create(dto: CreateTransportationDto) {
    const result = await this.db.query(
      `INSERT INTO transportation
      (cargo_date, location_from, location_to, driver, truck, truck_owner, price, cost, status, transportation_comment, user_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
      RETURNING *`,
      [
        dto.cargo_date,
        dto.location_from,
        dto.location_to,
        dto.driver,
        dto.truck,
        dto.truck_owner,
        dto.price,
        dto.cost,
        dto.status,
        dto.transportation_comment || null,
        dto.user_id || null,
      ],
    );
    return result.rows[0];
  }

  async remove(id: number) {
    const result = await this.db.query(
      'DELETE FROM transportation WHERE id = $1 RETURNING *',
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException(`Транспорт з id ${id} не знайдено`);
    }

    return result.rows[0];
  }

  async update(id: number, data: UpdateTransportationDto) {
    // Перевірка чи існує запис
    const existing = await this.db.query(
      'SELECT * FROM transportation WHERE id = $1',
      [id],
    );
    if (!existing.rows.length) {
      throw new NotFoundException(`Transportation with id ${id} not found`);
    }

    // Генеруємо SET частину для SQL
    const keys = Object.keys(data);
    if (!keys.length) return existing.rows[0]; // нічого не оновлювати

    const setClause = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');
    const values = Object.values(data);

    const result = await this.db.query(
      `UPDATE transportation SET ${setClause} WHERE id=$${keys.length + 1} RETURNING *`,
      [...values, id],
    );

    return result.rows[0];
  }
  async getMonthlyEarnings(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // Групуємо по місяцях, отримуємо загальний заробіток (cost)
    const dataQuery = `
    SELECT 
      EXTRACT(YEAR FROM cargo_date)::int AS year,
      EXTRACT(MONTH FROM cargo_date)::int AS month,
      SUM(cost) AS total
    FROM transportation
    GROUP BY year, month
    ORDER BY year DESC, month DESC
    LIMIT $1 OFFSET $2
  `;
    const data = await this.db.query(dataQuery, [limit, offset]);

    // Підрахунок загальної кількості місяців для пагінації
    const countQuery = `
    SELECT COUNT(DISTINCT to_char(cargo_date, 'YYYY-MM')) AS total
    FROM transportation
  `;
    const countResult = await this.db.query(countQuery);

    // Повертаємо у форматі, який очікує фронтенд
    return {
      rows: data.rows.map((row) => ({
        year: Number(row.year),
        month: Number(row.month),
        total: Number(row.total),
      })),
      total: Number(countResult.rows[0].total),
    };
  }
}
