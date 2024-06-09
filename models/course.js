const {
	v4: uuid
} = require("uuid");
const path = require("path");
const fs = require("fs");
const db = require("../data/db")


class Course {
	constructor(title, price, img) {
		this.title = title;
		this.price = price;
		this.img = img;
		this.id = uuid();
	}

	async save() {
        const sql = 'INSERT INTO courses (id, title, price, img) VALUES (?, ?, ?, ?)';
        const values = [this.id, this.title, this.price, this.img];

        try {
            await db.execute(sql, values);
        } catch (err) {
            console.error(err);
        }
    }

    static async update(course) {
        const sql = 'UPDATE courses SET title = ?, price = ?, img = ? WHERE id = ?';
        const values = [course.title, course.price, course.img, course.id];

        try {
            await db.execute(sql, values);
        } catch (err) {
            console.error(err);
        }
    }

    static async getAll() {
        const sql = 'SELECT * FROM courses';

        try {
            const [rows, fields] = await db.execute(sql);
            return rows;
        } catch (err) {
            console.error(err);
        }
    }

    static async getById(id) {
        const sql = 'SELECT * FROM courses WHERE id = ?';
        const values = [id];

        try {
            const [rows, fields] = await db.execute(sql, values);
            return rows[0];
        } catch (err) {
            console.error(err);
        }
    }
}


module.exports = Course;