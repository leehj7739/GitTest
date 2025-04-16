const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// DB 연결 설정
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// TMDB API 설정
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// TMDB 캐시 테이블 생성
const createCacheTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tmdb_movie_cache (
        tmdb_id INT PRIMARY KEY,
        title VARCHAR(255),
        overview TEXT,
        release_date DATE,
        runtime INT,
        adult BOOLEAN,
        poster_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tmdb_actor_cache (
        tmdb_id INT PRIMARY KEY,
        name VARCHAR(255),
        profile_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('TMDB cache tables created successfully');
  } catch (error) {
    console.error('Error creating cache tables:', error);
  }
};

// 앱 시작 시 캐시 테이블 생성
createCacheTables();

// TMDB 캐시 관련 함수들
const getMovieFromCache = async (tmdbId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tmdb_movie_cache WHERE tmdb_id = ?',
      [tmdbId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error getting movie from cache:', error);
    return null;
  }
};

const saveMovieToCache = async (movie) => {
  try {
    await pool.query(`
      INSERT INTO tmdb_movie_cache 
      (tmdb_id, title, overview, release_date, runtime, adult, poster_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      overview = VALUES(overview),
      release_date = VALUES(release_date),
      runtime = VALUES(runtime),
      adult = VALUES(adult),
      poster_path = VALUES(poster_path)
    `, [
      movie.id,
      movie.title,
      movie.overview,
      movie.release_date,
      movie.runtime,
      movie.adult,
      movie.poster_path
    ]);
  } catch (error) {
    console.error('Error saving movie to cache:', error);
  }
};

const getActorFromCache = async (tmdbId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tmdb_actor_cache WHERE tmdb_id = ?',
      [tmdbId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error getting actor from cache:', error);
    return null;
  }
};

const saveActorToCache = async (actor) => {
  try {
    await pool.query(`
      INSERT INTO tmdb_actor_cache 
      (tmdb_id, name, profile_path)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      profile_path = VALUES(profile_path)
    `, [
      actor.id,
      actor.name,
      actor.profile_path
    ]);
  } catch (error) {
    console.error('Error saving actor to cache:', error);
  }
};

// 배우 이미지 검색 (캐시 사용)
app.get('/api/actor-image', async (req, res) => {
  const { name } = req.query;
  console.log('Actor image request for:', name);
  try {
    // 캐시에서 배우 정보 확인
    const [cachedActors] = await pool.query(
      'SELECT * FROM tmdb_actor_cache WHERE name LIKE ?',
      [`%${name}%`]
    );

    if (cachedActors.length > 0) {
      const actor = cachedActors[0];
      const imageUrl = actor.profile_path 
        ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
        : null;
      
      console.log('Found actor in cache:', actor.name, 'Image URL:', imageUrl);
      
      res.json({
        imageUrl,
        name: actor.name,
        isCached: true,
        cachedAt: actor.updated_at
      });
      return;
    }

    // 캐시에 없으면 TMDB API 호출
    const searchResponse = await axios.get(`${TMDB_BASE_URL}/search/person`, {
      params: {
        api_key: TMDB_API_KEY,
        query: name,
        language: 'ko-KR'
      }
    });

    if (searchResponse.data.results.length > 0) {
      const actor = searchResponse.data.results[0];
      const imageUrl = actor.profile_path 
        ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
        : null;
      
      console.log('Found actor:', actor.name, 'Image URL:', imageUrl);
      
      // 캐시에 저장
      await saveActorToCache(actor);
      
      res.json({
        imageUrl,
        name: actor.name,
        isCached: false
      });
    } else {
      console.log('No actor found for:', name);
      res.json({ imageUrl: null, isCached: false });
    }
  } catch (error) {
    console.error('Error fetching actor image:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// 테이블 목록 가져오기
app.get('/api/tables', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
      [process.env.DB_NAME]
    );
    const tables = rows.map(row => row.TABLE_NAME);
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: error.message });
  }
});

