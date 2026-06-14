import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Billing, Admission } from "@/lib/models";

export async function GET() {
  try {
    await dbConnect();
    const bills = await Billing.find({})
      .populate({
        path: "admission_id",
        populate: { path: "patient_id" },
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(bills);
  } catch (error: any) {
    console.error("GET Billing Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
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

    const bill = new Billing({
      admission_id,
      total_amount: amount,
      payment_status,
      bill_date: new Date(bill_date),
    });

    await bill.save();
    return NextResponse.json(bill, { status: 201 });
  } catch (error: any) {
    console.error("POST Billing Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create bill" },
      { status: 500 }
    );
  }
}
