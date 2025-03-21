import * as THREE from 'three';

export class UI {
    constructor(scene) {
        this.scene = scene;
        
        // Create UI container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        document.body.appendChild(this.container);
        
        // Create HUD
        this.createHUD();
        
        // Create notification system
        this.createNotificationSystem();
        
        // Create tutorial
        this.createTutorial();
        
        // Create scoreboard
        this.createScoreboard();
        
        // Create game over screen
        this.createGameOverScreen();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    createHUD() {
        // Create HUD container
        this.hud = document.createElement('div');
        this.hud.style.position = 'absolute';
        this.hud.style.width = '100%';
        this.hud.style.padding = '20px';
        this.hud.style.display = 'flex';
        this.hud.style.justifyContent = 'space-between';
        this.container.appendChild(this.hud);
        
        // Create player stats containers
        this.playerStats = [];
        
        for (let i = 0; i < 2; i++) {
            const statsContainer = document.createElement('div');
            statsContainer.style.padding = '10px';
            statsContainer.style.background = 'rgba(0, 0, 0, 0.5)';
            statsContainer.style.borderRadius = '10px';
            statsContainer.style.color = '#fff';
            statsContainer.style.fontFamily = 'Arial, sans-serif';
            
            // Health bar
            const healthBar = document.createElement('div');
            healthBar.style.width = '200px';
            healthBar.style.height = '20px';
            healthBar.style.background = '#333';
            healthBar.style.borderRadius = '10px';
            healthBar.style.overflow = 'hidden';
            healthBar.style.marginBottom = '10px';
            
            const healthFill = document.createElement('div');
            healthFill.style.width = '100%';
            healthFill.style.height = '100%';
            healthFill.style.background = '#2ecc71';
            healthFill.style.transition = 'width 0.3s ease-out';
            healthBar.appendChild(healthFill);
            
            // Ammo counter
            const ammoCounter = document.createElement('div');
            ammoCounter.style.fontSize = '24px';
            ammoCounter.style.marginBottom = '5px';
            
            // Score
            const scoreCounter = document.createElement('div');
            scoreCounter.style.fontSize = '20px';
            
            statsContainer.appendChild(healthBar);
            statsContainer.appendChild(ammoCounter);
            statsContainer.appendChild(scoreCounter);
            
            this.playerStats.push({
                container: statsContainer,
                healthBar: healthFill,
                ammoCounter: ammoCounter,
                scoreCounter: scoreCounter
            });
            
            this.hud.appendChild(statsContainer);
        }
        
        // Position player stats
        this.playerStats[0].container.style.textAlign = 'left';
        this.playerStats[1].container.style.textAlign = 'right';
    }
    
    createNotificationSystem() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.style.position = 'absolute';
        this.notificationContainer.style.top = '20%';
        this.notificationContainer.style.left = '50%';
        this.notificationContainer.style.transform = 'translateX(-50%)';
        this.notificationContainer.style.textAlign = 'center';
        this.container.appendChild(this.notificationContainer);
    }
    
    createTutorial() {
        this.tutorial = document.createElement('div');
        this.tutorial.style.position = 'absolute';
        this.tutorial.style.bottom = '20px';
        this.tutorial.style.left = '50%';
        this.tutorial.style.transform = 'translateX(-50%)';
        this.tutorial.style.background = 'rgba(0, 0, 0, 0.7)';
        this.tutorial.style.color = '#fff';
        this.tutorial.style.padding = '20px';
        this.tutorial.style.borderRadius = '10px';
        this.tutorial.style.fontFamily = 'Arial, sans-serif';
        this.tutorial.style.textAlign = 'center';
        this.tutorial.innerHTML = `
            <h3>Controls</h3>
            <p>Player 1: WASD to move, SPACE to shoot</p>
            <p>Player 2: Arrow keys to move, ENTER to shoot</p>
            <button id="tutorial-close" style="pointer-events: auto;">Got it!</button>
        `;
        this.container.appendChild(this.tutorial);
    }
    
    createScoreboard() {
        this.scoreboard = document.createElement('div');
        this.scoreboard.style.position = 'absolute';
        this.scoreboard.style.top = '50%';
        this.scoreboard.style.left = '50%';
        this.scoreboard.style.transform = 'translate(-50%, -50%)';
        this.scoreboard.style.background = 'rgba(0, 0, 0, 0.8)';
        this.scoreboard.style.color = '#fff';
        this.scoreboard.style.padding = '20px';
        this.scoreboard.style.borderRadius = '10px';
        this.scoreboard.style.fontFamily = 'Arial, sans-serif';
        this.scoreboard.style.display = 'none';
        this.container.appendChild(this.scoreboard);
    }
    
    createGameOverScreen() {
        this.gameOverScreen = document.createElement('div');
        this.gameOverScreen.style.position = 'absolute';
        this.gameOverScreen.style.top = '50%';
        this.gameOverScreen.style.left = '50%';
        this.gameOverScreen.style.transform = 'translate(-50%, -50%)';
        this.gameOverScreen.style.background = 'rgba(0, 0, 0, 0.9)';
        this.gameOverScreen.style.color = '#fff';
        this.gameOverScreen.style.padding = '40px';
        this.gameOverScreen.style.borderRadius = '20px';
        this.gameOverScreen.style.textAlign = 'center';
        this.gameOverScreen.style.display = 'none';
        
        const playAgainButton = document.createElement('button');
        playAgainButton.textContent = 'Play Again';
        playAgainButton.style.padding = '10px 20px';
        playAgainButton.style.fontSize = '20px';
        playAgainButton.style.marginTop = '20px';
        playAgainButton.style.pointerEvents = 'auto';
        playAgainButton.style.cursor = 'pointer';
        
        this.gameOverScreen.appendChild(playAgainButton);
        this.container.appendChild(this.gameOverScreen);
    }
    
