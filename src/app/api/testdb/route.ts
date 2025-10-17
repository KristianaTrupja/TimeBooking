// app/api/testdb/route.ts
import { db } from "@/lib/db"; // or wherever you saved it
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await db.$connect();
    return NextResponse.json({ status: "success", message: "DB connected!" });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  } finally {
    await db.$disconnect();
  }
}
