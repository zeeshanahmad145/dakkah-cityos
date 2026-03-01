const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "tests", "unit", "admin-routes");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts"));

let count = 0;
files.forEach((f) => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, "utf8");
  let original = content;

  // The tests were manually restored via git checkout to have `expect(res.status).toHaveBeenCalledWith(500)`
  // We want to detect `mockRejectedValue(new Error("MESSAGE"))`
  // and map the accompanying 500 status block.
  content = content.replace(
    /mockRejectedValue\(new Error\("([^"]+)"\)\)([\s\S]*?)expect\(res\.status\)\.toHaveBeenCalledWith\(500\)(\s+expect\(res\.json\)\.toHaveBeenCalledWith\(\{ message: "([^"]+)" \}\))?/g,
    (match, errMsg, body, jsonExpect, jsonMsg) => {
      let newStatus = 500;
      let msgLower = errMsg.toLowerCase();

      if (
        msgLower.includes("validation") ||
        msgLower.includes("required") ||
        msgLower.includes("invalid")
      ) {
        newStatus = 400;
      } else if (msgLower.includes("not found")) {
        newStatus = 404;
      } else if (msgLower.includes("unauthorized")) {
        newStatus = 401;
      } else if (msgLower.includes("forbidden")) {
        newStatus = 403;
      }

      let res = match.replace(
        /toHaveBeenCalledWith\(500\)/,
        "toHaveBeenCalledWith(" + newStatus + ")",
      );

      if (jsonExpect && newStatus === 500) {
        res = res.replace(
          /expect\(res\.json\)\.toHaveBeenCalledWith\(\{ message: "([^"]+)" \}\)/,
          'expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "$1", message: expect.stringMatching(/failed$/) }))',
        );
      }
      return res;
    },
  );

  if (content !== original) {
    fs.writeFileSync(p, content);
    console.log(`Replaced in ${f}`);
    count++;
  }
});

console.log("Replaced error expectations in " + count + " files");