// 특정 테이블의 데이터 가져오기
app.get('/api/tables/:tableName', async (req, res) => {
  const { tableName } = req.params;
  try {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} LIMIT 100`);
    res.json(rows);
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 카테고리 목록 가져오기
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM category');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// 인기 영화 순위 (대여 횟수 기준)
app.get('/api/popular-films', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.rating,
        COUNT(r.rental_id) as rental_count
      FROM film f
      LEFT JOIN inventory i ON f.film_id = i.film_id
      LEFT JOIN rental r ON i.inventory_id = r.inventory_id
      GROUP BY f.film_id
      ORDER BY rental_count DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching popular films:', error);
    res.status(500).json({ error: error.message });
  }
});

// 영화 검색
app.get('/api/search-films', async (req, res) => {
  const { title } = req.query;
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.rating,
        GROUP_CONCAT(DISTINCT c.name) as categories,
        GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name)) as actors
      FROM film f
      LEFT JOIN film_category fc ON f.film_id = fc.film_id
      LEFT JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN film_actor fa ON f.film_id = fa.film_id
      LEFT JOIN actor a ON fa.actor_id = a.actor_id
      WHERE f.title LIKE ?
      GROUP BY f.film_id
      LIMIT 50
    `, [`%${title}%`]);

    // TMDB API를 사용하여 각 영화의 포스터 이미지 확인
    const filmsWithPosters = await Promise.all(rows.map(async (film) => {
      try {
        const searchResponse = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
          params: {
            api_key: TMDB_API_KEY,
            query: film.title,
            language: 'ko-KR'
          }
        });

        if (searchResponse.data.results.length > 0) {
          const movie = searchResponse.data.results[0];
          if (movie.poster_path) {
            return {
              ...film,
              posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            };
          }
        }
        return null;
      } catch (error) {
        console.error(`Error checking poster for ${film.title}:`, error);
        return null;
      }
    }));

    // 포스터가 있는 영화만 필터링
    const filteredFilms = filmsWithPosters.filter(film => film !== null);
    
    res.json(filteredFilms);
  } catch (error) {
    console.error('Error searching films:', error);
    res.status(500).json({ error: error.message });
  }
});

// 카테고리별 영화
app.get('/api/category-films', async (req, res) => {
  const { category } = req.query;
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.rating,
        GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name)) as actors
      FROM film f
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN film_actor fa ON f.film_id = fa.film_id
      LEFT JOIN actor a ON fa.actor_id = a.actor_id
      WHERE c.name = ?
      GROUP BY f.film_id
      LIMIT 50
    `, [category]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching category films:', error);
    res.status(500).json({ error: error.message });
  }
});

// 배우별 출연작
app.get('/api/actor-films', async (req, res) => {
  const { name } = req.query;
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.rating,
        GROUP_CONCAT(DISTINCT c.name) as categories
      FROM film f
      JOIN film_actor fa ON f.film_id = fa.film_id
      JOIN actor a ON fa.actor_id = a.actor_id
      LEFT JOIN film_category fc ON f.film_id = fc.film_id
      LEFT JOIN category c ON fc.category_id = c.category_id
      WHERE CONCAT(a.first_name, ' ', a.last_name) LIKE ?
      GROUP BY f.film_id
      LIMIT 50
    `, [`%${name}%`]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching actor films:', error);
    res.status(500).json({ error: error.message });
  }
});

