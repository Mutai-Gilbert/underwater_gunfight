export class UI {
    constructor() {
        this.createUI();
        this.setupEventListeners();
    }

    createUI() {
        // Create UI container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        document.body.appendChild(this.container);

        // Create HUD elements
        this.createHUD();
        this.createMessageSystem();
        this.createGameOverScreen();
        this.createStartScreen();
    }

    createHUD() {
        // Health display
        this.healthDisplay = document.createElement('div');
        this.healthDisplay.style.position = 'absolute';
        this.healthDisplay.style.left = '20px';
        this.healthDisplay.style.top = '20px';
        this.healthDisplay.style.color = '#fff';
        this.healthDisplay.style.fontSize = '24px';
        this.healthDisplay.style.textShadow = '2px 2px 2px rgba(0,0,0,0.5)';
        this.container.appendChild(this.healthDisplay);

        // Ammo display
        this.ammoDisplay = document.createElement('div');
        this.ammoDisplay.style.position = 'absolute';
        this.ammoDisplay.style.right = '20px';
        this.ammoDisplay.style.top = '20px';
        this.ammoDisplay.style.color = '#fff';
        this.ammoDisplay.style.fontSize = '24px';
        this.ammoDisplay.style.textShadow = '2px 2px 2px rgba(0,0,0,0.5)';
        this.container.appendChild(this.ammoDisplay);

        // Score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.style.position = 'absolute';
        this.scoreDisplay.style.left = '50%';
        this.scoreDisplay.style.top = '20px';
        this.scoreDisplay.style.transform = 'translateX(-50%)';
        this.scoreDisplay.style.color = '#fff';
        this.scoreDisplay.style.fontSize = '24px';
        this.scoreDisplay.style.textShadow = '2px 2px 2px rgba(0,0,0,0.5)';
        this.container.appendChild(this.scoreDisplay);

        // Crosshair
        this.crosshair = document.createElement('div');
        this.crosshair.style.position = 'absolute';
        this.crosshair.style.left = '50%';
        this.crosshair.style.top = '50%';
        this.crosshair.style.width = '20px';
        this.crosshair.style.height = '20px';
        this.crosshair.style.transform = 'translate(-50%, -50%)';
        this.crosshair.innerHTML = '⊕';
        this.crosshair.style.color = '#fff';
        this.crosshair.style.fontSize = '20px';
        this.crosshair.style.textShadow = '0 0 2px rgba(0,0,0,0.5)';
        this.container.appendChild(this.crosshair);
    }

    createMessageSystem() {
        this.messageContainer = document.createElement('div');
        this.messageContainer.style.position = 'absolute';
        this.messageContainer.style.left = '50%';
        this.messageContainer.style.bottom = '100px';
        this.messageContainer.style.transform = 'translateX(-50%)';
        this.messageContainer.style.color = '#fff';
        this.messageContainer.style.fontSize = '24px';
        this.messageContainer.style.textAlign = 'center';
        this.messageContainer.style.textShadow = '2px 2px 2px rgba(0,0,0,0.5)';
        this.container.appendChild(this.messageContainer);
    }

    createGameOverScreen() {
        this.gameOverScreen = document.createElement('div');
        this.gameOverScreen.style.position = 'absolute';
        this.gameOverScreen.style.left = '0';
        this.gameOverScreen.style.top = '0';
        this.gameOverScreen.style.width = '100%';
        this.gameOverScreen.style.height = '100%';
        this.gameOverScreen.style.backgroundColor = 'rgba(0,0,0,0.7)';
        this.gameOverScreen.style.display = 'none';
        this.gameOverScreen.style.flexDirection = 'column';
        this.gameOverScreen.style.alignItems = 'center';
        this.gameOverScreen.style.justifyContent = 'center';
        this.gameOverScreen.style.color = '#fff';
        this.gameOverScreen.style.pointerEvents = 'auto';

        const gameOverText = document.createElement('h1');
        gameOverText.textContent = 'GAME OVER';
        gameOverText.style.fontSize = '48px';
        gameOverText.style.marginBottom = '20px';
        this.gameOverScreen.appendChild(gameOverText);

        this.scoreboard = document.createElement('div');
        this.scoreboard.style.marginBottom = '30px';
        this.gameOverScreen.appendChild(this.scoreboard);

        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        restartButton.style.padding = '10px 20px';
        restartButton.style.fontSize = '24px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.color = '#fff';
        restartButton.onclick = () => this.onRestart?.();
        this.gameOverScreen.appendChild(restartButton);

        this.container.appendChild(this.gameOverScreen);
    }

    createStartScreen() {
        this.startScreen = document.createElement('div');
        this.startScreen.style.position = 'absolute';
        this.startScreen.style.left = '0';
        this.startScreen.style.top = '0';
        this.startScreen.style.width = '100%';
        this.startScreen.style.height = '100%';
        this.startScreen.style.backgroundColor = 'rgba(0,0,0,0.8)';
        this.startScreen.style.display = 'flex';
        this.startScreen.style.flexDirection = 'column';
        this.startScreen.style.alignItems = 'center';
        this.startScreen.style.justifyContent = 'center';
        this.startScreen.style.color = '#fff';
        this.startScreen.style.pointerEvents = 'auto';

        const title = document.createElement('h1');
        title.textContent = 'UNDERWATER GUNFIGHT';
        title.style.fontSize = '48px';
        title.style.marginBottom = '30px';
        title.style.textAlign = 'center';
        this.startScreen.appendChild(title);

        const instructions = document.createElement('div');
        instructions.innerHTML = `
            <p>WASD - Move</p>
            <p>SPACE - Swim Up</p>
            <p>SHIFT - Swim Down</p>
            <p>MOUSE - Aim</p>
            <p>LEFT CLICK - Shoot</p>
            <p>1,2,3 - Switch Weapons</p>
        `;
        instructions.style.fontSize = '24px';
        instructions.style.marginBottom = '30px';
        instructions.style.textAlign = 'center';
        this.startScreen.appendChild(instructions);

        const startButton = document.createElement('button');
        startButton.textContent = 'Start Game';
        startButton.style.padding = '15px 30px';
        startButton.style.fontSize = '24px';
        startButton.style.cursor = 'pointer';
        startButton.style.backgroundColor = '#4CAF50';
        startButton.style.border = 'none';
        startButton.style.borderRadius = '5px';
        startButton.style.color = '#fff';
        startButton.onclick = () => {
            this.hideStartScreen();
            this.onGameStart?.();
        };
        this.startScreen.appendChild(startButton);

        this.container.appendChild(this.startScreen);
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            // Update UI positions if needed
        });
    }

    updateHealth(health) {
        this.healthDisplay.textContent = `Health: ${health}`;
        if (health < 30) {
            this.healthDisplay.style.color = '#ff4444';
        } else if (health < 60) {
            this.healthDisplay.style.color = '#ffff44';
        } else {
            this.healthDisplay.style.color = '#fff';
        }
    }

    updateAmmo(current, total) {
        this.ammoDisplay.textContent = `Ammo: ${current}/${total}`;
    }

    updateScore(score) {
        this.scoreDisplay.textContent = `Score: ${score}`;
    }

    showMessage(text, duration = 2000) {
        this.messageContainer.textContent = text;
        this.messageContainer.style.opacity = '1';
        setTimeout(() => {
            this.messageContainer.style.opacity = '0';
        }, duration);
    }

    showGameOver() {
        this.gameOverScreen.style.display = 'flex';
    }

    hideGameOver() {
        this.gameOverScreen.style.display = 'none';
    }

    hideStartScreen() {
        this.startScreen.style.display = 'none';
    }

    updateScoreboard(scores) {
        // Sort scores in descending order
        scores.sort((a, b) => b.score - a.score);
        
        // Take top 5 scores
        const topScores = scores.slice(0, 5);
        
        // Create scoreboard HTML
        this.scoreboard.innerHTML = '<h2>High Scores</h2>';
        const scoreList = document.createElement('ul');
        scoreList.style.listStyle = 'none';
        scoreList.style.padding = '0';
        scoreList.style.margin = '10px 0';
        
        topScores.forEach((score, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${score.name}: ${score.score}`;
            li.style.fontSize = '20px';
            li.style.margin = '5px 0';
            scoreList.appendChild(li);
        });
        
        this.scoreboard.appendChild(scoreList);
    }
} 