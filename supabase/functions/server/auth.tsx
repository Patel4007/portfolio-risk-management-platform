import { createClient } from "jsr:@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

export async function signUp(email: string, password: string, name: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log(`Sign up error for user ${email}: ${error.message}`);
      throw error;
    }

    console.log(`User signed up successfully: ${email}`);
    return { success: true, user: data.user };
  } catch (error) {
    console.log(`Error during sign up process: ${error}`);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const {
      data: { session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`Sign in error for user ${email}: ${error.message}`);
      throw error;
    }

    if (!session) {
      throw new Error("No session returned from sign in");
    }

    console.log(`User signed in successfully: ${email}`);
    return { success: true, access_token: session.access_token, user: session.user };
  } catch (error) {
    console.log(`Error during sign in process: ${error}`);
    throw error;
  }
}

export async function verifyToken(accessToken: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.log(`Token verification error: ${error?.message || "No user found"}`);
      throw new Error("Invalid token");
    }

    console.log(`Token verified for user: ${user.email}`);
    return { success: true, user };
  } catch (error) {
    console.log(`Error during token verification: ${error}`);
    throw error;
  }
}
