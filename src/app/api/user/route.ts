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

const ALLOWED_ROLES = new Set(["Admin", "Dev", "Employee"]);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }
  
    // Don't trust JWT role (can be stale). Validate from DB.
    const requester = await db.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { role: true, isActive: true },
    });

    if (!requester?.isActive || requester.role !== "Admin") {
      throw new AuthorizationError("Only administrators can create users");
    }
    
    const body = await req.json();
    const { username, email, password, role } = body;
    
    // Basic required fields (email is only required for Admin role)
    if (!username || !password || !role) {
      throw new ValidationError(
        "Missing required fields: username, password, and role are required",
        "username/password/role"
      );
    }

    if (!ALLOWED_ROLES.has(role)) {
      throw new ValidationError("Invalid role value", "role");
    }

    // Email is required only for Admin role
    if (role === "Admin" && !email) {
      throw new ValidationError(
        "Email is required for Admin users",
        "email"
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError("Invalid email format", "email");
      }

      // Check for existing email only if email is provided
      const existingUserByEmail = await db.user.findUnique({ where: { email } });
      if (existingUserByEmail) {
        throw new ConflictError("User with this email already exists", undefined, { field: "email"});
      }
    }

    const existingUserByName = await db.user.findUnique({ where: { username } });
    if (existingUserByName) {
      throw new ConflictError("User with this username already exists", undefined, { field: "username"});
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await db.user.create({
      data: { username, email: email || null, password: hashedPassword, role },
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }

    // Admins can update anyone; users can update themselves (profile/settings).
    // But NEVER trust JWT role: always read requester role from DB.
    const requester = await db.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { id: true, role: true, isActive: true },
    });

    if (!requester?.isActive) {
      throw new AuthorizationError("Forbidden")
    }

    const { id, username, email, password, role, totalVacations } = await req.json();
    if (!id) {
      throw new ValidationError("User ID is required", 'id')
    }

    const isSelfUpdate = Number(id) === Number(requester.id);
    const isAdmin = requester.role === "Admin";
    if (!isAdmin && !isSelfUpdate) {
      throw new AuthorizationError("Forbidden")
    }

    if (!ALLOWED_ROLES.has(role)) {
      throw new ValidationError("Invalid role value", "role");
    }

    // If changing role to Admin, email is required
    if (role === "Admin" && !email) {
      throw new ValidationError(
        "Email is required for Admin users",
        "email"
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError("Invalid email format", "email");
      }

      // Check if email is already used by another user
      const existingUserByEmail = await db.user.findFirst({
        where: { email, NOT: { id: Number(id) } }
      });
      if (existingUserByEmail) {
        throw new ConflictError("User with this email already exists", undefined, { field: "email" });
      }
    }

    const updateData: any = { username, email: email || null, role };
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
