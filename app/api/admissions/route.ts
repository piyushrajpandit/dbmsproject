import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Admission, Bed, Patient, Doctor } from "@/lib/models";

export async function GET() {
  try {
    await dbConnect();
    const admissions = await Admission.find({})
      .populate("patient_id")
      .populate("doctor_id")
      .populate("bed_id")
      .populate("ward_id")
      .sort({ admission_date: -1 });

    return NextResponse.json(admissions);
  } catch (error: any) {
    console.error("GET Admissions Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch admissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { patient_id, doctor_id, bed_id, admission_date, status } = body;

    // Validation
    if (!patient_id || !doctor_id || !bed_id || !admission_date || !status) {
      return NextResponse.json(
        { error: "Required fields are missing: patient_id, doctor_id, bed_id, admission_date, status" },
        { status: 400 }
      );
    }

    // Check admission date not in the future
    const admDate = new Date(admission_date);
    if (admDate > new Date(Date.now() + 60000)) {
      return NextResponse.json(
        { error: "Admission date cannot be in the future." },
        { status: 400 }
      );
    }

    // Verify Patient and Doctor exist
    const patientExists = await Patient.findById(patient_id);
    if (!patientExists) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    const doctorExists = await Doctor.findById(doctor_id);
    if (!doctorExists) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

    // Fetch and check Bed
    const bed = await Bed.findById(bed_id);
    if (!bed) {
      return NextResponse.json({ error: "Bed not found." }, { status: 404 });
    }

    if (!bed.status_available) {
      return NextResponse.json(
        { error: "The selected bed is already occupied by another patient." },
        { status: 400 }
      );
    }

    // Create admission (ward_id is fetched from the Bed)
    const admission = new Admission({
      patient_id,
      doctor_id,
      bed_id,
      ward_id: bed.ward_id,
      admission_date: admDate,
      status,
    });

    // Save admission
    await admission.save();

    // Mark bed as occupied
    bed.status_available = false;
    await bed.save();

    return NextResponse.json(admission, { status: 201 });
  } catch (error: any) {
    console.error("POST Admission Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create admission" },
      { status: 500 }
    );
  }
}
