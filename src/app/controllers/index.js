const fs = require('fs');
const path = require('path');
//Mapeia todas as controllers, na pasta controllers, (pasta atual), diferentes de aqruivos que começam com '.' e com nome 'index.js', e importam os modulos, enviando o app.
module.exports = app => {
    fs 
        .readdirSync(__dirname)
        .filter(file => ((file.indexOf('.')) !== 0 && (file !== "index.js")))
        .forEach( file => require(path.resolve(__dirname, file))(app));
}
