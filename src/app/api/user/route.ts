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

async function validateLocation(locationIdRaw: unknown) {
  const locationId = Number(locationIdRaw);
  if (!Number.isInteger(locationId) || locationId <= 0) {
    throw new ValidationError("A valid location is required", "locationId");
  }

  const location = await db.location.findUnique({
    where: { id: locationId },
    select: { id: true, name: true },
  });

  if (!location) {
    throw new ValidationError("Selected location does not exist", "locationId");
  }

  return locationId;
}

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
    const { username, email, password, role, locationId: locationIdRaw } = body;
    
    // Basic required fields (email is only required for Admin role)
    if (!username || !password || !role || locationIdRaw === undefined || locationIdRaw === null) {
      throw new ValidationError(
        "Missing required fields: username, password, role, and location are required",
        "username/password/role/locationId"
      );
    }

    if (!ALLOWED_ROLES.has(role)) {
      throw new ValidationError("Invalid role value", "role");
    }

    const locationId = await validateLocation(locationIdRaw);

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
      data: { username, email: email || null, password: hashedPassword, role, locationId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const { password: _, ...userWithoutPasswordBase } = newUser;
    const userWithoutPassword = {
      ...userWithoutPasswordBase,
      locationName: newUser.location?.name ?? null,
    };

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
        createdAt: true,
        updatedAt: true,
        isActive: true,
        deletedAt: true,
        locationId: true,
        location: {
          select: {
            id: true,
            name: true,
          },
        },
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
      locationName: user.location?.name ?? null,
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

    const { id, username, email, password, role, totalVacations, locationId: locationIdRaw } = await req.json();
    if (!id) {
      throw new ValidationError("User ID is required", 'id')
    }
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new ValidationError("Invalid user id", "id");
    }

    const isSelfUpdate = numericId === Number(requester.id);
    const isAdmin = requester.role === "Admin";
    if (!isAdmin && !isSelfUpdate) {
      throw new AuthorizationError("Forbidden")
    }

    const targetUser = await db.user.findUnique({
      where: { id: numericId },
      select: {
        id: true,
        role: true,
        locationId: true,
        email: true,
      },
    });

    if (!targetUser) {
      throw new ValidationError("User not found", "id");
    }

    const effectiveRole = typeof role === "string" ? role : targetUser.role;
    if (!ALLOWED_ROLES.has(effectiveRole)) {
      throw new ValidationError("Invalid role value", "role");
    }

    if (!isAdmin && typeof role === "string" && role !== targetUser.role) {
      throw new AuthorizationError("Only administrators can change roles");
    }

    const effectiveLocationIdRaw =
      locationIdRaw === undefined || locationIdRaw === null
        ? targetUser.locationId
        : locationIdRaw;
    const locationId = await validateLocation(effectiveLocationIdRaw);

    if (!isAdmin && locationId !== targetUser.locationId) {
      throw new AuthorizationError("Only administrators can change location");
    }

    const normalizedEmail =
      typeof email === "string" ? email.trim() : (targetUser.email ?? null);

    // If changing role to Admin, email is required
    if (effectiveRole === "Admin" && !normalizedEmail) {
      throw new ValidationError(
        "Email is required for Admin users",
        "email"
      );
    }

    // Validate email format if provided
    if (normalizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new ValidationError("Invalid email format", "email");
      }

      // Check if email is already used by another user
      const existingUserByEmail = await db.user.findFirst({
        where: { email: normalizedEmail, NOT: { id: numericId } }
      });
      if (existingUserByEmail) {
        throw new ConflictError("User with this email already exists", undefined, { field: "email" });
      }
    }

    if (!username || typeof username !== "string") {
      throw new ValidationError("Username is required", "username");
    }

    const updateData: any = { username, email: normalizedEmail, role: effectiveRole, locationId };
    if (password) {
      updateData.password = await hash(password, 10);
    }

    const isValidVacation = isAdmin && typeof totalVacations === 'number' && !isNaN(totalVacations);

    const currentYear = new Date().getFullYear();

    const txOperation: any[] = [
      db.user.update({
        where: { id: numericId },
        data: updateData,
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    ];

    if (isValidVacation) {
      txOperation.push(
        db.totalVacationDays.upsert({
          where: {
            userId_year: {
              userId: numericId,
              year: currentYear,
            },
          },
          update: {
            grantedDays: totalVacations,
          },
          create: {
            userId: numericId,
            year: currentYear,
            grantedDays: totalVacations,
          },
        })
      );
    }

    const results = await db.$transaction(txOperation);
    const updatedUser = results[0]
    const updatedVacation = results[1]
    const { password: _password, ...updatedUserWithoutPassword } = updatedUser;

    const userWithVacation = {
      ...updatedUserWithoutPassword,
      locationName: updatedUserWithoutPassword.location?.name ?? null,
      ...(updatedVacation && { totalVacations: updatedVacation.grantedDays }),
    };

    return NextResponse.json({ user: userWithVacation }, { status: 200 });
  } catch (error) {
    return handleApiError(error)
  }
}
