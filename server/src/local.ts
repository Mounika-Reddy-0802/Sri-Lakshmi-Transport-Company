// Local development entry point.
//
// Phase 1 replaces the body of this file with a real `app.listen(...)` against
// the Express app exported from `api/index.ts`. Keeping the file here in Phase 0
// means `npm run dev` and `npm run build` are wired and green from the start.
export const SERVICE_NAME = "sltc-api";

function main(): void {
  console.log(`${SERVICE_NAME}: skeleton only — the Express app arrives in Phase 1.`);
}

main();
