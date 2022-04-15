<p align="center">
  <img img src="https://user-images.githubusercontent.com/1326151/163515423-5dc79c03-aa3f-42a8-946b-6f53911c7b61.png">
</p>
<h4 align="center">Track and store your products search positions by keywords on Wildberries</h4>
<h5 align="center">:trophy:<code>Must Have <s>Weapon</s> Tool for TOP-1 on Wildberries</code></h5>
<h5 align="center">:white_check_mark:<code>Standalone version</code></h5>


##### How to run?
- Clone this repo ```git clone https://github.com/glmn/WBTracker.git```
- Create in root folder <code>main.db</code> file
- With any SQL Managers open <code>main.db</code> database and execute next query 
```SQL
--
-- File generated with SQLiteStudio v3.3.3 on Пт апр 15 07:14:23 2022
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: keywords
CREATE TABLE keywords (
    keyword STRING UNIQUE
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
- You are ready to go, just type <code>node index</code> in your terminal

##### How to watch positions data?
Not implemented yet :laughing: Use your SQL skills to gather cool analytics

To-Do List:
- [ ] Implement Interactive mode
- [ ] Realtime Charts
