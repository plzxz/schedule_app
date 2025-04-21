import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

const db = mysqlPool.promise();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  const [rows] = await db.query(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    [username]
  );

  return NextResponse.json({ exists: rows.length > 0 });
}