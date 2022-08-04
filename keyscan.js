import fetch from 'node-fetch'

class WBProduct {
    constructor(product){
        this.sku = product
        this.data = ''
        this.extra = ''
        this.response = ''
    }

    async fetchData(){
        let url = "https://wbx-content-v2.wbstatic.net/ru/" + this.sku + ".json"
        try {
            this.response = await fetch(url)
            this.data = await this.response.json()
        } catch (error) {
            console.log('Product fetchData() error', this.sku, url)
            await this.fetchData()
        }
    }

    async fetchExtraData(){
        let url = "https://www.wildberries.ru/webapi/product/" + this.sku + "/data?targetUrl=BP&ids=" + this.sku + "&stores=130744&subject=2760&kind=0&brand="+ this.data.data.brand_id +"&_v=9.2.25.1"
        try {
            this.response = await fetch(url, {
                "headers": {
                    "x-requested-with": "XMLHttpRequest",
                    "x-spa-version": "9.2.25.1"
                }
                });
            this.extra = await this.response.json()
        } catch (error) {
            console.log('bad')
            await this.fetchExtraData()
        }
    }
}

class WBSimilarByNm {
    constructor(product){
        this.product = product
        this.data = ''
        this.response = ''
    }

    async fetchData(){
        let url = "https://www.wildberries.ru/webapi/recommendations/similar-by-nm/" + this.product.sku
        try {
            this.response = await fetch(url, {
                "headers": {
                  "x-requested-with": "XMLHttpRequest",
                  "x-spa-version": "9.2.25.1"
                }
              });
            this.data = await this.response.json()
        } catch (error) {
            console.log('Similar fetchData() error')
            await this.fetchData()
        }
    }
}


class WBMenu {
    constructor(){
        this.data = ''
        this.response = ''
    }

    async fetchData(){
        let url = "https://www.wildberries.ru/webapi/menu/main-menu-ru-ru.json"
        try {
            this.response = await fetch(url)
            this.data = await this.response.json()
        } catch (error) {
            console.log(error)
            await this.fetchData()
        }
    }
}

var keys = [];

(async () => {
    const product = new WBProduct(60059650)
    await product.fetchData()
    await product.fetchExtraData()
    const similar = new WBSimilarByNm(product)
    await similar.fetchData()
    const similarNms = similar.data.value.nmIds
    console.log(similarNms)

    await grabKeys(similarNms)
    let uniqKeys = [...new Set(keys)]
    for (let i of uniqKeys){
        console.log(i)
    }
})()

async function grabKeys(similarNms){
    let count = similarNms.length
    for(let i = 0; i < count; i++){
        let smProduct = new WBProduct(similarNms[i])
        await smProduct.fetchData()
        await smProduct.fetchExtraData()
        if(count <= 1000){
            let sm = new WBSimilarByNm(smProduct)
            await sm.fetchData()
            similarNms.push(...sm.data.value.nmIds)
            similarNms = [...new Set(similarNms)]
            count = similarNms.length
        }
        console.log(smProduct.extra.value.data.searchTags.tagsViewModels.map(v => v.text))
        keys.push(...smProduct.extra.value.data.searchTags.tagsViewModels.map(v => v.text))
    }
}





