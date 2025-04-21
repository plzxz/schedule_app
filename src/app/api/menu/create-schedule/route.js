import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function POST(req) {
  try {
    const { username, number } = await req.json();

    if (!username || !number || isNaN(number)) {
      return NextResponse.json({ error: 'Missing username or number' }, { status: 400 });
    }

    // 1. Get user
    const [[user]] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 2. Get schedule
    const [[schedule]] = await db.query(
      'SELECT id FROM schedules WHERE user_id = ? AND number = ?',
      [user.id, number]
    );
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

    const scheduleId = schedule.id;

    // 3. Mark schedule as used and clear its name
    await db.query('UPDATE schedules SET isUsed = 1, name = ? WHERE id = ?', ['', scheduleId]);

    // 4. Reset all related class slots (soft clear)
    await db.query(
      'UPDATE schedule_classes SET isUsed = 0, subject_name = "", subject_code = NULL, room = NULL, time_start = NULL, time_end = NULL, color = NULL, note = NULL WHERE schedule_id = ?',
      [scheduleId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST] /api/menu/create-schedule failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
