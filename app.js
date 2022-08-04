var wsHost = new URL(window.location).hostname
const app = new Vue({
  data: {
    ws: new WebSocket("ws://"+ wsHost +":9000"),
    ping: null,
    keywords: [],
    products: [],
    productData: {},
    chart: null,
    showProductInput: false,
    showKeywordInput: false,
    productInput: '',
    keywordInput: '',
  },
  methods: {
    submitProduct: function(){
      this.productInput = parseInt(this.productInput)
      if(typeof this.productInput == 'number'){
        this.ws.send(JSON.stringify({type:'add.product', data:{
          product: this.productInput
        }}))
        this.productInput = ''
        this.toggleProductInput()
      }
    },
    toggleProductInput: function(){
      this.showProductInput = !this.showProductInput
    },
    submitKeyword: function(){
        this.ws.send(JSON.stringify({type:'add.keyword', data:{
          keyword: this.keywordInput
        }}))
        this.keywordInput = ''
        this.toggleKeywordInput()
    },
    toggleKeywordInput: function(){
      this.showKeywordInput = !this.showKeywordInput
    },
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
        this.keywords.forEach((v, i) => {this.keywords[i].isActive = false})
      })
      if(this.products.filter((v, i) => v.isActive).length > 0){
        this.requestKeywords()
        this.requestProductData()
      } else {
        this.keywords = []
        this.productData = {}
      }
      this.chart.data = {}
      this.chart.update()
    },
    requestKeywords: function(){
      this.ws.send(JSON.stringify({type:'get.keywords', data:{
        products: (this.products).filter(obj => obj.isActive).map(el => el.product),
      }}))
    },
    requestProductData: function(){
      this.ws.send(JSON.stringify({type:'get.product.data', data:{
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
    updateChart: function(stats, diff){

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
            backgroundColor: color,
            borderColor: '#28253b',
            fill: false,
            datalabels: { display: false }
          })
          idx = datasets.length - 1
        }
        let date = new Date(stat.timestamp)
        date.setHours(date.getHours() + 3)
        datasets[idx].data.push({
          x: date,
          y: stat.position
        })
      }
      diff = diff.map((v) => {v.data = JSON.parse(v.data); return v})

      datasets.push({
        label: 'Изменения карточки',
        data: [],
        diffData: [],
        isDiffData: true,
        backgroundColor: '#a400ff',
        borderColor: '#7b6b9d',
        borderDash: [10,5],
        pointStyle: 'rectRot',
        pointRadius: 8,
        pointBorderColor: '#000000',
        fill: false,
        datalabels: { display: false }
      })

      let blackPaths = ['timestamp', 'ao_id', 'stocks'];

      diff.forEach((product_stat, idx) => {
        if(idx == 0) return
        let diffData = recursiveDiff.getDiff(diff[idx-1], diff[idx], true)
        diffData = diffData.filter(el => !blackPaths.some(r => el.path.includes(r)))
        if(!diffData.length) return
        let date = new Date(product_stat.timestamp)
        date.setHours(date.getHours() + 3)
        datasets[datasets.length-1].data.push({
          x: date,
          y: 1
        })
        datasets[datasets.length-1].diffData.push(diffData)
      })

      datasets.push({
        label: 'Остатки',
        data: [],
        customData: [],
        backgroundColor: '#830e59',
        borderColor: '#830e59',
        borderDash: [4,2],
        yAxisID: 'yStocks',
        datalabels: {
          color: '#eeeeee',
          backgroundColor: '#830e59',
          borderRadius: 20,
          borderWidth: 1,
          padding: 5,
          borderColor: '#000000',
          display: true,
          textAlign: 'center',
          clamp: true,
          clip: true,
          font: {size: 10},
          formatter: function(value, context) {
            return value.y
          }
        }
      })

      diff.filter(el => typeof el.data.stocks == 'object').forEach((product_stat, idx) => {
        let date = new Date(product_stat.timestamp)
        let stocks = product_stat.data.stocks.map(v => v.qty)
        console.log(stocks)
        stocks = stocks.reduce((pre, cur) => {
          console.log(idx, pre, cur)
          return pre + cur
        }, 0);
        date.setHours(date.getHours() + 3)
        datasets[datasets.length-1].data.push({
          x: date,
          y: stocks
        })
        datasets[datasets.length-1].customData.push({
          ...product_stat.data.stocks
        })
      })

      console.log(datasets[datasets.length-1])

      this.chart.data.datasets = datasets
      this.chart.update()
    }
  },
  mounted: function(){
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({type:'ping', data:''}))
      this.ws.send(JSON.stringify({type:'get.products', data:''}))
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
              min: key.min,
              max: key.max,
              position: key.position,
              show: key.show,
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
        case 'product.data':
          this.productData = JSON.parse(data.data[0].data)
          let sku = this.productData.nm_id
          let skuArchive = parseInt(sku/10000)
          let photoUrl = `https://images.wbstatic.net/c246x328/new/${skuArchive}0000/${sku}-1.jpg`
          this.productData.photoUrl = photoUrl
          break;
        case 'stats':
          this.updateChart(data.data, data.productDiff)
          break;
        case 'error':
          if(data.data == 'keyword_duplicate'){
            new Notify ({
              status: 'error',
              title: 'Ошибка',
              text: 'Данное ключевое слово уже есть в базе',
              effect: 'fade',
              speed: 300,
              customClass: '',
              customIcon: '',
              showIcon: false,
              showCloseButton: false,
              autoclose: true,
              autotimeout: 3000,
              gap: 44,
              distance: 20,
              type: 3,
              position: 'right top'
            })
          }
          break;
      }
    };

    const getOrCreateTooltip = (chart) => {
      let tooltipEl = chart.canvas.parentNode.querySelector('div');

      if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.style.opacity = 1;
        tooltipEl.classList.add('tooltip-div')
        const table = document.createElement('table');
        tooltipEl.appendChild(table);
        chart.canvas.parentNode.appendChild(tooltipEl);
      }

      return tooltipEl;
    };

    const externalTooltipHandler = (context) => {
      // Tooltip Element
      const {chart, tooltip} = context;
      const tooltipEl = getOrCreateTooltip(chart);

      // Hide if no tooltip
      if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
      }

      // Set Text
      if (tooltip.body) {
        const titleLines = tooltip.title || [];
        const bodyLines = tooltip.body.map(b => b.lines);

        const tableHead = document.createElement('thead');

        titleLines.forEach(title => {
          const tr = document.createElement('tr');
          const th = document.createElement('th');
          const text = document.createTextNode(title);

          th.appendChild(text);
          tr.appendChild(th);
          tableHead.appendChild(tr);
        });

        const tableBody = document.createElement('tbody');
        bodyLines.forEach((body, i) => {

          // MY PART -------
          let dataIndex = tooltip.dataPoints[i].dataIndex
          let dataset = tooltip.dataPoints[i].dataset
          if('diffData' in dataset){
            let diffData = dataset.diffData[dataIndex]
            let blackPaths = ['timestamp', 'ao_id', 'stocks']
            let whitePaths = ['description']
            diffData.forEach((diff,i) => {
              console.log(diff)
              const tr = document.createElement('tr');
              const td = document.createElement('td');

              if(blackPaths.some(r => diff.path.includes(r))) return;
              if(diff.path[0] == 'image'){
                let newImage = (document.createElement('img'))
                newImage.setAttribute("src","data:image/png;base64," + diff.val);
                let oldImage = (document.createElement('img'))
                oldImage.setAttribute("src","data:image/png;base64," + diff.oldVal);

                td.appendChild(oldImage);
                tr.appendChild(td);
                td.appendChild(newImage);
                tr.appendChild(td);
                tableBody.appendChild(tr);
                return;
              }

              if(diff.path[1] == 'stocks'){
                const span = document.createElement('span');
                span.classList.add('add-badge')
                span.textContent = 'Остатки';
                tr.appendChild(span);
                td.innerHTML = diff.val;
                tr.appendChild(td);
                tableBody.appendChild(tr);
                return;
              }

              if(diff.op == 'add' && diff.val){
                td.innerHTML = '<span class="add-badge">New</span>'
                tr.appendChild(td);
                td.innerHTML = diff.val;
                tr.appendChild(td);
                tableBody.appendChild(tr);
                return;
              }

              if(diff.op == 'delete'){
                td.innerHTML = '<span class="del-badge">Del</span>'
                tr.appendChild(td);
                td.innerHTML = diff.val;
                tr.appendChild(td);
                tableBody.appendChild(tr);
                return;
              }

              let dmp = new diff_match_patch()
              let diffResult = dmp.diff_main(diff.val, diff.oldVal)
              dmp.diff_cleanupSemantic(diffResult)
              let diffHtml = dmp.diff_prettyHtml(diffResult)
              const span = document.createElement('span');
              td.appendChild(span);
              td.innerHTML = diffHtml
              tr.appendChild(td);
              tableBody.appendChild(tr);
            })
            return;
          }
          // -------

          const colors = tooltip.labelColors[i];

          const span = document.createElement('span');
          span.classList.add('linecolor')
          span.style.background = colors.backgroundColor;
          span.style.borderColor = colors.borderColor;

          const tr = document.createElement('tr');
          const td = document.createElement('td');
          const text = document.createTextNode(body);

          td.appendChild(span);
          td.appendChild(text);
          tr.appendChild(td);
          tableBody.appendChild(tr);
        });

        const tableRoot = tooltipEl.querySelector('table');

        // Remove old children
        while (tableRoot.firstChild) {
          tableRoot.firstChild.remove();
        }

        // Add new children
        tableRoot.appendChild(tableHead);
        tableRoot.appendChild(tableBody);
      }

      const {offsetLeft: positionX, offsetTop: positionY} = chart.canvas;

      // Display, position, and set styles for font
      tooltipEl.style.opacity = 1;
      tooltipEl.style.left = positionX + tooltip.caretX + 'px'; //(tooltipEl.clientWidth/2) + 50
      tooltipEl.style.top = positionY + tooltip.caretY + 'px'; //50
      tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
    };


    const zoomOptions = {
      pan: {
          enabled: true,
          modifierKey: "",
          mode: "x",
          overScaleMode: "x",
        },
      limits: {
        y: {min:0},
        yStocks: {min:0},
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
        plugins: [ChartDataLabels],
        options: {
          interaction: {
            intersect: false,
            mode: 'nearest',
          },
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            ChartDataLabels,
            zoom: zoomOptions,
            legend: {
              display: false
            },
            tooltip: {
              enabled: false,
              position: 'nearest',
              external: externalTooltipHandler
            },
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
                tooltipFormat: 'yyyy-MM-dd HH:mm:ss',
                // displayFormats: {
                //     millisecond: 'HH:mm:ss.SSS',
                //     second: 'HH:mm:ss',
                //     minute: 'HH:mm',
                //     hour: 'HH'
                // }
              }
            },
            y: {
              beginAtZero: true,
              position: 'right',
              reverse: true,
            },
            yStocks: {
              beginAtZero: true,
              type: 'linear',
              display: true,
              position: 'left',

              // grid line settings
              grid: {
                drawOnChartArea: false, // only want the grid lines for one axis to show up
              },
            },
          }
        }
    })
  }
});
app.$mount("#content");