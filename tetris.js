class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        this.pieces = [
            // I piece
            {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00ffff'
            },
            // O piece
            {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffff00'
            },
            // T piece
            {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#800080'
            },
            // S piece
            {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00ff00'
            },
            // Z piece
            {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#ff0000'
            },
            // J piece
            {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#0000ff'
            },
            // L piece
            {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#ffa500'
            }
        ];
        
        this.init();
    }
    
    init() {
        this.initBoard();
        this.setupEventListeners();
        this.updateDisplay();
        this.draw(); // Draw initial empty board - THIS IS NEEDED!
    }
    
    initBoard() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('showHighScoresBtn').addEventListener('click', () => this.showHighScores());
        document.getElementById('closeHighScoresBtn').addEventListener('click', () => this.closeHighScores());
        document.getElementById('submitInitialsBtn').addEventListener('click', () => this.submitInitials());
        
        // Allow Enter key to submit initials
        document.getElementById('initialsEntry').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitInitials();
            }
        });
        
        // Limit initials input to 3 characters
        document.getElementById('initialsEntry').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().substring(0, 3);
        });
        
        // Close modal when clicking outside
        const modal = document.getElementById('highScoresModal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeHighScores();
            }
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;
        
        switch(e.code) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                this.rotatePiece();
                break;
            case 'Space':
                this.hardDrop();
                e.preventDefault();
                break;
            case 'KeyP':
                this.togglePause();
                break;
        }
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = 1000;
        
        this.initBoard();
        this.dropTime = Date.now(); // THIS IS NEEDED TOO!
        this.spawnPiece();
        this.spawnNextPiece();
        this.updateDisplay();
        this.gameLoop();
        
        document.getElementById('gameOver').style.display = 'none';
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.gamePaused ? 'RESUME' : 'PAUSE';
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.initBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.updateDisplay();
        this.draw();
        
        document.getElementById('pauseBtn').textContent = 'PAUSE';
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('initialsInput').style.display = 'none';
    }
    
    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            this.currentPiece = this.createPiece();
        }
        
        this.spawnNextPiece();
        
        // Check for game over
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
    }
    
    spawnNextPiece() {
        this.nextPiece = this.createPiece();
        this.drawNextPiece();
    }
    
    createPiece() {
        const piece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        return {
            shape: piece.shape,
            color: piece.color,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2),
            y: 0
        };
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        
        if (!this.checkCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.draw();
        } else if (dy > 0) {
            // Piece has landed
            this.placePiece();
            this.clearLines();
            this.spawnPiece();
        }
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            // Try wall kicks
            if (!this.checkCollision(this.currentPiece, -1, 0)) {
                this.currentPiece.x -= 1;
            } else if (!this.checkCollision(this.currentPiece, 1, 0)) {
                this.currentPiece.x += 1;
            } else if (!this.checkCollision(this.currentPiece, 0, -1)) {
                this.currentPiece.y -= 1;
            } else {
                // Can't rotate
                this.currentPiece.shape = originalShape;
            }
        }
        
        this.draw();
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    hardDrop() {
        if (!this.currentPiece) return;
        
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
        }
        
        this.placePiece();
        this.clearLines();
        this.spawnPiece();
    }
    
    checkCollision(piece, dx, dy) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
                        boardY >= this.BOARD_HEIGHT || 
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    placePiece() {
        if (!this.currentPiece) return;
        
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.updateLevel();
            this.updateDisplay();
        }
    }
    
    calculateScore(linesCleared) {
        const baseScore = [0, 40, 100, 300, 1200];
        return baseScore[linesCleared] * this.level;
    }
    
    updateLevel() {
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
        }
        
        // Update speed based on score thresholds (every 2000 points)
        const scoreThreshold = Math.floor(this.score / 2000);
        const baseInterval = 1000;
        const speedIncrease = scoreThreshold * 100; // Decrease by 100ms per threshold
        this.dropInterval = Math.max(50, baseInterval - speedIncrease);
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('initialsFinalScore').textContent = this.score;
        
        // Show initials input if score qualifies for high scores
        const highScores = this.getHighScores();
        const lowestHighScore = highScores.length > 0 ? highScores[highScores.length - 1].score : 0;
        
        if (this.score > lowestHighScore || highScores.length < 10) {
            document.getElementById('initialsInput').style.display = 'flex';
            document.getElementById('initialsEntry').value = '';
            document.getElementById('initialsEntry').focus();
        } else {
            document.getElementById('gameOver').style.display = 'flex';
        }
    }
    
    getHighScores() {
        const scores = localStorage.getItem('tetrisHighScores');
        return scores ? JSON.parse(scores) : [];
    }
    
    saveHighScore(initials) {
        const highScores = this.getHighScores();
        highScores.push({
            initials: initials.toUpperCase().substring(0, 3),
            score: this.score,
            date: new Date().toISOString()
        });
        
        // Sort by score descending and keep top 10
        highScores.sort((a, b) => b.score - a.score);
        const topScores = highScores.slice(0, 10);
        
        localStorage.setItem('tetrisHighScores', JSON.stringify(topScores));
        return topScores;
    }
    
    submitInitials() {
        const initialsInput = document.getElementById('initialsEntry');
        let initials = initialsInput.value.trim();
        
        if (initials.length === 0) {
            initials = 'AAA';
        }
        
        this.saveHighScore(initials);
        document.getElementById('initialsInput').style.display = 'none';
        document.getElementById('gameOver').style.display = 'flex';
    }
    
    showHighScores() {
        const highScores = this.getHighScores();
        const highScoresList = document.getElementById('highScoresList');
        highScoresList.innerHTML = '';
        
        if (highScores.length === 0) {
            highScoresList.innerHTML = '<li class="no-scores">No high scores yet!</li>';
        } else {
            highScores.forEach((entry, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="rank">#${index + 1}</span>
                    <span class="initials">${entry.initials}</span>
                    <span class="score-value">${entry.score.toLocaleString()}</span>
                `;
                highScoresList.appendChild(li);
            });
        }
        
        document.getElementById('highScoresModal').style.display = 'flex';
    }
    
    closeHighScores() {
        document.getElementById('highScoresModal').style.display = 'none';
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        const now = Date.now();
        if (now - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = now;
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }
        
        // Draw grid
        this.drawGrid();
    }
    
    drawBlock(x, y, color) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        // Block fill
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Block border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Inner highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(pixelX + 2, pixelY + 2, this.BLOCK_SIZE - 4, 4);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawNextPiece() {
        if (!this.nextPiece) return;
        
        // Clear next canvas
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const blockSize = 20;
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
        
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x]) {
                    const pixelX = offsetX + x * blockSize;
                    const pixelY = offsetY + y * blockSize;
                    
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(pixelX, pixelY, blockSize, blockSize);
                    
                    this.nextCtx.strokeStyle = '#fff';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(pixelX, pixelY, blockSize, blockSize);
                }
            }
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Tetris();
});
