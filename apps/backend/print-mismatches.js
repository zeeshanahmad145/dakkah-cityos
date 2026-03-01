const fs = require("fs");
const errs = JSON.parse(fs.readFileSync("parsed-errors-full.json", "utf8"));
const targets = [
  "fitness-service.unit.spec.ts",
  "admin-auctions.unit.spec.ts",
  "route.unit.spec.ts",
  "auction.unit.spec.ts",
];

targets.forEach((t) => {
  const fileErrs = errs.filter(
    (e) => e.file.includes(t) && e.messages.includes("toHaveBeenCalledWith"),
  );
  if (fileErrs.length > 0) {
    console.log("\n================ " + t + " ================");
    fileErrs.forEach((e) => {
      console.log("\nTEST: " + e.title);
      const lines = e.messages.split("\n");
      const expected = lines.find((l) => l.includes("Expected:"));
      const received = lines.find((l) => l.includes("Received:"));
      console.log("  " + (expected || "NO_EXPECTED"));
      console.log("  " + (received || "NO_RECEIVED"));
    });
  }
});
