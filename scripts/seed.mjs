// Seed script — run with: node scripts/seed.mjs
const BASE = "http://localhost:3000/api";

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ POST ${path} failed:`, data);
    return null;
  }
  return data;
}

async function seed() {
  console.log("🌱 Seeding database with Indian sample data...\n");

  // --- PATIENTS ---
  const patients = [
    { patient_name: "Aarav Sharma", dob: "1995-03-15", gender: "Male", blood_group: "B+", contact: "9876543210", email: "aarav.sharma@gmail.com", address: "42 MG Road, Bengaluru, Karnataka", medical_history: "Mild asthma since childhood" },
    { patient_name: "Priya Patel", dob: "1988-07-22", gender: "Female", blood_group: "O+", contact: "9823456789", email: "priya.patel@yahoo.com", address: "15 Sardar Patel Nagar, Ahmedabad, Gujarat", medical_history: "Type 2 Diabetes, managed with metformin" },
    { patient_name: "Rohan Verma", dob: "2001-11-05", gender: "Male", blood_group: "A+", contact: "9912345678", email: "rohan.verma@outlook.com", address: "78 Civil Lines, Lucknow, Uttar Pradesh", medical_history: "No significant history" },
    { patient_name: "Ananya Iyer", dob: "1992-01-30", gender: "Female", blood_group: "AB-", contact: "9845678901", email: "ananya.iyer@gmail.com", address: "23 T Nagar, Chennai, Tamil Nadu", medical_history: "Hypothyroidism, on levothyroxine" },
    { patient_name: "Vikram Singh", dob: "1975-09-12", gender: "Male", blood_group: "O-", contact: "9734567890", email: "vikram.singh@hotmail.com", address: "5 Rajpath, Jaipur, Rajasthan", medical_history: "Hypertension, previous cardiac stent (2020)" },
    { patient_name: "Meera Reddy", dob: "1999-06-18", gender: "Female", blood_group: "B-", contact: "9654321098", email: "meera.reddy@gmail.com", address: "12 Banjara Hills, Hyderabad, Telangana", medical_history: "Iron deficiency anemia" },
    { patient_name: "Arjun Nair", dob: "1985-12-25", gender: "Male", blood_group: "A-", contact: "9567890123", email: "arjun.nair@gmail.com", address: "34 Marine Drive, Kochi, Kerala", medical_history: "Chronic lower back pain" },
    { patient_name: "Kavya Gupta", dob: "2003-04-08", gender: "Female", blood_group: "AB+", contact: "9478901234", email: "kavya.gupta@yahoo.com", address: "67 Connaught Place, New Delhi", medical_history: "Seasonal allergies" },
  ];

  const createdPatients = [];
  for (const p of patients) {
    const res = await post("/patients", p);
    if (res) {
      createdPatients.push(res);
      console.log(`  ✅ Patient: ${p.patient_name}`);
    }
  }

  // --- DOCTORS ---
  const doctors = [
    { doctor_name: "Dr. Rajesh Kumar", specialization: "Cardiology", contact: "9001234567", salary: 250000 },
    { doctor_name: "Dr. Sunita Devi", specialization: "Neurology", contact: "9001234568", salary: 220000 },
    { doctor_name: "Dr. Amit Joshi", specialization: "Orthopaedics", contact: "9001234569", salary: 200000 },
    { doctor_name: "Dr. Pooja Mehta", specialization: "Paediatrics", contact: "9001234570", salary: 180000 },
    { doctor_name: "Dr. Sanjay Rao", specialization: "General Surgery", contact: "9001234571", salary: 230000 },
    { doctor_name: "Dr. Neha Agarwal", specialization: "Dermatology", contact: "9001234572", salary: 190000 },
  ];

  const createdDoctors = [];
  for (const d of doctors) {
    const res = await post("/doctors", d);
    if (res) {
      createdDoctors.push(res);
      console.log(`  ✅ Doctor: ${d.doctor_name}`);
    }
  }

  // --- WARDS ---
  const wards = [
    { ward_name: "General Ward", ward_number: "W-101", capacity: 20 },
    { ward_name: "ICU", ward_number: "W-102", capacity: 10 },
    { ward_name: "Paediatric Ward", ward_number: "W-103", capacity: 15 },
    { ward_name: "Cardiac Care Unit", ward_number: "W-104", capacity: 8 },
  ];

  const createdWards = [];
  for (const w of wards) {
    const res = await post("/wards", w);
    if (res) {
      createdWards.push(res);
      console.log(`  ✅ Ward: ${w.ward_name} (${w.ward_number})`);
    }
  }

  // --- BEDS ---
  if (createdWards.length >= 4) {
    const beds = [
      // General Ward beds
      { bed_number: "G-01", ward_id: createdWards[0]._id, type: "General" },
      { bed_number: "G-02", ward_id: createdWards[0]._id, type: "General" },
      { bed_number: "G-03", ward_id: createdWards[0]._id, type: "General" },
      { bed_number: "G-04", ward_id: createdWards[0]._id, type: "General" },
      { bed_number: "G-05", ward_id: createdWards[0]._id, type: "General" },
      // ICU beds
      { bed_number: "ICU-01", ward_id: createdWards[1]._id, type: "ICU" },
      { bed_number: "ICU-02", ward_id: createdWards[1]._id, type: "ICU" },
      { bed_number: "ICU-03", ward_id: createdWards[1]._id, type: "ICU" },
      // Paediatric beds
      { bed_number: "P-01", ward_id: createdWards[2]._id, type: "Paediatric" },
      { bed_number: "P-02", ward_id: createdWards[2]._id, type: "Paediatric" },
      // Cardiac beds
      { bed_number: "CCU-01", ward_id: createdWards[3]._id, type: "ICU" },
      { bed_number: "CCU-02", ward_id: createdWards[3]._id, type: "ICU" },
    ];

    const createdBeds = [];
    for (const b of beds) {
      const res = await post("/beds", b);
      if (res) {
        createdBeds.push(res);
        console.log(`  ✅ Bed: ${b.bed_number}`);
      }
    }

    // --- ADMISSIONS ---
    if (createdPatients.length >= 4 && createdDoctors.length >= 4 && createdBeds.length >= 4) {
      const today = new Date();
      const admissions = [
        {
          patient_id: createdPatients[0]._id,
          doctor_id: createdDoctors[0]._id,
          bed_id: createdBeds[0]._id,
          ward_id: createdWards[0]._id,
          admission_date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: "Admitted",
        },
        {
          patient_id: createdPatients[1]._id,
          doctor_id: createdDoctors[1]._id,
          bed_id: createdBeds[5]._id,
          ward_id: createdWards[1]._id,
          admission_date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: "Critical",
        },
        {
          patient_id: createdPatients[4]._id,
          doctor_id: createdDoctors[0]._id,
          bed_id: createdBeds[10]._id,
          ward_id: createdWards[3]._id,
          admission_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "Admitted",
        },
        {
          patient_id: createdPatients[3]._id,
          doctor_id: createdDoctors[3]._id,
          bed_id: createdBeds[8]._id,
          ward_id: createdWards[2]._id,
          admission_date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: "Admitted",
        },
      ];

      const createdAdmissions = [];
      for (const a of admissions) {
        const res = await post("/admissions", a);
        if (res) {
          createdAdmissions.push(res);
          console.log(`  ✅ Admission for patient ${a.patient_id}`);
        }
      }

      // --- BILLING ---
      if (createdAdmissions.length >= 2) {
        const bills = [
          {
            admission_id: createdAdmissions[0]._id,
            total_amount: 45000,
            payment_status: "Pending",
            bill_date: new Date().toISOString(),
          },
          {
            admission_id: createdAdmissions[1]._id,
            total_amount: 125000,
            payment_status: "Partial",
            bill_date: new Date().toISOString(),
          },
          {
            admission_id: createdAdmissions[2]._id,
            total_amount: 85000,
            payment_status: "Paid",
            bill_date: new Date().toISOString(),
          },
        ];

        for (const b of bills) {
          const res = await post("/billing", b);
          if (res) {
            console.log(`  ✅ Bill: ₹${b.total_amount} (${b.payment_status})`);
          }
        }
      }
    }
  }

  console.log("\n🎉 Seeding complete!");
}

seed().catch(console.error);
