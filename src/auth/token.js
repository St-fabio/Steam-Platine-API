import jwt from "jsonwebtoken";

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const ACCESS_SECRET = env("JWT_ACCESS_SECRET");

export function signAccessToken({ userId, email }) {
  return jwt.sign(
    { sub: userId, email },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}