import request from "supertest";
import app from "../src/app.js";
import {
  connectTestDB,
  closeTestDB,
  clearDB,
  createUser,
  createCategory,
  createWard,
  createDepartment,
} from "./testUtils.js";

// Note on the complaintLimiter (10 submissions/hour per user, Phase 16): the
// top-level beforeEach below creates a brand-new citizen (new _id) before
// EVERY test, so the per-user rate-limit budget effectively resets between
// tests — only a single test that itself posts many complaints as the same
// citizen could approach the limit, and none here does.

let category, ward, deptA, deptB;
let citizen, citizenCookie;
let otherCitizen, otherCitizenCookie;
let admin, adminCookie;
let deptUserA, deptUserACookie;
let deptUserB, deptUserBCookie;

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  category = await createCategory();
  ward = await createWard();
  deptA = await createDepartment();
  deptB = await createDepartment();

  ({ user: citizen, cookie: citizenCookie } = await createUser({ email: `citizen-${Date.now()}@test.com` }));
  ({ user: otherCitizen, cookie: otherCitizenCookie } = await createUser({ email: `citizen2-${Date.now()}@test.com` }));
  ({ user: admin, cookie: adminCookie } = await createUser({ email: `admin-${Date.now()}@test.com`, role: "admin" }));
  ({ user: deptUserA, cookie: deptUserACookie } = await createUser({
    email: `deptA-${Date.now()}@test.com`,
    role: "department_user",
    department: deptA._id,
  }));
  ({ user: deptUserB, cookie: deptUserBCookie } = await createUser({
    email: `deptB-${Date.now()}@test.com`,
    role: "department_user",
    department: deptB._id,
  }));
});

afterEach(async () => {
  await clearDB();
});

const validComplaintBody = () => ({
  title: "Broken streetlight",
  description: "The streetlight outside house 42 has been dark for a week.",
  category: category._id.toString(),
  severity: "medium",
  ward: ward._id.toString(),
  lat: 23.25,
  lng: 77.41,
});

describe("POST /api/complaints", () => {
  it("creates a complaint for a logged-in citizen", async () => {
    const res = await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    expect(res.status).toBe(201);
    expect(res.body.data.reporter).toBe(citizen._id.toString());
    expect(res.body.data.status).toBe("submitted");
  });

  it("rejects an unauthenticated request with 401", async () => {
    const res = await request(app).post("/api/complaints").send(validComplaintBody());
    expect(res.status).toBe(401);
  });

  it("rejects a request missing severity with 400", async () => {
    const body = validComplaintBody();
    delete body.severity;
    const res = await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(body);
    expect(res.status).toBe(400);
  });

  it("rejects an invalid category id with 400", async () => {
    const body = validComplaintBody();
    body.category = "64b000000000000000000000";
    const res = await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid category");
  });

  it("rejects an invalid ward id with 400", async () => {
    const body = validComplaintBody();
    body.ward = "64b000000000000000000000";
    const res = await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid ward");
  });
});

