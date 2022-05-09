const app = new Vue({
  data: {
    ws: new WebSocket("ws://127.0.0.1:9000"),
    ping: null,
    keywords: [],
    products: [],
    chart: null
  },
  methods: {
    toggleSelectors: function(selector){
      selector.isActive = !selector.isActive
      this.requestStats()
    },
    selectSKU: function(sku){
      this.products.forEach((el, i) => {
        if(this.products[i] === sku){
          this.products[i].isActive = !this.products[i].isActive
        } else {
          this.products[i].isActive = false
        }
      })
      if(this.products.filter((v, i) => v.isActive).length > 0)
      this.requestKeywords()
    },
    requestKeywords: function(){
      this.ws.send(JSON.stringify({type:'get.keywords', data:{
        products: (this.products).filter(obj => obj.isActive).map(el => el.product),
      }}))
    },
    requestStats: function(){
      let req = {
        type:'get.stats',
        data: {
          products: (this.products).filter(obj => obj.isActive).map(el => el.product),
          keywords: (this.keywords).filter(obj => obj.isActive).map(el => el.word),
        }
      }
      if(req.data.products.length > 0 && req.data.keywords.length > 0){
        this.ws.send(JSON.stringify(req))
      }
    },
    updateChart: function(stats){

      function getRandomColor() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

      function djb2(str){
        var hash = 01001;
        for (var i = 0; i < str.length; i++) {
          hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
        }
        return hash;
      }

      function hashStringToColor(str) {
        var hash = djb2(str);
        var r = (hash & 0xFF0000) >> 16;
        var g = (hash & 0x00FF00) >> 8;
        var b = hash & 0x0000FF;
        return "#" + ("0" + r.toString(16)).substr(-2) + ("0" + g.toString(16)).substr(-2) + ("0" + b.toString(16)).substr(-2);
      }


      labels = (this.keywords).filter(obj => obj.isActive).map(el => el.word)
      let data = []

      let datasets = []

      for(stat of stats){
        let idx = datasets.findIndex(obj => obj.label == stat.keyword)
        if(idx == -1){
          let color = hashStringToColor((stat.keyword).split("").reverse().join(""))
          datasets.push({
            label: stat.keyword,
            data: [],
            cubicInterpolationMode: 'monotone',
            tension: 0.4,
            backgroundColor: color,
            fill: false
          })
          idx = datasets.length - 1
        }
        let date = new Date(stat.timestamp)
        date.setHours(date.getHours() + 3) // add 3 hours (GMT+3)
        datasets[idx].data.push({
          x: date,
          y: stat.position
        })
      }

      this.chart.data.datasets = datasets
      this.chart.update()
    }
  },
  mounted: function(){
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({type:'ping', data:''}))
      // this.ws.send(JSON.stringify({type:'get.keywords', data:''}))
      this.ws.send(JSON.stringify({type:'get.products', data:''}))

      // setInterval(() => {
        // this.ws.send(JSON.stringify({type:'get.keywords', data:''}))
        // this.ws.send(JSON.stringify({type:'get.products', data:''}))
      // }, 60000)
    };

    this.ws.onmessage = (event) => {
      let data = JSON.parse(event.data)
      switch(data.type){
        case 'ping': this.ping = true; break;
        case 'keywords':
          let tmpKeysArr = []
          for(key of data.data){
            let idx = this.keywords.findIndex(obj => obj.word == key.key)
            tmpKeysArr.push({
              word: key.key,
              total_products: key.total_products,
              isActive: (idx == -1) ? false : this.keywords[idx].isActive
            })
          }
          this.keywords = tmpKeysArr
          break;
        case 'products':
          let tmpProductsArr = []
          for(product of data.data){
            let idx = this.products.findIndex(obj => obj.product == product)
            tmpProductsArr.push({
              product: product,
              isActive: (idx == -1) ? false : this.products[idx].isActive
            })
          }
          this.products = tmpProductsArr
          break;
        case 'stats':
          this.updateChart(data.data)
          break;
      }
    };

    const zoomOptions = {
      pan: {
          enabled: true,
          modifierKey: "",
        },
      limits: {
        y: {min:0, max:'original'},
        x: {}
      },
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true,
        },
        mode: "x",
      }
    };

    this.chart = new Chart('myChart', {
        type: 'line',
        data: {},
        options: {
          interaction: {
            intersect: false,
            mode: 'index',
          },
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            zoom: zoomOptions
          },
          scales: {
            x: {
              type: 'time',
              ticks: {
                autoSkip: true,
                autoSkipPadding: 50,
                maxRotation: 0
              },
              time: {
                tooltipFormat: 'yyyy-mm-dd HH:mm',
                displayFormats: {
                    millisecond: 'HH:mm:ss.SSS',
                    second: 'HH:mm:ss',
                    minute: 'HH:mm',
                    hour: 'HH'
                }
              }
            },
            y: {
              beginAtZero: true,
              position: 'right',
              reverse: true,
            }
          }
        }
    })
  }
});
app.$mount("#content");