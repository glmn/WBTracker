<p align="center">WBTracker более не разрабатывается, т.к. был пересоздан в виде SaaS решения<br/><br/>
<img src="https://github.com/glmn/glmn/assets/1326151/549b8bed-60c3-4f6e-8f5a-8592c63467b6" height="35"></p>

<img src="https://github.com/glmn/glmn/assets/1326151/5f38f86c-7014-4e73-8fa1-c6657a902826" height="11">
<b>Нейромаркет</b> - Глубокий Анализ товаров на Wildberries.
Выдача доступов к закрытому бета-тестированию -> <b><a href="https://t.me/+tN3mdbvUP1RkNDgy" target="_blank">Телеграм канал</a></b>

<br/><br/>
<p align="center"><b><a href="https://telegra.ph/WBTracker--Analitika-poiskovyh-zaprosov-na-Wildberries-na-vashem-kompyutere-ili-na-VDS-absolyutno-besplatno-Instrukciya-po-Ustan-05-23">Инструкция по Установке WBTracker на Русском</a></b></p>
<p align="center"><img img src="https://user-images.githubusercontent.com/1326151/163515423-5dc79c03-aa3f-42a8-946b-6f53911c7b61.png"></p>
<h4 align="center">Track and store your products search positions by keywords on Wildberries</h4>
<h5 align="center">:trophy:<code>Must Have <s>Weapon</s> Tool for TOP-1 on Wildberries</code></h5>
<h5 align="center">:white_check_mark:<code>Standalone version</code></h5>

<p align="center"><img img src="https://user-images.githubusercontent.com/1326151/169816090-6a712134-a1e3-4521-a7c4-b3b3f5a054ef.png"></p>

#### How to run?
- Clone this repo ```git clone https://github.com/glmn/WBTracker.git```
- Run <code>npm install</code> in your terminal
- Fill <code>keywords</code> table with your keywords
- Fill <code>products</code> table with your products SKUs
- You are ready to go, just type <code>npm run scan</code> in your terminal

#### How to watch positions data?
- Type <code>npm run watch</code> in your terminal
- Open your browser and visit <code>http://127.0.0.1</code>

#### Migrate from v0.0.3 to v0.0.4
- Type <code>npm run migrate</code> in your terminal

#### To-Do List
- [x] Implement Interactive mode
- [x] Realtime Charts
- [x] Implement <code>insert</code> of *keywords* and *products*
- [x] SKU Preview - image, title, orders(?), count
- [ ] Implement <code>Bulk insert</code> of *keywords* and *products*
- [ ] Implement <code>remove</code> of *keywords* and *products*
- [ ] Switch to PostgreSQL
- [ ] Implement <a href="https://github.com/glmn/wb-private-api">@glmn/wb-private-api</a> library 
