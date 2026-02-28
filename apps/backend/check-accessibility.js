const fs = require("fs");
const path = require("path");

const adminRoutesDir = path.join(__dirname, "src", "admin", "routes");

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

const results = {
  inMenu: [],
  hiddenOrSubpage: [],
};

uiPages.forEach((p) => {
  let relative = path.relative(adminRoutesDir, p);
  relative = relative.replace(/\\/g, "/").replace("/page.tsx", "");
  if (relative === "page.tsx") relative = "/";
  const routePath = relative === "/" ? "/" : "/" + relative;

  const content = fs.readFileSync(p, "utf8");

  // Check if it exports a config with a label parameter (which mounts it to the sidebar)
  const hasConfig = content.includes("export const config = defineRouteConfig");
  const hasLabel = content.match(/defineRouteConfig\s*\(\s*\{[^}]*label\s*:/);

  if (hasConfig && hasLabel) {
    results.inMenu.push(routePath);
  } else {
    results.hiddenOrSubpage.push(routePath);
  }
});

console.log("# Admin UI Accessibility Report\n");

console.log(`## Direct Sidebar Navigation (${results.inMenu.length} routes)`);
console.log(
  "These pages are directly accessible from the left-hand Admin Panel menu:\n",
);
results.inMenu.sort().forEach((r) => console.log(`- \`${r}\``));

console.log(
  `\n## Nested or Data Pages (${results.hiddenOrSubpage.length} routes)`,
);
console.log(
  "These pages do not appear in the sidebar and are accessed by clicking on rows/links within the main pages:\n",
);
results.hiddenOrSubpage.sort().forEach((r) => console.log(`- \`${r}\``));
