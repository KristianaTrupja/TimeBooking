import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { notifyUsersByRole } from "@/lib/notificationsLib";
import { NotificationType } from "@prisma/client";
import { NotificationMessage } from "@/constants/notificationTemplates";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthenticationError, AuthorizationError, ConflictError, ValidationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }
  
    if (session.user.role !== "Admin") {
      throw new AuthorizationError("Only administrators can create users");
    }
    
    const body = await req.json();
    const { username, email, password, role } = body;
    
    if (!username || !email || !password || !role) {
      throw new ValidationError(
        "Missing required fields: username, email, password, and role are required",
        "username/email/password/role"
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format", "email");
    }

    const [existingUserByEmail, existingUserByName] = await Promise.all([
      db.user.findUnique({ where: { email } }),
      db.user.findUnique({ where: { username } })
    ]);

    if (existingUserByEmail) {
      throw new ConflictError("User with this email already exists", undefined, { field: "email"})
    }

    if (existingUserByName) {
      throw new ConflictError("User with this username already exists", undefined, { field: "username"});
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await db.user.create({
      data: { username, email, password: hashedPassword, role },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    await notifyUsersByRole({
      role: "Admin",
      title: "New User Created",
      message: NotificationMessage.UserCreated(newUser.username, session.user.username),
      type: NotificationType.INFO,
      actionType: "VIEW_USERS",
    })

    return NextResponse.json(
      { user: userWithoutPassword, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(req: Request) {
  const today = new Date()
  const currentYear = today.getFullYear()
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("includeInactive") === "true";
  
  try {
    const users = await db.user.findMany({
      where: includeInactive ? {} : { isActive: true },  // Include inactive if requested
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        password: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        deletedAt: true,
        vacations: {
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
      totalVacations: user.vacations[0]?.grantedDays ?? 0,
      vacations: undefined,
    }))

    return NextResponse.json({ users: usersWithVacationDays }, { status: 200 });
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      throw new ValidationError("User ID is required", 'id')
    }

    // Check if user has any related data
    const [workHoursCount, absencesCount, vacationsCount, submissionsCount, notificationsCount, sidebarProjectsCount] = await Promise.all([
      db.workHours.count({ where: { userId: id } }),
      db.absence.count({ where: { userId: id } }),
      db.totalVacationDays.count({ where: { userId: id } }),
      db.timeSheetSubmission.count({ where: { userId: id } }),
      db.notifications.count({ where: { userId: id } }),
      db.sidebarProject.count({ where: { userId: id } }),
    ]);

    const hasRelatedData = 
      workHoursCount > 0 || 
      absencesCount > 0 || 
      vacationsCount > 0 || 
      submissionsCount > 0 || 
      notificationsCount > 0 || 
      sidebarProjectsCount > 0;

    if (hasRelatedData) {
      // Soft delete: set isActive to false and record deletion timestamp
      await db.user.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });
      
      return NextResponse.json(
        { message: "User deactivated successfully. Their data has been preserved." },
        { status: 200 }
      );
    } else {
      // Hard delete: user has no related data, safe to remove completely
      await db.user.delete({ where: { id } });
      
      return NextResponse.json(
        { message: "User deleted successfully." },
        { status: 200 }
      );
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(req: Request) {
  try {
    const { id, username, email, password, role, totalVacations } = await req.json();
    if (!id) {
      throw new ValidationError("User ID is required", 'id')
    }

    const updateData: any = { username, email, role };
    if (password) {
      updateData.password = await hash(password, 10);
    }

    const isValidVacation = typeof totalVacations === 'number' && !isNaN(totalVacations);

    const currentYear = new Date().getFullYear();

    const txOperation: any[] = [
      db.user.update({
        where: { id },
        data: updateData,
      })
    ];

    if (isValidVacation) {
      txOperation.push(
        db.totalVacationDays.upsert({
          where: {
            userId_year: {
              userId: id,
              year: currentYear,
            },
          },
          update: {
            grantedDays: totalVacations,
          },
          create: {
            userId: id,
            year: currentYear,
            grantedDays: totalVacations,
          },
        })
      );
    }

    const results = await db.$transaction(txOperation);
    const updatedUser = results[0]
    const updatedVacation = results[1]

    const userWithVacation = {
      ...updatedUser,
      ...(updatedVacation && { totalVacations: updatedVacation.grantedDays }),
    };

    return NextResponse.json({ user: userWithVacation }, { status: 200 });
  } catch (error) {
    return handleApiError(error)
  }
}
