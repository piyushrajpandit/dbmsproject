import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Billing, Admission } from "@/lib/models";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const { admission_id, total_amount, payment_status, bill_date } = body;

    // Validation
    if (!admission_id || total_amount === undefined || !payment_status || !bill_date) {
      return NextResponse.json(
        { error: "Required fields are missing: admission_id, total_amount, payment_status, bill_date" },
        { status: 400 }
      );
    }

    const amount = Number(total_amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Bill amount must be a positive number." },
        { status: 400 }
      );
    }

    // Verify Admission exists
    const admissionExists = await Admission.findById(admission_id);
    if (!admissionExists) {
      return NextResponse.json({ error: "Admission not found." }, { status: 404 });
    }

    const bill = await Billing.findByIdAndUpdate(
      id,
      {
        admission_id,
        total_amount: amount,
        payment_status,
        bill_date: new Date(bill_date),
      },
      { new: true }
    );

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error: any) {
    console.error("PUT Bill Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update bill" },
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

    const bill = await Billing.findByIdAndDelete(id);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Bill deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Bill Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete bill" },
      { status: 500 }
    );
  }
}
