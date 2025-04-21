import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

const db = mysqlPool.promise();

export async function POST(req) {
    const { scheduleId } = await req.json();
  
    await db.query('UPDATE schedules SET isUsed = false, name = "" WHERE id = ?', [scheduleId]);
  
    return NextResponse.json({ success: true });
  }