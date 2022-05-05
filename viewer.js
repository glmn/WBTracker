import {WebSocketServer} from 'ws'
import sqlite from 'aa-sqlite';
import * as fs from 'fs'
import http from 'http'
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

    var keywords = (await sqlite.all("SELECT * FROM keywords"))
                    .map((v,i) => {return {key: v.keyword, total_products: v.total_products}})
    var products = (await sqlite.all("SELECT id FROM products"))
                    .map((v,i) => v.id)

    ws.on('message', async function(message) {
        message = JSON.parse(message)
        if(message.type == 'ping') ws.send(JSON.stringify({type:'ping', data:'pong'}))
        if(message.type == 'get.keywords') ws.send(JSON.stringify({type:'keywords', data:keywords}))
        if(message.type == 'get.products') ws.send(JSON.stringify({type:'products', data:products}))
        if(message.type == 'get.stats') {
            let products = (message.data.products).join("','")
            let keywords = (message.data.keywords).join("','")
            // let response = await sqlite.all(
            //     `SELECT * FROM stats WHERE product in ('${products}') AND keyword in ('${keywords}')`
            // )
            let response = await sqlite.all(
                `select strftime('%d%H', timestamp), timestamp, position, keyword, product, total_products
                from stats
                WHERE product in ('${products}') AND keyword in ('${keywords}')
                group by strftime('%d%H', timestamp), keyword, product
                ORDER by timestamp DESC`
            )

            ws.send(JSON.stringify({type:'stats', data:response}))
        }
    })
})