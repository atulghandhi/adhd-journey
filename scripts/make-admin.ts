import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email) {
  console.error("Usage: npx tsx scripts/make-admin.ts <email>");
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const {
    data,
    error,
  } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 500,
  });

  if (error) {
    throw error;
  }

  const user = data.users.find((candidate) => candidate.email === email);

  if (!user) {
    throw new Error(`No auth user found for ${email}. Sign up first, then rerun.`);
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    name:
      typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null,
    role: "admin",
  });

  if (profileError) {
    throw profileError;
  }

  console.log(`Admin role granted to ${email}.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
