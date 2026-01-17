#!/usr/bin/env node

import { execSync } from "child_process";
import { exit } from "process";

// Disable AWS CLI pagination
process.env.AWS_PAGER = "";

const S3_BUCKET = "glass-to-glass";
const CLOUDFRONT_DISTRIBUTION_ID = "E2364N1GKLPY0";

function run(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✅ ${description} complete`);
  } catch (error) {
    console.error(`❌ ${description} failed`);
    exit(1);
  }
}

console.log("🚀 Starting deployment...\n");

// Step 1: Build for production
run("npm run build:production", "Building for production");

// Step 2: Sync to S3 (upload new files and delete old ones)
run(
  `aws s3 sync dist/ s3://${S3_BUCKET} --delete`,
  "Uploading to S3 and removing old files"
);

// Step 3: Create CloudFront invalidation
if (!CLOUDFRONT_DISTRIBUTION_ID) {
  console.warn(
    "\n⚠️  CLOUDFRONT_DISTRIBUTION_ID not set. Skipping cache invalidation."
  );
  console.log("💡 Set it with: export CLOUDFRONT_DISTRIBUTION_ID=your-id\n");
} else {
  run(
    `aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths '/*' --no-paginate`,
    "Invalidating CloudFront cache"
  );
}

console.log("\n🎉 Deployment complete!\n");
