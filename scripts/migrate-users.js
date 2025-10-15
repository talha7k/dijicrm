#!/usr/bin/env node

/**
 * Migration script for existing users
 * Run this script after deploying the auth/onboarding separation changes
 *
 * Usage: node scripts/migrate-users.js
 */

const {
  migrateExistingUsers,
  validateMigration,
  cleanupInvalidProfiles,
} = require("../src/lib/utils/migrate-existing-users.ts");

async function main() {
  console.log("🚀 Starting user migration process...\n");

  try {
    // Step 1: Run migration
    console.log("Step 1: Migrating existing users...");
    const migrationResult = await migrateExistingUsers();

    console.log("\n📊 Migration Results:");
    console.log(`   Total users: ${migrationResult.totalUsers}`);
    console.log(`   Migrated: ${migrationResult.migratedUsers}`);
    console.log(`   Skipped: ${migrationResult.skippedUsers}`);
    console.log(`   Errors: ${migrationResult.errors.length}`);

    if (migrationResult.errors.length > 0) {
      console.log("\n❌ Migration Errors:");
      migrationResult.errors.forEach((error) => console.log(`   - ${error}`));
    }

    // Step 2: Validate migration
    console.log("\nStep 2: Validating migration...");
    const validationResult = await validateMigration();

    console.log("\n📊 Validation Results:");
    console.log(`   Valid profiles: ${validationResult.validProfiles}`);
    console.log(`   Invalid profiles: ${validationResult.invalidProfiles}`);

    if (validationResult.validationErrors.length > 0) {
      console.log("\n⚠️  Validation Errors:");
      validationResult.validationErrors.forEach((error) =>
        console.log(`   - ${error}`),
      );
    }

    // Step 3: Cleanup if needed
    if (validationResult.invalidProfiles > 0) {
      console.log("\nStep 3: Cleaning up invalid profiles...");
      const cleanupResult = await cleanupInvalidProfiles();

      console.log("\n🧹 Cleanup Results:");
      console.log(`   Cleaned profiles: ${cleanupResult.cleanedProfiles}`);

      if (cleanupResult.errors.length > 0) {
        console.log("\n❌ Cleanup Errors:");
        cleanupResult.errors.forEach((error) => console.log(`   - ${error}`));
      }
    }

    // Summary
    console.log("\n🎉 Migration process completed!");
    console.log(
      "Users with incomplete profiles will be redirected to onboarding on next login.",
    );

    if (
      migrationResult.errors.length > 0 ||
      validationResult.validationErrors.length > 0
    ) {
      console.log(
        "\n⚠️  Some issues were encountered. Please review the errors above.",
      );
      process.exit(1);
    } else {
      console.log("\n✅ Migration successful!");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n💥 Migration failed with error:", error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

main();
