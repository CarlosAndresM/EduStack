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

// Middleware para servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());

// Ruta para servir el archivo login.html ( 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});



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



// Endpoint para registrar un nuevo usuario y enviar correo de verificación
app.post('/registro', (req, res) => {
    const { email, password, first_name, last_name, phone, userName, agreed_terms, promotional_offers, educational_level_id } = req.body;

    console.log('Inicio del proceso de registro.');
    console.log('Datos recibidos del cliente:', req.body);

    // Validar que todos los campos necesarios están presentes
    if (!email || !password || !first_name || !last_name || !phone || !userName || agreed_terms === undefined || promotional_offers === undefined || !educational_level_id) {
        let camposFaltantes = [];
        if (!email) camposFaltantes.push('correo electrónico');
        if (!password) camposFaltantes.push('contraseña');
        if (!first_name) camposFaltantes.push('nombre');
        if (!last_name) camposFaltantes.push('apellido');
        if (!phone) camposFaltantes.push('teléfono');
        if (!userName) camposFaltantes.push('nombre de usuario');
        if (agreed_terms === undefined) camposFaltantes.push('aceptar términos y condiciones');
        if (promotional_offers === undefined) camposFaltantes.push('aceptar ofertas promocionales');
        if (!educational_level_id) camposFaltantes.push('nivel educativo');

        console.log('Faltan campos obligatorios en el formulario: ', camposFaltantes.join(', '));
        return res.status(400).send('Por favor completa todos los campos y acepta los términos y condiciones.');
    }

    // Verificar si el usuario ya existe en la tabla usuarios
    connection.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error al verificar nombre de usuario:', err);
            return res.status(500).send('Error interno al verificar nombre de usuario.');
        }

        if (results.length > 0) {
            const mensaje = 'Este usuario ya se encuentra registrado, inicie sesión.';
            console.log(mensaje);
            return res.json({ mensaje: mensaje, userExisten: true });
        }

        // Verificar si hay un registro en usuarios_temporales para este correo electrónico
        connection.query('SELECT * FROM usuarios_temporales WHERE email = ?', [email], (err, tempResults) => {
            if (err) {
                console.error('Error al verificar correo electrónico:', err);
                return res.status(500).send('Error interno al registrar usuario.');
            }

            if (tempResults.length > 0) {
                const existingUser = tempResults[0];

                // Verificar si los datos son distintos a los que se intentan registrar ahora
                if (existingUser.first_name !== first_name ||
                    existingUser.last_name !== last_name ||
                    existingUser.phone !== phone ||
                    existingUser.userName !== userName ||
                    existingUser.educational_level_id !== educational_level_id ||
                    existingUser.agreed_terms !== agreed_terms ||
                    existingUser.promotional_offers !== promotional_offers) {
                    const mensaje = `Registro en proceso, algunos datos son distintos a como los ingresó anteriormente. Podrá revisarlos y cambiarlos en "Mi Cuenta".`;
                    console.log(mensaje);
                    return res.status(200).send({ message: 'modal', mensaje: mensaje });
                }

                const mensaje = `Ya hay un proceso de registro en curso para este correo electrónico. Los datos ingresados son iguales a los registrados anteriormente. Puedes revisar tus datos en Mi Cuenta al finalizar.`;
                console.log(mensaje);
                return res.status(200).send({ message: 'modal', mensaje: mensaje });
            }

            // Generar código de verificación
            const verificationCode = generateVerificationCode();

            // Guardar usuario y código de verificación en la tabla temporal
            const insertSql = 'INSERT INTO usuarios_temporales (email, password, first_name, last_name, phone, userName, educational_level_id, agreed_terms, promotional_offers, verification_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
            const insertValues = [email,password, first_name, last_name, phone, userName, educational_level_id, agreed_terms? 1 : 0, promotional_offers? 1 : 0, verificationCode];

            connection.query(insertSql, insertValues, (err, result) => {
                if (err) {
                    console.error('Error al guardar usuario temporal:', err);
                    return res.status(500).send('Error interno al registrar usuario.');
                }

                console.log('Usuario temporal registrado correctamente.');

                // Configurar el correo electrónico
                const mailOptions = {
                    from: 'carlosandresmunoza3@example.com',
                    to: email,
                    subject: 'Confirmación de Registro',
                    html: `
                        <p>Hola ${first_name} ${last_name},</p>
                        <p>Gracias por registrarte. Para completar tu registro, por favor ingresa el siguiente código de verificación:</p>
                        <h3>${verificationCode}</h3>
                        <p>Este código es válido por 10 minutos.</p>
                        <p>Atentamente,</p>
                        <p>EduStack</p>
                    `
                };

                // Enviar el correo electrónico
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error al enviar el correo electrónico de verificación:', error);
                        return res.status(500).send('Error al enviar el correo electrónico de verificación.');
                    }

                    console.log('Correo electrónico de verificación enviado:', info.response);
                    return res.status(200).send({ message: 'modal', showModal: true });
                });
            });
        });
    });
});



