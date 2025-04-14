import React, { useState, useEffect, useRef } from 'react';
import './Game.css';

const boardSize = 10;
const initialSnake = [{ x: 2, y: 2 }];
const initialFood = { x: 6, y: 6 };

const Game = () => {
  const [snake, setSnake] = useState(initialSnake);
  const [food, setFood] = useState(initialFood);
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [score, setScore] = useState(0);

  const nextDirection = useRef('RIGHT');
  const allowDirectionChange = useRef(true);
  const gameInterval = useRef(null);

  const moveSnake = (snake, direction, hasEaten) => {
    const newHead = { ...snake[0] };
    if (direction === 'RIGHT') newHead.x += 1;
    if (direction === 'LEFT') newHead.x -= 1;
    if (direction === 'UP') newHead.y -= 1;
    if (direction === 'DOWN') newHead.y += 1;

    return hasEaten
      ? [newHead, ...snake]
      : [newHead, ...snake.slice(0, -1)];
  };

  const generateFood = (snake) => {
    const availableCells = [];

    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const isOccupied = snake.some(seg => seg.x === x && seg.y === y);
        if (!isOccupied) {
          availableCells.push({ x, y });
        }
      }
    }

    if (availableCells.length === 0) {
      setWin(true);
      setGameOver(true);
      clearInterval(gameInterval.current);
      return food;
    }

    const randomIndex = Math.floor(Math.random() * availableCells.length);
    return availableCells[randomIndex];
  };

  useEffect(() => {
    if (gameOver) return;

    gameInterval.current = setInterval(() => {
      setSnake(prevSnake => {
        const currentDirection = nextDirection.current;
        setDirection(currentDirection);
        allowDirectionChange.current = true;

        const head = { ...prevSnake[0] };
        if (currentDirection === 'RIGHT') head.x += 1;
        if (currentDirection === 'LEFT') head.x -= 1;
        if (currentDirection === 'UP') head.y -= 1;
        if (currentDirection === 'DOWN') head.y += 1;

        const hasEaten = head.x === food.x && head.y === food.y;
        const newSnake = moveSnake(prevSnake, currentDirection, hasEaten);

        if (hasEaten) {
          const newFood = generateFood(newSnake);
          setFood(newFood);
          setScore(prev => prev + 1);
        }

        const [newHead, ...body] = newSnake;
        if (
          newHead.x < 0 || newHead.x >= boardSize ||
          newHead.y < 0 || newHead.y >= boardSize ||
          body.some(seg => seg.x === newHead.x && seg.y === newHead.y)
        ) {
          setGameOver(true);
          clearInterval(gameInterval.current);
        }

        return newSnake;
      });
    }, 200);

    return () => clearInterval(gameInterval.current);
  }, [food, gameOver]);

  const handleKeyDown = (e) => {
    if (!allowDirectionChange.current) return;

    const opposite = {
      'UP': 'DOWN',
      'DOWN': 'UP',
      'LEFT': 'RIGHT',
      'RIGHT': 'LEFT',
    };

    const keyDirectionMap = {
      ArrowUp: 'UP',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      ArrowRight: 'RIGHT',
    };

    const newDir = keyDirectionMap[e.key];
    if (newDir && newDir !== opposite[direction]) {
      nextDirection.current = newDir;
      allowDirectionChange.current = false;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  return (
    <div className="game-container">
      <h1>스네이크 게임</h1>
      {win && <h2>🎉 승리! 보드를 모두 채웠습니다!</h2>}
      {gameOver && !win && <h2>💀 게임 오버! 점수: {score}</h2>}
      <h3>점수: {score}</h3>

      <div className="game-board">
        {Array.from({ length: boardSize }).map((_, y) => (
          <div key={y} className="row">
            {Array.from({ length: boardSize }).map((_, x) => {
              const isSnake = snake.some(seg => seg.x === x && seg.y === y);
              const isFood = food.x === x && food.y === y;
              return (
                <div
                  key={x}
                  className={`cell ${isSnake ? 'snake' : ''} ${isFood ? 'food' : ''}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Game;
