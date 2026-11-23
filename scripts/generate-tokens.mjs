import { writeFile } from "node:fs/promises";
import { renderTokensCss } from "../src/tokens/tokens.ts";

await writeFile(new URL("../src/tokens/tokens.css", import.meta.url), renderTokensCss());
