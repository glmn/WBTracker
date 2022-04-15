<p align="center">
  <img img src="https://user-images.githubusercontent.com/1326151/163515423-5dc79c03-aa3f-42a8-946b-6f53911c7b61.png">
</p>
<h4 align="center">Track and store your products search positions by keywords on Wildberries</h4>
<h5 align="center">:trophy:<code>Must Have <s>Weapon</s> Tool for TOP-1 on Wildberries</code></h5>
<h5 align="center">:white_check_mark:<code>Standalone version</code></h5>


##### How to use?
- Clone this repo <code>git clone https://github.com/glmn/WBTracker.git</code>
- Create in root folder <code>main.db</code> file
- With any SQL Managers open <code>main.db</code> database and execute next query 
```SQL
-- Table: keywords
CREATE TABLE keywords (keyword STRING UNIQUE);

-- Table: products
CREATE TABLE products (id INT UNIQUE PRIMARY KEY);

-- Table: stats
CREATE TABLE stats (timestamp DATETIME DEFAULT (CURRENT_TIMESTAMP), keyword STRING, product INT, position INT, total_products INT);

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;

```



To-Do List:
- [ ] Implement Interactive mode
- [ ] Realtime Charts
