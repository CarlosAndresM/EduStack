const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();
const port = process.env.PORT || 3000;
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Para generar el código de verificación

// Configuración de la conexión a MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'EduStack'
});

// Configurar nodemailer (CONFIGURACION TEMPORAL YA QUE DEBE SER UN CORREO DE PROVEEDOR )
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'carlosandresmunoza3@gmail.com',
        pass: 'ctxm rxwr jxiz ktcw'
    }
})


// Funcion para generar un codigo de verificacion aleatorio

function generateVerificationCode() { 
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // Código de 6 caracteres
}

// Conectar a MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a MySQL: ' + err.stack);
        return;
    }
    console.log('Conexión establecida con MySQL');
});

// Middleware para parsear application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));


// Rutas de la aplicación
app.use(express.json());

// Middleware para servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());

// Ruta para servir el archivo login.html ( 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
})


app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registro.html'));
})



// Ruta para manejar la solicitud de categorías educativas
app.post('/listaEducativa', (req, res) => {
    connection.query('SELECT id, nombre FROM niveles_educativos', (err, result) => {
        if (err) {
            console.error('Error al obtener las categorías escolares: ' + err.stack);
            return res.status(500).send('Error interno al obtener las categorías.');
        }

        res.json({
            message: 'Nivel educativo obtenido correctamente',
            categories: result
        });
    });
});