describe("GET /api/complaints/mine", () => {
  it("only returns the logged-in citizen's own complaints", async () => {
    await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    await request(app).post("/api/complaints").set("Cookie", otherCitizenCookie).send(validComplaintBody());

    const res = await request(app).get("/api/complaints/mine").set("Cookie", citizenCookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    res.body.data.forEach((c) => expect(c.reporter).toBe(citizen._id.toString()));
  });
});

describe("GET /api/complaints/:id", () => {
  it("lets the owner view their complaint", async () => {
    const created = await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    const res = await request(app).get(`/api/complaints/${created.body.data._id}`).set("Cookie", citizenCookie);
    expect(res.status).toBe(200);
  });

  it("blocks a different citizen with 403", async () => {
    const created = await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    const res = await request(app).get(`/api/complaints/${created.body.data._id}`).set("Cookie", otherCitizenCookie);
    expect(res.status).toBe(403);
  });

  it("lets an admin view any complaint", async () => {
    const created = await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    const res = await request(app).get(`/api/complaints/${created.body.data._id}`).set("Cookie", adminCookie);
    expect(res.status).toBe(200);
  });

  it("returns 404 for a complaint that doesn't exist", async () => {
    const res = await request(app).get("/api/complaints/64b000000000000000000000").set("Cookie", citizenCookie);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/complaints (admin-only list)", () => {
  it("blocks a citizen with 403", async () => {
    const res = await request(app).get("/api/complaints").set("Cookie", citizenCookie);
    expect(res.status).toBe(403);
  });

  it("lets an admin list all complaints", async () => {
    await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    const res = await request(app).get("/api/complaints").set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("safely ignores a NoSQL-operator-injection query string instead of crashing (Phase 16 guard)", async () => {
    await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    const res = await request(app).get("/api/complaints?status[$ne]=null").set("Cookie", adminCookie);
    // Before the Phase 16 fix this would have passed { $ne: null } straight into
    // the Mongoose filter; asString() now drops it, so the request must still
    // succeed as an unfiltered list, never 500.
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/complaints/:id/assign", () => {
  it("blocks a citizen with 403", async () => {
    const created = await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    const res = await request(app)
      .patch(`/api/complaints/${created.body.data._id}/assign`)
      .set("Cookie", citizenCookie)
      .send({ department: deptA._id.toString() });
    expect(res.status).toBe(403);
  });

  it("lets an admin assign a department, moving status to assigned", async () => {
    const created = await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    const res = await request(app)
      .patch(`/api/complaints/${created.body.data._id}/assign`)
      .set("Cookie", adminCookie)
      .send({ department: deptA._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("assigned");
  });
});

describe("PATCH /api/complaints/:id/status (department scoping)", () => {
  let complaintId;
  beforeEach(async () => {
    const created = await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    complaintId = created.body.data._id;
    await request(app)
      .patch(`/api/complaints/${complaintId}/assign`)
      .set("Cookie", adminCookie)
      .send({ department: deptA._id.toString() });
  });

  it("blocks a department_user from a different department with 403", async () => {
    const res = await request(app)
      .patch(`/api/complaints/${complaintId}/status`)
      .set("Cookie", deptUserBCookie)
      .send({ status: "in_progress", note: "starting work" });
    expect(res.status).toBe(403);
  });

  it("lets the assigned department update status", async () => {
    const res = await request(app)
      .patch(`/api/complaints/${complaintId}/status`)
      .set("Cookie", deptUserACookie)
      .send({ status: "in_progress", note: "starting work" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("in_progress");
  });

  it("rejects a status value the department can't set directly (e.g. closed) with 400", async () => {
    const res = await request(app)
      .patch(`/api/complaints/${complaintId}/status`)
      .set("Cookie", deptUserACookie)
      .send({ status: "closed" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/complaints/:id/verify (resolution verification)", () => {
  let complaintId;
  beforeEach(async () => {
    const created = await request(app).post("/api/complaints").set("Cookie", citizenCookie).send(validComplaintBody());
    complaintId = created.body.data._id;
    await request(app)
      .patch(`/api/complaints/${complaintId}/assign`)
      .set("Cookie", adminCookie)
      .send({ department: deptA._id.toString() });
    await request(app)
      .patch(`/api/complaints/${complaintId}/status`)
      .set("Cookie", deptUserACookie)
      .send({ status: "resolved", note: "fixed it" });
  });

  it("blocks a non-owner citizen with 403", async () => {
    const res = await request(app)
      .post(`/api/complaints/${complaintId}/verify`)
      .set("Cookie", otherCitizenCookie)
      .send({ action: "confirm" });
    expect(res.status).toBe(403);
  });

  it("lets the owner confirm, closing the complaint", async () => {
    const res = await request(app)
      .post(`/api/complaints/${complaintId}/verify`)
      .set("Cookie", citizenCookie)
      .send({ action: "confirm" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("closed");
  });

  it("requires a note to reject", async () => {
    const res = await request(app)
      .post(`/api/complaints/${complaintId}/verify`)
      .set("Cookie", citizenCookie)
      .send({ action: "reject" });
    expect(res.status).toBe(400);
  });

  it("reopens the complaint to in_progress when rejected with a note", async () => {
    const res = await request(app)
      .post(`/api/complaints/${complaintId}/verify`)
      .set("Cookie", citizenCookie)
      .send({ action: "reject", note: "still broken" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("in_progress");
  });
});