import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password, role } = body;

    const existingUserByEmail = await db.user.findUnique({ where: { email } });
    const existingUserByName = await db.user.findUnique({
      where: { username },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "User already exists" },
        { status: 409 }
      );
    }

    if (existingUserByName) {
      return NextResponse.json(
        { user: null, message: "User already exists with this name" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await db.user.create({
      data: { username, email, password: hashedPassword, role },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { user: userWithoutPassword, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const today = new Date()
  const currentYear = today.getFullYear()
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        password: true,
        createdAt: true,
        updatedAt: true,
        vocations: {
          where: {
            year: currentYear,
          },
          select: {
            grantedDays: true,
          },
        },

      },
    })

    const usersWithVacationDays = users.map(user => ({
      ...user,
      totalVocations: user.vocations[0]?.grantedDays ?? 0,
      vocations: undefined,
    }))

    return NextResponse.json({ users: usersWithVacationDays }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { id, username, email, password, role, totalVocations } = await req.json();
    if (!id) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      )
    }

    
    const updateData: any = { username, email, role };
    if (password) {
      updateData.password = await hash(password, 10);
    }
    
    const currentYear = new Date().getFullYear();
    const [updatedUser, updatedVacation] = await db.$transaction([
      db.user.update({
        where: { id },
        data: updateData,
      }),
      db.totalVocationDays.upsert({
        where: {
          userId_year: {
            userId: id,
            year: currentYear,
          },
        },
        update: {
          grantedDays: totalVocations,
        },
        create: {
          userId: id,
          year: currentYear,
          grantedDays: totalVocations,
        },
      }),
    ])

    const userWithVacation = {
      ...updatedUser,
      totalVocations: updatedVacation.grantedDays,
    };

    return NextResponse.json({ user: userWithVacation }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}
