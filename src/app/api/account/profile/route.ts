import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        hashedPassword: true,
        businesses: {
          where: { isActive: true },
          select: {
            role: true,
            business: {
              select: { id: true, name: true, slug: true, logo: true, plan: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      role: user.role,
      hasPassword: !!user.hashedPassword,
      businesses: user.businesses.map((ub) => ({
        id: ub.business.id,
        name: ub.business.name,
        slug: ub.business.slug,
        logo: ub.business.logo,
        plan: ub.business.plan,
        role: ub.role,
      })),
    });
  } catch (error) {
    console.error("Account profile GET error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true },
    });

    await logAction({
      userId: session.user.id,
      action: "account:update_profile",
      entity: "user",
      entityId: session.user.id,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Account profile PATCH error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
