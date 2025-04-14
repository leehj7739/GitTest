use sakila;

-- select * from film;
-- select * from category;
-- select * from category
-- where name IN ('action' , 'Sports');

-- select * from film_category
-- where category_id = 1
-- or category_id = 15;

-- select title from film
-- where film_id = 10;

-- select category_id from category
-- where name IN ('action' , 'Sports');

-- select * from film_category
-- where category_id IN(
-- 	select category_id from category
-- 	where name IN ('action' , 'Sports')
-- );

-- select title from film
-- where film_id IN (
-- 	select film_id from film_category
-- 	where category_id IN(
-- 		select category_id from category
-- 		where name IN ('action' , 'Sports')
-- 	)
-- );

-- select film_id from film_category as fc
-- JOIN category as c
-- ON c.category_id = fc.category_id
-- where name IN ( 'action','sports')
-- ;

-- select 
-- 	f.title AS film_title,
-- 	c.name AS category_name  
-- from film_category as fc
-- JOIN category as c
-- ON c.category_id = fc.category_id
-- JOIN film as f
-- ON fc.film_id = f.film_id
-- where name IN ( 'action','sports')
-- ;

-- select  
-- 	f.title AS film_title,
--     a.first_name AS actor_first_name,
--     a.last_name AS actor_last_name
-- from film_actor AS fa
-- JOIN film AS f
-- ON fa.film_id = f.film_id
-- join actor as a
-- ON a.actor_id = fa.actor_id
-- where f.title = 'ACADEMY DINOSAUR';
-- ; 


-- select rating, length from film

-- where 1=1
-- and rating = 'PG-13' 
-- and length >120 
-- order by length asc;



-- select * from city 
-- where country_id = 44
-- AND (
-- city  LIKE 'A%'
-- or city LIKE  'B%'
-- );



-- # sql 연습

-- ## **1. 실전 분석 쿼리 및 고급 실습**

-- ### **1.1 인기 영화 분석**

-- - 대여 내역을 활용해 가장 인기 있는 영화 5편을 찾는 쿼리:

-- **포인트:**

-- - 여러 테이블을 조인하여 각 영화의 대여 횟수를 집계한 후 내림차순 정렬합니다.

-- select f.title as film_title, count(r.rental_date) as rental_count
-- from film AS f
-- join inventory as i
-- on f.film_id = i.film_id
-- join rental as r
-- on r.inventory_id = i.inventory_id
-- group by f.title
-- order by rental_count desc
-- limit 5
-- ;


-- ### **1.2 고객별 결제 내역 분석**

-- - 각 고객의 총 결제 금액을 계산하고 상위 5명을 조회:

-- select c.customer_id as c_id, c.first_name, c.last_name , count(p.amount) as rental_count ,sum(p.amount) as Amount
-- from customer as c
-- join rental as r
-- on c.customer_id = r.customer_id
-- join payment as p
-- on r.customer_id = p.customer_id
-- group by c.customer_id
-- order by sum(p.amount) desc
-- limit 5
-- ;


-- ### **1.3 월별 대여 건수 및 트렌드 분석**

-- - 대여 일자를 기반으로 월별 대여 건수를 집계:

-- **팁:**

-- - 날짜 함수 DATE_FORMAT을 사용해 연도와 월로 그룹화함으로써 월별 트렌드 분석이 가능합니다.

-- select  DATE_FORMAT(r.rental_date,'%Y-%m') as year_mon , count(DATE_FORMAT(r.rental_date,'%Y-%m')) as count
-- from film as f
-- join inventory as i
-- on f.film_id = i.film_id
-- join rental as r
-- on r.inventory_id = i.inventory_id
-- group by DATE_FORMAT(r.rental_date,'%Y-%m') 
-- ;


-- ### **1.4 다중 조건 및 CASE 구문**

-- - 특정 조건에 따라 영화의 등급을 재분류 하는 예제:

-- **설명:**

-- - CASE 구문을 활용하여 영화 대여 요금을 기준으로 등급 범주를 지정하는 방법을 보여줍니다.

-- ---

-- SELECT
--     CASE
--         WHEN(조건A) THEN A
--         WHEN(조건B) THEN B
-- 		ELSE C
-- END AS 원하는 컬럼명
-- FROM TABLE
-- ;


-- SELECT film_id, title, rental_rate,
--     CASE
--         WHEN(rental_rate >= 4.9) THEN 'expensive_price_movie'
--         WHEN(rental_rate >= 2.9) THEN 'normal_price_movie'
-- 		ELSE 'cheap_price_movie'
-- END AS 'new_grade'
-- FROM film
-- ;


-- ## **2. 실습 문제 및 도전 과제**

-- ### **2.1 기본 문제**

-- **배우 검색:**

-- - 성이 ‘SWANK’인 배우의 이름을 조회하는 쿼리를 작성하세요.
-- - **힌트:** WHERE last_name = 'SWANK'

-- select actor_id, first_name, last_name 
-- from actor
-- where last_name = 'SWANK'
-- ;


-- **영화 길이 분석:**

-- - 평균 영화 길이를 소숫점 둘째자리까지 출력하는 쿼리를 작성하세요.
-- - **힌트:** ROUND(AVG(length), 2)

-- select ROUND(AVG(length), 2) as film_avg_length
-- from film 
-- ;

-- ### **2.2 중급 문제**

-- **조인 연습:**

-- - 고객과 주소 테이블을 조인하여 고객 이름과 도시 이름을 출력하세요.
-- - **힌트:**
--     - customer 테이블의 address_id와 address 테이블의 address_id
--     - address 테이블의 city_id와 city 테이블의 city_id 사용


-- select c.first_name,c.last_name, city.city
-- from customer as c
-- join address as a
-- on a.address_id = c.address_id
-- join city 
-- on city.city_id = a.city_id
-- ;

-- **서브쿼리 도전:**

-- - 영화 제목 중, ‘Action’ 카테고리에 속하는 영화 리스트를 서브쿼리를 활용하여 작성해 보세요.

-- select film_id, title
-- from film
-- where film_id IN (
-- 	select film_id from film_category
--     where category_id IN (
--     select category_id from category
--     where name = 'action'
--     )
-- );


-- ### **2.3 고급 문제**

-- **시간대별 대여 분석:**

-- - 대여 날짜 및 시간을 기반으로, 하루 중 특정 시간대(예: 오전 9시 ~ 오후 5시)의 대여 건수를 집계하는 쿼리를 작성하세요.
-- - **힌트:**
--     - HOUR(rental_date) 함수를 이용하여 시간대 구분

-- select hour(rental_date) as rental_hour, count(hour(rental_date)) as rental_count
-- from rental
-- group by hour(rental_date)
-- order by rental_hour asc
-- ;


-- **복잡한 조건:**

-- - 각 고객의 마지막 대여 날짜를 확인하고, 지난 6개월 동안 대여 기록이 없는 고객을 찾는 쿼리를 작성해 보세요.
-- - **힌트:**
--     - MAX(rental_date)와 날짜 비교 함수 활용

select  c.customer_id, c.first_name, c.last_name, MAX(r.rental_date) as last_rental_date
from customer as c
join rental  as r
on  r.customer_id = c.customer_id
group by c.customer_id
having timestampdiff(MONTH, MAX(r.rental_date) ,date('2006-06-01')) > 6 
order by c.customer_id
;


-- select  c.customer_id, c.first_name, c.last_name, MAX(r.rental_date) as last_rental_date
-- from customer as c
-- join rental  as r
-- on  r.customer_id = c.customer_id
-- group by c.customer_id
-- having timestampdiff(MONTH, MAX(r.rental_date) ,NOW()) > 6 
-- order by c.customer_id
-- ;




