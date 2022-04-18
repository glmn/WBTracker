import http from 'http'
import * as fs from 'fs'
const port = 80
const requestHandler = (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    fs.readFile("charts.html", (err, data) => res.end(data))
}
const server = http.createServer(requestHandler)
server.listen(port, (err) => {
    if (err) return console.log(err);
})