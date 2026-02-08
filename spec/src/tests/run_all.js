const { runtime } = require("../src/index");
console.log("Test:", runtime({a:1}).status === "OK");
