const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
const {host, port, user, pass} = require('../config/mail'); //Arquivo com as configurações de autenticação

//Carrega no nodemailer as configurações no arquivo mail.json
const transport = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass}
});

//Configuração do nodemailer.
transport.use('compile', hbs({
    viewEngine: {
        extname: '.html', // handlebars extension
        layoutsDir: path.resolve('./src/resource/mail/auth'), // location of handlebars templates
        defaultLayout: 'forgotPassword', // name of main template
        partialsDir: path.resolve('./src/resource/mail/auth'), // location of your subtemplates aka. header, footer etc
    },
    viewPath: path.resolve('./src/resource/mail/'),
    extName: '.html',
}))

module.exports = transport;