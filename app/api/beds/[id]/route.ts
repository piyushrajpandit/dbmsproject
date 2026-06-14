import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Bed } from "@/lib/models";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();
    const { status_available } = body;

    if (status_available === undefined) {
      return NextResponse.json(
        { error: "status_available is required in request body" },
        { status: 400 }
      );
    }

    const bed = await Bed.findByIdAndUpdate(
      id,
      { status_available: !!status_available },
      { new: true }
    );

    if (!bed) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    return NextResponse.json(bed);
  } catch (error: any) {
    console.error("PATCH Bed Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update bed status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

    const bed = await Bed.findByIdAndDelete(id);
    if (!bed) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Bed deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Bed Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete bed" },
      { status: 500 }
    );
  }
}

