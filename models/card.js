const path = require("path");
const db = require("../data/db");

class Card {
    static async add(course) {
        let card = await Card.fetch();
        if (!card) {
            card = { id: null, courses: [], price: 0 };
        }

        const idx = card.courses.findIndex(c => c.id === course.id);
        const candidate = card.courses[idx];

        if (candidate) {
            // Если курс уже есть в корзине, увеличиваем количество
            candidate.count++;
            card.courses[idx] = candidate;
            // Обновляем количество в базе данных
            await db.execute('UPDATE card_courses SET count = ? WHERE id = ?', [candidate.count, candidate.db_id]);
        } else {
            // Если курс новый, добавляем его в корзину
            course.count = 1;
            const [result] = await db.execute('INSERT INTO card_courses (card_id, course_id, count) VALUES (?, ?, ?)', [card.id, course.id, course.count]);
            course.db_id = result.insertId;
            card.courses.push(course);
        }

        // Обновляем общую цену корзины при добавлении курса
        card.price += parseFloat(course.price);

        if (card.id) {
            // Обновляем цену в таблице cards
            await db.execute('UPDATE cards SET price = ? WHERE id = ?', [card.price, card.id]);
        } else {
            // Если корзины еще нет, создаем новую запись в таблице cards
            const [result] = await db.execute('INSERT INTO cards (price) VALUES (?)', [card.price]);
            card.id = result.insertId;
            // Обновляем записи в таблице card_courses, чтобы установить card_id
            await db.execute('UPDATE card_courses SET card_id = ? WHERE id = ?', [card.id, course.db_id]);
        }

        return card;
    }

    static async remove(id) {
        let card = await Card.fetch();
        const idx = card.courses.findIndex(c => c.id === id);
        const course = card.courses[idx];

        if (!course) {
            throw new Error(`Course with id ${id} not found in the card.`);
        }

        if (course.count === 1) {
            // Если количество курса равно 1, удаляем его из корзины и базы данных
            await db.execute('DELETE FROM card_courses WHERE id = ?', [course.db_id]);
            card.courses = card.courses.filter(c => c.id !== id);
        } else {
            // Если количество курса больше 1, уменьшаем количество на 1
            course.count--;
            await db.execute('UPDATE card_courses SET count = ? WHERE id = ?', [course.count, course.db_id]);
        }

        // Уменьшаем общую цену корзины на цену данного курса
        card.price -= parseFloat(course.price);
        if (card.price < 0) card.price = 0;

        if (card.courses.length === 0) {
            // Если в корзине больше нет курсов, удаляем запись из таблицы cards
            await db.execute('DELETE FROM cards WHERE id = ?', [card.id]);
            card = { id: null, courses: [], price: 0 };
        } else {
            // Обновляем цену в таблице cards
            await db.execute('UPDATE cards SET price = ? WHERE id = ?', [card.price, card.id]);
        }

        return card;
    }

    static async fetch() {
        // Получаем запись корзины из таблицы cards
        const [cardRows] = await db.execute('SELECT * FROM cards LIMIT 1');
        const card = cardRows[0];
        if (!card) {
            return { id: null, courses: [], price: 0 };
        }

        // Получаем все курсы, связанные с данной корзиной
        const [courseRows] = await db.execute('SELECT cc.id as db_id, cc.course_id as id, c.title, c.price, c.img, cc.count FROM card_courses cc JOIN courses c ON cc.course_id = c.id WHERE cc.card_id = ?', [card.id]);
        card.courses = courseRows.map(row => ({ id: row.id, title: row.title, price: row.price, img: row.img, count: row.count, db_id: row.db_id }));

        // Пересчитываем общую цену корзины на основании данных из базы
        card.price = card.courses.reduce((total, course) => total + (course.price * course.count), 0);

        return card;
    }
}

module.exports = Card;
