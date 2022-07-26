const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/noderest").catch((error) => handleError(error));

mongoose.Promise = global.Promise;

module.exports = mongoose;