// 대여 통계
app.get('/api/rental-stats', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.name as category,
        COUNT(r.rental_id) as rental_count,
        SUM(p.amount) as total_revenue
      FROM rental r
      JOIN payment p ON r.rental_id = p.rental_id
      JOIN inventory i ON r.inventory_id = i.inventory_id
      JOIN film f ON i.film_id = f.film_id
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      GROUP BY c.name
      ORDER BY rental_count DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching rental stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// 영화 포스터 검색
app.get('/api/movie-poster', async (req, res) => {
  const { title } = req.query;
  console.log('Movie poster request for:', title);
  try {
    const searchResponse = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
        language: 'ko-KR'
      }
    });
    console.log('TMDB API response:', searchResponse.data);
    console.log('Total results:', searchResponse.data.results.length);
    console.log('First result:', searchResponse.data.results[0]);

    if (searchResponse.data.results.length > 0) {
      const movie = searchResponse.data.results[0];
      const posterUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null;
      
      console.log('Found movie:', movie.title, 'Poster URL:', posterUrl);
      console.log('Movie poster path:', movie.poster_path);
      
      res.json({
        posterUrl,
        title: movie.title,
        overview: movie.overview,
        releaseDate: movie.release_date
      });
    } else {
      console.log('No movie found for:', title);
      res.json({ posterUrl: null });
    }
  } catch (error) {
    console.error('Error fetching movie poster:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// TMDB에서 영화 정보 가져오기 (캐시 사용)
app.post('/api/sync-movie', async (req, res) => {
  const { tmdbId } = req.body;
  console.log('Syncing movie with TMDB ID:', tmdbId);
  
  try {
    // 캐시에서 영화 정보 확인
    let movie = await getMovieFromCache(tmdbId);
    let credits = null;

    if (!movie) {
      // 캐시에 없으면 API 호출
      let movieResponse = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'ko-KR',
          append_to_response: 'credits'
        }
      });

      if (!movieResponse.data.overview || movieResponse.data.overview === '') {
        movieResponse = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
          params: {
            api_key: TMDB_API_KEY,
            language: 'en-US',
            append_to_response: 'credits'
          }
        });
      }

      movie = movieResponse.data;
      credits = movie.credits;
      
      // 캐시에 저장
      await saveMovieToCache(movie);
      
      // 배우 정보도 캐시에 저장
      for (const cast of movie.credits.cast.slice(0, 10)) {
        await saveActorToCache(cast);
      }
    } else {
      // 캐시에서 배우 정보 가져오기
      const actors = await Promise.all(
        movie.credits.cast.slice(0, 10).map(cast => getActorFromCache(cast.id))
      );
      credits = { cast: actors.filter(Boolean) };
    }

    // 트랜잭션 시작
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 영화 정보 저장
      const [result] = await connection.query(`
        INSERT INTO film (title, description, release_year, language_id, rental_duration, rental_rate, length, replacement_cost, rating)
        VALUES (?, ?, ?, 1, 3, 4.99, ?, 19.99, ?)
      `, [
        movie.title,
        movie.overview || '줄거리가 없습니다.',
        new Date(movie.release_date).getFullYear(),
        movie.runtime || 0,
        movie.adult ? 'NC-17' : 'PG-13'
      ]);

      const filmId = result.insertId;
      console.log('Inserted film with ID:', filmId);

      // 장르 정보 저장
      for (const genre of movie.genres) {
        const [genreResult] = await connection.query(`
          INSERT IGNORE INTO category (name)
          VALUES (?)
        `, [genre.name]);

        const [category] = await connection.query(`
          SELECT category_id FROM category WHERE name = ?
        `, [genre.name]);

        await connection.query(`
          INSERT INTO film_category (film_id, category_id)
          VALUES (?, ?)
        `, [filmId, category[0].category_id]);
      }

      // 배우 정보 저장
      for (const cast of credits.cast) {
        const [actorResult] = await connection.query(`
          INSERT IGNORE INTO actor (first_name, last_name)
          VALUES (?, ?)
        `, [cast.name.split(' ')[0], cast.name.split(' ').slice(1).join(' ') || '']);

        const [actor] = await connection.query(`
          SELECT actor_id FROM actor 
          WHERE first_name = ? AND last_name = ?
        `, [cast.name.split(' ')[0], cast.name.split(' ').slice(1).join(' ') || '']);

        await connection.query(`
          INSERT INTO film_actor (film_id, actor_id)
          VALUES (?, ?)
        `, [filmId, actor[0].actor_id]);
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: '영화 정보가 성공적으로 저장되었습니다.',
        filmId: filmId
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error syncing movie:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// TMDB 영화 검색 (캐시 사용)
app.get('/api/search-tmdb', async (req, res) => {
  const { query } = req.query;
  console.log('Searching TMDB for:', query);
  
  try {
    let searchResponse = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        language: 'ko-KR'
      }
    });

    if (searchResponse.data.results.length === 0 || !searchResponse.data.results[0].overview) {
      searchResponse = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
          language: 'en-US'
        }
      });
    }

    const movies = await Promise.all(searchResponse.data.results.map(async (movie) => {
      // 캐시에서 영화 정보 확인
      const cachedMovie = await getMovieFromCache(movie.id);
      if (cachedMovie) {
        return {
          id: cachedMovie.tmdb_id,
          title: cachedMovie.title,
          overview: cachedMovie.overview || '줄거리가 없습니다.',
          release_date: cachedMovie.release_date,
          poster_path: cachedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${cachedMovie.poster_path}` : null,
          isCached: true,
          cachedAt: cachedMovie.updated_at
        };
      }

      // 캐시에 없으면 API 응답 사용
      return {
        id: movie.id,
        title: movie.title,
        overview: movie.overview || '줄거리가 없습니다.',
        release_date: movie.release_date,
        poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        isCached: false
      };
    }));

    res.json(movies);
  } catch (error) {
    console.error('Error searching TMDB:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// 데이터베이스 백업 API
app.get('/api/backup-database', async (req, res) => {
  try {
    console.log('백업 시작');
    // 도커 컨테이너 내의 백업 디렉토리 사용
    const backupDir = '/backups';
    console.log('백업 디렉토리 경로:', backupDir);

    // 디렉토리 생성 시도
    try {
      if (!fs.existsSync(backupDir)) {
        console.log('백업 디렉토리 생성 시도');
        fs.mkdirSync(backupDir, { recursive: true });
        console.log('백업 디렉토리 생성 완료');
      } else {
        console.log('백업 디렉토리가 이미 존재함');
      }
    } catch (dirError) {
      console.error('디렉토리 생성 오류:', dirError);
      throw new Error('백업 디렉토리를 생성할 수 없습니다: ' + dirError.message);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `sakila_backup_${timestamp}.sql`);
    console.log('백업 파일 경로:', backupFile);

    // 모든 테이블의 데이터를 가져옵니다
    const [tables] = await pool.query('SHOW TABLES');
    console.log('테이블 개수:', tables.length);
    let backupContent = '';

    for (const table of tables) {
      const tableName = table[`Tables_in_${process.env.DB_NAME}`];
      console.log(`테이블 ${tableName} 백업 중...`);
      
      const [rows] = await pool.query(`SELECT * FROM ${tableName}`);
      console.log(`${tableName} 행 개수:`, rows.length);
      
      // 테이블 구조 백업
      const [createTable] = await pool.query(`SHOW CREATE TABLE ${tableName}`);
      backupContent += `\n\n-- Table structure for ${tableName}\n`;
      backupContent += `${createTable[0]['Create Table']};\n\n`;
      
      // 데이터 백업
      if (rows.length > 0) {
        backupContent += `-- Data for ${tableName}\n`;
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const value = row[col];
            return value === null ? 'NULL' : `'${value}'`;
          });
          backupContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
      }
    }

    console.log('백업 파일 쓰기 시작');
    // 백업 파일 저장
    fs.writeFileSync(backupFile, backupContent);
    console.log('백업 파일 쓰기 완료');
    
    // 파일이 실제로 생성되었는지 확인
    if (fs.existsSync(backupFile)) {
      const stats = fs.statSync(backupFile);
      console.log('백업 파일 크기:', stats.size, 'bytes');
    } else {
      throw new Error('백업 파일이 생성되지 않았습니다.');
    }
    
    res.json({
      success: true,
      message: '데이터베이스 백업이 완료되었습니다.',
      backupFile: path.basename(backupFile),
      backupPath: backupFile
    });
  } catch (error) {
    console.error('백업 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 