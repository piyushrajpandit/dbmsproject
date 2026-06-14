import mongoose, { Schema, Document, Model } from "mongoose";

// --- PATIENT INTERFACE & SCHEMA ---
export interface IPatient extends Document {
  patient_name: string;
  dob: Date;
  gender: "Male" | "Female" | "Other";
  blood_group: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
  contact: string;
  email: string;
  address?: string;
  medical_history?: string;
}

const PatientSchema: Schema = new Schema(
  {
    patient_name: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
    blood_group: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    contact: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^\d{1,10}$/.test(v);
        },
        message: (props: any) =>
          `${props.value} is not a valid contact number! It must be numeric and max 10 digits.`,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address."],
    },
    address: { type: String },
    medical_history: { type: String },
  },
  { timestamps: true }
);

// --- DOCTOR INTERFACE & SCHEMA ---
export interface IDoctor extends Document {
  doctor_name: string;
  specialization: string;
  contact?: string;
  salary?: number;
}

const DoctorSchema: Schema = new Schema(
  {
    doctor_name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    contact: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // optional
          return /^\d{1,10}$/.test(v);
        },
        message: (props: any) =>
          `${props.value} is not a valid contact number! It must be numeric and max 10 digits.`,
      },
    },
    salary: { type: Number, min: 0 },
  },
  { timestamps: true }
);

// --- WARD INTERFACE & SCHEMA ---
export interface IWard extends Document {
  ward_name: string;
  ward_number: string;
  capacity: number;
}

const WardSchema: Schema = new Schema(
  {
    ward_name: { type: String, required: true, trim: true },
    ward_number: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

// --- BED INTERFACE & SCHEMA ---
export interface IBed extends Document {
  bed_number: string;
  ward_id: mongoose.Types.ObjectId;
  type: "General" | "ICU" | "Paediatric";
  status_available: boolean;
}

const BedSchema: Schema = new Schema(
  {
    bed_number: { type: String, required: true, trim: true },
    ward_id: { type: Schema.Types.ObjectId, ref: "Ward", required: true },
    type: { type: String, required: true, enum: ["General", "ICU", "Paediatric"] },
    status_available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Add compound index to prevent duplicate bed numbers within the same ward
BedSchema.index({ bed_number: 1, ward_id: 1 }, { unique: true });

// --- ADMISSION INTERFACE & SCHEMA ---
export interface IAdmission extends Document {
  patient_id: mongoose.Types.ObjectId;
  doctor_id: mongoose.Types.ObjectId;
  bed_id: mongoose.Types.ObjectId;
  ward_id: mongoose.Types.ObjectId;
  admission_date: Date;
  discharge_date?: Date;
  status: "Admitted" | "Discharged" | "Critical";
}

const AdmissionSchema: Schema = new Schema(
  {
    patient_id: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    bed_id: { type: Schema.Types.ObjectId, ref: "Bed", required: true },
    ward_id: { type: Schema.Types.ObjectId, ref: "Ward", required: true },
    admission_date: {
      type: Date,
      required: true,
      validate: {
        validator: function (v: Date) {
          // Cannot be in the future
          return v <= new Date(Date.now() + 60000); // 1 minute buffer for clock drift
        },
        message: () => "Admission date cannot be in the future.",
      },
    },
    discharge_date: { type: Date },
    status: {
      type: String,
      required: true,
      enum: ["Admitted", "Discharged", "Critical"],
      default: "Admitted",
    },
  },
  { timestamps: true }
);

// --- BILLING INTERFACE & SCHEMA ---
export interface IBilling extends Document {
  admission_id: mongoose.Types.ObjectId;
  total_amount: number;
  payment_status: "Pending" | "Paid" | "Partial";
  bill_date: Date;
}

const BillingSchema: Schema = new Schema(
  {
    admission_id: { type: Schema.Types.ObjectId, ref: "Admission", required: true },
    total_amount: {
      type: Number,
      required: true,
      min: [0, "Bill amount must be positive."],
    },
    payment_status: {
      type: String,
      required: true,
      enum: ["Pending", "Paid", "Partial"],
    },
    bill_date: { type: Date, required: true },
  },
  { timestamps: true }
);

// --- MODELS EXPORTS ---
export const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);

export const Ward: Model<IWard> =
  mongoose.models.Ward || mongoose.model<IWard>("Ward", WardSchema);

export const Bed: Model<IBed> =
  mongoose.models.Bed || mongoose.model<IBed>("Bed", BedSchema);

export const Admission: Model<IAdmission> =
  mongoose.models.Admission || mongoose.model<IAdmission>("Admission", AdmissionSchema);

export const Billing: Model<IBilling> =
  mongoose.models.Billing || mongoose.model<IBilling>("Billing", BillingSchema);
