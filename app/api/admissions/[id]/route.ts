import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Admission, Bed } from "@/lib/models";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();
    const { action } = body; // action = "discharge"

    if (action !== "discharge") {
      return NextResponse.json(
        { error: "Invalid action. Only 'discharge' is supported on this endpoint." },
        { status: 400 }
      );
    }

    // Find admission
    const admission = await Admission.findById(id);
    if (!admission) {
      return NextResponse.json({ error: "Admission record not found" }, { status: 404 });
    }

    // Validation: Discharge only allowed if current status is "Admitted"
    if (admission.status !== "Admitted") {
      return NextResponse.json(
        { error: `Discharge is only allowed if status is 'Admitted'. Current status is '${admission.status}'.` },
        { status: 400 }
      );
    }

    // Update admission details
    admission.status = "Discharged";
    admission.discharge_date = new Date();
    await admission.save();

    // Free the associated bed
    if (admission.bed_id) {
      await Bed.findByIdAndUpdate(admission.bed_id, { status_available: true });
    }

    return NextResponse.json(admission);
  } catch (error: any) {
    console.error("PATCH Admission Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to discharge patient" },
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

    const admission = await Admission.findByIdAndDelete(id);
    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }

    // Free the associated bed
    if (admission.bed_id) {
      await Bed.findByIdAndUpdate(admission.bed_id, { status_available: true });
    }

    return NextResponse.json({ message: "Admission deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Admission Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete admission" },
      { status: 500 }
    );
  }
}

