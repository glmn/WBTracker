import fetch from 'node-fetch';
import sqlite from 'aa-sqlite';
import log from 'log-beautify';


await sqlite.open('./main.db')

class WBKeyword {
    constructor(keyword){
        this.keyword = keyword
        this.query = ''
        this.shardKey = ''
    }

    async fetchData(){
        let url = "https://wbxsearch.wildberries.ru/exactmatch/v2/male?query=" + encodeURI(this.keyword)
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
            await this.fetchData()
        }
    }
}


( async () => {
    var keywords = (await sqlite.all("SELECT keyword FROM keywords"))
                    .map((v,i) => v.keyword)
    var products = (await sqlite.all("SELECT id FROM products"))
                    .map((v,i) => v.id)

    let interval = 5 * 1000 //seconds * milliseconds

    setInterval(async function(){
        await init(keywords, products)
    }, interval)
})()

async function insertStats(keyword, product, position, total_products){
    let insert = 'INSERT INTO stats(keyword, product, position, total_products) VALUES(?,?,?,?)'
    console.log([...arguments])
    try {
        await sqlite.push(insert, [...arguments])
    } catch (err) {
        console.log(err)
    }
}

async function init(keywords, products){
    for(let keyword of keywords){

        let key = new WBKeyword(keyword)
        await key.fetchData()
        let search = new WBSearch(key)
        await search.fetchData()

        let total_products = search.positions.length

        console.info(`Запрос: ${keyword} | Всего: ${total_products}`)

        search.positions.forEach(async function(product, idx){
            let idxFound = products.indexOf(product.id)
            if (idxFound != -1){
                console.log(`Артикул: ${products[idxFound]} | Позиция: ${idx+1}`)
                await insertStats( keyword, products[idxFound], idx+1, total_products)
            }
        })
    }
}

