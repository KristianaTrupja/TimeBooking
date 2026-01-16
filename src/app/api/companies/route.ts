import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ValidationError, RecordNotFoundError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";

/**
 * CREATE company
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      throw new ValidationError("Company name is required", "name");
    }

    const company = await db.company.create({
      data: { name },
    });

    return NextResponse.json(
      { company, message: "Company created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET companies
 * ?includeInactive=true
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const companies = await db.company.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * UPDATE company
 * ?companyId=1
 */
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = Number(searchParams.get("companyId"));
    const { name, isActive } = await req.json();

    if (!companyId || !name) {
      throw new ValidationError("Company ID and name are required", "companyId/name");
    }

    const company = await db.company.update({
      where: { id: companyId },
      data: {
        name,
        ...(typeof isActive === "boolean" && { isActive }),
      },
    });

    return NextResponse.json(
      { company, message: "Company updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE company
 * ?companyId=1
 *
 * Soft delete if related data exists
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = Number(searchParams.get("companyId"));

    if (!companyId) {
      throw new ValidationError("Company ID is required", "companyId");
    }

    // Check if company has any projects
    const projectsCount = await db.projects.count({ where: { companyId } });
    
    // Check if any sidebar projects reference this company's name
    const company = await db.company.findUnique({ where: { id: companyId } });
    const sidebarProjectsCount = company 
      ? await db.sidebarProject.count({ where: { company: company.name } })
      : 0;

    const hasRelatedData = projectsCount > 0 || sidebarProjectsCount > 0;

    if (hasRelatedData) {
      await db.company.update({
        where: { id: companyId },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: "Company deactivated successfully. Related data preserved.",
      });
    }

    const deleted = await db.company.delete({
      where: { id: companyId },
    });

    if (!deleted) {
      throw new RecordNotFoundError("Company", String(companyId));
    }

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
