const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const authConfig = require('../../config/auth');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');


const router = express.Router();

function generateToken(params = {}){
    return jwt.sign(params,authConfig.secret, {
        expiresIn: 86400,
    });
}

router.post('/register', async (req, res) => {
    const {email} = req.body;

    try {
        if( await User.findOne({email}))
            return res.status(400).send({error: 'User already exists'});

        const user = await User.create(req.body);
        user.password = undefined;
        return res.send({ 
            user,
            token: generateToken({id: user.id})
         });
    }catch(err){
        return res.status(400).send({error: 'Registration failed: ' + err});
    }
});

router.post('/authenticate', async (req,res) => {
    
    const { email, password} = req.body;
    const user = await User.findOne({email}).select('+password');

    if(!user)
        return res.status(400).send({error: 'User not found'});


    if(!await bcrypt.compare(password, user.password))
        return res.status(400).send({error: 'Invalid password'});
    
    user.password = undefined;

    return res.send({
        user,
        token: generateToken({id: user.id})
    });
})

router.post('/forgotPassword', async (req, res) => {
    const {email} = req.body;

    try {
        //Porcura pelo usuario enviado na requisição no banco de dados.
        const user = await User.findOne({email});

        //Retorna false se nenhum usuario foi encontrado.
        if(!user)
            return res.status(400).send({error: 'User not found.'});

        //Cria um token com 20 bytes randomicos em hexadecimal, para enviar no email e servir de verificação na recuperação da sennha.
        const token = crypto.randomBytes(20).toString('hex');
        
        //Data atual + 1 hora.
        const now = new Date();
        now.setHours(now.getHours() + 1);

        //Procura um usuario com o id do usuario encontrado anteriormente no banco, e atribui o token e o tempo de expiração do token.
        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now,
            }
        })

        //Envia um email utilizando o mailer.
        mailer.sendMail({
            to: email,//Destinatário.
            from: 'eliezer@hotmail.com', //Remetente.
            template:'auth/forgotPassword', //Local do arquivo de template que chegara no email destino.
            context: {token} //VariÁvel enviada para o template no forgotPassword.html.
        }, (err) => { //Callback de erro do nodemailer.
            if(err)
                return res.status(400).send({error: `Cannot send forgot password email\tError: ${err}`});
            return res.send();
        })
    }catch(err) {//Erro da Rota.
        return res.status(400).send({error: `Errror on forgot password, try again. \tError: ${err}`})
    }
});

router.post('/resetPassword', async (req,res) => {
    const {email, token, password} = req.body;

    try {

        //Procura por um usuario no banco com o email informado na requisição.
        const user = await User.findOne({email}).select('+passwordResetToken passwordResetExpires');
        //Código 400, caso usuaro não encontrado.
        if(!user)
            return res.status(400).send({error: 'User not found.'});
        //Código 400, caso o token não é o mesmo do recuperado no banco.
        if(token !== user.passwordResetToken)
            return res.status(400).send({error: 'Token Invalid.'});
        //Data atual.
        const now = new Date();
        //Código 400, caso a data atual seja maior que a data de expiração do token (token expirado).
        if(now > user.passwordResetExpires)
            return res.status(400).send({error: 'Token expired, try again with a new token.'});
        //Atualiza a senha.
        user.password = password;
        //Salva a senha no banco.
        await user.save();
        //Fim da rota da aplicação.
        res.send();
    }catch(err) { //Erro na Rota.
        res.status(400).send({error: `Cannot reset password, try again.\tError: ${err}`});
    }
})

module.exports = app => app.use('/auth', router);