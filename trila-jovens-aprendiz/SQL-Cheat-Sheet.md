# SQL cheat sheet 

## Comprehensive 

### **Data Manipulation Language �DML�Commands** 

|**Command**|**Description**|**Syntax**|
|---|---|---|
|`SELECT`|The SELECT command retrieves<br>data from a database.|`SELECT column1, column2 FROM`<br>`table_name;`|
|`INSERT`|The INSERT command adds new<br>records to a table.|`INSERT INTO table_name`<br>`(column1, column2) VALUES`<br>`(value1, value2);`|
|`UPDATE`|The UPDATE command is used<br>to modify existing records in a<br>table.|`UPDATE table_name SET column1`<br>`= value1, column2 = value2`<br>`WHERE condition;`|
|`DELETE`|The DELETE command removes<br>records from a table.|`DELETE FROM table_name WHERE`<br>`condition;`|



##### **Example** 

```
SELECTfirst_name,last_name
FROMcustomers;
```

```
INSERTINTOcustomers
(first_name,last_name)
VALUES('Mary','Doe');
```

```
UPDATEemployeesSET
employee_name=‘JohnDoe’,
department=‘Marketing’;
```

```
DELETEFROMemployeesWHERE
employee_name=‘JohnDoe’;
```

### **Data Definition Language �DDL�Commands** 

|**Command**|**Description**|**Syntax**|**Example**|
|---|---|---|---|
|`CREATE`|The CREATE command creates a<br>new database and objects, such<br>as a table, index, view, or stored<br>procedure.|`CREATE TABLE table_name`<br>`(column1 datatype1,`<br>`column2 datatype2, �);`|`CREATE TABLE employees (`<br>`employee_id INT`<br>`PRIMARY KEY,`<br>`first_name`<br>`VARCHAR(50),`<br>`last_name`<br>`VARCHAR(50),`<br>`age INT`<br>`);`|
|`ALTER`|The ALTER command adds,<br>deletes, or modifies columns in<br>an existing table.|`ALTER TABLE table_name`<br>`ADD column_name datatype;`|`ALTER TABLE customers ADD`<br>`email VARCHAR(100);`|
|`DROP`|The DROP command is used to<br>drop an existing table in a<br>database.|`DROP TABLE table_name;`|`DROP TABLE customers;`|
|`TRUNCATE`|The TRUNCATE command is<br>used to delete the data inside a<br>table, but not the table itself.|`TRUNCATE TABLE`<br>`table_name;`|`TRUNCATE TABLE customers;`|





The SQL tool with the highest user satisfaction. 

```
DBVIS.COM��
```

### **Data Control Language �DCL�Commands** 

|**Command**|**Description**|**Syntax**|
|---|---|---|
|`GRANT`|The GRANT command is used to<br>|`GRANT SELECT, INSERT ON`|
||give specific privileges to users<br>or roles.|`table_name TO user_name;`|
|`REVOKE`|The REVOKE command is used<br>to take away privileges<br>previously granted to users or<br>roles.|`REVOKE SELECT, INSERT ON`<br>`table_name FROM`<br>`user_name;`|



#### **Example** 

```
GRANTSELECT,INSERTON
employeesTO‘JohnDoe’;
```

```
REVOKESELECT,INSERTON
employeesFROM‘John
Doe’;
```

### **Querying Data Commands** 

|**Command**|**Description**|
|---|---|
|`SELECT`Statement|The SELECT statement is the<br>primary command used to<br>retrieve data from a database|
|`WHERE` Clause|The WHERE clause is used to<br>filter rows based on a specified<br>condition.|
|`ORDER BY`Clause|The ORDER BY clause is used to<br>sort the result set in ascending<br>or descending order based on a<br>specified column.|
|`GROUP BY`Clause|The GROUP BY clause groups<br>rows based on the values in a<br>specified column. It is often<br>used with aggregate functions<br>like COUNT, SUM, AVG, etc.|
|`HAVING`Clause|The HAVING clause filters<br>grouped results based on a<br>specified condition.|



#### **Syntax** 

```
SELECTcolumn1,column2
FROMtable_name;
SELECT*FROMtable_name
WHEREcondition;
SELECT*FROMtable_name
ORDERBYcolumn_name
ASC|DESC;
```

