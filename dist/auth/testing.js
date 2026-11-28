import {
  createFirebaseAuthService
} from "../chunk-IQ6CBLUC.js";
import "../chunk-5F642S7P.js";

// src/auth/testing.ts
var EMULATOR_URL = "http://127.0.0.1:9099";
var TEST_PROJECT_ID = "demo-onolys";
var TEST_PASSWORD = "longenough1";
var API_KEY = "fake-api-key";
var REQUEST_TYPE = {
  verifyEmail: "VERIFY_EMAIL",
  resetPassword: "PASSWORD_RESET",
  verifyAndChangeEmail: "VERIFY_AND_CHANGE_EMAIL",
  recoverEmail: "RECOVER_EMAIL"
};
var made = [];
function createTestAuthService(emailApi = null) {
  const service = createFirebaseAuthService(
    { apiKey: API_KEY, authDomain: `${TEST_PROJECT_ID}.firebaseapp.com`, projectId: TEST_PROJECT_ID, appId: "1:1:web:1" },
    { emailApi, emulatorUrl: EMULATOR_URL }
  );
  service.consumeRedirectError = async () => void 0;
  made.push(service);
  return service;
}
async function signOutTestServices() {
  await Promise.all(made.splice(0).map((service) => service.signOut()));
}
var counter = 0;
function newTestEmail(prefix = "user") {
  return `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}
async function emulator(path, init) {
  const response = await fetch(`${EMULATOR_URL}${path}`, init);
  if (!response.ok) throw new Error(`Auth emulator ${path} answered ${response.status}`);
  return await response.json();
}
async function oobCodes() {
  return (await emulator(`/emulator/v1/projects/${TEST_PROJECT_ID}/oobCodes`)).oobCodes;
}
async function readActionCode(kind, email) {
  const wanted = email.toLowerCase();
  const found = (await oobCodes()).filter((c) => c.requestType === REQUEST_TYPE[kind] && c.email.toLowerCase() === wanted);
  const latest = found.at(-1);
  if (!latest) throw new Error(`No ${kind} code in the emulator for ${email}`);
  return latest.oobCode;
}
async function issueActionCode(service, kind, email, opts = {}) {
  const post = (path, body) => emulator(`/identitytoolkit.googleapis.com/v1/accounts:${path}?key=${API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const idToken = kind === "resetPassword" ? void 0 : await service.getToken();
  if (kind !== "resetPassword" && !idToken) throw new Error("issueActionCode needs a signed-in service");
  if (kind === "recoverEmail") {
    if (!opts.newEmail) throw new Error("recoverEmail needs newEmail");
    await post("update", { idToken, email: opts.newEmail, returnSecureToken: true });
  } else {
    await post("sendOobCode", { requestType: REQUEST_TYPE[kind], email, idToken, newEmail: opts.newEmail });
  }
  return readActionCode(kind, email);
}
async function signUpTestUser(service, opts = {}) {
  const email = opts.email ?? newTestEmail();
  const password = opts.password ?? TEST_PASSWORD;
  await service.signUp(email, password);
  if (opts.verified) {
    await service.applyEmailVerification(await issueActionCode(service, "verifyEmail", email));
  }
  return { email, password };
}
async function clickVerificationLink(service, email) {
  const oobCode = await issueActionCode(service, "verifyEmail", email);
  await emulator(`/identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ oobCode })
  });
}
export {
  EMULATOR_URL,
  TEST_PASSWORD,
  TEST_PROJECT_ID,
  clickVerificationLink,
  createTestAuthService,
  issueActionCode,
  newTestEmail,
  readActionCode,
  signOutTestServices,
  signUpTestUser
};
//# sourceMappingURL=testing.js.map