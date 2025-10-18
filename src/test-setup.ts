import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock environment variables for tests
vi.mock("$env/static/public", () => ({
  PUBLIC_FIREBASE_API_KEY: "test-api-key",
  PUBLIC_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  PUBLIC_FIREBASE_PROJECT_ID: "test-project",
  PUBLIC_FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
  PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  PUBLIC_FIREBASE_APP_ID: "1:123456789:web:test",
}));

// Mock $env/dynamic/private for server-side tests
vi.mock("$env/dynamic/private", () => ({
  FIREBASE_SERVICE_ACCOUNT_KEY: "test-service-account-key",
  SMTP_HOST: "smtp.test.com",
  SMTP_PORT: "587",
  SMTP_USER: "test@test.com",
  SMTP_PASS: "test-password",
  OPENAI_API_KEY: "test-openai-key",
}));