```
SELECTcolumn_name,
COUNT(*)FROMtable_name
GROUPBYcolumn_name;
```

```
SELECTcolumn_name,
COUNT(*)FROMtable_name
GROUPBYcolumn_name
HAVINGcondition;
```

#### **Example** 

```
SELECTfirst_name,
last_nameFROMcustomers;
```

```
SELECT*FROMcustomers
WHEREage>30;
SELECT*FROMproducts
ORDERBYpriceDESC;
```

```
SELECTcategory,COUNT(*)
FROMproductsGROUPBY
category;
```

```
SELECTcategory,COUNT(*)
FROMproductsGROUPBY
categoryHAVINGCOUNT(*)
>5;
```



The SQL tool with the highest user satisfaction. 

```
DBVIS.COM��
```

### **Joining Commands** 

|**Command**|**Description**|**Syntax**|**Example**|
|---|---|---|---|
|`INNER JOIN`|The INNER JOIN command<br>returns rows with matching<br>values in both tables.|`SELECT * FROM table1`<br>`INNER JOIN table2 ON`<br>`table1.column =`<br>`table2.column;`|`SELECT * FROM employees`<br>`INNER JOIN departments ON`<br>`employees.department_id =`<br>`departments.id;`|
|`LEFT JOIN/LEFT OUTER JOIN`|The LEFT JOIN command<br>returns all rows from the left<br>table (first table) and the<br>matching rows from the right<br>table (second table).|`SELECT * FROM table1 LEFT`<br>`JOIN table2 ON`<br>`table1.column =`<br>`table2.column;`|`SELECT * FROM employees LEFT`<br>`JOIN departments ON`<br>`employees.department_id =`<br>`departments.id;`|
|`RIGHT JOIN/RIGHT OUTER`<br>`JOIN`|The RIGHT JOIN command<br>returns all rows from the right<br>table (second table) and the<br>matching rows from the left<br>table (first table).|`SELECT * FROM table1`<br>`RIGHT JOIN table2 ON`<br>`table1.column =`<br>`table2.column;`|`SELECT *`<br>`FROM employees`<br>`RIGHT JOIN departments`<br>`ON employees.department_id =`<br>`departments.department_id;`|
|`FULL JOIN/FULL OUTER JOIN`|The FULL JOIN command<br>returns all rows when there is a<br>match in either the left table or<br>the right table.|`SELECT * FROM table1 FULL`<br>`JOIN table2 ON`<br>`table1.column =`<br>`table2.column;`|`SELECT *`<br>`FROM employees`<br>`LEFT JOIN departments ON`<br>`employees.employee_id =`<br>`departments.employee_id`<br>`UNION`<br>`SELECT *`<br>`FROM employees`<br>`RIGHT JOIN departments ON`<br>`employees.employee_id =`<br>`departments.employee_id;`|
|`CROSS JOIN`|The CROSS JOIN command<br>combines every row from the<br>first table with every row from<br>the second table, creating a<br>Cartesian product.|`SELECT * FROM table1`<br>`CROSS JOIN table2;`|`SELECT * FROM employees`<br>`CROSS JOIN departments;`|
|`SELF JOIN`|The SELF JOIN command joins<br>a table with itself.|`SELECT * FROM table1 t1,`<br>`table1 t2 WHERE t1.column`<br>`= t2.column;`|`SELECT * FROM employees t1,`<br>`employees t2`<br>`WHERE t1.employee_id =`<br>`t2.employee_id;`|
|`NATURAL JOIN`|The NATURAL JOIN command<br>matches columns with the<br>same name in both tables.|`SELECT * FROM table1`<br>`NATURAL JOIN table2;`|`SELECT * FROM employees`<br>`NATURAL JOIN departments;`|





The SQL tool with the highest user satisfaction. 

```
DBVIS.COM��
```

### **Subqueries in SQL** 

