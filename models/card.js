const path = require("path");
const db = require("../data/db"); // Подключаем модуль для работы с базой данных

class Card {
    static async add(course) { // Метод для добавления курса в корзину
        let card = await Card.fetch(); // Получаем текущее состояние корзины из базы данных

        const idx = card.courses.findIndex(c => c.id === course.id); // Ищем индекс курса в корзине

        if (card.courses[idx]) { // Если курс уже есть в корзине
            card.courses[idx].count++; // Увеличиваем количество курсов
            await db.execute('UPDATE card_courses SET count = ? WHERE id = ?', [card.courses[idx].count, card.courses[idx].db_id]); // Обновляем количество в базе данных
        } else { // Если курса нет в корзине
            course.count = 1; // Устанавливаем количество курса
            const [result] = await db.execute('INSERT INTO card_courses (card_id, course_id, count) VALUES (?, ?, ?)', [card.id, course.id, course.count]); // Добавляем курс в базу данных
            course.db_id = result.insertId; // Записываем ID курса в базу данных
            card.courses.push(course); // Добавляем курс в массив курсов корзины
        }

        // Обновляем общую цену корзины при добавлении курса
        card.price += parseFloat(course.price);

        if (card.id) { // Если корзина уже существует
            // Обновляем цену в базе данных
            await db.execute('UPDATE cards SET price = ? WHERE id = ?', [card.price, card.id]);
        } else { // Если корзины еще нет
            // Создаем новую запись в базе данных для корзины
            const [result] = await db.execute('INSERT INTO cards (price) VALUES (?)', [card.price]);
            card.id = result.insertId; // Получаем ID корзины из базы данных
            // Обновляем записи в таблице card_courses, чтобы установить card_id
            await db.execute('UPDATE card_courses SET card_id = ? WHERE id = ?', [card.id, course.db_id]);
        }

        return card; // Возвращаем обновленную корзину
    }

    static async remove(id) { // Метод для удаления курса из корзины
        let card = await Card.fetch(); // Получаем текущее состояние корзины из базы данных
        const idx = card.courses.findIndex(c => c.id === id); // Ищем индекс курса в корзине
        const course = card.courses[idx]; // Получаем информацию о курсе

        if (!card.courses[idx]) { // Если курс не найден в корзине
            throw new Error(`Course with id ${id} not found in the card.`); // Выбрасываем ошибку
        }

        if (course.count === 1) { // Если количество курсов равно 1
            // Удаляем курс из базы данных и корзины
            await db.execute('DELETE FROM card_courses WHERE id = ?', [course.db_id]);
            card.courses.splice(idx, 1);
        } else { // Если количество курсов больше 1
            // Уменьшаем количество курсов на 1 в базе данных
            course.count--;
            await db.execute('UPDATE card_courses SET count = ? WHERE id = ?', [course.count, course.db_id]);
        }

        // Уменьшаем общую цену корзины на цену данного курса
        card.price -= parseFloat(course.price);
        if (card.price < 0) card.price = 0; // Проверяем, чтобы цена корзины не была отрицательной

        if (card.courses.length === 0) { // Если в корзине больше нет курсов
            // Удаляем запись о корзине из базы данных
            await db.execute('DELETE FROM cards WHERE id = ?', [card.id]);
            card = { id: null, courses: [], price: 0 }; // Обнуляем информацию о корзине
        } else {
            // Обновляем цену в базе данных
            await db.execute('UPDATE cards SET price = ? WHERE id = ?', [card.price, card.id]);
        }

        return card; // Возвращаем обновленное состояние корзины
    }

    static async fetch() { // Метод для получения текущего состояния корзины
        // Получаем запись о корзине из базы данных
        const [cardRows] = await db.execute('SELECT * FROM cards LIMIT 1');
        const card = cardRows[0] || { id: null, courses: [], price: 0 } // Если запись о корзине не найдена, создаем пустую корзину

        // Получаем информацию о курсах, связанных с корзиной
        if (card.id) { // Если корзина существует
            // Получаем информацию о курсах из базы данных
            const [courseRows] = await db.execute('SELECT cc.id as db_id, cc.course_id as id, c.title, c.price, c.img, cc.count FROM card_courses cc JOIN courses c ON cc.course_id = c.id WHERE cc.card_id = ?', [card.id]);
            // Заполняем информацию о курсах в корзине
            card.courses = courseRows.map(row => ({
                id: row.id, title: row.title, price: row.price, img: row.img, count: row.count, db_id: row.db_id
            }));

            // Пересчитываем общую цену корзины на основе данных из базы данных
            card.price = card.courses.reduce((total, course) => total + (course.price * course.count), 0);
        }
        return card; // Возвращаем информацию о корзине
    }
}

module.exports = Card; // Экспортируем класс Card для использования в других модулях

// await Card.fetch() - Этот метод используется для получения текущего состояния корзины из базы данных. Подобно методу fetch, он загружает данные о карте из базы данных и возвращает объект card с информацией о курсах в корзине и их общей стоимости.

// card.courses.findIndex(c => c.id === id) - Этот метод массива используется для поиска индекса курса с указанным id в массиве курсов корзины. Он возвращает индекс элемента, если он найден, или -1, если элемент не найден.

// await db.execute('DELETE FROM card_courses WHERE id = ?', [course.db_id]) - Этот метод используется для удаления записи о курсе из таблицы card_courses в базе данных.

// card.courses.splice(idx, 1) - Этот метод массива используется для удаления одного элемента из массива. В данном случае он удаляет курс из массива курсов корзины по его индексу idx.

// await db.execute('UPDATE card_courses SET count = ? WHERE id = ?', [course.count, course.db_id]) - Этот метод используется для обновления количества курса в таблице card_courses в базе данных.

// await db.execute('DELETE FROM cards WHERE id = ?', [card.id]) - Этот метод используется для удаления записи о карте из таблицы cards в базе данных.

// await db.execute('UPDATE cards SET price = ? WHERE id = ?', [card.price, card.id]) - Этот метод используется для обновления цены корзины в таблице cards в базе данных.