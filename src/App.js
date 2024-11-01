import { useState, useEffect } from 'react';
import Peer from 'peerjs';

export default function Game() {
  const WINNING_COMBINATIONS = [ [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const HOSTPLAYER = 'X';
  const CLIENTPLAYER = 'O';
  const [gameMode, setGameMode] = useState('easy');
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const bot = currentPlayer === 'X' ? 'O' : 'X';
  const [message, setMessage] = useState('');
  const [gameActive, setGameActive] = useState(true);
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);
  const [scoreDraw, setScoreDraw] = useState(0);
  const [board, setBoard] = useState(["", "", "", "", "", "", "", "", ""]);

  const [isShowGameBoard, setIsShowGameBoard] = useState(true);
  const [isShowOnlineOptions, setIsShowOnlineOptions] = useState(false);
  const [isShowStatusMsg, setIsShowStatusMsg] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Chờ kết nối!');
  const [peer, setPeer] = useState(null);
  const [conn, setConn] = useState(null);
  const [lastPeerId, setLastPeerId] = useState(null);
  const [defaultGameActiveOnline, setDefaultGameActiveOnline] = useState(false);
  const [defaultPlayerOnline, setDefaultPlayerOnline] = useState('X');

  useEffect(() => {
    initializePeer();
  }, []);

  const initializePeer = () => {
    const newPeer = new Peer(null, {debug: 2});
    setPeer(newPeer);
    newPeer.on('open', (id) => {
        if(newPeer.id === null)
        {
          console.log('Error: Peer ID is null');
          newPeer.id = lastPeerId;
        }else
        {
          setLastPeerId(newPeer.id);
        }
        console.log('ID: ' + newPeer.id);
        setStatusMsg('ID phòng bạn: ' + newPeer.id);
    });
    newPeer.on('connection', (c) => {
        const newConn = c;
        if(conn && conn.open)
        {
          newConn.on('open', () => {
            newConn.send('Already connected to another client');
            setTimeout(() => {newConn.close();}, 500);
          });
          return;
        }
        setConn(newConn);
        newConn.on('open', () => {
            console.log('Connected to: ' + newConn.peer);
            setStatusMsg('Đã kết nối với: ' + newConn.peer + ' - Bạn là ' + HOSTPLAYER);
            setMessage('Lượt chơi của ' + HOSTPLAYER);
            setDefaultPlayerOnline(HOSTPLAYER);
            setCurrentPlayer(HOSTPLAYER);
            setGameActive(true);
            setDefaultGameActiveOnline(true);
            setIsShowGameBoard(true);
            setIsShowOnlineOptions(false);
        });
        readyPlayOnline(newConn)
    });
    newPeer.on('disconnected', () => {
      console.log('Connection lost. Please reconnect');
      setStatusMsg('Kết nối bị mất. Vui lòng kết nối lại');
      setGameActive(false);
    });

    newPeer.on('close', () => {
      setConn(null);
      console.log('Connection destroyed');
      setStatusMsg('Kết nối bị hủy');
      setGameActive(false);
    });

    newPeer.on('error', (err) => {
      console.log(err);
      setStatusMsg('Lỗi: ' + err);
      setGameActive(false);
    });
  };

  function readyPlayOnline(connparam){
    connparam.on('data', (data) => {
        setBoard(data.board);
        setCurrentPlayer(data.player);
        let player = data.player === 'X' ? 'X' : 'O';
        if(checkWinOnline(player, data.board))
        {
          if(player === 'X') {
            setScoreX(scoreX + 1);
            setMessage('X thắng!');
            setGameActive(false);
            resetGameOnline();
          }else
          {
            setScoreO(scoreO + 1);
            setMessage('O thắng!');
            setGameActive(false);
            resetGameOnline();
          }
        } else if ( data.board.every(cell => cell !== "")) {
          setScoreDraw(scoreDraw + 1);
          setMessage('Hòa!');
          setGameActive(false);
          resetGameOnline();
        }else
        {
          setCurrentPlayer(player === 'X' ? 'O' : 'X');
          if(player === 'X') setMessage('Lượt chơi của O');
          else setMessage('Lượt chơi của X');
          setGameActive(true);
        }
    });
  }

  useEffect(() => {
    setCurrentPlayer('X');
    setIsShowGameBoard(true);
    setIsShowOnlineOptions(false);
    setIsShowStatusMsg(false);
    resetGame();
    switch (gameMode) {
      case 'easy':
        setMessage('Lượt chơi của ' + currentPlayer);
        break;
      case 'medium':
        setMessage('Lượt chơi của ' + currentPlayer);
        break;
      case 'hard':
        setMessage('Lượt chơi của ' + currentPlayer);
        break;
      case 'friends':
        resetScore();
        break;
      case 'online':
        setIsShowGameBoard(false);
        setIsShowStatusMsg(true);
        setIsShowOnlineOptions(true);
        setGameActive(false);
        setMessage('');
        resetScore();
        break;
      default:
        SetGameMode('easy');
        setCurrentPlayer('X');
        setMessage('Lượt chơi của ' + currentPlayer);
        break;
    }
  }, [gameMode]);

  function handleCellClick(index) {
    if (board[index] === "" && gameActive) {
        board[index] = currentPlayer;
        if(gameMode === "online" && conn && conn.open && gameActive)
          {
            board[index] = defaultPlayerOnline;
            conn.send({index: index, board: board, player: currentPlayer});
            setGameActive(false);
          } 

        if (checkWin(currentPlayer)) {
          if(currentPlayer === 'X') {
            setScoreX(scoreX + 1);
            setMessage('X thắng!');
            setGameActive(false);
            if(gameMode === "online") resetGameOnline();
          }else
          {
            setScoreO(scoreO + 1);
            setMessage('O thắng!');
            setGameActive(false);
            if(gameMode === "online") resetGameOnline();
          }
        } else if ( board.every(cell => cell !== "")) {
          setScoreDraw(scoreDraw + 1);
          setMessage('Hòa!');
          setGameActive(false);
          if(gameMode === "online") resetGameOnline();
        }
        else {
          setMessage('Lượt chơi của ' + (currentPlayer === 'X' ? 'O' : 'X'));
          if(gameMode !== "friends" && gameMode !== "online") botMove();
          else setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
          // setGameActive(true);
        }
    }
  }

  function resetScore() {
    setScoreX(0);
    setScoreO(0);
    setScoreDraw(0);
  }

  function resetGame() {
    setBoard(["", "", "", "", "", "", "", "", ""]);
    setCurrentPlayer('X');
    setMessage('Lượt chơi của ' + currentPlayer);
    setGameActive(true);
  }

  function resetGameOnline() {
    setStatusMsg("Đếm ngược 3s để khởi động lại trò chơi");
    setTimeout(() => {
      setStatusMsg('Đã kết nối với: ' + conn.peer + ' - Bạn là ' + defaultPlayerOnline);
      setBoard(["", "", "", "", "", "", "", "", ""]);
      setCurrentPlayer(defaultPlayerOnline);
      setMessage('Lượt chơi của ' + HOSTPLAYER);
      setGameActive(defaultGameActiveOnline);
    }, 3000);
  }

  function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
      return combination.every(index => {
        return board[index] === currentClass;
      });
    });
  }

  function checkWinOnline(currentClass, onboard) {
    return WINNING_COMBINATIONS.some(combination => {
      return combination.every(index => {
        return onboard[index] === currentClass;
      });
    });
  }

  function botMove()
  {
    
    if(!gameActive) return;
    let botIndex;
    if (gameMode === "easy") {
        botIndex = getEasyMove();
    } else if (gameMode === "medium") {
        botIndex = getMediumMove();
    } else {
        botIndex = getBestMove(); 
    }
    let newBoard = board.map((cell, index) => index === botIndex ? bot : cell);
    setBoard(newBoard);

    if (checkWinOnline(bot, newBoard)) {
        if (bot === "X") {
            setScoreX(scoreX + 1);
            setMessage("X thắng!");
            setGameActive(false);
        } else {
            setScoreO(scoreO + 1);
            setMessage("O thắng!");
            setGameActive(false);
        }
    } else if (board.every(cell => cell !== "")) {
        setScoreDraw(scoreDraw + 1);
        setMessage("Hòa!");
        setGameActive(false);
    }else {
        setMessage("Lượt chơi của " + currentPlayer);
    }
  }

  function getEasyMove() {
      const emptyCells = board.map((cell, index) => cell === "" ? index : null).filter(cell => cell !== null);
      const corners = [0, 2, 6, 8];
      if(emptyCells.length === 9){
        return corners[Math.floor(Math.random() * corners.length)];
      }
      for (let i = 0; i < emptyCells.length; i++) {
        const index = emptyCells[i];
        board[index] = currentPlayer;
        if (checkWin(currentPlayer)) {
            board[index] = "";
            continue; 
        }
        board[index] = "";
      }
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  function getMediumMove() {
    const emptyCells = board.map((cell, index) => cell === "" ? index : null).filter(index => index !== null);
    const edges = [1, 3, 5, 7];
    const center = 4;

    if (emptyCells.length === 8 && board[center] === currentPlayer) { 
        return edges[Math.floor(Math.random() * edges.length)]; 
    }


    for (let i = 0; i < emptyCells.length; i++) {
        const index = emptyCells[i];
        board[index] = currentPlayer;
        if (checkWin(currentPlayer)) {
            board[index] = "";
            return index; 
        }
        board[index] = "";
    }


    for (let i = 0; i < emptyCells.length; i++) {
        const adjacentCells = getAdjacentCells(bot); 
        if (adjacentCells.includes(emptyCells[i])) {
            return emptyCells[i];
        }
    }


    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  function getAdjacentCells(bot) {
    const adjacents = {
        0: [1, 3], 1: [0, 2, 4], 2: [1, 5],
        3: [0, 4, 6], 4: [1, 3, 5, 7], 5: [2, 4, 8],
        6: [3, 7], 7: [4, 6, 8], 8: [5, 7]
    };
    const botCells = board.map((cell, index) => cell === bot ? index : null).filter(index => index !== null);
    return botCells.reduce((acc, index) => acc.concat(adjacents[index] || []), []);
  }

  function getBestMove() {
    let bestScore = -Infinity;
    let move;

    for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
            board[i] = bot;
            let score = minimax(board, 0, false);
            board[i] = "";
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
  }

  function minimax(newBoard, depth, isMaximizing) {
      if (checkWin(bot)) return 10 - depth;
      if (checkWin(currentPlayer)) return depth - 10;
      if (newBoard.every(cell => cell !== "")) return 0;

      if (isMaximizing) {
          let bestScore = -Infinity;
          for (let i = 0; i < newBoard.length; i++) {
              if (newBoard[i] === "") {
                  newBoard[i] = bot;
                  let score = minimax(newBoard, depth + 1, false);
                  newBoard[i] = "";
                  bestScore = Math.max(score, bestScore);
              }
          }
          return bestScore;
      } else {
          let bestScore = Infinity;
          for (let i = 0; i < newBoard.length; i++) {
              if (newBoard[i] === "") {
                  newBoard[i] = currentPlayer;
                  let score = minimax(newBoard, depth + 1, true);
                  newBoard[i] = "";
                  bestScore = Math.min(score, bestScore);
              }
          }
          return bestScore;
      }
  }

  function joinRoom(roomID) {
      if(conn) conn.close();
      console.log('Joining room: ' + roomID);
      const newConn = peer.connect(roomID, {reliable: true});
      setConn(newConn);
      newConn.on('open', () => {
        console.log('Connected to: ' + newConn.peer);
        setStatusMsg('Đã kết nối với: ' + newConn.peer + ' - Bạn là ' + CLIENTPLAYER);
        setMessage('Lượt chơi của ' + HOSTPLAYER);
        setCurrentPlayer(CLIENTPLAYER);
        setDefaultPlayerOnline(CLIENTPLAYER);
        setGameActive(false);
        setDefaultGameActiveOnline(false);
        setIsShowGameBoard(true);
        setIsShowOnlineOptions(false);
      });
      readyPlayOnline(newConn);
  }

  return (
    <>
      <h1 className="game-title">Tic Tac Toe</h1>
      <div className="difficulty-selection">
        <label>Chọn chế độ: </label>
        <select id="mode" onChange={ (e) => setGameMode(e.target.value)}  value={gameMode} >
          <option value="easy">Dễ</option>
          <option value="medium">Trung Bình</option>
          <option value="hard">Khó</option>
          <option value="friends">Chơi với Bạn Bè</option>
          <option value="online">Chơi Online</option>
        </select>
      </div>
      <div className="scoreboard">
        <div className="score-header">X</div>
        <div className="score-header">O</div>
        <div className="score-header">Hòa</div>
        <div className="score-value" id="scoreX">{scoreX}</div>
        <div className="score-value" id="scoreO">{scoreO}</div>
        <div className="score-value" id="scoreDraw">{scoreDraw}</div>
      </div>
      <div id="message">{message}</div>
      {
        isShowStatusMsg && (
          <div id="status-msg">{statusMsg}</div>
        )       
      }
      {
        isShowOnlineOptions && (
          <>
            <div id="online-options">
                  <input type="text" id="room-id" placeholder="Nhập ID Phòng"></input>
                  <button onClick={ () => joinRoom(document.getElementById('room-id').value)}>Nhập Phòng</button>
            </div>
          </>
        )
      }
      {
        isShowGameBoard && (
          <div id="game-board">
              <div className={ board[0] === "" ? 'cell' : 'cell taken' } onClick={ () => handleCellClick(0)}>{board[0]}</div>
              <div className={ board[1] === "" ? 'cell' : 'cell taken' } onClick={ () => handleCellClick(1)}>{board[1]}</div>
              <div className={ board[2] === "" ? 'cell' : 'cell taken' } onClick={ () => handleCellClick(2)}>{board[2]}</div>
              <div className={ board[3] === "" ? 'cell' : 'cell taken' } onClick={ () => handleCellClick(3)}>{board[3]}</div>
              <div className={ board[4] === "" ? 'cell' : 'cell taken' } onClick={ () => handleCellClick(4)}>{board[4]}</div>
              <div className={ board[5] === "" ? 'cell' : 'cell taken' } onClick={ () => handleCellClick(5)}>{board[5]}</div>
              <div className={ board[6] === "" ? 'cell' : 'cell taken' } onClick={ () => handleCellClick(6)}>{board[6]}</div>
              <div className={ board[7] === "" ? 'cell' : 'cell taken' } onClick={ () => handleCellClick(7)}>{board[7]}</div>
              <div className={ board[8] === "" ? 'cell' : 'cell taken' } onClick={ () => handleCellClick(8)}>{board[8]}</div>
          </div>
        )
      }
      {
        gameMode !== "online" && (
          <button id="button-reset" onClick={resetGame}>Khởi động lại trò chơi</button>
        )
      }
    </>
  );
}