|**Command**|**Description**|
|---|---|
|`IN`|The IN command is used to<br>determine whether a value<br>matches any value in a subquery<br>result. It is often used in the<br>WHERE clause.|
|`ANY`|The ANY command is used to<br>compare a value to any value<br>returned by a subquery. It can<br>be used with comparison<br>operators like =, >, <, etc.|
|`ALL`<br>**ggregate Fun**|The ALL command is used to<br>compare a value to all values<br>returned by a subquery. It can<br>be used with comparison<br>operators like =, >, <, etc.<br>**ctions Commands**|
|**Command**|**Description**|
|`COUNT()`|The COUNT command counts<br>the number of rows or non-null<br>values in a specified column.|
|`SUM()`|The SUM command is used to<br>calculate the sum of all values in<br>a specified column.|
|`AVG()`|The AVG command is used to<br>calculate the average (mean) of<br>all values in a specified column.|
|`MIN()`|The MIN command returns the<br>minimum (lowest) value in a<br>specified column.|
|`MAX()`|The MAX command returns the|



### **Aggregate Functions Commands** 

The MAX command returns the maximum (highest) value in a specified column. 

#### **Syntax** 

```
SELECTcolumn(s)FROM
tableWHEREvalueIN
(subquery);
```

```
SELECTcolumn(s)FROM
tableWHEREvalue<ANY
(subquery);
```

```
SELECTcolumn(s)FROM
tableWHEREvalue>ALL
(subquery);
```

#### **Syntax** 

```
SELECTCOUNT(column_name)
FROMtable_name;
```

```
SELECTSUM(column_name)
FROMtable_name;
SELECTAVG(column_name)
FROMtable_name;
```

```
SELECTMIN(column_name)
FROMtable_name;
```

```
SELECTMAX(column_name)
FROMtable_name;
```

#### **Example** 

```
SELECT*FROMcustomers
WHEREcityIN(SELECT
cityFROMsuppliers);
```

```
SELECT*FROMproducts
WHEREprice<ANY(SELECT
unit_priceFROM
supplier_products);
```

```
SELECT*FROMorders
WHEREorder_amount>ALL
(SELECTtotal_amountFROM
previous_orders);
```

#### **Example** 

```
SELECTCOUNT(age)FROM
employees;
```

```
SELECTSUM(revenue)FROM
sales;
```

```
SELECTAVG(price)FROM
products;
```

```
SELECTMIN(price)FROM
products;
```

```
SELECTMAX(price)FROM
products;
```



The SQL tool with the highest user satisfaction. 

```
DBVIS.COM��
```

### **String Functions in SQL** 

|**Command**|**Description**|**Syntax**|
|---|---|---|
|`CONCAT()`|The CONCAT command<br>concatenates two or more<br>strings into a single string.|`SELECT CONCAT(string1,`<br>`string2, �) AS`<br>`concatenated_string FROM`<br>`table_name;`|
|`SUBSTRING()/SUBSTR()`|The SUBSTRING command<br>extracts a substring from a<br>string.|`SELECT SUBSTRING(string`<br>`FROM start_position [FOR`<br>`length]) AS substring`<br>`FROM table_name;`|
|`CHAR_LENGTH()/LENGTH()`|The LENGTH command returns<br>the length (number of<br>characters) of a string.|`SELECT`<br>`CHAR_LENGTH(string) AS`<br>`length FROM table_name;`|
|`UPPER()`|The UPPER command converts<br>all characters in a string to<br>uppercase.|`SELECT UPPER(string) AS`<br>`uppercase_string FROM`<br>`table_name;`|
|`LOWER()`|The LOWER command converts<br>all characters in a string to<br>lowercase.|`SELECT LOWER(string) AS`<br>`lowercase_string FROM`<br>`table_name;`|
|`TRIM()`|The TRIM command removes<br>specified prefixes or suffixes (or<br>whitespace by default) from a<br>string.|`SELECT TRIM([LEADING |`<br>`TRAILING | BOTH]`<br>`characters FROM string)`<br>`AS trimmed_string FROM`<br>`table_name;`|
|`LEFT()`|The LEFT command returns a<br>specified number of characters<br>from the left of a string.|`SELECT LEFT(string,`<br>`num_characters) AS`<br>`left_string FROM`<br>`table_name;`|
|`RIGHT()`|The RIGHT command returns a<br>specified number of characters<br>from the right of a string.|`SELECT RIGHT(string,`<br>`num_characters) AS`<br>`right_string FROM`<br>`table_name;`|
|`REPLACE()`|The REPLACE command<br>replaces occurrences of a<br>substring within a string.|`SELECT REPLACE(string,`<br>`old_substring,`<br>`newsubstring)AS`|



