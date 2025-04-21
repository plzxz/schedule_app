import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const number = parseInt(searchParams.get('number'), 10);

    if (!username || !number) {
      return NextResponse.json({ error: 'Missing username or number' }, { status: 400 });
    }

    // 1. Get user and schedule
    const [[user]] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [[schedule]] = await db.query(
      'SELECT id, name FROM schedules WHERE user_id = ? AND number = ?',
      [user.id, number]
    );
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

    const scheduleId = schedule.id;

    // 2. Load all classes in this schedule
    const [rows] = await db.query(
      `SELECT id, day_name, slot_index, subject_name, subject_code, room, time_start, time_end, color, note, isUsed
       FROM schedule_classes
       WHERE schedule_id = ?
       ORDER BY day_name, slot_index ASC`,
      [scheduleId]
    );

    // 3. Group by day
    const result = { name: schedule.name, days: {} };
    for (const row of rows) {
      if (!result.days[row.day_name]) {
        result.days[row.day_name] = [];
      }
      result.days[row.day_name].push({
        id: row.id,
        name: row.subject_name,
        code: row.subject_code,
        room: row.room,
        start: row.time_start,
        end: row.time_end,
        color: row.color,
        note: row.note,
        isUsed: !!row.isUsed,
        slot_index: row.slot_index
      });
    }

    return NextResponse.json(result);

  } catch (err) {
    console.error('[GET] /api/schedule failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
