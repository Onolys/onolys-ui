import {
  AuthError
} from "./chunk-5F642S7P.js";

// src/auth/firebase.ts
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  applyActionCode,
  checkActionCode,
  confirmPasswordReset as fbConfirmPasswordReset,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  onIdTokenChanged,
  reload,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  verifyPasswordResetCode as fbVerifyPasswordResetCode
} from "firebase/auth";
var OPERATION = {
  verifyAndChangeEmail: "VERIFY_AND_CHANGE_EMAIL",
  recoverEmail: "RECOVER_EMAIL"
};
var toUser = (u) => u ? { uid: u.uid, email: u.email, displayName: u.displayName, emailVerified: u.emailVerified } : null;
var POPUP_FALLBACK = /* @__PURE__ */ new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported"
]);
var isMobile = () => /Android|iPhone|iPad|iPod/i.test(globalThis.navigator?.userAgent ?? "");
async function emailCall(run) {
  let status;
  try {
    status = await run();
  } catch {
    throw new AuthError("email/unavailable");
  }
  if (status < 200 || status >= 300) throw new AuthError("email/unavailable");
}
function createFirebaseAuthService(config, options) {
  const { emailApi, emulatorUrl } = options;
  const auth = getAuth(initializeApp(config));
  if (emulatorUrl && !auth.emulatorConfig) connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
  const listeners = /* @__PURE__ */ new Set();
  const emit = () => {
    const u = toUser(auth.currentUser);
    for (const l of [...listeners]) l(u ? { ...u } : null);
  };
  let redirectError = getRedirectResult(auth).then(
    () => void 0,
    (err) => err?.code ?? "auth/unknown"
  );
  onIdTokenChanged(auth, emit);
  const requestVerification = (user, next) => emailCall(async () => {
    if (!emailApi) throw new AuthError("email/unavailable");
    return emailApi.sendVerification(() => user.getIdToken(), next);
  });
  const need = () => {
    if (!auth.currentUser) throw new AuthError("auth/requires-recent-login");
    return auth.currentUser;
  };
  return {
    onAuthStateChanged(cb) {
      listeners.add(cb);
      void auth.authStateReady().then(() => {
        if (listeners.has(cb)) cb(toUser(auth.currentUser));
      });
      return () => void listeners.delete(cb);
    },
    async signUp(email, password, next) {
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        if (err?.code !== "auth/email-already-in-use") throw err;
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (signInErr) {
          const code = signInErr?.code;
          if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") throw err;
          throw signInErr;
        }
        return;
      }
      try {
        await requestVerification(cred.user, next);
      } catch {
      }
      emit();
    },
    async consumeRedirectError() {
      const pending = redirectError;
      redirectError = void 0;
      return pending;
    },
    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signInWithGoogle() {
      const provider = new GoogleAuthProvider();
      if (isMobile()) return signInWithRedirect(auth, provider);
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        const code = err.code ?? "";
        if (POPUP_FALLBACK.has(code)) return signInWithRedirect(auth, provider);
        throw err;
      }
    },
    async sendPasswordReset(email) {
      await emailCall(async () => {
        if (!emailApi) throw new AuthError("email/unavailable");
        return emailApi.sendPasswordReset(email);
      });
    },
    async sendVerificationEmail(next) {
      await requestVerification(need(), next);
    },
    async refreshUser() {
      const user = auth.currentUser;
      if (!user) return null;
      await reload(user);
      await user.getIdToken(true);
      emit();
      return toUser(auth.currentUser);
    },
    async applyEmailVerification(oobCode) {
      await applyActionCode(auth, oobCode);
      const user = auth.currentUser;
      if (user) {
        await reload(user);
        await user.getIdToken(true);
        emit();
      }
    },
    async checkEmailVerificationCode(oobCode) {
      const info = await checkActionCode(auth, oobCode);
      const email = info.data.email;
      if (info.operation !== "VERIFY_EMAIL" || !email) throw new AuthError("auth/invalid-action-code");
      return email;
    },
    async verifyPasswordResetCode(oobCode) {
      return fbVerifyPasswordResetCode(auth, oobCode);
    },
    async confirmPasswordReset(oobCode, newPassword) {
      await fbConfirmPasswordReset(auth, oobCode, newPassword);
    },
    async checkEmailChangeCode(oobCode, kind) {
      const info = await checkActionCode(auth, oobCode);
      const email = info.data.email;
      if (info.operation !== OPERATION[kind] || !email) throw new AuthError("auth/invalid-action-code");
      return { email, previousEmail: info.data.previousEmail ?? null };
    },
    async applyEmailChange(oobCode) {
      let info;
      try {
        info = await checkActionCode(auth, oobCode);
      } catch {
        info = void 0;
      }
      const emails = [info?.data?.email, info?.data?.previousEmail].filter(Boolean).map((e) => e.toLowerCase());
      const before = auth.currentUser;
      await applyActionCode(auth, oobCode);
      const user = auth.currentUser;
      if (!user) return { signedIn: false };
      if (emails.length > 0 && !emails.includes((before?.email ?? "").toLowerCase())) return { signedIn: false };
      try {
        await reload(user);
        await user.getIdToken(true);
      } catch {
        try {
          await fbSignOut(auth);
        } catch {
        }
        return { signedIn: false };
      }
      emit();
      return { signedIn: true };
    },
    async getToken(forceRefresh = false) {
      const user = auth.currentUser;
      return user ? user.getIdToken(forceRefresh) : null;
    },
    async signOut() {
      await fbSignOut(auth);
    }
  };
}

export {
  createFirebaseAuthService
};
//# sourceMappingURL=chunk-IQ6CBLUC.js.map