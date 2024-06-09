const mysql = require('mysql2');

const pool = mysql.createPool({
    host: '127.0.0.1',  // адрес вашего сервера базы данных
    user: 'root',       // имя пользователя базы данных
    password: '', // пароль пользователя базы данных
    database: 'courses' // имя базы данных
});

module.exports = pool.promise();
