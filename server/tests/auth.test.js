import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { connectTestDB, closeTestDB, clearDB, createUser } from "./testUtils.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("POST /api/auth/register", () => {
  it("registers a new citizen and sets an httpOnly cookie", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Asha Verma",
      email: "asha@test.com",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("citizen");
    expect(res.body.data).not.toHaveProperty("password");
    expect(res.headers["set-cookie"][0]).toMatch(/^token=/);
  });

  it("rejects an invalid email with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Asha Verma",
      email: "not-an-email",
      password: "password123",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects a password shorter than 6 characters with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Asha Verma",
      email: "asha2@test.com",
      password: "123",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Asha Verma", email: "dup@test.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Another Person", email: "dup@test.com", password: "password123" });
    expect(res.status).toBe(409);
  });

  it("never lets the client set their own role", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Sneaky",
      email: "sneaky@test.com",
      password: "password123",
      role: "admin",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("citizen");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await User.create({ name: "Login Test", email: "login@test.com", password: "password123" });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("login@test.com");
    expect(res.headers["set-cookie"][0]).toMatch(/^token=/);
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("rejects an unknown email with 401 (not 404 — avoids leaking which emails are registered)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "password123" });
    expect(res.status).toBe(401);
  });

  it("rejects a deactivated account with 403", async () => {
    await User.create({
      name: "Deactivated",
      email: "deactivated@test.com",
      password: "password123",
      isActive: false,
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "deactivated@test.com", password: "password123" });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 with no cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 for a garbage cookie", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", "token=not-a-real-jwt");
    expect(res.status).toBe(401);
  });

  it("returns the logged-in user's profile for a valid cookie, with id (not _id) and no password", async () => {
    const { user, cookie } = await createUser({ name: "Me Test", email: "me@test.com" });
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user._id.toString());
    expect(res.body.data.email).toBe("me@test.com");
    expect(res.body.data).not.toHaveProperty("password");
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the token cookie", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"][0]).toMatch(/^token=;/);
  });
});