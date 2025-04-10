// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUser, setNewUser] = useState({ username: '', email: '' });

  // API의 기본 URL - 환경 변수에서 가져오거나 기본값 사용
  const API_URL = process.env.REACT_APP_API_URL || '/lkz/api';

  // 사용자 목록 불러오기
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) {
        throw new Error('서버에서 데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('사용자 데이터 로딩 중 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트시 사용자 목록 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  // 입력 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  // 사용자 추가
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error('사용자 추가에 실패했습니다.');
      }

      // 성공시 사용자 목록 갱신
      fetchUsers();
      // 입력 필드 초기화
      setNewUser({ username: '', email: '' });
    } catch (err) {
      setError(err.message);
      console.error('사용자 추가 중 오류:', err);
    }
  };

  // 사용자 삭제
  const handleDeleteUser = async (id) => {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('사용자 삭제에 실패했습니다.');
      }

      // 성공시 사용자 목록 갱신
      fetchUsers();
    } catch (err) {
      setError(err.message);
      console.error('사용자 삭제 중 오류:', err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>3-Tier 아키텍처 데모</h1>
        <div className="server-info">
          <h3>서버 정보:</h3>
          <p>프론트엔드 환경: {process.env.NODE_ENV}</p>
          <p>백엔드 API URL: {API_URL}</p>
        </div>
      </header>

      <main>
        {/* 사용자 추가 양식 */}
        <section className="add-user-section">
          <h2>새 사용자 추가</h2>
          <form onSubmit={handleAddUser}>
            <div className="form-group">
              <label htmlFor="username">사용자명:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={newUser.username}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">이메일:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <button type="submit">사용자 추가</button>
          </form>
        </section>

        {/* 사용자 목록 */}
        <section className="users-section">
          <h2>사용자 목록</h2>
          {error && <p className="error-message">{error}</p>}
          {loading ? (
            <p>데이터를 불러오는 중...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>사용자명</th>
                  <th>이메일</th>
                  <th>생성일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5">사용자 데이터가 없습니다.</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{new Date(user.created_at).toLocaleString()}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="delete-btn"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;