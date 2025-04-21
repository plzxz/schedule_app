import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

// Map short day names to full ENUM values
const dayMap = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function POST(req) {
  try {
    const { username, number, name, classes } = await req.json();

    if (!username || !number || !Array.isArray(classes)) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Get user and schedule
    const [[user]] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [[schedule]] = await db.query(
      'SELECT id FROM schedules WHERE user_id = ? AND number = ?',
      [user.id, number]
    );
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

    const scheduleId = schedule.id;

    // 2. Update schedule name and mark as used
    await db.query(
      'UPDATE schedules SET name = ?, isUsed = true WHERE id = ?',
      [name || '', scheduleId]
    );

    // 3. Soft-delete all current entries
    await db.query(
      'UPDATE schedule_classes SET isUsed = 0 WHERE schedule_id = ?',
      [scheduleId]
    );

    // 4. Sort classes per day and assign proper slot_index
    const dayBuckets = {};
    for (const cls of classes) {
      const fullDay = dayMap[cls.day];
      if (!fullDay) continue;
      if (!dayBuckets[fullDay]) dayBuckets[fullDay] = [];
      dayBuckets[fullDay].push(cls);
    }

    for (const [dayName, dayClasses] of Object.entries(dayBuckets)) {
      const dayBase = dayOrder.indexOf(dayName) * 8;

      for (let i = 0; i < dayClasses.length; i++) {
        const cls = dayClasses[i];

        const slotIndex = dayBase + i;

        await db.query(
          `INSERT INTO schedule_classes 
            (schedule_id, day_name, slot_index, subject_name, subject_code, room, time_start, time_end, color, note, isUsed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE
             subject_name = VALUES(subject_name),
             subject_code = VALUES(subject_code),
             room = VALUES(room),
             time_start = VALUES(time_start),
             time_end = VALUES(time_end),
             color = VALUES(color),
             note = VALUES(note),
             isUsed = 1`,
          [
            scheduleId,
            dayName,
            slotIndex,
            cls.name || '',
            cls.code || '',
            cls.room || '',
            cls.start || null,
            cls.end || null,
            cls.color || '',
            cls.note || ''
          ]
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Schedule save failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
