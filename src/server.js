const express = require("express");
const bodyParser = require("body-parser");
const mockRoutes = require("./routes/mock-route");
const muzzleRoutes = require("./routes/muzzle-route");
const defineRoutes = require("./routes/define-route");

const app = express();
const PORT = process.env.PORT || 3000;
const muzzled = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(mockRoutes);
app.use(muzzleRoutes);
app.use(defineRoutes);

app.listen(PORT, e => {
  if (e) {
    console.error(e);
  } else {
    console.log("Successfully listening on port 3000");
  }
});

exports.muzzled = muzzled;
