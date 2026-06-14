import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Ward } from "@/lib/models";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const { ward_name, ward_number, capacity } = body;

    // Validation
    if (!ward_name || !ward_number || capacity === undefined) {
      return NextResponse.json(
        { error: "Ward name, ward number, and capacity are required." },
        { status: 400 }
      );
    }

    if (isNaN(capacity) || capacity < 1) {
      return NextResponse.json(
        { error: "Capacity must be at least 1." },
        { status: 400 }
      );
    }

    // Check unique ward number excluding current ward
    const existingWard = await Ward.findOne({
      _id: { $ne: id },
      ward_number: ward_number.trim(),
    });
    if (existingWard) {
      return NextResponse.json(
        { error: `Ward with number ${ward_number} already exists.` },
        { status: 400 }
      );
    }

    const ward = await Ward.findByIdAndUpdate(
      id,
      {
        ward_name: ward_name.trim(),
        ward_number: ward_number.trim(),
        capacity,
      },
      { new: true }
    );

    if (!ward) {
      return NextResponse.json({ error: "Ward not found" }, { status: 404 });
    }

    return NextResponse.json(ward);
  } catch (error: any) {
    console.error("PUT Ward Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update ward" },
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

    const ward = await Ward.findByIdAndDelete(id);
    if (!ward) {
      return NextResponse.json({ error: "Ward not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Ward deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Ward Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete ward" },
      { status: 500 }
    );
  }
}
