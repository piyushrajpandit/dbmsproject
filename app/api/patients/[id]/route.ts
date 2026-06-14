import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Patient } from "@/lib/models";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const {
      patient_name,
      dob,
      gender,
      blood_group,
      contact,
      email,
      address,
      medical_history,
    } = body;

    // Manual Validation
    if (!patient_name || !dob || !gender || !blood_group || !contact || !email) {
      return NextResponse.json(
        { error: "Required fields are missing: patient_name, dob, gender, blood_group, contact, email" },
        { status: 400 }
      );
    }

    // Check contact numeric and 10 digits
    if (!/^\d{1,10}$/.test(contact)) {
      return NextResponse.json(
        { error: "Contact number must be numeric and max 10 digits." },
        { status: 400 }
      );
    }

    // Check unique email and contact (excluding current patient)
    const existingPatient = await Patient.findOne({
      _id: { $ne: id },
      $or: [{ email: email.toLowerCase() }, { contact }],
    });

    if (existingPatient) {
      if (existingPatient.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: "A patient with this email already exists." },
          { status: 400 }
        );
      }
      if (existingPatient.contact === contact) {
        return NextResponse.json(
          { error: "A patient with this contact number already exists." },
          { status: 400 }
        );
      }
    }

    const patient = await Patient.findByIdAndUpdate(
      id,
      {
        patient_name,
        dob: new Date(dob),
        gender,
        blood_group,
        contact,
        email: email.toLowerCase(),
        address,
        medical_history,
      },
      { new: true }
    );

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("PUT Patient Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update patient" },
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

    const patient = await Patient.findByIdAndDelete(id);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Patient deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Patient Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete patient" },
      { status: 500 }
    );
  }
}
