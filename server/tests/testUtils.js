// Shared helpers for the backend test suite. Tests never touch the real
// MongoDB Atlas cluster — each test file spins up its own throwaway
// in-memory MongoDB instance via mongodb-memory-server, so nothing here
// depends on server/.env at all.
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import User from "../src/models/User.js";
import Category from "../src/models/Category.js";
import Ward from "../src/models/Ward.js";
import Department from "../src/models/Department.js";

// generateToken.js / auth.middleware.js both read process.env.JWT_SECRET —
// give tests a fixed value so signing/verifying always agrees, independent
// of whatever (if anything) is in server/.env.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_for_phase17";

let mongod;

export const connectTestDB = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

export const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
};

export const clearDB = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
};

// Signs the same shape of JWT generateToken.js does, without needing a real
// Express `res` to attach a cookie to.
export const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

let counter = 0;
const unique = (label) => `${label}-${Date.now()}-${counter++}`;

// Creates a User directly via the model (not through POST /api/auth/register)
// so fixture setup never eats into registerLimiter's budget, and returns a
// ready-to-use Cookie header string for supertest's .set("Cookie", ...).
export const createUser = async (overrides = {}) => {
  const user = await User.create({
    name: "Test User",
    email: `${unique("user")}@test.com`,
    password: "password123",
    role: "citizen",
    ...overrides,
  });
  const token = signToken(user._id);
  return { user, token, cookie: `token=${token}` };
};

export const createCategory = (overrides = {}) =>
  Category.create({ name: unique("Category"), priorityWeight: 0.5, ...overrides });

export const createWard = (overrides = {}) =>
  Ward.create({ name: unique("Ward"), importanceWeight: 0.5, ...overrides });

export const createDepartment = (overrides = {}) =>
  Department.create({ name: unique("Department"), ...overrides });