```
SELECTREPLACE(string,
old_substring,
new_substring)AS
replaced_stringFROM
table_name;
```

#### **Example** 

```
SELECTCONCAT(first_name,
'',last_name)AS
full_nameFROMemployees;
```

##### `SELECT` 

```
SUBSTRING(product_name
FROM1FOR5)AS
substringFROMproducts;
```

##### `SELECT` 

```
CHAR_LENGTH(product_name)
ASlengthFROMproducts;
```

```
SELECTUPPER(first_name)
ASuppercase_first_name
FROMemployees;
```

```
SELECTLOWER(last_name)
ASlowercase_last_name
FROMemployees;
```

```
SELECTTRIM(TRAILING''
FROMfull_name)AS
trimmed_full_nameFROM
customers;
```

#### `SELECT` 

```
LEFT(product_name,5)
ASleft_product_name
FROMproducts;
```

##### `SELECT` 

```
RIGHT(order_number,4)AS
right_order_numberFROM
orders;
```

##### `SELECT` 

```
REPLACE(description,
'old_string',
'new_string')AS
replaced_descriptionFROM
product_descriptions;
```



The SQL tool with the highest user satisfaction. 

```
DBVIS.COM��
```

### **Date and Time SQL Commands** 

|**Command**|**Description**|**Syntax**|**Example**|
|---|---|---|---|
|`CURRENT_DATE()`|The CURRENT_DATE command<br>returns the current date.|`SELECT CURRENT_DATE() AS`<br>`current_date;`|`�`|
|`CURRENT_TIME()`|The CURRENT_TIME command<br>returns the current time.|`SELECT CURRENT_TIME() AS`<br>`current_time;`|`�`|
|`CURRENT_TIMESTAMP()`|The CURRENT_TIMESTAMP<br>command returns the current<br>date and time.|`SELECT`<br>`CURRENT_TIMESTAMP() AS`<br>`current_timestamp;`|`�`|
|`DATE_PART()`|The DATE_PART command<br>extracts a specific part (e.g.,<br>year, month, day) from a date or<br>time.|`SELECT DATE_PART('part',`<br>`date_expression) AS`<br>`extracted_part;`|`SELECT D`<br>`'2024-04`<br>`extracte`|
|`DATE_ADD()/DATE_SUB()`|The DATE_ADD command adds<br>or subtracts a specified number<br>of days, months, or years<br>to/from a date.|`SELECT`<br>`DATE_ADD(date_expression,`<br>`INTERVAL value unit) AS`<br>`new_date;`|`�DATE_`<br>`SELECT`<br>`DATE_ADD`<br>`INTERVAL`<br>`new_date`<br>`�DATE_`<br>`SELECT`<br>`DATE_SUB`<br>`INTERVAL`<br>`new_date`|
|`EXTRACT()`|The EXTRACT command<br>extracts a specific part (e.g.,<br>year, month, day) from a date or<br>time.|`SELECT EXTRACT(part FROM`<br>`date_expression) AS`<br>`extracted_part;`|`SELECT E`<br>`'2024-04`<br>`extracte`|
|`TO_CHAR()`|The TO_CHAR command<br>converts a date or time to a<br>specified format.|`SELECT`<br>`TO_CHAR(date_expression,`<br>`'format') AS`<br>`formatted_date;`|`SELECT`<br>`TO_CHAR(`<br>`'YYYY-MM`<br>`formatte`|
|`TIMESTAMPDIFF()`|The TIMESTAMPDIFF command<br>|`SELECT`|`SELECT T`|
||calculates the difference<br>between two timestamps in a<br>specified unit (e.g., days, hours,<br>minutes).|`TIMESTAMPDIFF(unit,`<br>`timestamp1, timestamp2)`<br>`AS difference;`|`'2024-04`<br>`'2024-04`<br>`differen`|
|`DATEDIFF()`|The DATEDIFF command<br>|`SELECT DATEDIFF(date1,`<br>|`SELECT`<br>|
||calculates the difference in days<br>between two dates.|`date2) AS`<br>`differenceindas`|`DATEDIFF`<br>`'2024-04`|