    setupEventListeners() {
        // Tutorial close button
        document.getElementById('tutorial-close').addEventListener('click', () => {
            this.tutorial.style.display = 'none';
        });
        
        // Listen for player events
        window.addEventListener('player-damage', (event) => {
            const player = event.detail.player;
            const amount = event.detail.amount;
            this.showDamageIndicator(player, amount);
        });
        
        window.addEventListener('player-death', (event) => {
            const player = event.detail.player;
            this.showDeathMessage(player);
        });
        
        window.addEventListener('player-score', (event) => {
            const player = event.detail.player;
            const score = event.detail.score;
            this.updateScore(player, score);
        });
        
        // Listen for weapon events
        window.addEventListener('weapon-shoot', () => {
            this.updatePlayerStats();
        });
        
        window.addEventListener('weapon-reload-start', (event) => {
            const weapon = event.detail.weapon;
            this.showReloadingIndicator(weapon);
        });
        
        window.addEventListener('weapon-reload-complete', () => {
            this.updatePlayerStats();
        });
    }
    
    updatePlayerStats() {
        this.playerStats.forEach((stats, index) => {
            const player = this.scene.getObjectByName(`player${index + 1}`);
            if (player && player.userData.player) {
                const playerObj = player.userData.player;
                
                // Update health bar
                const healthPercent = (playerObj.health / 100) * 100;
                stats.healthBar.style.width = `${healthPercent}%`;
                stats.healthBar.style.background = this.getHealthColor(healthPercent);
                
                // Update ammo counter
                if (playerObj.weapon) {
                    stats.ammoCounter.textContent = `Ammo: ${playerObj.weapon.currentAmmo}/${playerObj.weapon.maxAmmo}`;
                    if (playerObj.weapon.isReloading) {
                        stats.ammoCounter.textContent += ' (Reloading...)';
                    }
                }
                
                // Update score
                stats.scoreCounter.textContent = `Score: ${playerObj.score}`;
            }
        });
    }
    
    showNotification(message, duration = 3000) {
        const notification = document.createElement('div');
        notification.style.background = 'rgba(0, 0, 0, 0.7)';
        notification.style.color = '#fff';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.marginBottom = '10px';
        notification.style.transition = 'opacity 0.3s ease-in-out';
        notification.textContent = message;
        
        this.notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                this.notificationContainer.removeChild(notification);
            }, 300);
        }, duration);
    }
    
    showDamageIndicator(player, amount) {
        const index = player === this.scene.getObjectByName('player1').userData.player ? 0 : 1;
        const stats = this.playerStats[index];
        
        // Flash health bar
        stats.healthBar.style.transition = 'none';
        stats.healthBar.style.filter = 'brightness(2)';
        setTimeout(() => {
            stats.healthBar.style.transition = 'all 0.3s ease-out';
            stats.healthBar.style.filter = 'none';
        }, 100);
        
        // Show damage number
        const damageNumber = document.createElement('div');
        damageNumber.style.position = 'absolute';
        damageNumber.style.color = '#ff4444';
        damageNumber.style.fontSize = '24px';
        damageNumber.style.fontWeight = 'bold';
        damageNumber.style.textShadow = '0 0 5px rgba(0,0,0,0.5)';
        damageNumber.textContent = `-${amount}`;
        
        const rect = stats.container.getBoundingClientRect();
        damageNumber.style.left = `${rect.left + Math.random() * rect.width}px`;
        damageNumber.style.top = `${rect.top + Math.random() * rect.height}px`;
        
        this.container.appendChild(damageNumber);
        
        // Animate damage number
        let opacity = 1;
        let y = parseFloat(damageNumber.style.top);
        
        const animate = () => {
            opacity -= 0.02;
            y -= 1;
            
            damageNumber.style.opacity = opacity;
            damageNumber.style.top = `${y}px`;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.container.removeChild(damageNumber);
            }
        };
        
        animate();
    }
    
    showReloadingIndicator(weapon) {
        const player = weapon.owner;
        if (player) {
            const index = player === this.scene.getObjectByName('player1').userData.player ? 0 : 1;
            this.playerStats[index].ammoCounter.textContent = 'Reloading...';
        }
    }
    
    showDeathMessage(player) {
        const message = `Player ${player === this.scene.getObjectByName('player1').userData.player ? '1' : '2'} was eliminated!`;
        this.showNotification(message, 5000);
    }
    
    updateScore(player, score) {
        const index = player === this.scene.getObjectByName('player1').userData.player ? 0 : 1;
        this.playerStats[index].scoreCounter.textContent = `Score: ${score}`;
    }
    
    showGameOver(winner) {
        this.gameOverScreen.innerHTML = `
            <h2>Game Over!</h2>
            <p>${winner} wins!</p>
            <button id="play-again" style="pointer-events: auto;">Play Again</button>
        `;
        this.gameOverScreen.style.display = 'block';
    }
    
    hideGameOver() {
        this.gameOverScreen.style.display = 'none';
    }
    
    getHealthColor(percent) {
        if (percent > 60) return '#2ecc71';
        if (percent > 30) return '#f1c40f';
        return '#e74c3c';
    }
} 