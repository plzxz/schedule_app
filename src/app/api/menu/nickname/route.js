import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

const db = mysqlPool.promise();

export async function POST(req) {
    const { username, name } = await req.json();
  
    await db.query(
      'UPDATE users SET name = ? WHERE username = ?',
      [name, username]
    );
  
    return NextResponse.json({ success: true });
  }