```
SELECTDATE_PART('year',
'2024-04-11')AS
extracted_part;
```

```
��DATE_ADDExample
SELECT
DATE_ADD('2024-04-11',
INTERVAL1DAY)AS
new_date;
```

```
��DATE_SUBExample
SELECT
DATE_SUB('2024-04-11',
INTERVAL1DAY)AS
new_date;
```

```
SELECTEXTRACT(YEARFROM
'2024-04-11')AS
extracted_part;
```

```
TO_CHAR('2024-04-11',
'YYYY-MM-DD')AS
formatted_date;
```

```
SELECTTIMESTAMPDIFF(DAY,
'2024-04-10',
'2024-04-11')AS
difference;
```

```
SELECTDATEDIFF(date1,
date2)AS
difference_in_days;
```

```
DATEDIFF('2024-04-11',
'2024-04-10')AS
difference_in_days;
```



The SQL tool with the highest user satisfaction. 

```
DBVIS.COM��
```

### **Conditional Expressions** 

|**Command**|**Description**|**Syntax**|**Example**|
|---|---|---|---|
|`CASE Statement`|The CASE statement allows you<br>|`SELECT`|`SELECT`|
||to perform conditional logic<br>within a query.|`column1,`<br>`column2,`<br>`CASE`|`order_id,`<br>`total_amount,`<br>`CASE`|
|||`WHEN condition1`<br>`THEN result1`<br>`WHEN condition2`|`WHEN total_amount`<br>`> 1000 THEN 'High Value`<br>`Order'`|
|||`THEN result2`<br>`ELSE`<br>`default_result`<br>`END AS alias`|`WHEN total_amount`<br>`> 500 THEN 'Medium Value`<br>`Order'`<br>`ELSE 'Low Value`|
|||`FROM table_name;`|`Order'`<br>`END AS order_status`<br>`FROM orders;`|
|`IF() Function`|The IF��function evaluates a<br>condition and returns a value<br>|`SELECT IF(condition,`<br>`true_value, false_value)`|`SELECT`<br>`name,`|
||based on the evaluation.|`AS alias FROM table_name;`|`age,`<br>`IF(age > 50,`<br>`'Senior', 'Junior') AS`<br>`employee_category`<br>`FROM employees;`|
|`COALESCE() Function`|The COALESCE��function<br>returns the first non-null value<br>from a list of values.|`SELECT COALESCE(value1,`<br>`value2, �) AS alias`<br>`FROM table_name;`|`SELECT`<br>`COALESCE(first_name,`<br>`middle_name) AS`<br>`preferred_name`<br>`FROM employees;`|
|`NULLIF() Function`|The NULLIF��function returns|`SELECT`|`SELECT`|
||null if two specified expressions|`NULLIF(expression1,`|`NULLIF(total_amount,`|
||are equal.|`expression2) AS alias`|`discounted_amount) AS`|
|||`FROM table_name;`|`diff_amount FROM orders;`|





The SQL tool with the highest user satisfaction. 

```
DBVIS.COM��
```

### **Set Operations** 

