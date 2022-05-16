import fs from 'fs'
import sqlite from 'aa-sqlite'

(async () => {
    console.log('Creating Database file')

    await fs.writeFile('./main.db','', (err) => {
        if (err) throw err;
        console.log("The file was succesfully saved!");
    })

    console.log('Created main.db')
    await sqlite.open('./main.db')
    console.log('Connect to DB')

    await sqlite.push(
        `CREATE TABLE keywords (
            keyword        STRING  UNIQUE,
            total_products INT (5)
        );`
    )
    console.log('Created table keywords')
    await sqlite.push(
        `CREATE TABLE products (
            id INT UNIQUE PRIMARY KEY
        );`
    )
    console.log('Created table products')

    await sqlite.push(
        `CREATE TABLE stats (
            timestamp      DATETIME DEFAULT (CURRENT_TIMESTAMP),
            keyword        STRING,
            product        INT,
            position       INT,
            total_products INT
        );`
    )
    console.log('Created table stats')
    console.log('Ready to go!')
})()