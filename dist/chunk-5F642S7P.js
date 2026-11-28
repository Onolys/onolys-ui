// src/auth/types.ts
var AuthError = class extends Error {
  code;
  constructor(code) {
    super(code);
    this.name = "AuthError";
    this.code = code;
  }
};

export {
  AuthError
};
//# sourceMappingURL=chunk-5F642S7P.js.map