// Ruta para el registro de usuarios
app.post('/registro', (req, res) => {
    
    const { email, password, first_name, last_name, phone, userName, educational_level_id, agreed_terms, promotional_offers } = req.body;

        // Validar que todos los campos obligatorios estén llenos
        if (!email || !password || !first_name || !last_name || !phone || !userName || !educational_level_id) {
            return res.status(400).json({ message: 'Por favor, complete todos los campos obligatorios.' });
        }

    console.log('VALIDANDO LOS DATOS DEL REGISTRO: ', req.body);

    // Verificar si el correo electrónico ya está registrado en la tabla de usuarios
    connection.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ message: 'Error al verificar el correo electrónico.' });
        }

        if (results.length > 0) {
            if(results[0].userName === userName) {
                return res.status(400).json({message: 'Este nombre usuario ya esta en uso. Prueba con otro.'})
            }
            else{
        // Correo electrónico ya registrado
        return res.status(400).json({ message: 'Este correo electrónico ya está registrado. Por favor, inicie sesión.' });
            }
           
        } else {
            // Verificar si el correo electrónico ya está registrado en la tabla de usuarios temporales
            connection.query('SELECT * FROM usuarios_temporales WHERE email = ?', [email], (err, tempResults) => {
                if (err) {
                    console.error('Error al consultar la base de datos:', err);
                    return res.status(500).json({ message: 'Error al verificar el correo electrónico.' });
                }

                if (tempResults.length > 0) {
                    // Usuario temporal encontrado, verificar el código de verificación
                    const usuarioTemporal = tempResults[0];
                    const ahora = new Date();
                    const tiempoTranscurrido = ahora - usuarioTemporal.created_at;
                    const tiempoLimite = 5 * 60 * 1000; // 5 minutos en milisegundos

                    if (tiempoTranscurrido < tiempoLimite) {
                        // Mostrar modal de verificación con mensaje de recordatorio
                        return res.status(200).json({ showModal: true, message: 'Anteriormente se encontraba registrándose en la plataforma. Por favor, confirme el código de verificación y correo para continuar.' });
                    } else {
                        // El código de verificación ha expirado, generar uno nuevo y enviar correo
                        const newVerificationCode = generateVerificationCode();
                        const updateQuery = 'UPDATE usuarios_temporales SET verification_code = ?, created_at = CURRENT_TIMESTAMP WHERE email = ?';
                        connection.query(updateQuery, [newVerificationCode, email], (err, updateResult) => {
                            if (err) {
                                console.error('Error al actualizar el código de verificación en la base de datos:', err);
                                return res.status(500).json({ message: 'Error al actualizar el código de verificación.' });
                            }

                            // Enviar correo electrónico con el nuevo código de verificación
                            const mailOptions = {
                                from: 'carlosandresmunoza3@gmail.com',
                                to: email,
                                subject: 'Confirmación de Registro',
                                html: `

                                                            <!DOCTYPE html>
                            <html lang="en">
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Correo de Verificación</title>
                                <style>
                                    @keyframes snow {
                                        0% {
                                            opacity: 0;
                                            transform: translateY(0px);
                                        }

                                        20% {
                                            opacity: 1;
                                        }

                                        100% {
                                            opacity: 1;
                                            transform: translateY(650px);
                                        }
                                    }

                                    @keyframes astronaut {
                                        0% {
                                            transform: rotate(0deg);
                                        }

                                        100% {
                                            transform: rotate(360deg);
                                        }
                                    }

                                    .explora-conocimiento {
                                        box-sizing: border-box;
                                        display: flex; 
                                        border-radius: 5px;
                                        font-size: 12px;
                                        color: #ffffff;
                                        right: 0;
                                        bottom: 0;
                                        position: absolute;
                                        width: 200px;
                                        justify-content: center;
                                        align-items: center;
                                        gap: 10px;
                                        background-color: #333333;
                                    }

                                    .explora-conocimiento p {
                                        color: #f4f4f4;
                                    }

                                    body {
                                        margin: 20px;
                                        font-family: Arial, sans-serif;
                                        padding: 20px;
                                    }

                                    .container {
                                        max-width: 600px;
                                        margin: 0 auto; 
                                        background-color: #f4f4f4;

                                        padding: 20px;
                                        border-radius: 5px;
                                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                    }

                                    .logo {
                                        text-align: center;
                                        margin-bottom: 20px;
                                    }

                                    .logo img {
                                        max-width: 150px;
                                    }

                                    .message {
                                        position: relative;
                                        padding: 20px;
                                        border-radius: 5px;
                                    }

                                    h3 {
                                        color: #333333;
                                        font-size: 24px;
                                        margin-bottom: 10px;
                                    }

                                    p {
                                        color: #666666;
                                        font-size: 16px;
                                        line-height: 1.6;
                                    }

                                    .firma {
                                        font-family: cursive;
                                        font-size: 22px;
                                        color: #333333;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="logo">
                                        <h1 class="firma">EduStack</h1>

                                    </div>
                                    <div class="message">
        
                                    <p>Hola ${first_name} ${last_name},</p>
                                    <p>El código de verificación ha expirado. Para completar tu registro, por favor ingresa el siguiente código de verificación:</p>
                                    <h3>${newVerificationCode}</h3>
                                    <p>Este código es válido por 5 minutos.</p>
                                    <p>Atentamente,</p>
                                    <p class="firma">EduStack</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                                `
                            };

                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    console.error('Error al enviar el correo electrónico de verificación:', error);
                                    return res.status(500).json({ message: 'Error al enviar el correo electrónico de verificación.' });
                                }

                                console.log('Correo electrónico de verificación enviado:', info.response);
                                return res.status(200).json({ showModal: true });
                            });
                        });
                    }
                } else {
                    // Usuario no encontrado en usuarios_temporales, crear uno nuevo
                    const verificationCode = generateVerificationCode();
                    const insertQuery = 'INSERT INTO usuarios_temporales (email, password, first_name, last_name, phone, userName, educational_level_id, agreed_terms, promotional_offers, verification_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
                    connection.query(insertQuery, [email, password, first_name, last_name, phone, userName, educational_level_id, agreed_terms, promotional_offers, verificationCode], (err, insertResult) => {
                        if (err) {
                            console.error('Error al insertar usuario temporal en la base de datos:', err);
                            return res.status(500).json({ message: 'Error al registrar el usuario temporal.' });
                        }

                        // Enviar correo electrónico con el código de verificación
                        const mailOptions = {
                            from: 'carlosandresmunoza3@gmail.com',
                            to: email,
                            subject: 'Confirmación de Registro',
                            html: `
                                                    <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Correo de Verificación</title>
                            <style>
                                @keyframes snow {
                                    0% {
                                        opacity: 0;
                                        transform: translateY(0px);
                                    }

                                    20% {
                                        opacity: 1;
                                    }

                                    100% {
                                        opacity: 1;
                                        transform: translateY(650px);
                                    }
                                }

                                @keyframes astronaut {
                                    0% {
                                        transform: rotate(0deg);
                                    }

                                    100% {
                                        transform: rotate(360deg);
                                    }
                                }

                                .explora-conocimiento {
                                    box-sizing: border-box;
                                    display: flex; 
                                    border-radius: 5px;
                                    font-size: 12px;
                                    color: #ffffff;
                                    right: 0;
                                    bottom: 0;
                                    position: absolute;
                                    width: 200px;
                                    justify-content: center;
                                    align-items: center;
                                    gap: 10px;
                                    background-color: #333333;
                                }

                                .explora-conocimiento p {
                                    color: #f4f4f4;
                                }

                                body {
                                    margin: 20px;
                                    font-family: Arial, sans-serif;
                                    padding: 20px;
                                }

                                .container {
                                    max-width: 600px;
                                    margin: 0 auto; 
                                    background-color: #f4f4f4;

                                    padding: 20px;
                                    border-radius: 5px;
                                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                }

                                .logo {
                                    text-align: center;
                                    margin-bottom: 20px;
                                }

                                .logo img {
                                    max-width: 150px;
                                }

                                .message {
                                    position: relative;
                                    padding: 20px;
                                    border-radius: 5px;
                                }

                                h3 {
                                    color: #333333;
                                    font-size: 24px;
                                    margin-bottom: 10px;
                                }

                                p {
                                    color: #666666;
                                    font-size: 16px;
                                    line-height: 1.6;
                                }

                                .firma {
                                    font-family: cursive;
                                    font-size: 22px;
                                    color: #333333;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="logo">
                                    <h1 class="firma">EduStack</h1>

                                </div>
                                <div class="message">
                                 <p>Hola ${first_name} ${last_name},</p>
                                <p>Gracias por registrarte. Para completar tu registro, por favor ingresa el siguiente código de verificación:</p>
                                <h3>${verificationCode}</h3>
                                <p>Este código es válido por 5 minutos.</p>
                                <p>Atentamente,</p>
                                <p class="firma">EduStack</p>
                                </div>
                            </div>
                        </body>
                        </html>

                            
                               
                            `
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.error('Error al enviar el correo electrónico de verificación:', error);
                                return res.status(500).json({ message: 'Error al enviar el correo electrónico de verificación.' });
                            }

                            console.log('Correo electrónico de verificación enviado:', info.response);
                            return res.status(200).json({ showModal: true });
                        });
                    });
                }
            });
        }
    });
});



