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

    ws.on('message', function(message) {
        if(message == 'ping') ws.send(JSON.stringify({type:'ping', data:'pong'}))
        if(message == 'get.keywords') ws.send(JSON.stringify({type:'keywords', data:keywords}))
        if(message == 'get.products') ws.send(JSON.stringify({type:'products', data:products}))
    })
})