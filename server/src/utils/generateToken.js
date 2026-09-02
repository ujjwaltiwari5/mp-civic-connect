import jwt from "jsonwebtoken";

export const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,                                  // JavaScript in the browser can never read this
    secure: process.env.NODE_ENV === "production",    // HTTPS-only once deployed
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, in milliseconds
  });

  return token;
};