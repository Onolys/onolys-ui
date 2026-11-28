# Coding rules

Apply to all code in this repo (Python and TypeScript). Read before changing code. Numbers are stable; PRDs and reviews cite "rule N".

Enforcement: no CI check. The reviewer reads these rules against the diff. **Block** = structural, must be fixed; **Flag** = style or convention, raise it; **Defer** = stated, not applied yet. Task specs say "follow `docs/rules/coding-rules.md`".

Copied per repo: the eval repo and onolys-common keep their own copies, synced by hand. No cross-repo pull.

## Structure

1. **Organize by feature, not layer.** (Block)
   - Do: group by what the code does: `audio/{validate,ffmpeg,transcode}.py`.
   - Don't: split by technical layer (`services/`, `models/`, `utils/`).

2. **Fewer files: one per feature.** (Flag)
   - Do: keep a feature in one file; split once it passes about 300 lines. `audio/validate.py` stays one file until then.
   - Don't: treat 300 as a hard limit or add a CI gate. It is guidance only.

3. **Libraries plus YAML; the runner loops the list.** (Block)
   - Do: write steps as library functions, list them in YAML, resolve by `@step` name.
   - Don't: branch with `if/elif` on step kinds in the runner.
   ```yaml
   - use: rules.max_per_volley
     with: {n: 1}
   ```

4. **One folder per evaluation type; one pipeline YAML per evaluation.** (Block)
   - Do: `evaluations/miti/{pipeline.yaml,prompts/,fewshot/}`; shared protocols in `protocols/`.
   - Don't: use a base pipeline plus override files.

5. **Package boundary: engine = `Engine.run` plus one public types module.** (Block)
   - Do: keep product features (STT, voice, rating, scenarios) in the product; import only the public surface: `from onolys_engine import Engine, EngineError`.
   - Don't: reach into internals such as `onolys_engine.steps.prepare`.

6. **Dev tools live in `tools/` and are not shipped.** (Flag)
   - Do: put them in `engine/tools/`.
   - Don't: mix them into the shipped package.

## Code shape

7. **Classes for major concepts; functions otherwise.** (Flag)
   - Do: use a class for a major concept even if only one variant exists today (more are likely): a converter base plus one small class per dataset. Use plain or static functions for everything else. Apply judgment and the code principles.
   - Don't: over-engineer, or nest inheritance deeper than one level (base plus subclass, no more).

8. **Generic base function plus thin named wrappers.** (Flag)
   - Do: `get_doc(path, Model, uid)` with `get_session(uid, sid)` only filling its parameters.
   - Don't: put logic in the wrappers.

9. **One implementation per piece of logic; inject a stub client at the lowest layer.** (Block)
   - Do: tests and dev use an LLM fixture client, a local-folder blob client, an in-process queue, an email recorder. The Firestore stub is the Firestore emulator.
   - Don't: write parallel fake classes (`repo/fake.py`) or an in-memory Firestore.

10. **Constants: one `constants.py` per package.** (Block)
    - Do: engine and api each have one `constants.py` (eval has its own in its repo); `constants.ts` per app or package for TypeScript. Collection names, storage paths, limits, model ids, state names live there. Per-environment values go in env YAML or env vars.
    - Don't: scatter literals elsewhere.

11. **One source per instruction.** (Block)
    - Do: generate shared prompt or rule text from one file: MITI definitions in `protocols/miti-4.2.1/definitions/*.md` are rendered into every evaluation's prompt.
    - Don't: copy the text into several places.

## Docs and tests

12. **Plain-words docstrings.** (Flag)
    - Do: say what it does, and why if not obvious.
    - Don't: reference spec or planning ids (`PRD R6`, `SP09`, `FX46`).

13. **One `architecture.md`, kept current, instead of ADRs.** (Defer)
    - Do: update it when the design changes.
    - Don't: add new ADRs. Not applied during the revamp (docs are frozen); this rule takes effect after.

14. **Tests mirror source; behaviour-named files.** (Flag)
    - Do: `src/x/audio/validate.py` -> `tests/audio/test_validate.py`; `web/src/features/x` -> `web/tests/features/x`. Shared helpers in `tests/helpers/`.
    - Don't: scatter helpers or name files after implementation details.

## UI and clean-up

15. **`@onolys/common` is the design system.** (Block)
    - Do: themes, tokens, every reusable component, common shell pieces (header, footer, account menu, theme toggle, sign-in) and generic helpers (`format`) live in the package. Products keep only product-specific parts.
    - Don't: re-implement shared UI inside a product.

16. **No legacy or compat code before launch.** (Block)
    - Do: delete old setups, shims, migration and guard tests, legacy CSS layers. Git history is the archive.
    - Don't: keep dead code "just in case".


## Dependencies

17. **Use the library; don't rebuild it.** (Block)
    - Do: use the vendor or library's built-in feature and its documented test hooks. Before writing infrastructure code, look up the documented way and follow it. Examples: Firebase Admin `verify_id_token`, with `FIREBASE_AUTH_EMULATOR_HOST` set only in tests and local dev; Firebase emulators for Auth and Firestore; `google.oauth2.id_token` for Google OIDC tokens; `@firebase/rules-unit-testing` for rules.
    - Don't: write custom versions of what a dependency already does (token verifiers, cert caches, retry/backoff wrappers, fake auth modes). Don't hand-roll mocks of a vendor SDK when the vendor ships an emulator. Don't add guards or branches for settings prod never sets, or keep setup that exists only for history.
    - Tests: prefer the vendor emulator or the library's test utilities over custom fakes. A fake is allowed only when no official emulator or test utility exists, and then at the lowest layer (rule 9). Turn test settings on for tests only; never affect prod.
