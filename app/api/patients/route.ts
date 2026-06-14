import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Patient } from "@/lib/models";

export async function GET() {
  try {
    await dbConnect();
    const patients = await Patient.find({}).sort({ createdAt: -1 });
    return NextResponse.json(patients);
  } catch (error: any) {
    console.error("GET Patients Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch patients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
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

    // Check unique email and contact
    const existingPatient = await Patient.findOne({
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

    const patient = new Patient({
      patient_name,
      dob: new Date(dob),
      gender,
      blood_group,
      contact,
      email: email.toLowerCase(),
      address,
      medical_history,
    });

    await patient.save();
    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    console.error("POST Patient Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create patient" },
      { status: 500 }
    );
  }
}
