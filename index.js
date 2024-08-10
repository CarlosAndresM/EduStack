const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto'); // Para generar el código de verificación
const { connect } = require('http2');
const { Console } = require('console');
require('dotenv').config();

const port = process.env.PORT || 3000;


app.use(cookieParser());
const SECRET_KEY = process.env.SECRET_KEY

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// Configurar nodemailer (CONFIGURACION TEMPORAL YA QUE DEBE SER UN CORREO DE PROVEEDOR )
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})


// Funcion para generar un codigo de verificacion aleatorio

function generateVerificationCode() { 
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // Código de 6 caracteres
}


// Conectar a MySQL
connection.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar a MySQL: ' + err.stack);
        return;
    }
    console.log('Conexión establecida con MySQL');
    connection.release(); // Liberar la conexión de vuelta al pool
});

// Middleware para parsear application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));


// Rutas de la aplicación
app.use(express.json());


app.set('view engine', 'ejs')

// Middleware para servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));



app.use(bodyParser.json());


const authenticateToken = (req, res, next) => {
    const token = req.cookies.auth_token; // Obtener el token de las cookies

    if (token) {
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                // Token inválido o expirado
                return res.redirect('/login'); // Redirigir al login si el token no es válido
            }
            // Token válido
            req.user = user;
            next(); // Continuar a la siguiente función para manejar la solicitud
        });
    } else {
        // No hay token
        return res.redirect('/login'); // Redirigir al login si no hay token
    }
};



// Ruta protegida que requiere autenticación
app.get('/protected', authenticateToken, (req, res) => {
    res.status(200).json({message: 'Acceso a ruta protegida permitido.', user: req.user});
});

// Usa este middleware para rutas que requieren autenticación
app.get('/home', authenticateToken, (req, res) => {
    res.render('home', { user: req.user });
});

// Ruta para servir la vista de login
app.get('/', (req, res) => {
    res.render('login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('registro');
});


// Ruta dinamica para manejar los perfiles de usuario
app.get('/:username', authenticateToken, (req, res) => {
    const username = req.params.username;
  
    console.log('Nombre de usuario recibido:', username);
  
    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
      if (err) {
        console.error('Error en la consulta SQL:', err);
        return res.status(500).send('Error en la base de datos');
      }
  
      if (result.length === 0) {
        return res.status(404).send('El usuario no existe');
      }
  
      console.log('Resultado de la consulta obtenido correctamente de ', username );
  
      const user  =  result[0];
      if (req.user.username === username) { 
        res.render('profile', { user }); // Mostrar perfil completo si es el usuario autenticado
      } else {  
      const userActual = req.user
  
        res.render('publicProfile', { user, userActual }); // Mostrar el perfil limitado si es otro usuario
      }
    });
  });
 
// Ruta para manejar la solicitud de categorías educativas
app.post('/educational_levels', (req, res) => {
    connection.query('SELECT id, nombre FROM educational_levels', (err, result) => {
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



// Ruta para el cierre de sesión y el registro de la ultima conexion para el respectivo usuario
app.post('/logout', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(400).json({ message: 'No se proporcionó el token de autenticación.' });
    }

    // Verificar el token y extraer el id del usuario
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error('Token inválido:', err);
            return res.status(403).json({ message: 'Token inválido.' });
        }

        const { id } = decoded;

        // Registrar la última conexión
        connection.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id], (err, result) => {
            if (err) {
                console.error('Error al registrar la última conexión del usuario:', err.stack);
                // Eliminar la cookie de autenticación y redireccionar al login, incluso si hay un error
                res.cookie('auth_token', '', { httpOnly: true, expires: new Date(0) });
                return res.status(500).json({ message: 'Error interno al registrar la última conexión.' });
            }

            console.log('Última conexión registrada correctamente.');

            // Eliminar la cookie de autenticación y redireccionar al login
            res.cookie('auth_token', '', { httpOnly: true, expires: new Date(0) });
            res.status(200).json({ message: 'Cierre de sesión exitoso' });
        });
    });
});



// Iniciar sesion
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log('Validando datos de inicio de sesión:');
    
    if (!username || !password) {
        return res.status(400).json({ message: 'Por favor, complete todos los campos obligatorios.' });
    }

    connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
        console.log('Ejecutando consulta para ese usuario');
        if (err) {
            console.error('Error al consultar en la base de datos al momento de buscar el usuario: ' + err.stack);
            return res.status(500).send('Error interno al buscar el usuario.');
        }
        if (result.length === 0) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrecta' });
        }

        const user = result[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrecta' });
        }

        // Generar un token JWT
        const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
 

        // Establecer el token en una cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000,
            sameSite: 'Strict'
        });

        return res.status(200).json({ message: 'Inicio de sesión exitoso' });
    });
});





// Función para enviar el correo electrónico de verificación
function sendVerificationEmail(email, firstName, lastName, verificationCode) {
   
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
        
                                    <p>Hola ${firstName} ${lastName},</p>
                                    <p>Para completar tu registro, por favor ingresa el siguiente código de verificación:</p>
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
            console.error('Error al enviar el correo electrónico:', error);
        } else {
            console.log('Correo electrónico enviado:', info.response);
        }
    });
}




