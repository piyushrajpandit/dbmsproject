import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Ward, Bed } from "@/lib/models";

export async function GET() {
  try {
    await dbConnect();
    const wards = await Ward.find({}).sort({ createdAt: 1 });
    const beds = await Bed.find({});

    // Map beds to their respective wards
    const wardsWithBeds = wards.map((ward) => {
      const wardBeds = beds.filter(
        (bed) => bed.ward_id.toString() === ward._id.toString()
      );
      const availableBedsCount = wardBeds.filter((bed) => bed.status_available)
        .length;

      return {
        ...ward.toObject(),
        beds: wardBeds,
        availableBedsCount,
      };
    });

    return NextResponse.json(wardsWithBeds);
  } catch (error: any) {
    console.error("GET Wards Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch wards" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
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

    // Check unique ward number
    const existingWard = await Ward.findOne({ ward_number: ward_number.trim() });
    if (existingWard) {
      return NextResponse.json(
        { error: `Ward with number ${ward_number} already exists.` },
        { status: 400 }
      );
    }

    const ward = new Ward({
      ward_name: ward_name.trim(),
      ward_number: ward_number.trim(),
      capacity,
    });

    await ward.save();
    return NextResponse.json(ward, { status: 201 });
  } catch (error: any) {
    console.error("POST Ward Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create ward" },
      { status: 500 }
    );
  }
}
