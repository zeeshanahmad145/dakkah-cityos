const fs = require("fs");
const path = require("path");

const adminRoutesDir = path.join(__dirname, "src", "admin", "routes");
const apiAdminDir = path.join(__dirname, "src", "api", "admin");

function getFiles(dir, ext, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, ext, fileList);
    } else if (fullPath.endsWith(ext)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const uiPages = getFiles(adminRoutesDir, "page.tsx");
const apiRoutes = getFiles(apiAdminDir, "route.ts");

const uiPaths = uiPages.map((p) => {
  let relative = path.relative(adminRoutesDir, p);
  relative = relative.replace(/\\/g, "/").replace("/page.tsx", "");
  if (relative === "page.tsx") relative = "/"; // root
  return "/" + relative;
});

const apiPaths = apiRoutes.map((p) => {
  let relative = path.relative(apiAdminDir, p);
  relative = relative.replace(/\\/g, "/").replace("/route.ts", "");
  if (relative === "route.ts") relative = "/";
  return "/admin/" + relative;
});

console.log("# Admin Panel Inventory\n");

console.log("## UI Pages Found (" + uiPaths.length + ")\n");
uiPaths.sort().forEach((p) => console.log("- `" + p + "`"));
console.log("\n");

console.log("## API Routes Found (" + apiPaths.length + ")\n");
apiPaths.sort().forEach((p) => console.log("- `" + p + "`"));
console.log("\n");

// Simple heuristic matching
console.log("## Coverage Analysis\n");
console.log("Comparing UI paths to `/admin/*` API routes.\n");

uiPaths.sort().forEach((ui) => {
  // e.g. /vendors -> /admin/vendors
  // e.g. /vendors/[id] -> /admin/vendors
  const baseUi = ui.split("/[")[0]; // remove dynamic parts for simple match

  if (baseUi === "/" || baseUi === "/settings") return; // Skip non-entity roots

  const expectedApi = "/admin" + baseUi;
  const hasApi = apiPaths.some((api) => api.startsWith(expectedApi));

  if (hasApi) {
    console.log(`- [x] UI: \`${ui}\` -> API Coverage Found`);
  } else {
    console.log(
      `- [ ] UI: \`${ui}\` -> **Missing API Route** (\`${expectedApi}\`)`,
    );
  }
});
