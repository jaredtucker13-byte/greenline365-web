// Instrumentation file for Next.js
// This file is used for server-side instrumentation

export async function register() {
  // Server-side initialization can go here
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Server instrumentation initialized");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    console.log("Edge runtime initialized");
  }
}
