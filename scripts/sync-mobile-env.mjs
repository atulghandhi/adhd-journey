import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function parseEnvFile(contents) {
  return contents
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((env, line) => {
      const separatorIndex = line.indexOf("=");

      if (separatorIndex === -1) {
        return env;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
      return env;
    }, {});
}

function requireValue(name, value) {
  if (!value) {
    throw new Error(`${name} is missing.`);
  }

  return value;
}

const repoRoot = resolve(import.meta.dirname, "..");
const sourceEnvPath = resolve(repoRoot, process.argv[2] ?? ".env.local");
const targetEnvPath = resolve(repoRoot, "apps/mobile/.env.local");

const sourceEnv = parseEnvFile(readFileSync(sourceEnvPath, "utf8"));

const supabaseUrl = requireValue(
  "NEXT_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL",
  sourceEnv.EXPO_PUBLIC_SUPABASE_URL || sourceEnv.NEXT_PUBLIC_SUPABASE_URL,
);
const supabaseAnonKey = requireValue(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY",
  sourceEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY || sourceEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const revenueCatKey =
  sourceEnv.EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY ||
  sourceEnv.EXPO_PUBLIC_REVENUECAT_SDK_KEY ||
  sourceEnv.REVENUECAT_PUBLIC_SDK_KEY ||
  "";

const mobileEnv = [
  `EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`,
  `EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY=${revenueCatKey}`,
  "",
].join("\n");

mkdirSync(resolve(repoRoot, "apps/mobile"), { recursive: true });
writeFileSync(targetEnvPath, mobileEnv, "utf8");

console.log(`Wrote ${targetEnvPath}`);
