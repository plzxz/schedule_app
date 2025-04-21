import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const hash = Buffer.from(username + password).toString('base64');

    // 1. Create user
    const [userResult] = await db.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hash]
    );
    const userId = userResult.insertId;

    // 2. Insert 3 schedules
    const scheduleIds = [];
    for (let i = 1; i <= 3; i++) {
      const [res] = await db.query(
        'INSERT INTO schedules (user_id, number, isUsed) VALUES (?, ?, ?)',
        [userId, i, false]
      );
      scheduleIds.push(res.insertId);
    }

    // 3. Insert 56 class slots (7 days × 8 slots = 56) per schedule
    for (const scheduleId of scheduleIds) {
      let slotIndex = 0;
      for (const day of days) {
        for (let i = 0; i < 8; i++) {
          await db.query(
            `INSERT INTO schedule_classes (
              schedule_id, day_name, slot_index,
              subject_name, isUsed
            ) VALUES (?, ?, ?, '', 0)`,
            [scheduleId, day, slotIndex]
          );
          slotIndex++;
        }
      }
    }

    return NextResponse.json({ id: userId, username }, { status: 200 });

  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Register failed' }, { status: 500 });
  }
}