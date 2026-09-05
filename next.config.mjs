import { execSync } from "child_process"
import { readFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf8"))

/**
 * Build stamp shown in the footer, resolved once here because the deployed app
 * has neither a `.git` directory nor `package.json` to read at runtime. The
 * values are handed to `env` below so Next inlines them into the client bundle.
 */
function resolveCommit() {
  // CI checkouts often have no usable git metadata, but do export the SHA.
  const fromEnv =
    process.env.THALOS_BUILD_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA
  if (fromEnv) return fromEnv.trim().slice(0, 7)

  try {
    return execSync("git rev-parse --short=7 HEAD", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim()
  } catch {
    // No git available (Docker build, tarball). The version alone still
    // identifies the release, so this is not worth failing the build over.
    return ""
  }
}

/**
 * Which branch this build came from. `main` and `release` deploy to separate
 * Vercel frontends off the same package.json version, so the branch is what
 * actually tells the two apart at a glance.
 */
function resolveBranch() {
  const fromEnv =
    process.env.THALOS_BUILD_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.GITHUB_REF_NAME
  if (fromEnv) return fromEnv.trim()

  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim()
    // A CI checkout sits on a detached HEAD, which names no branch.
    return branch === "HEAD" ? "" : branch
  } catch {
    return ""
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // The baseline was cleaned to zero errors, so the build is a real typecheck
    // again - same guarantee `nest build` gives the backend. Do not flip this
    // back on to get a red build green.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  env: {
    // A deploy pipeline can override the version with a release tag; otherwise
    // it comes from package.json.
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || pkg.version,
    NEXT_PUBLIC_APP_COMMIT: resolveCommit(),
    NEXT_PUBLIC_APP_BRANCH: resolveBranch(),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  turbopack: {
    resolveAlias: {
      pino: path.resolve(__dirname, "lib", "mocks", "pino.js"),
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      pino: path.resolve(__dirname, "lib", "mocks", "pino.js"),
    }
    return config
  },
}

export default nextConfig
