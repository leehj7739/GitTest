-- 예제 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS join_practice;
USE join_practice;

-- 테이블 생성
CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    customer_name VARCHAR(50),
    email VARCHAR(100)
);

CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    amount DECIMAL(10,2),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(50),
    price DECIMAL(10,2)
);

CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    quantity INT,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 샘플 데이터 삽입
INSERT INTO customers VALUES
(1, '김철수', 'chulsoo@example.com'),
(2, '이영희', 'younghee@example.com'),
(3, '박민수', 'minsu@example.com'),
(4, '정지은', 'jieun@example.com');

INSERT INTO orders VALUES
(101, 1, '2024-01-15', 150000),
(102, 2, '2024-01-16', 75000),
(103, 1, '2024-01-17', 200000),
(104, 3, '2024-01-18', 50000);

INSERT INTO products VALUES
(1001, '노트북', 1000000),
(1002, '스마트폰', 800000),
(1003, '태블릿', 500000),
(1004, '이어폰', 150000);

INSERT INTO order_items VALUES
(101, 1001, 1),
(101, 1004, 2),
(102, 1002, 1),
(103, 1003, 1),
(103, 1004, 1),
(104, 1004, 1);

-- 1. INNER JOIN 예제
-- 고객과 주문 정보 조회
SELECT c.customer_name, o.order_date, o.amount
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id;

-- 2. LEFT JOIN 예제
-- 모든 고객과 그들의 주문 정보 조회 (주문이 없는 고객도 포함)
SELECT c.customer_name, o.order_date, o.amount
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;

-- 3. RIGHT JOIN 예제
-- 모든 주문과 고객 정보 조회 (고객 정보가 없는 주문도 포함)
SELECT c.customer_name, o.order_date, o.amount
FROM customers c
RIGHT JOIN orders o ON c.customer_id = o.customer_id;

-- 4. FULL OUTER JOIN 예제 (MySQL에서는 LEFT JOIN과 RIGHT JOIN을 UNION으로 구현)
SELECT c.customer_name, o.order_date, o.amount
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
UNION
SELECT c.customer_name, o.order_date, o.amount
FROM customers c
RIGHT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.customer_id IS NULL;

-- 5. 다중 테이블 JOIN 예제
-- 고객, 주문, 상품 정보를 모두 조회
SELECT 
    c.customer_name,
    o.order_date,
    p.product_name,
    oi.quantity,
    p.price * oi.quantity as total_price
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id;

-- 6. SELF JOIN 예제
-- 같은 테이블 내에서의 관계 조회 (예: 동일한 금액의 주문 찾기)
SELECT a.order_id as order1, b.order_id as order2, a.amount
FROM orders a
INNER JOIN orders b ON a.amount = b.amount
WHERE a.order_id < b.order_id; 