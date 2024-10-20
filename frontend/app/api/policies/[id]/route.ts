// app/api/policies/[id]/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid policy ID." }, { status: 400 });
  }

  try {
    const policy = await prisma.policy.findUnique({
      where: { id: parseInt(id) },
    });

    if (!policy) {
      return NextResponse.json({ error: "Policy not found." }, { status: 404 });
    }

    return NextResponse.json(policy, { status: 200 });
  } catch (error) {
    console.error("Error fetching policy:", error);
    return NextResponse.json(
      { error: "Failed to fetch policy." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid policy ID." }, { status: 400 });
  }

  try {
    const { category, title, content } = await request.json();

    if (!title || !category || !content) {
      return NextResponse.json(
        { error: "Category, title, and content are required." },
        { status: 400 }
      );
    }

    const updatedPolicy = await prisma.policy.update({
      where: { id: parseInt(id) },
      data: { category, title, content },
    });

    return NextResponse.json(updatedPolicy, { status: 200 });
  } catch (error) {
    console.error("Error updating policy:", error);
    return NextResponse.json(
      { error: "Failed to update policy." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid policy ID." },
        { status: 400 }
      );
    }

    // First check if the policy exists
    const existingPolicy = await prisma.policy.findUnique({
      where: { id },
    });

    if (!existingPolicy) {
      return NextResponse.json({ error: "Policy not found." }, { status: 404 });
    }

    // Perform the deletion
    await prisma.policy.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting policy:", error);
    return NextResponse.json(
      { error: "Failed to delete policy." },
      { status: 500 }
    );
  }
}