// Endpoint para confirmar la cuenta del usuario con el código de verificación 
app.post('/confirmar-cuenta', (req, res) => {
    const { email, verificationCode } = req.body;


    console.log('Inicio de la confirmación de cuenta.');
    console.log('Datos recibidos del cliente:', req.body);

    

    // Verificar el código de verificación y que no haya expirado
    connection.query('SELECT * FROM usuarios_temporales WHERE email =? AND verification_code =? AND created_at >= NOW() - INTERVAL 10 MINUTE', [email, verificationCode], (err, results) => {
        if (err) {
            console.error('Error al verificar código de verificación:', err);
            return res.status(500).json({ error: 'Error interno al verificar código de verificación.' });
        }

        if (results.length === 0) {
            if (err.code === 'ER_EXPIRED_CODE') {
                console.log('Código de verificación ha expirado. Se ha generado un nuevo código.');
                return res.status(400).json({ error: 'Código de verificación ha expirado. Se ha generado un nuevo código.' });
            } else {
                console.log('Correo electrónico o código de verificación incorrecto.');
                return res.status(400).json({ error: 'Correo electrónico o código de verificación incorrecto.' });
            }
        }

        const user = results[0];

        // Insertar usuario en la tabla final de usuarios
        const insertSql = 'INSERT INTO usuarios (email, password, first_name, last_name, phone, userName, educational_level_id, agreed_terms, promotional_offers) VALUES (?,?,?,?,?,?,?,?,?)';
        const insertValues = [user.email, user.password, user.first_name, user.last_name, user.phone, user.userName, user.educational_level_id, user.agreed_terms, user.promotional_offers];

        connection.query(insertSql, insertValues, (err, result) => {
            if (err) {
                console.error('Error al registrar usuario:', err);
                return res.status(500).json({ error: 'Error interno al registrar usuario.' });
            }

            console.log('Usuario registrado correctamente.');

            // Eliminar usuario de la tabla temporal
            connection.query('DELETE FROM usuarios_temporales WHERE email =?', [email], (err, result) => {
                if (err) {
                    console.error('Error al eliminar usuario temporal:', err);
                    return res.status(500).json({ error: 'Error interno al completar el registro.' });
                }

                console.log('Usuario temporal eliminado correctamente.');

                // Enviar respuesta al cliente con un mensaje de confirmación
                res.status(200).json({ message: 'Registro completado correctamente.' });
            });
        });
    });
});


// Endpoint para solicitar un nuevo código de verificación
app.post('/solicitar-nuevo-codigo', (req, res) => {
    const { email } = req.body;

    console.log('Solicitando nuevo código de verificación para:', email);

    // Verificar si el usuario existe en la tabla temporal
    connection.query('SELECT * FROM usuarios_temporales WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error al verificar usuario:', err);
            return res.status(500).send('Error interno al solicitar nuevo código.');
        }

        if (results.length === 0) {
            console.log('Usuario no encontrado.');
            return res.status(404).send('Usuario no encontrado.');
        }

        const user = results[0];

        // Generar un nuevo código de verificación
        const verificationCode = generateVerificationCode();

        // Actualizar el código de verificación y el tiempo de expiración en la tabla temporal
        const updateSql = 'UPDATE usuarios_temporales SET verification_code = ?, created_at = NOW() WHERE email = ?';
        connection.query(updateSql, [verificationCode, email], (err, result) => {
            if (err) {
                console.error('Error al actualizar código de verificación:', err);
                return res.status(500).send('Error interno al solicitar nuevo código.');
            }

            console.log('Nuevo código de verificación generado:', verificationCode);

            // Configurar el tiempo de expiración para enviar al cliente
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10); // El código es válido por 10 minutos

            res.status(200).json({
                message: 'Nuevo código de verificación generado correctamente.',
                expiresAt: expiresAt
            });
        });
    });
});

// Manejador de errores para rutas no encontradas
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