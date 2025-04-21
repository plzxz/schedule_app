import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const hash = Buffer.from(username + password).toString('base64');

    const [rows] = await db.query(
      'SELECT id, username, name, image FROM users WHERE username = ? AND password = ?',
      [username, hash]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    return NextResponse.json(rows[0], { status: 200 });

  } catch (err) {
    console.error('Login failed:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
