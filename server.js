const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();
const port = process.env.PORT || 3000;

// Configuración de la conexión a MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'EduStack'
});


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

// Ruta para servir el archivo index.html (opcional)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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


app.post('/registro', (req, res) => {
    const { email, password, first_name, last_name, phone, company, agreed_terms, promotional_offers } = req.body;

    console.log('Datos recibidos:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('First Name:', first_name);
    console.log('Last Name:', last_name);
    console.log('Phone:', phone);
    console.log('Company:', company);
    console.log('Agreed Terms:', agreed_terms);
    console.log('Promotional Offers:', promotional_offers);

    // Validar que todos los campos necesarios están presentes
    if (!email || !password || !first_name || !last_name || !phone || !company || agreed_terms === undefined || promotional_offers === undefined) {
        return res.status(400).send('Por favor completa todos los campos y acepta los términos y condiciones.');
    }

    // Preparar consulta SQL para insertar un nuevo usuario
    const sql = 'INSERT INTO usuarios (email, password, first_name, last_name, phone, company, agreed_terms, promotional_offers) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [email, password, first_name, last_name, phone, company, agreed_terms ? 1 : 0, promotional_offers ? 1 : 0];

    // Ejecutar la consulta SQL
    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error al registrar usuario en la base de datos:', err);
            return res.status(500).send('Error interno al registrar usuario.');
        }

        console.log('Usuario registrado correctamente');
        res.status(200).send('Registro exitoso');
    });
});




// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});