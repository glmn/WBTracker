import fetch from 'node-fetch';
import sqlite from 'aa-sqlite';
import log from 'log-beautify';
import {Loader, Aphorism} from 'loader-in-console';


await sqlite.open('./main.db')

class WBProduct {
    constructor(product){
        this.sku = product
        this.data = ''
    }

    async fetchData(){
        let url = "https://wbx-content-v2.wbstatic.net/ru/" + this.sku + ".json"
        let response = await fetch(url)
        let jsonData = await response.json()
        this.data = jsonData
    }
}

class WBKeyword {
    constructor(keyword){
        this.keyword = keyword
        this.query = ''
        this.shardKey = ''
    }

    async fetchData(){
        let url = "https://wbxsearch.wildberries.ru/exactmatch/v2/female?query=" + encodeURI(this.keyword)
        let response = await fetch(url)
        let jsonData = await response.json()

        this.query = jsonData.query
        this.shardKey = jsonData.shardKey
    }
}

class WBSearch {
    constructor(keyword){
        this.keyword = keyword
        this.positions = []

        this.params = {
            'page': 1,
            'spp': 19,
            'regions': [69,64,86,83,4,38,30,33,70,22,31,66,68,82,48,1,40,80],
            'stores': [117673,122258,122259,130744,117501,507,3158,124731,121709,120762,117986,159402,2737],
            'pricemarginCoeff': 1.0,
            'reg': 1,
            'appType': 1,
            'offlineBonus': 0,
            'onlineBonus': 0,
            'emp': 0,
            'locale': 'ru',
            'lang': 'ru',
            'curr': 'rub',
            'couponsGeo': [2,6,7,3,19,21,8],
            'dest': [-1059500,-108082,-269701,12358048],
            'sort': 'popular',
            'limit': 300
        }
    }

    async fetchData(){
        let queryParams = new URLSearchParams(this.params).toString()
        let url = 'https://wbxcatalog-ru.wildberries.ru/' + this.keyword.shardKey + '/catalog?' + queryParams + '&' + this.keyword.query
        let response = await fetch(url)
        let jsonData = await response.json()
        this.positions.push(...jsonData.data.products)

        if(jsonData.data.products.length == 300){
            this.params.page += 1
            if(this.params.page <= 100){
                await this.fetchData()
            }
        }
    }
}


( async () => {
    var keywords = (await sqlite.all("SELECT keyword FROM keywords"))
                    .map((v,i) => v.keyword)
    var products = (await sqlite.all("SELECT id FROM products"))
                    .map((v,i) => v.id)

    log.success('Ключевые слова')
    log.show(keywords.join(', '), "\n")

    log.success('SKU товаров')
    log.show(products.join(', '), "\n")

    const interval = 10 * 60 * 1000

    var checksCount = 0;
    var startTime = new Date().toLocaleString()

    showInfo(checksCount, startTime, 'Сканирую')
    await init()
    checksCount++
    showInfo(checksCount, startTime, 'Отдыхаю')

    setInterval(async function(){
        showInfo(checksCount, startTime, 'Сканирую')
        await init()
        checksCount++
        showInfo(checksCount, startTime, 'Отдыхаю')
    }, interval)
})()

function showInfo(checksCount, startTime, status){
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`\x1b[4m\x1b[36mПроверок: ${checksCount}\x1b[0m | Время запуска: ${startTime} | \x1b[32m${status}\x1b[0m`)
}

async function insertStats(keyword, product, position, total_products){
    let insert = 'INSERT INTO stats(keyword, product, position, total_products) VALUES(?,?,?,?)'
    try {
        await sqlite.push(insert, [...arguments])
    } catch (err) {
        console.log(err)
    }
}

async function insertProductStats(product, data){
    let insert = 'INSERT INTO product_stats(product_id, data) VALUES(?,?)'
    let response = await sqlite.all(`SELECT * FROM product_stats WHERE product_id = '${product}' ORDER BY timestamp DESC LIMIT 1`)
    if (response.length == 0){
        try {
            await sqlite.push(insert, [...arguments])
        } catch (err) {
            console.log(err)
        }
    } else {
        if (response[0].data != data){
            try {
                await sqlite.push(insert, [...arguments])
            } catch (err) {
                console.log(err)
            }
        }
    }
}

async function updateKeywordTotalProducts(total_products, keyword){
    let query = "UPDATE keywords SET total_products = ? WHERE keyword = ?"
    try {
        await sqlite.push(query, [...arguments])
    } catch (err) {
        console.log(err)
    }
}

async function init(){
    var keywords = (await sqlite.all("SELECT keyword FROM keywords"))
                    .map((v,i) => v.keyword)
    var products = (await sqlite.all("SELECT id FROM products"))
                    .map((v,i) => v.id)

    let timer = 0
    for(let sku of products){
        timer += 150
        setTimeout(async function(){
            let product = new WBProduct(sku)
            await product.fetchData()
            insertProductStats(product.sku, JSON.stringify(product.data))
        })
    }

    for(let keyword of keywords){
        timer += 150
        setTimeout(async function() {
            let key = new WBKeyword(keyword)
            await key.fetchData()
            let search = new WBSearch(key)
            await search.fetchData()

            let total_products = search.positions.length
            await updateKeywordTotalProducts(total_products, keyword)

            search.positions.forEach(async function(product, idx){
                let idxFound = products.indexOf(product.id)
                if (idxFound != -1){
                    await insertStats(keyword, products[idxFound], idx+1, total_products)
                }
            })
        }, timer)
    }
}

