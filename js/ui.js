/**
 * Manages the game's user interface
 */

class UI {
  constructor() {
    this.livesElement = document.getElementById('lives');
    this.timerElement = document.getElementById('timer');
    this.killsElement = document.getElementById('kills');
    this.messageElement = document.getElementById('game-message');
    this.summaryElement = document.getElementById('game-summary');
    
    this.updateLives(3);
  }
  
  updateLives(lives) {
    this.livesElement.innerHTML = '';
    for (let i = 0; i < lives; i++) {
      const lifeElement = document.createElement('div');
      lifeElement.className = 'life';
      this.livesElement.appendChild(lifeElement);
    }
  }
  
  updateTimer(remainingTime) {
    this.timerElement.textContent = formatTime(Math.ceil(remainingTime));
    
    // Change color when time is running low
    if (remainingTime <= 30) {
      this.timerElement.style.color = '#ff4d4d';
    } else if (remainingTime <= 60) {
      this.timerElement.style.color = '#ffdd00';
    } else {
      this.timerElement.style.color = '';
    }
  }
  
  updateKills(kills) {
    this.killsElement.textContent = `Kills: ${kills}`;
  }
  
  showMessage(message, duration = 0) {
    this.messageElement.textContent = message;
    this.messageElement.style.opacity = '1';
    
    if (duration > 0) {
      setTimeout(() => {
        this.hideMessage();
      }, duration * 1000);
    }
  }
  
  hideMessage() {
    this.messageElement.style.opacity = '0';
  }
  
  showStartScreen() {
    this.showMessage('Press Enter to Start');
  }
  
  showGameOverScreen(reason) {
    this.showMessage(`Game Over\n${reason}\n\nPress Enter to Restart`);
  }
  
  showGameWonScreen() {
    this.showMessage('You Escaped!\n\nPress Enter to Play Again');
  }
  
  showSummary(timeTaken, enemiesKilled, success) {
    this.summaryElement.innerHTML = '';
    
    const title = document.createElement('h2');
    title.textContent = success ? 'Escape Successful!' : 'Game Over';
    this.summaryElement.appendChild(title);
    
    const timeText = document.createElement('p');
    timeText.textContent = `Time: ${formatTime(Math.floor(timeTaken))}`;
    this.summaryElement.appendChild(timeText);
    
    const killsText = document.createElement('p');
    killsText.textContent = `Enemies Defeated: ${enemiesKilled}`;
    this.summaryElement.appendChild(killsText);
    
    const message = document.createElement('p');
    message.textContent = success ? 
      'You managed to escape the maze in time!' :
      'Better luck next time!';
    message.style.marginTop = '16px';
    this.summaryElement.appendChild(message);
    
    const prompt = document.createElement('p');
    prompt.textContent = 'Press Enter to Play Again';
    prompt.style.marginTop = '16px';
    prompt.style.fontStyle = 'italic';
    this.summaryElement.appendChild(prompt);
    
    this.summaryElement.style.display = 'block';
  }
  
  hideSummary() {
    this.summaryElement.style.display = 'none';
  }
  
  reset() {
    this.updateLives(3);
    this.updateTimer(180);
    this.updateKills(0);
    this.hideMessage();
    this.hideSummary();
  }
}