// CRUD test script — tests add & delete for all entities
const BASE = "http://127.0.0.1:3000/api";

async function api(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: "Non-JSON response", raw: text.slice(0, 200) }; }
  return { ok: res.ok, status: res.status, data };
}

let passed = 0, failed = 0;

function test(name, ok, detail) {
  if (ok) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`, detail || "");
    failed++;
  }
}

async function run() {
  console.log("🧪 Testing CRUD operations...\n");

  const uid = Date.now().toString().slice(-6);

  // ═══════════════════════════════════════
  // PATIENT: Add → Verify → Delete → Verify
  // ═══════════════════════════════════════
  console.log("── Patients ──");
  const p = await api("POST", "/patients", {
    patient_name: "Test Patient",
    dob: "2000-01-01",
    gender: "Male",
    blood_group: "A+",
    contact: `11${uid}11`,
    email: `test.patient.${uid}@test.com`,
    address: "Test Address, Mumbai",
  });
  test("Add patient", p.ok && p.data._id, p.data);

  if (p.ok) {
    // Test updating patient
    const updatedP = await api("PUT", `/patients/${p.data._id}`, {
      patient_name: "Updated Patient Name",
      dob: p.data.dob,
      gender: "Female",
      blood_group: p.data.blood_group,
      contact: p.data.contact,
      email: p.data.email,
      address: "Updated Address",
      medical_history: "Updated History",
    });
    test("Update patient details", updatedP.ok && updatedP.data.patient_name === "Updated Patient Name" && updatedP.data.gender === "Female", updatedP.data);

    const del = await api("DELETE", `/patients/${p.data._id}`);
    test("Delete patient", del.ok, del.data);

    // Verify it's gone
    const check = await api("GET", `/patients/${p.data._id}`);
    test("Verify patient deleted", !check.ok || !check.data._id, check.data);
  }

  // ═══════════════════════════════════════
  // DOCTOR: Add → Verify → Delete → Verify
  // ═══════════════════════════════════════
  console.log("\n── Doctors ──");
  const d = await api("POST", "/doctors", {
    doctor_name: "Dr. Test Doctor",
    specialization: "Testing",
    contact: `22${uid}22`,
    salary: 100000,
  });
  test("Add doctor", d.ok && d.data._id, d.data);

  if (d.ok) {
    // Test updating doctor
    const updatedD = await api("PUT", `/doctors/${d.data._id}`, {
      doctor_name: d.data.doctor_name,
      specialization: "Updated Specialization",
      contact: d.data.contact,
      salary: 120000,
    });
    test("Update doctor specialities", updatedD.ok && updatedD.data.specialization === "Updated Specialization" && updatedD.data.salary === 120000, updatedD.data);

    const del = await api("DELETE", `/doctors/${d.data._id}`);
    test("Delete doctor", del.ok, del.data);

    const check = await api("GET", `/doctors/${d.data._id}`);
    test("Verify doctor deleted", !check.ok || !check.data._id, check.data);
  }

  // ═══════════════════════════════════════
  // WARD: Add → Verify → Delete
  // ═══════════════════════════════════════
  console.log("\n── Wards ──");
  const w = await api("POST", "/wards", {
    ward_name: "Test Ward",
    ward_number: `W-${uid}`,
    capacity: 5,
  });
  test("Add ward", w.ok && w.data._id, w.data);

  if (w.ok) {
    // Test updating ward
    const updatedW = await api("PUT", `/wards/${w.data._id}`, {
      ward_name: "Updated Ward Name",
      ward_number: w.data.ward_number,
      capacity: 8,
    });
    test("Update ward capacity", updatedW.ok && updatedW.data.capacity === 8 && updatedW.data.ward_name === "Updated Ward Name", updatedW.data);
  }

  // ═══════════════════════════════════════
  // BED: Add → Delete → Verify
  // ═══════════════════════════════════════
  console.log("\n── Beds ──");
  if (w.ok) {
    const b = await api("POST", "/beds", {
      bed_number: "TEST-01",
      ward_id: w.data._id,
      type: "General",
    });
    test("Add bed", b.ok && b.data._id, b.data);

    if (b.ok) {
      const del = await api("DELETE", `/beds/${b.data._id}`);
      test("Delete bed", del.ok, del.data);
    }

    // Clean up test ward
    const delW = await api("DELETE", `/wards/${w.data._id}`);
    test("Delete test ward", delW.ok || delW.status === 200, delW.data);
  }

  // ═══════════════════════════════════════
  // ADMISSION: Add → Delete
  // ═══════════════════════════════════════
  console.log("\n── Admissions ──");
  // Get existing data for admission test
  const patientsRes = await api("GET", "/patients");
  const doctorsRes = await api("GET", "/doctors");
  const bedsRes = await api("GET", "/beds?available=true");

  if (patientsRes.ok && doctorsRes.ok && bedsRes.ok &&
      patientsRes.data.length > 0 && doctorsRes.data.length > 0 && bedsRes.data.length > 0) {
    
    // Find a patient that isn't already admitted
    const availableBed = bedsRes.data[0];
    
    // Create a fresh patient for admission test
    const testP = await api("POST", "/patients", {
      patient_name: "Admission Test Patient",
      dob: "1990-05-15",
      gender: "Female",
      blood_group: "O+",
      contact: `33${uid}33`,
      email: `admission.test.${uid}@test.com`,
    });

    if (testP.ok && availableBed) {
      const adm = await api("POST", "/admissions", {
        patient_id: testP.data._id,
        doctor_id: doctorsRes.data[0]._id,
        bed_id: availableBed._id,
        ward_id: availableBed.ward_id,
        admission_date: new Date().toISOString(),
        status: "Admitted",
      });
      test("Add admission", adm.ok && adm.data._id, adm.data);

      if (adm.ok) {
        // Test billing
        console.log("\n── Billing ──");
        const bill = await api("POST", "/billing", {
          admission_id: adm.data._id,
          total_amount: 15000,
          payment_status: "Pending",
          bill_date: new Date().toISOString(),
        });
        test("Add bill", bill.ok && bill.data._id, bill.data);

        if (bill.ok) {
          // Test updating billing status
          const updatedBill = await api("PUT", `/billing/${bill.data._id}`, {
            admission_id: adm.data._id,
            total_amount: 15000,
            payment_status: "Paid",
            bill_date: bill.data.bill_date,
          });
          test("Update billing status to Paid", updatedBill.ok && updatedBill.data.payment_status === "Paid", updatedBill.data);

          const delBill = await api("DELETE", `/billing/${bill.data._id}`);
          test("Delete bill", delBill.ok, delBill.data);
        }

        // Discharge (delete) admission
        const delAdm = await api("DELETE", `/admissions/${adm.data._id}`);
        test("Delete admission", delAdm.ok, delAdm.data);
      }

      // Clean up test patient
      await api("DELETE", `/patients/${testP.data._id}`);
    }
  } else {
    console.log("  ⏭️  Skipped — no existing data for admission test");
  }

  // ═══════════════════════════════════════
  // VALIDATION TESTS
  // ═══════════════════════════════════════
  console.log("\n── Validation Tests ──");
  
  // Invalid contact (too long)
  const badContact = await api("POST", "/patients", {
    patient_name: "Bad Contact",
    dob: "2000-01-01",
    gender: "Male",
    blood_group: "A+",
    contact: "12345678901234",
    email: "bad@test.com",
  });
  test("Reject invalid contact (>10 digits)", !badContact.ok, badContact.data);

  // Missing required field
  const noName = await api("POST", "/patients", {
    dob: "2000-01-01",
    gender: "Male",
    blood_group: "A+",
    contact: "4444444444",
    email: "noname@test.com",
  });
  test("Reject missing patient name", !noName.ok, noName.data);

  // Negative bill amount
  const existingAdmissions = await api("GET", "/admissions");
  if (existingAdmissions.ok && existingAdmissions.data.length > 0) {
    const negBill = await api("POST", "/billing", {
      admission_id: existingAdmissions.data[0]._id,
      total_amount: -500,
      payment_status: "Pending",
      bill_date: new Date().toISOString(),
    });
    test("Reject negative bill amount", !negBill.ok, negBill.data);
  }

  // ═══════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════
  console.log(`\n${"═".repeat(40)}`);
  console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${"═".repeat(40)}`);

  if (failed === 0) {
    console.log("🎉 All tests passed!\n");
  } else {
    console.log(`⚠️  ${failed} test(s) failed.\n`);
    process.exit(1);
  }
}

run().catch(console.error);
