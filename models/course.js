// Импортируем необходимые модули для генерации уникальных идентификаторов, работы с путями файлов и файловой системой, а также для работы с базой данных.
const {v4: uuid} = require("uuid"); // Подключаем функцию v4 из пакета uuid, которая генерирует уникальный идентификатор (UUID).} = require("uuid");
const path = require("path"); // Подключаем модуль path для работы с путями файлов.
const fs = require("fs"); // Подключаем модуль fs для работы с файловой системой.
const db = require("../data/db"); // Подключаем модуль для работы с базой данных.

// Создаем класс Course для представления курса.
class Course {
    // Конструктор класса Course, принимающий заголовок, цену и изображение курса.
    constructor(title, price, img) {
        this.title = title; // Записываем заголовок курса.
        this.price = price; // Записываем цену курса.
        this.img = img; // Записываем изображение курса.
        this.id = uuid(); // Генерируем уникальный идентификатор для курса.
    }

    // Асинхронный метод для сохранения курса в базе данных.
    async save() {
        const sql = 'INSERT INTO courses (id, title, price, img) VALUES (?, ?, ?, ?)'; // SQL запрос для вставки курса в базу данных.
        const values = [this.id, this.title, this.price, this.img]; // Параметры для SQL запроса.

        try {
            await db.execute(sql, values); // Выполняем SQL запрос к базе данных для сохранения курса.
        } catch (err) {
            console.error(err); // В случае ошибки выводим ее в консоль.
        }
    }

    // Статический асинхронный метод для обновления информации о курсе в базе данных.
    static async update(course) {
        const sql = 'UPDATE courses SET title = ?, price = ?, img = ? WHERE id = ?'; // SQL запрос для обновления информации о курсе в базе данных.
        const values = [course.title, course.price, course.img, course.id]; // Параметры для SQL запроса.

        try {
            await db.execute(sql, values); // Выполняем SQL запрос к базе данных для обновления информации о курсе.
        } catch (err) {
            console.error(err); // В случае ошибки выводим ее в консоль.
        }
    }

    // Статический асинхронный метод для получения всех курсов из базы данных.
    static async getAll() {
        const sql = 'SELECT * FROM courses'; // SQL запрос для выборки всех курсов из базы данных.

        try { // Метод await используется для ожидания завершения выполнения асинхронного запроса к базе данных.
            const [rows, fields] = await db.execute(sql); // Выполняем SQL запрос к базе данных для получения всех курсов.
            return rows; // Возвращаем полученные курсы.
        } catch (err) {
            console.error(err); // В случае ошибки выводим ее в консоль.
        }
    }

    // Статический асинхронный метод для получения курса по его идентификатору из базы данных.
    static async getById(id) {
        const sql = 'SELECT * FROM courses WHERE id = ?'; // SQL запрос для выборки курса по его идентификатору из базы данных.
        const values = [id]; // Параметры для SQL запроса.

        try {                 //Метод await используется для ожидания завершения выполнения асинхронного запроса к базе данных.
            const [rows, fields] = await db.execute(sql, values); // Выполняем SQL запрос к базе данных для получения курса по его идентификатору.
            return rows[0]; // Возвращаем найденный курс.
        } catch (err) {
            console.error(err); // В случае ошибки выводим ее в консоль.
        }
    }
}

module.exports = Course; // Экспортируем класс Course для использования в других модулях.
