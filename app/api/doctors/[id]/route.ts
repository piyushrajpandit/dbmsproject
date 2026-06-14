import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Doctor } from "@/lib/models";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
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

    if (salary !== undefined && (isNaN(Number(salary)) || Number(salary) < 0)) {
      return NextResponse.json(
        { error: "Salary must be a positive number." },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      {
        doctor_name,
        specialization,
        contact: contact || undefined,
        salary: salary ? Number(salary) : undefined,
      },
      { new: true }
    );

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json(doctor);
  } catch (error: any) {
    console.error("PUT Doctor Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update doctor" },
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

    const doctor = await Doctor.findByIdAndDelete(id);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Doctor deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Doctor Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete doctor" },
      { status: 500 }
    );
  }
}
