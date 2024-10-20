// app/api/policies/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const policies = await prisma.policy.findMany();
    return NextResponse.json(policies, { status: 200 });
  } catch (error) {
    console.error("Error fetching policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch policies." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { category, title, content } = await request.json();

    if (!category || !title || !content) {
      return NextResponse.json(
        { error: "Category, title, and content are required." },
        { status: 400 }
      );
    }

    const newPolicy = await prisma.policy.create({
      data: { category, title, content },
    });

    return NextResponse.json(newPolicy, { status: 201 });
  } catch (error) {
    console.error("Error creating policy:", error);
    return NextResponse.json(
      { error: "Failed to create policy." },
      { status: 500 }
    );
  }
}
