import {WebSocketServer} from 'ws'
import sqlite from 'aa-sqlite';
import * as fs from 'fs'
import http from 'http'

await sqlite.open('./main.db')

const port = 80
const requestHandler = (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    fs.readFile("charts.html", (err, data) => res.end(data))
}
const server = http.createServer(requestHandler)
server.listen(port, (err) => {
    if (err) return console.log(err);
});


/**
 * WebSocket server
 */


const wss = new WebSocketServer({port:9000})
wss.on('connection', async function(ws){
    ws.send(JSON.stringify({type:'connection', data: true}))

    var keywords = (await sqlite.all("SELECT keyword FROM keywords"))
                    .map((v,i) => v.keyword)
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
                `select strftime('%d%H', timestamp), timestamp, position, keyword, product
                from stats
                WHERE product in ('${products}') AND keyword in ('${keywords}')
                group by strftime('%d%H', timestamp), keyword, product
                ORDER by timestamp DESC`
            )

            ws.send(JSON.stringify({type:'stats', data:response}))
        }
    })
})