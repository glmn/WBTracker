import {WebSocketServer} from 'ws'
import sqlite from 'aa-sqlite';
import fetch from 'node-fetch';
import connect from 'connect'
import serveStatic from 'serve-static'

var __dirname = process.cwd();
await sqlite.open('./main.db')

/**
 * Simple web server
 */
const port = 80

connect()
    .use(serveStatic(__dirname))
    .listen(port, () => console.log('Open your browser\n http://127.0.0.1'));

/**
 * WebSocket server
 */


const wss = new WebSocketServer({port:9000})
wss.on('connection', async function(ws){
    ws.send(JSON.stringify({type:'connection', data: true}))

    var products = (await sqlite.all("SELECT id FROM products"))
                    .map((v,i) => v.id)

    ws.on('message', async function(message) {
        message = JSON.parse(message)
        if(message.type == 'ping') ws.send(JSON.stringify({type:'ping', data:'pong'}))
        if(message.type == 'get.keywords') {
            let products = (message.data.products).join("','")
            let activeKeys = await sqlite.all(`SELECT keyword FROM keywords`)
            activeKeys = activeKeys.map((v) => v.keyword)

            let keywords = await sqlite.all(
                `SELECT DISTINCT keyword, total_products, position, min(position) as min, max(position) as max, max(timestamp) FROM stats WHERE product in ('${products}') GROUP BY keyword ORDER BY timestamp DESC`
            )
            keywords = keywords.map((v) => {
                let isActive = (activeKeys.indexOf(v.keyword) > -1) ? true : false
                return {
                    key: v.keyword,
                    total_products: v.total_products,
                    min: v.min,
                    max: v.max,
                    position: v.position,
                    show: isActive
                }
            })

            keywords.sort((a,b) => a.position - b.position)
            ws.send(JSON.stringify({type:'keywords', data:keywords}))
        }
        if(message.type == 'get.product.data') {
            let product = message.data.products[0]
            let url = "https://wbx-content-v2.wbstatic.net/ru/" + product + ".json"
            let response = await fetch(url)
            let jsonData = await response.json()
            ws.send(JSON.stringify({type: 'product.data', data: jsonData}))
        }
        if(message.type == 'get.products') ws.send(JSON.stringify({type:'products', data:products}))
        if(message.type == 'get.stats') {
            let products = (message.data.products).join("','")
            let keywords = (message.data.keywords).join("','")
            let response = await sqlite.all(
                `select strftime('%m%d%H', timestamp), timestamp, position, keyword, product, total_products
                from stats
                WHERE product in ('${products}') AND keyword in ('${keywords}')
                group by strftime('%m%d%H', timestamp), keyword, product
                ORDER by timestamp DESC`
            )

            ws.send(JSON.stringify({type:'stats', data:response}))
        }

        if(message.type == 'add.product') {
            let product = message.data.product
            let insert = `INSERT INTO products VALUES(?)`
            await sqlite.push(insert, product)
            products.push(product)
            ws.send(JSON.stringify({type:'products', data:products}))
        }

        if(message.type == 'add.keyword') {
            let keyword = message.data.keyword
            console.log(keyword)
            let insert = `INSERT INTO keywords (keyword) VALUES(?)`
            await sqlite.push(insert, keyword)
        }
    })
})