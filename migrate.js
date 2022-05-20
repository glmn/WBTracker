import sqlite from 'aa-sqlite'

(async () => {

    await sqlite.open('./main.db')
    console.log('Connect to DB')

    await sqlite.push(`
        CREATE TABLE product_stats (
            product_id INTEGER,
            timestamp  DATE    DEFAULT (CURRENT_TIMESTAMP),
            data       TEXT,
            image      TEXT
        );`
    )
    console.log('Created table product_stats')

    console.log('Migration [DONE]')
})()
