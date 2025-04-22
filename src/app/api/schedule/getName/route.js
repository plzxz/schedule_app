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
      'SELECT name FROM schedules WHERE user_id = ? AND number = ?',
      [user.id, number]
    );
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });


    // 3. Group by day
    const result = { name: schedule.name};

    return NextResponse.json(result);

  } catch (err) {
    console.error('[GET] /api/schedule/getName failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