// Ruta para verificar el código de verificación y completar el registro del usuario
app.post('/verificar-codigo', (req, res) => {
    const { verificationCode, verificacionEmail } = req.body;

    // Buscar el usuario temporal por el código de verificación y correo electrónico
    connection.query('SELECT * FROM usuarios_temporales WHERE verification_code = ? AND email = ?', [verificationCode, verificacionEmail], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ message: 'Error al verificar el código de verificación.' });
        }

        if (results.length === 0) {
            // Código de verificación no encontrado para el correo proporcionado
            return res.status(400).json({ message: 'Código de verificación o el correo proporcionado erroneo, corrija e intente nuevamente.', type: 'correoErroneo' });
        }
        
        const usuarioTemporal = results[0];
        const ahora = new Date();
        const tiempoTranscurrido = ahora - new Date(usuarioTemporal.created_at);
        const tiempoLimite = 5 * 60 * 1000; // 5 minutos en milisegundos

        if (tiempoTranscurrido > tiempoLimite) {
            // Código de verificación expirado, generar uno nuevo y enviar correo
            const newVerificationCode = generateVerificationCode();
            const updateQuery = 'UPDATE usuarios_temporales SET verification_code = ?, created_at = CURRENT_TIMESTAMP WHERE email = ?';
            connection.query(updateQuery, [newVerificationCode, usuarioTemporal.email], (err, updateResult) => {
                if (err) {
                    console.error('Error al actualizar el código de verificación en la base de datos:', err);
                    return res.status(500).json({ message: 'Error al actualizar el código de verificación.' });
                }

                // Enviar correo electrónico con el nuevo código de verificación
                const mailOptions = {
                    from: 'carlosandresmunoza3@gmail.com',
                    to: usuarioTemporal.email,
                    subject: 'Nuevo Código de Verificación',
                    html: `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Correo de Verificación</title>
                            <style>
                                @keyframes snow {
                                    0% {
                                        opacity: 0;
                                        transform: translateY(0px);
                                    }

                                    20% {
                                        opacity: 1;
                                    }

                                    100% {
                                        opacity: 1;
                                        transform: translateY(650px);
                                    }
                                }

                                @keyframes astronaut {
                                    0% {
                                        transform: rotate(0deg);
                                    }

                                    100% {
                                        transform: rotate(360deg);
                                    }
                                }

                                .explora-conocimiento {
                                    box-sizing: border-box;
                                    display: flex; 
                                    border-radius: 5px;
                                    font-size: 12px;
                                    color: #ffffff;
                                    right: 0;
                                    bottom: 0;
                                    position: absolute;
                                    width: 200px;
                                    justify-content: center;
                                    align-items: center;
                                    gap: 10px;
                                    background-color: #333333;
                                }

                                .explora-conocimiento p {
                                    color: #f4f4f4;
                                }

                                body {
                                    margin: 20px;
                                    font-family: Arial, sans-serif;
                                    padding: 20px;
                                }

                                .container {
                                    max-width: 600px;
                                    margin: 0 auto; 
                                    background-color: #f4f4f4;

                                    padding: 20px;
                                    border-radius: 5px;
                                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                }

                                .logo {
                                    text-align: center;
                                    margin-bottom: 20px;
                                }

                                .logo img {
                                    max-width: 150px;
                                }

                                .message {
                                    position: relative;
                                    padding: 20px;
                                    border-radius: 5px;
                                }

                                h3 {
                                    color: #333333;
                                    font-size: 24px;
                                    margin-bottom: 10px;
                                }

                                p {
                                    color: #666666;
                                    font-size: 16px;
                                    line-height: 1.6;
                                }

                                .firma {
                                    font-family: cursive;
                                    font-size: 22px;
                                    color: #333333;
                                }
                            </style>

                        </head>
                        <body>
                            <p>Hola ${usuarioTemporal.first_name} ${usuarioTemporal.last_name},</p>
                            <p>El código de verificación anterior ha expirado. Aquí tienes uno nuevo:</p>
                            <h3>${newVerificationCode}</h3>
                            <p>Este código es válido por 5 minutos.</p>
                            <p>Atentamente,</p>
                            <p>EduStack</p>
                        </body>
                        </html>
                    `
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error al enviar el correo electrónico de verificación:', error);
                        return res.status(500).json({ message: 'Error al enviar el correo electrónico de verificación.' });
                    }

                    console.log('Correo electrónico de verificación enviado:', info.response);
                    return res.status(200).json({ message: 'Nuevo código de verificación generado.', type: 'expiracionDeCodigo' });
                });
            });
        } else {
            // El código de verificación es válido, proceder con el registro
            const insertQuery = `
                INSERT INTO usuarios (email, password, first_name, last_name, phone, userName, educational_level_id, agreed_terms, promotional_offers, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            const { email, password, first_name, last_name, phone, userName, educational_level_id, agreed_terms, promotional_offers } = usuarioTemporal;
            connection.query(insertQuery, [email, password, first_name, last_name, phone, userName, educational_level_id, agreed_terms, promotional_offers], (err, insertResult) => {
                if (err) {
                    console.error('Error al insertar usuario en la base de datos:', err);
                    return res.status(500).json({ message: 'Error al completar el registro.' });
                }

                // Eliminar el usuario temporal de la base de datos
                const deleteQuery = 'DELETE FROM usuarios_temporales WHERE id = ?';
                connection.query(deleteQuery, [usuarioTemporal.id], (err, deleteResult) => {
                    if (err) {
                        console.error('Error al eliminar usuario temporal de la base de datos:', err);
                        return res.status(500).json({ message: 'Error al completar el registro.' });
                    }

                    return res.status(200).json({ message: 'Registro completado correctamente.' });
                });
            });
        }
    });
});



app.use((req, res, next) => {
    res.status(404).send("Página no encontrada");
});

// Middleware de error genérico
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error interno del servidor');
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});