import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [selectedFeature, setSelectedFeature] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [actorImages, setActorImages] = useState({});
  const [moviePosters, setMoviePosters] = useState({});
  const [tmdbMovies, setTmdbMovies] = useState([]);
  const [tmdbSearchTerm, setTmdbSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);

  // 카테고리 목록 가져오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // 배우 이미지 가져오기
  const fetchActorImage = async (actorName) => {
    if (!actorImages[actorName]) {
      console.log('Fetching image for actor:', actorName);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/actor-image?name=${actorName}`);
        console.log('Actor image response:', response.data);
        setActorImages(prev => ({
          ...prev,
          [actorName]: response.data
        }));
      } catch (error) {
        console.error('Error fetching actor image:', error);
        console.error('Error details:', error.response?.data || error.message);
      }
    }
  };

  const fetchMoviePoster = async (title) => {
    if (!moviePosters[title]) {
      console.log('Fetching poster for movie:', title);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/movie-poster?title=${title}`);
        console.log('Movie poster response:', response.data);
        setMoviePosters(prev => ({
          ...prev,
          [title]: response.data
        }));
      } catch (error) {
        console.error('Error fetching movie poster:', error);
        console.error('Error details:', error.response?.data || error.message);
      }
    }
  };

  // 영화 포스터 컴포넌트
  const MoviePoster = ({ title, posterUrl, isCached, cachedAt }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    return (
      <div className="movie-poster">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : posterUrl ? (
          <div className="poster-container">
            <img 
              src={posterUrl} 
              alt={title} 
              className={`poster-image ${isCached ? 'cached' : ''}`}
              onError={() => setError('포스터를 불러올 수 없습니다')}
            />
            {isCached && (
              <div className="cache-badge">
                <span className="cache-icon">💾</span>
                <span className="cache-text">캐시됨</span>
                {cachedAt && (
                  <span className="cache-time">
                    {new Date(cachedAt).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="no-poster">포스터 없음</div>
        )}
        <div className="movie-title">{title}</div>
      </div>
    );
  };

  // 선택된 기능에 따라 데이터 가져오기
  useEffect(() => {
    if (selectedFeature) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          let url = `${process.env.REACT_APP_API_URL}/api/`;
          switch (selectedFeature) {
            case 'popular':
              url += 'popular-films';
              break;
            case 'search':
              url += `search-films?title=${searchTerm}`;
              break;
            case 'category':
              url += `category-films?category=${selectedCategory}`;
              break;
            case 'actors':
              url += `actor-films?name=${searchTerm}`;
              break;
            case 'rentals':
              url += 'rental-stats';
              break;
            default:
              return;
          }
          const response = await axios.get(url);
          setData(response.data);

          // 영화 포스터 가져오기
          response.data.forEach(film => {
            fetchMoviePoster(film.title);
          });

          // 배우 이미지 가져오기
          if (selectedFeature === 'category' || selectedFeature === 'search') {
            response.data.forEach(film => {
              if (film.actors) {
                film.actors.split(',').forEach(actor => {
                  fetchActorImage(actor.trim());
                });
              }
            });
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setError('데이터를 불러오는데 실패했습니다.');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [selectedFeature, searchTerm, selectedCategory]);

  // 배우 이미지 컴포넌트
  const ActorImage = ({ name, imageUrl, isCached, cachedAt }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    return (
      <div className="actor-card">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : imageUrl ? (
          <div className="image-container">
            <img 
              src={imageUrl} 
              alt={name} 
              className={`actor-image ${isCached ? 'cached' : ''}`}
              onError={() => setError('이미지를 불러올 수 없습니다')}
            />
            {isCached && (
              <div className="cache-badge">
                <span className="cache-icon">💾</span>
                <span className="cache-text">캐시됨</span>
                {cachedAt && (
                  <span className="cache-time">
                    {new Date(cachedAt).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="no-image">이미지 없음</div>
        )}
        <div className="actor-name">{name}</div>
      </div>
    );
  };

  const searchTmdbMovies = async () => {
    if (!tmdbSearchTerm) return;
    
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/search-tmdb?query=${tmdbSearchTerm}`);
      setTmdbMovies(response.data);
    } catch (error) {
      console.error('Error searching TMDB:', error);
      setError('TMDB 검색 중 오류가 발생했습니다.');
    }
  };

  const syncMovie = async (tmdbId) => {
    setSyncing(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/sync-movie`, { tmdbId });
      if (response.data.success) {
        setTmdbMovies(prev => prev.filter(movie => movie.id !== tmdbId));
        alert('영화가 성공적으로 저장되었습니다!');
        
        // 현재 선택된 기능의 데이터를 새로고침
        if (selectedFeature) {
          const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
              let url = `${process.env.REACT_APP_API_URL}/api/`;
              switch (selectedFeature) {
                case 'popular':
                  url += 'popular-films';
                  break;
                case 'search':
                  url += `search-films?title=${searchTerm}`;
                  break;
                case 'category':
                  url += `category-films?category=${selectedCategory}`;
                  break;
                case 'actors':
                  url += `actor-films?name=${searchTerm}`;
                  break;
                case 'rentals':
                  url += 'rental-stats';
                  break;
                default:
                  return;
              }
              const response = await axios.get(url);
              setData(response.data);

              // 영화 포스터 가져오기
              response.data.forEach(film => {
                fetchMoviePoster(film.title);
              });

              // 배우 이미지 가져오기
              if (selectedFeature === 'category' || selectedFeature === 'search') {
                response.data.forEach(film => {
                  if (film.actors) {
                    film.actors.split(',').forEach(actor => {
                      fetchActorImage(actor.trim());
                    });
                  }
                });
              }
            } catch (error) {
              console.error('Error fetching data:', error);
              setError('데이터를 불러오는데 실패했습니다.');
            } finally {
              setLoading(false);
            }
          };

          fetchData();
        }
      }
    } catch (error) {
      console.error('Error syncing movie:', error);
      setError('영화 저장 중 오류가 발생했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/backup-database`);
      setBackupStatus({
        success: true,
        message: response.data.message,
        file: response.data.backupFile,
        backupPath: response.data.backupPath
      });
    } catch (error) {
      setBackupStatus({
        success: false,
        message: '백업 중 오류가 발생했습니다.',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Sakila 영화 대여 시스템</h1>
      
      <div className="feature-selector">
        <select 
          value={selectedFeature}
          onChange={(e) => setSelectedFeature(e.target.value)}
        >
          <option value="">기능을 선택하세요</option>
          <option value="popular">인기 영화 순위</option>
          <option value="search">영화 검색</option>
          <option value="category">카테고리별 영화</option>
          <option value="actors">배우별 출연작</option>
          <option value="rentals">대여 통계</option>
          <option value="tmdb">TMDB 영화 추가</option>
        </select>
        
        <button 
          className="backup-button"
          onClick={handleBackup}
          disabled={loading}
        >
          {loading ? '백업 중...' : '데이터베이스 백업'}
        </button>
      </div>

      {backupStatus && (
        <div className={`backup-status ${backupStatus.success ? 'success' : 'error'}`}>
          {backupStatus.message}
          {backupStatus.file && (
            <div className="backup-file">
              백업 파일: {backupStatus.file}
              {backupStatus.backupPath && (
                <div className="backup-path">
                  저장 경로: {backupStatus.backupPath}
                </div>
              )}
            </div>
          )}
          {backupStatus.error && (
            <div className="backup-error">
              오류: {backupStatus.error}
            </div>
          )}
        </div>
      )}

      {selectedFeature === 'tmdb' && (
        <div className="tmdb-search">
          <div className="search-box">
            <input
              type="text"
              placeholder="TMDB에서 영화 검색"
              value={tmdbSearchTerm}
              onChange={(e) => setTmdbSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchTmdbMovies()}
            />
            <button onClick={searchTmdbMovies}>검색</button>
          </div>

          {tmdbMovies.length > 0 && (
            <div className="tmdb-results">
              <h2>검색 결과</h2>
              <div className="movie-grid">
                {tmdbMovies.map(movie => (
                  <div key={movie.id} className="movie-card">
                    {movie.poster_path ? (
                      <img src={movie.poster_path} alt={movie.title} className="poster-image" />
                    ) : (
                      <div className="no-poster">포스터 없음</div>
                    )}
                    <div className="movie-info">
                      <h3>{movie.title}</h3>
                      <p className="release-date">{movie.release_date}</p>
                      <p className="overview">{movie.overview}</p>
                      <button 
                        onClick={() => syncMovie(movie.id)}
                        disabled={syncing}
                      >
                        {syncing ? '저장 중...' : '데이터베이스에 저장'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedFeature === 'search' && (
        <div className="search-box">
          <input
            type="text"
            placeholder="영화 제목을 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {selectedFeature === 'category' && (
        <div className="category-selector">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">카테고리를 선택하세요</option>
            {categories.map(category => (
              <option key={category.category_id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedFeature === 'actors' && (
        <div className="search-box">
          <input
            type="text"
            placeholder="배우 이름을 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">데이터를 불러오는 중...</div>
      ) : data.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>포스터</th>
                {Object.keys(data[0]).filter(key => key !== 'posterUrl' && key !== 'isCached' && key !== 'cachedAt').map(key => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  <td>
                    <MoviePoster 
                      title={row.title} 
                      posterUrl={row.posterUrl} 
                      isCached={row.isCached}
                      cachedAt={row.cachedAt}
                    />
                  </td>
                  {Object.entries(row)
                    .filter(([key]) => key !== 'posterUrl' && key !== 'isCached' && key !== 'cachedAt')
                    .map(([key, value]) => (
                      <td key={key}>
                        {key === 'actors' && value ? (
                          <div className="actors-container">
                            {value.split(',').map(actor => (
                              <ActorImage 
                                key={actor} 
                                name={actor.trim()} 
                                imageUrl={actorImages[actor.trim()]?.imageUrl}
                                isCached={actorImages[actor.trim()]?.isCached}
                                cachedAt={actorImages[actor.trim()]?.cachedAt}
                              />
                            ))}
                          </div>
                        ) : value}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedFeature && !loading && (
        <div className="no-data">데이터가 없습니다.</div>
      )}
    </div>
  );
}

export default App; 