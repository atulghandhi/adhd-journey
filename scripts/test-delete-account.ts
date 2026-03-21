import { execSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

type LocalSupabaseEnv = {
  ANON_KEY?: string;
  API_URL?: string;
  SERVICE_ROLE_KEY?: string;
};

function parseSupabaseStatusEnv(output: string): LocalSupabaseEnv {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<LocalSupabaseEnv>((env, line) => {
      const match = /^([A-Z0-9_]+)="?(.*?)"?$/.exec(line);

      if (!match) {
        return env;
      }

      const [, key, value] = match;

      if (key === "ANON_KEY" || key === "API_URL" || key === "SERVICE_ROLE_KEY") {
        env[key] = value;
      }

      return env;
    }, {});
}

function getLocalSupabaseEnv(): LocalSupabaseEnv {
  const output = execSync("supabase status -o env", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return parseSupabaseStatusEnv(output);
}

function requireValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

async function countRows(
  table: "community_posts" | "profiles" | "user_progress",
  column: "id" | "user_id",
  value: string,
  serviceClient: ReturnType<typeof createClient>,
) {
  const { count, error } = await serviceClient
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, value);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function main() {
  const localEnv = getLocalSupabaseEnv();
  const apiUrl = requireValue("API_URL", process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? localEnv.API_URL);
  const anonKey = requireValue(
    "ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      localEnv.ANON_KEY,
  );
  const serviceRoleKey = requireValue("SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY ?? localEnv.SERVICE_ROLE_KEY);

  const anonClient = createClient(apiUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const serviceClient = createClient(apiUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `delete-account-smoke-${runId}@focuslab.local`;
  const password = "password123";
  const name = "Delete Account Smoke Test";

  let createdUserId: string | undefined;
  let deletedByFunction = false;

  try {
    console.log(`Creating disposable test user ${email}...`);

    const signUpResult = await anonClient.auth.signUp({
      email,
      options: {
        data: { name },
      },
      password,
    });

    if (signUpResult.error) {
      throw signUpResult.error;
    }

    let accessToken = signUpResult.data.session?.access_token;
    let userId = signUpResult.data.user?.id;

    if (!accessToken || !userId) {
      const signInResult = await anonClient.auth.signInWithPassword({ email, password });

      if (signInResult.error) {
        throw signInResult.error;
      }

      accessToken = signInResult.data.session?.access_token;
      userId = signInResult.data.user?.id;
    }

    accessToken = requireValue("access token", accessToken);
    userId = requireValue("user id", userId);
    createdUserId = userId;

    const { data: tasks, error: tasksError } = await serviceClient
      .from("tasks")
      .select("id,title")
      .order("order", { ascending: true })
      .limit(1);

    if (tasksError || !tasks?.length) {
      throw tasksError ?? new Error("No task found for smoke test.");
    }

    const firstTask = tasks[0];

    console.log(`Seeding owned rows against task "${firstTask.title}"...`);

    const now = new Date().toISOString();

    const { error: progressError } = await serviceClient.from("user_progress").insert({
      completed_at: now,
      current_day: 1,
      status: "completed",
      task_id: firstTask.id,
      unlocked_at: now,
      user_id: userId,
    });

    if (progressError) {
      throw progressError;
    }

    const { error: postError } = await serviceClient.from("community_posts").insert({
      body: `delete-account smoke test ${runId}`,
      task_id: firstTask.id,
      user_id: userId,
    });

    if (postError) {
      throw postError;
    }

    console.log("Invoking delete-account function...");

    const response = await fetch(`${apiUrl}/functions/v1/delete-account`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const rawBody = await response.text();
    const body = rawBody ? JSON.parse(rawBody) : null;

    if (!response.ok) {
      throw new Error(`delete-account failed with ${response.status}: ${rawBody}`);
    }

    if (!body?.ok) {
      throw new Error(`delete-account returned unexpected body: ${rawBody}`);
    }

    deletedByFunction = true;

    console.log("Verifying auth user and owned rows were removed...");

    const authLookup = await serviceClient.auth.admin.getUserById(userId);

    if (!authLookup.error && authLookup.data.user) {
      throw new Error("Auth user still exists after delete-account.");
    }

    const [profileCount, progressCount, postCount] = await Promise.all([
      countRows("profiles", "id", userId, serviceClient),
      countRows("user_progress", "user_id", userId, serviceClient),
      countRows("community_posts", "user_id", userId, serviceClient),
    ]);

    if (profileCount !== 0 || progressCount !== 0 || postCount !== 0) {
      throw new Error(
        `Residual rows found after delete-account. profiles=${profileCount}, user_progress=${progressCount}, community_posts=${postCount}`,
      );
    }

    console.log("delete-account smoke test passed.");
    console.log(`Deleted user ${userId}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`delete-account smoke test failed: ${message}`);
    process.exitCode = 1;
  } finally {
    if (createdUserId && !deletedByFunction) {
      try {
        await serviceClient.auth.admin.deleteUser(createdUserId);
      } catch (cleanupError) {
        const message =
          cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        console.error(`Cleanup failed for ${createdUserId}: ${message}`);
      }
    }
  }
}

void main();
