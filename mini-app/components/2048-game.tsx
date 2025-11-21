"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const SIZE = 4;

type Board = number[][];

function createEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandomTile(board: Board): Board {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newBoard = board.map(row => row.slice());
  newBoard[r][c] = value;
  return newBoard;
}

function rotate(board: Board, times: number): Board {
  let newBoard = board.map(row => row.slice());
  for (let t = 0; t < times; t++) {
    const rotated: Board = createEmptyBoard();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        rotated[c][SIZE - 1 - r] = newBoard[r][c];
      }
    }
    newBoard = rotated;
  }
  return newBoard;
}

function compress(board: Board): { board: Board; scoreDelta: number } {
  let scoreDelta = 0;
  const newBoard = board.map(row => {
    const filtered = row.filter(v => v !== 0);
    const merged: number[] = [];
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2;
        merged.push(mergedVal);
        scoreDelta += mergedVal;
        i += 2;
      } else {
        merged.push(filtered[i]);
        i += 1;
      }
    }
    while (merged.length < SIZE) merged.push(0);
    return merged;
  });
  return { board: newBoard, scoreDelta };
}

function move(board: Board, dir: "up" | "down" | "left" | "right"): { board: Board; scoreDelta: number } {
  let rotated = board;
  let times = 0;
  if (dir === "up") times = 1;
  else if (dir === "right") times = 2;
  else if (dir === "down") times = 3;
  rotated = rotate(board, times);
  const { board: compressed, scoreDelta } = compress(rotated);
  const restored = rotate(compressed, (4 - times) % 4);
  return { board: restored, scoreDelta };
}

function canMove(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() => {
    let b = createEmptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    return b;
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const handleMove = (dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const { board: newBoard, scoreDelta } = move(board, dir);
    if (JSON.stringify(newBoard) === JSON.stringify(board)) return;
    const withTile = addRandomTile(newBoard);
    setBoard(withTile);
    setScore(prev => prev + scoreDelta);
    if (!canMove(withTile)) setGameOver(true);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") handleMove("up");
      else if (e.key === "ArrowDown") handleMove("down");
      else if (e.key === "ArrowLeft") handleMove("left");
      else if (e.key === "ArrowRight") handleMove("right");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [board, gameOver, handleMove]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((v, i) => (
          <div
            key={i}
            className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-2xl font-bold"
          >
            {v !== 0 ? v : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => handleMove("up")}>
          <ArrowUp />
        </Button>
        <Button variant="outline" onClick={() => handleMove("left")}>
          <ArrowLeft />
        </Button>
        <Button variant="outline" onClick={() => handleMove("right")}>
          <ArrowRight />
        </Button>
        <Button variant="outline" onClick={() => handleMove("down")}>
          <ArrowDown />
        </Button>
      </div>
      <div className="text-xl font-semibold">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg font-bold">Game Over!</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
