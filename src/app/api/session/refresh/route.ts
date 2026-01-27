import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * API endpoint to trigger session refresh
 * Used when admin changes user permissions/roles
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // The session will be refreshed on next request due to JWT callback logic
    return NextResponse.json({ 
      success: true,
      message: "Session refresh triggered" 
    });
  } catch (error) {
    console.error("Session refresh error:", error);
    return NextResponse.json(
      { message: "Failed to refresh session" },
      { status: 500 }
    );
  }
}
