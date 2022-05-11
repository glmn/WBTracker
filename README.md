<p align="center"><i>:baby_chick: Work In Progress <code>use it on your own risk</code></i></p>
<p align="center"><img img src="https://user-images.githubusercontent.com/1326151/163515423-5dc79c03-aa3f-42a8-946b-6f53911c7b61.png"></p>
<h4 align="center">Track and store your products search positions by keywords on Wildberries</h4>
<h5 align="center">:trophy:<code>Must Have <s>Weapon</s> Tool for TOP-1 on Wildberries</code></h5>
<h5 align="center">:white_check_mark:<code>Standalone version</code></h5>

<p align="center"><img img src="https://user-images.githubusercontent.com/1326151/167756110-bf663f64-a954-4123-a945-56802591cf10.png"></p>

#### How to run?
- Clone this repo ```git clone https://github.com/glmn/WBTracker.git```
- Run <code>npm install</code> in your terminal
- Create in root folder <code>main.db</code> file
- With any SQL Managers open <code>main.db</code> database and execute next query 
```SQL
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: keywords
CREATE TABLE keywords (
    keyword        STRING  UNIQUE,
    total_products INT (5) 
);


-- Table: products
CREATE TABLE products (
    id INT UNIQUE
         PRIMARY KEY
);


-- Table: stats
CREATE TABLE stats (
    timestamp      DATETIME DEFAULT (CURRENT_TIMESTAMP),
    keyword        STRING,
    product        INT,
    position       INT,
    total_products INT
);


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
```
- Fill <code>keywords</code> table with your keywords
- Fill <code>products</code> table with your products SKUs
- You are ready to go, just type <code>npm run scan</code> in your terminal

#### How to watch positions data?
- Type <code>npm run watch</code> in your terminal
- Open your browser and visit <code>http://127.0.0.1</code>

#### To-Do List
- [x] Implement Interactive mode
- [x] Realtime Charts
- [ ] Add <code>insert</code> and <code>remove</code> of *keywords* and *products*
- [ ] SKU Preview - image, title, orders(?), count
