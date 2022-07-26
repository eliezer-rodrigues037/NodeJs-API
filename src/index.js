const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Importa todas as controllers.
require("./app/controllers/index.js")(app);

app.listen(3000, function () {
    console.log("Api started.");
});
