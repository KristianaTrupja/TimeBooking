import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { notifyUsersByRole } from "@/lib/notificationsLib";
import { NotificationType } from "@prisma/client";

export async function Post(req: Request) {
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

    await notifyUsersByRole({
      role: "Admin",
      title: "New User Created",
      message: `User "${newUser.username}" with ID: ${newUser.id} was successfully created.`,
      type: NotificationType.INFO,
      actionType: "VIEW_USERS",
      actionUrl: `/admin?tab=modify-absences`,
    })

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

export async function Get() {
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
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function Delete(req: Request) {
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

export async function Put(req: Request) {
  try {
    const { id, username, email, password, role } = await req.json();
    if (!id) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = { username, email, role };
    if (password) {
      updateData.password = await hash(password, 10);
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}