|**Command**|**Description**|**Syntax**||**Example**|
|---|---|---|---|---|
|`UNION`|The UNION operator<br>combines the result sets of<br>two or more SELECT<br>statements into a single<br>result set.|`SELECT col`<br>`table1`<br>`UNION`<br>`SELECT col`<br>`table2;`|`umn1, column2 FROM`<br>`umn1, column2 FROM`|`SELECT first_name, last_name`<br>`FROM customers`<br>`UNION`<br>`SELECT first_name, last_name`<br>`FROM employees;`|
|`INTERSECT`|The INTERSECT operator<br>returns the common rows<br>that appear in both result<br>sets.|`SELECT col`<br>`table1`<br>`INTERSECT`<br>`SELECT col`<br>`table2;`|`umn1, column2 FROM`<br>`umn1, column2 FROM`|`SELECT first_name, last_name`<br>`FROM customers`<br>`INTERSECT`<br>`SELECT first_name, last_name`<br>`FROM employees;`|
|`EXCEPT`|The EXCEPT operator<br>returns the distinct rows<br>from the left result set that<br>are not present in the right<br>result set.|`SELECT col`<br>`table1`<br>`EXCEPT`<br>`SELECT col`<br>`table2;`|`umn1, column2 FROM`<br>`umn1, column2 FROM`|`SELECT first_name, last_name`<br>`FROM customers`<br>`EXCEPT`<br>`SELECT first_name, last_name`<br>`FROM employees;`|
|**ransaction**<br>**Command**|**Control Commands**<br>**Description**|**Syntax**|**Example**||
|`COMMIT`<br>`ROLLBACK`|The COMMIT command is<br>used to save all the changes<br>made during the current<br>transaction and make them<br>permanent.<br>The ROLLBACK command is<br>used to undo all the<br>changes made during the<br>current transaction and<br>discard them.|`COMMIT;`<br>`ROLLBACK;`|`BEGIN TRANSACTION;`<br>`�SQL statements an`<br>`INSERT INTO employee`<br>`30);`<br>`UPDATE products SET `<br>`'Electronics';`<br>`COMMIT;`<br>`BEGIN TRANSACTION;`<br>`�SQL statements an`<br>`INSERT INTO employee`<br>`UPDATE products SET `<br>`'Electronics';`<br>`ROLLBACK;`|`d changes within the transaction`<br>`s (name, age) VALUES ('Alice',`<br> `price = 25.00 WHERE category =`<br>`d changes within the transaction`<br>`s (name, age) VALUES ('Bob', 35);`<br> `price = 30.00 WHERE category =`|



### **Transaction Control Commands** 



The SQL tool with the highest user satisfaction. 

```
DBVIS.COM��
```

|`SAVEPOINT`|The SAVEPOINT command<br>is used to set a point within<br>a transaction to which you<br>can later roll back.|`SAVEPOINT`<br>`savepoint_n`<br>`ame;`|`BEGIN TRANSACTION;`<br>`INSERT INTO employees (name, age) VALUES ('Carol',`<br>`28);`<br>`SAVEPOINT before_update;`<br>`UPDATE products SET price = 40.00 WHERE category =`<br>`'Electronics';`<br>`SAVEPOINT after_update;`|
|---|---|---|---|
||||`DELETE FROM customers WHERE age > 60;`<br>`ROLLBACK TO before_update;`<br>`�At this point, the DELETE is rolled back, but the`<br>`UPDATE remains.`<br>`COMMIT;`|
|`ROLLBACK TO`<br>`SAVEPOINT`|The ROLLBACK TO<br>SAVEPOINT command is<br>used to roll back to a<br>specific savepoint within a<br>transaction.|`ROLLBACK TO`<br>`SAVEPOINT`<br>`savepoint_n`<br>`ame;`|`BEGIN TRANSACTION;`<br>`INSERT INTO employees (name, age) VALUES ('David',`<br>`42);`<br>`SAVEPOINT before_update;`<br>`UPDATE products SET price = 50.00 WHERE category =`<br>`'Electronics';`<br>`SAVEPOINT after_update;`<br>`DELETE FROM customers WHERE age > 60;`<br>`�Rollback to the savepoint before the update`<br>`ROLLBACK TO SAVEPOINT before_update;`<br>`�At this point, the UPDATE is rolled back, but the`<br>`INSERT remains.`<br>`COMMIT;`|
|`SET TRANSACTION`|The SET TRANSACTION<br>command is used to<br>configure properties for the<br>current transaction, such as<br>isolation level and<br>transaction mode.|`SET`<br>`TRANSACTION`<br>`[ISOLATION`<br>`LEVEL {`<br>`READ`<br>`COMMITTED |`<br>`SERIALIZABL`<br>`E }]`|`BEGIN TRANSACTION;`<br>`�Set the isolation level to READ COMMITTED`<br>`SET TRANSACTION ISOLATION LEVEL READ COMMITTED;`<br>`�SQL statements and changes within the transaction`<br>`INSERT INTO employees (name, age) VALUES ('Emily',`<br>`35);`<br>`UPDATE products SET price = 60.00 WHERE category =`<br>`'Electronics';`<br>`COMMIT;`|





The SQL tool with the highest user satisfaction. 

```
DBVIS.COM��
```

