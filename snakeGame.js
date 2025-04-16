class Graph {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.obstacles = [];
    }

    isInside(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }


    addObstacle(x, y) {
        if (this.isInside(x, y)) {
            this.obstacles.push({ x, y });
        }
    }

    isObstacle(x, y) {
        return this.obstacles.some(obstacle => obstacle.x === x && obstacle.y === y);
    }
}

class SnakeGame {
    constructor(width, height) {
        this.graph = new Graph(width, height);
        this.snake = [{ x: Math.floor(width / 2), y: Math.floor(height / 2) }];
        this.food = {};
        this.generateFood();
    }

    initializeObstacles() {
        // Example: Add obstacles at specific positions
        this.graph.addObstacle(5, 5);
        this.graph.addObstacle(6, 5);
        this.graph.addObstacle(7, 5);
    }

    generateFood() {
        let x, y;
        do {
            x = Math.floor(Math.random() * this.graph.width);
            y = Math.floor(Math.random() * this.graph.height);
        } while (this.isSnakeNode(x, y));
        this.food = { x, y };
    }

    isSnakeNode(x, y) {
        return this.snake.some(segment => segment.x === x && segment.y === y);
    }


    move(direction) {
        let newHead = { ...this.snake[0] };
        if (direction === 'w') newHead.y -= 1; // Move up
        if (direction === 's') newHead.y += 1; // Move down
        if (direction === 'a') newHead.x -= 1; // Move left
        if (direction === 'd') newHead.x += 1; // Move right

        if (!this.graph.isInside(newHead.x, newHead.y) || this.isSnakeNode(newHead.x, newHead.y)) {
            return false; // Game over
        }

        this.snake.unshift(newHead);

        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.generateFood(); // Generate new food
        } else {
            this.snake.pop(); // Remove the tail
        }

        return true;
    }

    display() {
        const gameElement = document.getElementById('game');
        gameElement.innerHTML = ''; // Clear the previous display
    
        for (let y = 0; y < this.graph.height; ++y) {
            for (let x = 0; x < this.graph.width; ++x) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
    
                if (this.isSnakeNode(x, y)) {
                    cell.classList.add('snake');
                } else if (this.food.x === x && this.food.y === y) {
                    cell.classList.add('food');
                } else if (this.graph.isObstacle(x, y)) {
                    cell.classList.add('obstacle');
                }
    
                gameElement.appendChild(cell);
            }
        }
    }
    

    getNeighbors(node) {
        const directions = [
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: 0, y: 1 }
        ];
        return directions
            .map(direction => ({ x: node.x + direction.x, y: node.y + direction.y }))
            .filter(neighbor => this.graph.isInside(neighbor.x, neighbor.y) && !this.isSnakeNode(neighbor.x, neighbor.y) && !this.graph.isObstacle(neighbor.x, neighbor.y));
    }
    


    bfs() {
        const start = this.snake[0];
        const goal = this.food;

        const visited = Array.from({ length: this.graph.height }, () => Array(this.graph.width).fill(false));
        const prev = Array.from({ length: this.graph.height }, () => Array(this.graph.width).fill(null));
        const queue = [start];

        visited[start.y][start.x] = true;
        let lastValidPosition = start;

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === goal.x && current.y === goal.y) break;

            for (const neighbor of this.getNeighbors(current)) {
                if (!visited[neighbor.y][neighbor.x]) {
                    visited[neighbor.y][neighbor.x] = true;
                    prev[neighbor.y][neighbor.x] = current;
                    queue.push(neighbor);
                    lastValidPosition = neighbor;
                }
            }
        }

        const path = [];
        for (let at = goal; at; at = prev[at.y][at.x]) {
            if (!prev[at.y][at.x]) {
                for (let at = lastValidPosition; at; at = prev[at.y][at.x]) {
                    path.push(at);
                }
                path.push(start);
                return path.reverse();
            }
            path.push(at);
        }
        path.push(start);
        return path.reverse();
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    aStar() {
        const start = this.snake[0];
        const goal = this.food;

        const gScore = Array.from({ length: this.graph.height }, () => Array(this.graph.width).fill(Infinity));
        const fScore = Array.from({ length: this.graph.height }, () => Array(this.graph.width).fill(Infinity));
        const prev = Array.from({ length: this.graph.height }, () => Array(this.graph.width).fill(null));

        gScore[start.y][start.x] = 0;
        fScore[start.y][start.x] = this.heuristic(start, goal);

        const openSet = [start];
        while (openSet.length > 0) {
            openSet.sort((a, b) => fScore[a.y][a.x] - fScore[b.y][b.x]);
            const current = openSet.shift();

            if (current.x === goal.x && current.y === goal.y) {
                let path = [];
                let node = current;
                while (node) {
                    path.push(node);
                    node = prev[node.y][node.x];
                }
                path.reverse();
                return path;
            }

            for (const neighbor of this.getNeighbors(current)) {
                const tentative_gScore = gScore[current.y][current.x] + 1;
                if (tentative_gScore < gScore[neighbor.y][neighbor.x]) {
                    prev[neighbor.y][neighbor.x] = current;
                    gScore[neighbor.y][neighbor.x] = tentative_gScore;
                    fScore[neighbor.y][neighbor.x] = gScore[neighbor.y][neighbor.x] + this.heuristic(neighbor, goal);
                    openSet.push(neighbor);
                }
            }
        }

        return []; // No path found
    }

    getDirectionToFood() {
        let path = this.aStar();
        
        if (path.length < 2) {
            // If A* fails, fall back to BFS
            path = this.bfs();
        }
    
        if (path.length < 2) return 'x'; // No valid move found
    
        const nextStep = path[1];
        const currentHead = this.snake[0];
    
        if (nextStep.x < currentHead.x) return 'a'; // Move left
        if (nextStep.x > currentHead.x) return 'd'; // Move right
        if (nextStep.y < currentHead.y) return 'w'; // Move up
        if (nextStep.y > currentHead.y) return 's'; // Move down
    
        return 'x'; // Fallback case
    }
    
}

const game = new SnakeGame(20, 20);

function gameLoop() {
    game.display();

    const move = game.getDirectionToFood();
    if (move === 'x' || !game.move(move)) {
        alert("Game Over!");
        return;
    }

    setTimeout(gameLoop, 200);
}

document.addEventListener('DOMContentLoaded', () => {
    gameLoop();
});
