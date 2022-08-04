import fetch from 'node-fetch';
import sqlite from 'aa-sqlite';
import log from 'log-beautify';

await sqlite.open('./main.db')


class WBProduct {
    constructor(product){
        this.sku = product
        this.imageBase64 = ''
        this.data = ''
    }

    async fetchData(){
        let url = "https://wbx-content-v2.wbstatic.net/ru/" + this.sku + ".json"
        try{
            let response = await fetch(url)
            let jsonData = await response.json()
            this.data = jsonData
        } catch (err) {
            console.log(err)
            await this.fetchData()
        }
    }

    async fetchImage(){
        let skuArchive = parseInt(this.sku/10000)
        let random = Date.now()
        let imageUrl = `https://images.wbstatic.net/c246x328/new/${skuArchive}0000/${this.sku}-1.jpg?r=${random}`
        try{
            let response = await fetch(imageUrl)
            this.imageBase64 = (await response.buffer()).toString('base64')
        } catch (err) {
            console.log(imageUrl)
            await this.fetchImage()
        }
    }

    async fetchStocks(){
        let params = {
            'appType': '64',
            'spp': '0',
            'dest': '-1255563,-1278703,-102269,-1029256',
            'regions': '83,75,64,4,38,30,33,70,71,22,31,66,68,40,48,1,69,80',
            'stores': '117673,122258,122259,125238,125239,125240,6159,507,3158,117501,120602,120762,6158,121709,124731,159402,2737,130744,117986,1733,686,132043',
            'pricemarginCoeff': '1',
            'pricemarginMin': '0',
            'pricemarginMax': '0',
            'reg': '0',
            'emp': '0',
            'lang': 'ru',
            'locale': 'ru',
            'version': '3',
            'nm': this.sku
        }

        let queryParams = new URLSearchParams(params).toString()
        let url = 'https://wbxcatalog-ru.wildberries.ru/nm-2-card/catalog?' + queryParams
        try {
            this.response = await fetch(url)
            this.data.stocks = (await this.response.json()).data.products[0].sizes[0].stocks
        } catch (err) {
            console.log(url, err, this.data.stocks)
            await this.fetchStocks()
        }
    }

    async fetchDetails(){
        let params = {
            'pricemarginCoeff': '1',
            'locale': 'ru',
            'nm': this.sku
        }

        let queryParams = new URLSearchParams(params).toString()
        let url = 'https://card.wb.ru/cards/detail?' + queryParams
        try {
            this.response = await fetch(url)
            this.data.details = (await this.response.json()).data.products[0].sizes[0].stocks
        } catch (err) {
            console.log(err)
            await this.fetchDetails()
        }
    }


}

class WBKeyword {
    constructor(keyword){
        this.keyword = keyword
        this.query = ''
        this.shardKey = ''
    }

    async fetchData(){
        let url = "https://search.wb.ru/exactmatch/ru/female/v4/search?&resultset=catalog&query=" + encodeURI(this.keyword)
        try {
            let response = await fetch(url)
            let jsonData = await response.json()
            this.query = jsonData.query
            this.shardKey = jsonData.shardKey
        } catch (err) {
            console.log(err)
            await this.fetchData()
        }
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
        try {
            let response = await fetch(url)
            let jsonData = await response.json()
            this.positions.push(...jsonData.data.products)

            if(jsonData.data.products.length == 300){
                this.params.page += 1
                if(this.params.page <= 100){
                    await this.fetchData()
                }
            }
        } catch (err) {
            console.log(err)
            await this.fetchData()
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

async function insertProductStats(product, data, imageBase64){
    let insert = 'INSERT INTO product_stats(product_id, data, image) VALUES(?,?,?)'
    let response = await sqlite.all(`SELECT * FROM product_stats WHERE product_id = '${product}' ORDER BY timestamp DESC LIMIT 1`)
    if (response.length == 0){
        try {
            await sqlite.push(insert, [...arguments])
        } catch (err) {
            console.log(err)
        }
    } else {
        if (response[0].data != data || response[0].image != imageBase64){
            try {
                await sqlite.push(insert, [...arguments])
            } catch (err) {
                console.log(err)
            }
        }
    }
}

async function updateKeywordTotalProducts(total_products, _query, keyword){
    let query = "UPDATE keywords SET total_products = ? , query = ? WHERE keyword = ?"
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
            await product.fetchImage()
            await product.fetchStocks()
            await product.fetchDetails()
            insertProductStats(product.sku, JSON.stringify(product.data), product.imageBase64)
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
            await updateKeywordTotalProducts(total_products, key.query, keyword)

            search.positions.forEach(async function(product, idx){
                let idxFound = products.indexOf(product.id)
                if (idxFound != -1){
                    await insertStats(keyword, products[idxFound], idx+1, total_products)
                }
            })
        }, timer)
    }
}

