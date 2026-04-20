const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/books", require("./routes/books"));
app.use("/auth", require("./routes/auth"));
app.use("/loans", require("./routes/loans"));

app.listen(process.env.PORT, () => {
  console.log("Server działa na porcie " + process.env.PORT);
});