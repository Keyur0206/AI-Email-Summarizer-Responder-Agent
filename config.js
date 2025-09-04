import "dotenv/config";

export const config = {
  SESSION_SECRET: process.env.SESSION_SECRET || "supersecretkey",

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:3000/auth/google/callback",

  OPEN_API_KEY: process.env.OPENAI_API_KEY,
};
