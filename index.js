// Requiriendo las dependencias necesarias
var express = require('express');
var cors = require('cors');
const { createConnection } = require('mysql2');
var mysql = require('mysql2');
var path = require('path');

// Crear una instancia de la aplicación Express
var app = express();

// Usar CORS para permitir solicitudes desde el puerto 5500 (o el origen de tu frontend)
app.use(cors({
    origin: 'http://127.0.0.1:5502', // Aquí puedes ajustar esto al origen de tu frontend
}));

// Middlewares para la configuración básica de Express
app.use(express.json()); // Para parsear JSON en las solicitudes
app.use(express.urlencoded({ extended: false })); // Para parsear formularios

// Configurar la conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Usa el usuario que tengas configurado en MySQL
    password: 'coldwinter.123', // Usa la contraseña que tengas configurada en MySQL
    database: 'todo_list' // Nombre de la base de datos a la que deseas conectarte
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error de conexión a la base de datos: ', err);
        return;
    }
    console.log('Conexión a la base de datos establecida');
});

// Ruta para el login
app.post('/login', (req, res) => {
    const { nombre, contraseña } = req.body;

    if (!nombre || !contraseña) {
        return res.status(400).json({ error: 'Nombre y contraseña son obligatorios' });
    }

    // Consulta para verificar las credenciales
    const query = 'SELECT * FROM usuarios WHERE nombre = ? AND contraseña = ?';
    db.query(query, [nombre, contraseña], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta: ', err);
            return res.status(500).json({ error: 'Error en la consulta' });
        }

        if (results.length > 0) {
            // Si el usuario existe, devolver éxito
            res.status(200).json({ message: 'Login exitoso', usuario: results[0] });
        } else {
            // Si el usuario no existe, devolver error
            res.status(401).json({ error: 'Credenciales incorrectas' });
        }
    });
});

// Ruta para el registro (signup)
app.post('/signup', (req, res) => {
    const { nombre, contraseña, correo } = req.body;

    if (!nombre || !contraseña || !correo) {
        return res.status(400).json({ error: 'Nombre, contraseña y correo son obligatorios' });
    }

    // Consulta para verificar si el usuario ya existe
    const checkQuery = 'SELECT * FROM usuarios WHERE nombre = ? OR correo = ?';
    db.query(checkQuery, [nombre, correo], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta: ', err);
            return res.status(500).json({ error: 'Error en la consulta' });
        }

        if (results.length > 0) {
            // Si el usuario ya existe, devolver error
            return res.status(409).json({ error: 'El usuario o correo ya está registrado' });
        }

        // Si el usuario no existe, insertarlo en la base de datos
        const insertQuery = 'INSERT INTO usuarios (nombre, contraseña, correo) VALUES (?, ?, ?)';
        db.query(insertQuery, [nombre, contraseña, correo], (err, result) => {
            if (err) {
                console.error('Error al insertar el usuario: ', err);
                return res.status(500).json({ error: 'Error al registrar el usuario' });
            }

            // Devolver éxito
            res.status(201).json({ message: 'Usuario registrado exitosamente', id: result.insertId });
        });
    });
});

// Ruta para obtener las tareas de un usuario
app.get('/tareas/:usuario_id', (req, res) => {
    const usuario_id = req.params.usuario_id;

    // Consulta para obtener las tareas del usuario
    const query = 'SELECT * FROM tarea WHERE usuario_id = ?';
    db.query(query, [usuario_id], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta: ', err);
            return res.status(500).json({ error: 'Error en la consulta' });
        }

        // Enviar los resultados de la consulta como respuesta en formato JSON
        res.json(results);
    });
});

// Ruta para agregar una nueva tarea
app.post('/tareas', (req, res) => {
    const { nombre, estado, usuario_id } = req.body;

    if (!nombre || !estado || !usuario_id) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Consulta para insertar la nueva tarea
    const query = 'INSERT INTO tarea (nombre, estado, usuario_id) VALUES (?, ?, ?)';
    db.query(query, [nombre, estado, usuario_id], (err, result) => {
        if (err) {
            console.error('Error al insertar la tarea: ', err);
            return res.status(500).json({ error: 'Error al guardar la tarea' });
        }

        // Devolver la tarea creada
        res.status(201).json({ id: result.insertId, nombre, estado, usuario_id });
    });
});

// Ruta para actualizar una tarea
app.put('/tareas/:id', (req, res) => {
    const tarea_id = req.params.id;
    const { estado } = req.body;

    if (!estado) {
        return res.status(400).json({ error: 'El estado es obligatorio' });
    }

    // Consulta para actualizar la tarea
    const query = 'UPDATE tarea SET estado = ? WHERE id = ?';
    db.query(query, [estado, tarea_id], (err, result) => {
        if (err) {
            console.error('Error al actualizar la tarea: ', err);
            return res.status(500).json({ error: 'Error al actualizar la tarea' });
        }

        // Devolver éxito
        res.status(200).json({ message: 'Tarea actualizada exitosamente' });
    });
});

// Ruta para eliminar una tarea
app.delete('/tareas/:id', (req, res) => {
    const tarea_id = req.params.id;

    // Consulta para eliminar la tarea
    const query = 'DELETE FROM tarea WHERE id = ?';
    db.query(query, [tarea_id], (err, result) => {
        if (err) {
            console.error('Error al eliminar la tarea: ', err);
            return res.status(500).json({ error: 'Error al eliminar la tarea' });
        }

        // Devolver éxito
        res.status(200).json({ message: 'Tarea eliminada exitosamente' });
    });
});

// Configurar el puerto en el que se escucharán las solicitudes
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

module.exports = app;