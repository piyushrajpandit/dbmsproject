import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Bed, Ward } from "@/lib/models";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const availableOnly = searchParams.get("available") === "true";

    const query: any = {};
    if (availableOnly) {
      query.status_available = true;
    }

    const beds = await Bed.find(query).populate("ward_id").sort({ createdAt: -1 });
    return NextResponse.json(beds);
  } catch (error: any) {
    console.error("GET Beds Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch beds" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { bed_number, ward_id, type, status_available } = body;

    // Validation
    if (!bed_number || !ward_id || !type) {
      return NextResponse.json(
        { error: "Bed number, ward selection, and type are required." },
        { status: 400 }
      );
    }

    // Verify Ward exists and check capacity limit
    const ward = await Ward.findById(ward_id);
    if (!ward) {
      return NextResponse.json({ error: "Selected Ward does not exist." }, { status: 404 });
    }

    const bedCount = await Bed.countDocuments({ ward_id });
    if (bedCount >= ward.capacity) {
      return NextResponse.json(
        { error: `Cannot add bed. Ward "${ward.ward_name}" has reached its maximum capacity of ${ward.capacity} beds.` },
        { status: 400 }
      );
    }

    // Check unique bed number inside this ward
    const existingBed = await Bed.findOne({
      bed_number: bed_number.trim(),
      ward_id,
    });
    if (existingBed) {
      return NextResponse.json(
        { error: `Bed number "${bed_number}" already exists in this ward.` },
        { status: 400 }
      );
    }

    const bed = new Bed({
      bed_number: bed_number.trim(),
      ward_id,
      type,
      status_available: status_available !== undefined ? status_available : true,
    });

    await bed.save();
    return NextResponse.json(bed, { status: 201 });
  } catch (error: any) {
    console.error("POST Bed Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create bed" },
      { status: 500 }
    );
  }
}
