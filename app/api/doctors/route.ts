import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Doctor } from "@/lib/models";

export async function GET() {
  try {
    await dbConnect();
    const doctors = await Doctor.find({}).sort({ createdAt: -1 });
    return NextResponse.json(doctors);
  } catch (error: any) {
    console.error("GET Doctors Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { doctor_name, specialization, contact, salary } = body;

    // Validation
    if (!doctor_name || !specialization) {
      return NextResponse.json(
        { error: "Doctor name and specialization are required." },
        { status: 400 }
      );
    }

    if (contact && !/^\d{1,10}$/.test(contact)) {
      return NextResponse.json(
        { error: "Contact number must be numeric and max 10 digits." },
        { status: 400 }
      );
    }

    if (salary !== undefined && (isNaN(salary) || salary < 0)) {
      return NextResponse.json(
        { error: "Salary must be a positive number." },
        { status: 400 }
      );
    }

    const doctor = new Doctor({
      doctor_name,
      specialization,
      contact: contact || undefined,
      salary: salary || undefined,
    });

    await doctor.save();
    return NextResponse.json(doctor, { status: 201 });
  } catch (error: any) {
    console.error("POST Doctor Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create doctor" },
      { status: 500 }
    );
  }
}