// Función para enviar el correo electrónico de verificación cuando exte ya a expirado
function sendVerificationEmailExpired(email, firstName, lastName, verificationCode) {
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

                <p>Hola ${firstName} ${lastName},</p>
                <p>El código de verificación ha expirado. Para completar tu registro, por favor ingresa el siguiente código de verificación:</p>
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
            console.error('Error al enviar el correo electrónico:', error);
        } else {
            console.log('Correo electrónico enviado:', info.response);
        }
    });
}

// Ruta para el registro de usuarios
app.post('/registro', async (req, res) => {
    const { email, password, first_name, last_name, phone, username, educational_level_id, agreed_terms, promotional_offers } = req.body;
    console.log('validando informacion de cuenta: ', req.body)

    if (!email || !password || !first_name || !last_name || !phone || !username || !educational_level_id) {
        return res.status(400).json({ message: 'Por favor, complete todos los campos obligatorios.' });
    }

    console.log('VALIDANDO LOS DATOS DEL REGISTRO: ', req.body);

    // Verificar si el correo electrónico o el nombre de usuario ya están registrados en la tabla de usuarios
    connection.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ message: 'Error al verificar el correo electrónico o nombre de usuario.' });
        }

        if (results.length > 0) {
            if (results.some(user => user.email === email)) {
                return res.status(400).json({ message: 'Este correo electrónico ya está registrado. Por favor, inicie sesión.' });
            }
            if (results.some(user => user.username === username)) {
                return res.status(400).json({ message: 'Este nombre de usuario ya está en uso. Prueba con otro.' });
            }
        } else {
            // Verificar si el correo electrónico ya está registrado en la tabla de usuarios temporales
            connection.query('SELECT * FROM users_temp WHERE email = ?', [email], async (err, tempResults) => {
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
                        const updateQuery = 'UPDATE users_temp SET verification_code = ?, created_at = CURRENT_TIMESTAMP WHERE email = ?';
                        connection.query(updateQuery, [newVerificationCode, email], (err, updateResult) => {
                            if (err) {
                                console.error('Error al actualizar el código de verificación en la base de datos:', err);
                                return res.status(500).json({ message: 'Error al actualizar el código de verificación.' });
                            }

                            // Enviar correo electrónico con el nuevo código de verificación
                            sendVerificationEmailExpired(email, first_name, last_name, newVerificationCode);

                            return res.status(200).json({ showModal: true });
                        });
                    }
                } else {
                    // Usuario no encontrado en usuarios_temporales, crear uno nuevo
                    const verificationCode = generateVerificationCode();
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const insertQuery = 'INSERT INTO users_temp (email, password, first_name, last_name, phone, username, educational_level_id, agreed_terms, promotional_offers, verification_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
                    connection.query(insertQuery, [email, hashedPassword, first_name, last_name, phone, username, educational_level_id, agreed_terms, promotional_offers, verificationCode], (err, insertResult) => {
                        if (err) {
                            console.error('Error al insertar usuario temporal en la base de datos:', err);
                            return res.status(500).json({ message: 'Error al registrar el usuario temporal.' });
                        }

                        // Enviar correo electrónico con el código de verificación
                        sendVerificationEmail(email, first_name, last_name, verificationCode);

                        return res.status(200).json({ showModal: true });
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
    connection.query('SELECT * FROM users_temp WHERE verification_code = ? AND email = ?', [verificationCode, verificacionEmail], (err, results) => {
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
            const updateQuery = 'UPDATE users_temp SET verification_code = ?, created_at = CURRENT_TIMESTAMP WHERE email = ?';
            connection.query(updateQuery, [newVerificationCode, usuarioTemporal.email], (err, updateResult) => {
                if (err) {
                    console.error('Error al actualizar el código de verificación en la base de datos:', err);
                    return res.status(500).json({ message: 'Error al actualizar el código de verificación.' });
                }

                // Enviar correo electrónico con el nuevo código de verificación
                sendVerificationEmailExpired(usuarioTemporal.email, usuarioTemporal.first_name, usuarioTemporal.last_name, newVerificationCode);

                return res.status(200).json({ message: 'Nuevo código de verificación generado.', type: 'expiracionDeCodigo' });
            });
        } else {
            // El código de verificación es válido, proceder con el registro
            const insertQuery = `

              INSERT INTO users (
                email, password, first_name, last_name, phone, username, educational_level_id, agreed_terms, promotional_offers, profile_picture_url
              ) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
            `;
            const { email, password, first_name, last_name, phone, username, educational_level_id, agreed_terms, promotional_offers } = usuarioTemporal;
            connection.query(insertQuery, [email, password, first_name, last_name, phone, username, educational_level_id, agreed_terms, promotional_offers, username], (err, insertResult) => {
                if (err) {
                    console.error('Error al insertar usuario en la base de datos:', err);
                    return res.status(500).json({ message: 'Error al completar el registro.' });
                }

                // Eliminar el usuario temporal de la base de datos
                const deleteQuery = 'DELETE FROM users_temp WHERE id = ?';
                connection.query(deleteQuery, [usuarioTemporal.id], (err, deleteResult) => {
                    if (err) {
                        console.error('Error al eliminar el usuario temporal de la base de datos:', err);
                        return res.status(500).json({ message: 'Error al limpiar los datos temporales.' });
                    }

                    return res.status(200).json({ message: 'Registro completado con éxito.' });
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