import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

const db = mysqlPool.promise();

export async function POST(req) {
    const { username, image } = await req.json();
  
    await db.query(
      'UPDATE users SET image = ? WHERE username = ?',
      [image, username]
    );
  
    return NextResponse.json({ success: true });
  }