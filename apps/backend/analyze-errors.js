const fs = require("fs");

const errors = JSON.parse(fs.readFileSync("parsed-errors-full.json", "utf8"));
const counts = {};

errors.forEach((e) => {
  // Extract first line of error message, removing ANSI color codes
  const lines = e.messages.split("\n");
  let msg = lines[0]
    ? lines[0].replace(/\x1b\[[0-9;]*m/g, "").trim()
    : "Unknown Error";

  // further normalize: replace specific values so grouped properly
  if (msg.includes("Expected:") && msg.includes("Received:")) {
    msg = "Expected vs Received Mismatch";
  } else if (msg.includes("toHaveBeenCalledWith")) {
    msg = "toHaveBeenCalledWith Mismatch";
  } else if (msg.includes("toHaveBeenCalledTimes")) {
    msg = "toHaveBeenCalledTimes Mismatch";
  }

  if (e.messages.includes("is not a function")) {
    msg = lines.find((l) => l.includes("is not a function")) || msg;
    msg = msg.trim();
  } else if (e.messages.includes("Cannot read properties of undefined")) {
    msg = "Cannot read properties of undefined";
  }

  counts[msg] = (counts[msg] || 0) + 1;
});

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
console.log(`Total Errors Parsed: ${errors.length}\n`);
sorted.forEach(([k, v]) => console.log(`${v}x : ${k.substring(0, 150)}`));

// Write a grouped file for reference
const grouped = {};
errors.forEach((e) => {
  let msg = "Other";
  if (e.messages.includes("is not a function")) msg = "is not a function";
  else if (e.messages.includes("Cannot read properties of undefined"))
    msg = "Cannot read properties of undefined";
  else if (e.messages.includes("toHaveBeenCalledWith"))
    msg = "toHaveBeenCalledWith";
  else if (e.messages.includes("toHaveBeenCalledTimes"))
    msg = "toHaveBeenCalledTimes";
  else if (e.messages.includes("Expected") && e.messages.includes("Received"))
    msg = "Value Mismatch";

  if (!grouped[msg]) grouped[msg] = [];
  grouped[msg].push(e.file);
});

fs.writeFileSync("errors-grouped.json", JSON.stringify(grouped, null, 2));
