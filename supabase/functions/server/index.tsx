import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as auth from "./auth.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-dd6554a5/health", (c) => {
  return c.json({ status: "ok" });
});

// Authentication routes
app.post("/make-server-dd6554a5/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const result = await auth.signUp(email, password, name);
    return c.json({ success: true, user: result.user });
  } catch (error) {
    console.log(`Sign up route error: ${error}`);
    return c.json(
      { error: error instanceof Error ? error.message : "Failed to create account" },
      400
    );
  }
});

app.post("/make-server-dd6554a5/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const result = await auth.signIn(email, password);
    return c.json({
      success: true,
      access_token: result.access_token,
      user: result.user,
    });
  } catch (error) {
    console.log(`Sign in route error: ${error}`);
    return c.json(
      { error: error instanceof Error ? error.message : "Failed to sign in" },
      401
    );
  }
});

app.get("/make-server-dd6554a5/auth/verify", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "No authorization header" }, 401);
    }

    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
      return c.json({ error: "No token provided" }, 401);
    }

    const result = await auth.verifyToken(accessToken);
    return c.json({ success: true, user: result.user });
  } catch (error) {
    console.log(`Verify token route error: ${error}`);
    return c.json(
      { error: error instanceof Error ? error.message : "Token verification failed" },
      401
    );
  }
});

Deno.serve(app.fetch);