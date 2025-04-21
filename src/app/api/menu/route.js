import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

const db = mysqlPool.promise();

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
  
    if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  
    const [[user]] = await db.query(
      'SELECT id, username, name, image FROM users WHERE username = ?',
      [username]
    );
  
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  
    const [schedules] = await db.query(
      'SELECT id, name, number, isUsed FROM schedules WHERE user_id = ? ORDER BY number ASC',
      [user.id]
    );
  
    return NextResponse.json({
      name: user.name || user.username,
      image: user.image || '/placehold.png',
      schedules
    });
  }
  