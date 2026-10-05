// Street Fighter III: 3rd Strike - Main Game Engine, Stages & Loop

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Screens
    this.currentScreen = 'title'; // 'title', 'select', 'vs', 'battle', 'victory'
    this.gameMode = 'arcade'; // 'arcade', 'versus', 'training'
    
    // Selected characters
    this.p1Char = 'tony';
    this.p2Char = 'george';
    this.p1CursorIndex = 0;
    this.p2CursorIndex = 1;
    this.availableChars = ['tony', 'george', 'amid'];

    // Fighters & AI
    this.p1 = null;
    this.p2 = null;
    this.ai = null;

    // Match & Round state
    this.currentRound = 1;
    this.maxRounds = 3;
    this.roundTimer = 99;
    this.roundTimerInterval = null;
    this.matchState = 'intro'; // 'intro', 'fighting', 'round_over', 'match_over'
    this.stageId = 'rooftop'; // 'rooftop', 'temple', 'office'
    
    // SF3 Visual Polish
    this.screenShake = 0;
    this.superFreezeTimer = 0;
    this.superFreezeChar = null;
    this.bannerText = null;
    this.bannerColor = '#fff';
    this.bannerTimer = 0;

    // Keyboard states
    this.keys = {};
    this.p1PrevKeys = {};
    this.p2PrevKeys = {};

    // Character victory quotes
    this.quotes = {
      tony: '"Blood flows where weakness settles. Sharpen your edge before facing my blades again."',
      george: '"True strength lies within tranquility. Your chaotic spirit was easily undone by the chakra."',
      amid: '"Audit finalized. Total liabilities: your consciousness. Please clear your desk by tomorrow."'
    };

    // Stage backgrounds
    this.stagePowerplantImg = new Image();
    this.stagePowerplantImg.src = 'assets/stage_powerplant.png';
    this.stageBgLoaded = false;
    this.stagePowerplantImg.onload = () => { this.stageBgLoaded = true; };

    this.smokeParticles = [];
    this.initSmokeParticles();

    this.bgParticles = [];
    this.initBgParticles();

    // Setup events
    this.initInputs();
    this.initUI();

    // Start loop
    this.lastFrameTime = performance.now();
    this.fpsCounter = document.getElementById('fps-counter');
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    
    requestAnimationFrame((t) => this.loop(t));
  }

  initBgParticles() {
    this.bgParticles = Array.from({ length: 40 }, () => ({
      x: Math.random() * 960,
      y: Math.random() * 540,
      vx: (Math.random() - 0.5) * 1.5,
      vy: Math.random() * 1.5 + 0.5,
      size: Math.random() * 3 + 1,
      color: 'rgba(255, 255, 255, 0.4)'
    }));
  }

  initSmokeParticles() {
    // Industrial chimney smoke plumes rising from stacks at x=520 and x=595
    this.smokeParticles = Array.from({ length: 30 }, () => ({
      stack: Math.random() < 0.6 ? 520 : 595,
      x: 0,
      y: Math.random() * -120,
      vx: (Math.random() - 0.2) * 1.2,
      vy: -(Math.random() * 1.2 + 0.8),
      size: Math.random() * 8 + 6,
      alpha: Math.random() * 0.4 + 0.2
    }));
  }

  // --- Input Management ---
  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Title navigation with Enter / Space
      if (this.currentScreen === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        this.selectMenuOption();
      }

      // Character select navigation
      if (this.currentScreen === 'select') {
        if (e.code === 'KeyA') this.moveSelectCursor('p1', -1);
        if (e.code === 'KeyD') this.moveSelectCursor('p1', 1);
        if (e.code === 'KeyJ' || e.code === 'Space') this.confirmSelect('p1');

        if (this.gameMode === 'versus') {
          if (e.code === 'ArrowLeft') this.moveSelectCursor('p2', -1);
          if (e.code === 'ArrowRight') this.moveSelectCursor('p2', 1);
          if (e.code === 'Digit1' || e.code === 'Numpad1') this.confirmSelect('p2');
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mobile Virtual Touch Controls
    const touchButtons = document.querySelectorAll('.t-btn');
    touchButtons.forEach(btn => {
      const code = btn.getAttribute('data-key');
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.keys[code] = true;
      });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.keys[code] = false;
      });
      btn.addEventListener('mousedown', (e) => {
        this.keys[code] = true;
      });
      btn.addEventListener('mouseup', (e) => {
        this.keys[code] = false;
      });
    });
  }

  // Poll inputs for P1 and P2
  getP1Input() {
    const isArcade = this.gameMode === 'arcade' || this.gameMode === 'training';

    // Support both WASD and Arrow Keys for P1 in solo modes
    const isRight = !!(this.keys['KeyD'] || (isArcade && this.keys['ArrowRight']));
    const isLeft = !!(this.keys['KeyA'] || (isArcade && this.keys['ArrowLeft']));
    const isUp = !!(this.keys['KeyW'] || (isArcade && this.keys['ArrowUp']));
    const isDown = !!(this.keys['KeyS'] || (isArcade && this.keys['ArrowDown']));

    const forward = this.p1.facing === 1 ? isRight : isLeft;
    const backward = this.p1.facing === 1 ? isLeft : isRight;

    const tapFwd = forward && !this.p1PrevKeys['forward'];
    const tapDn = isDown && !this.p1PrevKeys['down'];

    this.p1PrevKeys['forward'] = forward;
    this.p1PrevKeys['down'] = isDown;

    return {
      forward,
      backward,
      up: isUp,
      down: isDown,
      tapForward: tapFwd,
      tapDown: tapDn,
      lightPunch: !!(this.keys['KeyJ'] || this.keys['KeyZ'] || (isArcade && this.keys['Numpad1'])),
      heavyPunch: !!(this.keys['KeyK'] || this.keys['KeyX'] || (isArcade && this.keys['Numpad2'])),
      lightKick: !!(this.keys['KeyU'] || this.keys['KeyC'] || (isArcade && this.keys['Numpad4'])),
      heavyKick: !!(this.keys['KeyI'] || this.keys['KeyV'] || (isArcade && this.keys['Numpad5'])),
      special1: !!(this.keys['KeyO'] || this.keys['KeyQ'] || (isArcade && this.keys['Numpad6'])),
      special2: !!(this.keys['KeyL'] || this.keys['KeyE'] || (isArcade && this.keys['Numpad3'])),
      superArt: !!(this.keys['Space'] || this.keys['Enter'] || (isArcade && this.keys['Numpad0']))
    };
  }

  getP2Input() {
    if (this.gameMode === 'arcade' && this.ai) {
      return this.ai.update();
    }

    const forwardKey = this.p2.facing === 1 ? 'ArrowRight' : 'ArrowLeft';
    const backKey = this.p2.facing === 1 ? 'ArrowLeft' : 'ArrowRight';

    const tapFwd = this.keys[forwardKey] && !this.p2PrevKeys[forwardKey];
    const tapDn = this.keys['ArrowDown'] && !this.p2PrevKeys['ArrowDown'];

    this.p2PrevKeys[forwardKey] = this.keys[forwardKey];
    this.p2PrevKeys['ArrowDown'] = this.keys['ArrowDown'];

    return {
      forward: !!this.keys[forwardKey],
      backward: !!this.keys[backKey],
      up: !!this.keys['ArrowUp'],
      down: !!this.keys['ArrowDown'],
      tapForward: tapFwd,
      tapDown: tapDn,
      lightPunch: !!this.keys['Digit1'] || !!this.keys['Numpad1'],
      heavyPunch: !!this.keys['Digit2'] || !!this.keys['Numpad2'],
      lightKick: !!this.keys['Digit4'] || !!this.keys['Numpad4'],
      heavyKick: !!this.keys['Digit5'] || !!this.keys['Numpad5'],
      special1: !!this.keys['Digit6'] || !!this.keys['Numpad6'],
      special2: !!this.keys['Digit3'] || !!this.keys['Numpad3'],
      superArt: !!this.keys['Digit0'] || !!this.keys['Numpad0'] || !!this.keys['Enter']
    };
  }

  // --- UI & Screen Transitions ---
  initUI() {
    // Menu buttons
    document.getElementById('btn-arcade').onclick = () => {
      this.gameMode = 'arcade';
      this.switchScreen('select');
    };
    document.getElementById('btn-versus').onclick = () => {
      this.gameMode = 'versus';
      this.switchScreen('select');
    };
    document.getElementById('btn-training').onclick = () => {
      this.gameMode = 'training';
      this.switchScreen('select');
    };
    document.getElementById('btn-howtoplay').onclick = () => {
      document.getElementById('help-modal').classList.add('active');
    };
    document.getElementById('btn-controls-quick').onclick = () => {
      document.getElementById('help-modal').classList.add('active');
    };
    document.getElementById('close-help').onclick = () => {
      document.getElementById('help-modal').classList.remove('active');
    };

    // Character select slots
    const charSlots = document.querySelectorAll('.char-slot');
    charSlots.forEach(slot => {
      slot.onclick = () => {
        const charId = slot.getAttribute('data-char');
        this.p1Char = charId;
        this.confirmSelect('p1');
      };
    });

    // Victory screen buttons
    document.getElementById('btn-rematch').onclick = () => this.startMatch();
    document.getElementById('btn-char-select').onclick = () => this.switchScreen('select');
    document.getElementById('btn-menu').onclick = () => this.switchScreen('title');

    // CRT Scanline toggle
    const crtBtn = document.getElementById('toggle-crt');
    const crtOverlay = document.getElementById('crt-overlay');
    crtBtn.onclick = () => {
      crtOverlay.classList.toggle('crt-off');
      crtBtn.textContent = crtOverlay.classList.contains('crt-off') ? 'CRT: OFF' : 'CRT: ON';
    };

    // Audio toggle
    const audioBtn = document.getElementById('toggle-audio');
    audioBtn.onclick = () => {
      const active = AudioSys.toggleAudio();
      audioBtn.textContent = active ? 'AUDIO: ON' : 'AUDIO: MUTED';
    };
  }

  switchScreen(screenName) {
    this.currentScreen = screenName;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    if (screenName === 'title') {
      document.getElementById('title-screen').classList.add('active');
      AudioSys.startBGM();
    } else if (screenName === 'select') {
      document.getElementById('select-screen').classList.add('active');
      this.updateSelectGrid();
    } else if (screenName === 'vs') {
      document.getElementById('vs-screen').classList.add('active');
      this.setupVsScreen();
    } else if (screenName === 'victory') {
      document.getElementById('victory-screen').classList.add('active');
    }
  }

  moveSelectCursor(player, delta) {
    if (player === 'p1') {
      this.p1CursorIndex = (this.p1CursorIndex + delta + this.availableChars.length) % this.availableChars.length;
      this.p1Char = this.availableChars[this.p1CursorIndex];
    } else {
      this.p2CursorIndex = (this.p2CursorIndex + delta + this.availableChars.length) % this.availableChars.length;
      this.p2Char = this.availableChars[this.p2CursorIndex];
    }
    AudioSys.playWhoosh();
    this.updateSelectGrid();
  }

  updateSelectGrid() {
    const slots = document.querySelectorAll('.char-slot');
    slots.forEach(slot => {
      const id = slot.getAttribute('data-char');
      slot.classList.remove('p1-cursor', 'p2-cursor');
      if (id === this.p1Char) slot.classList.add('p1-cursor');
      if (id === this.p2Char && this.gameMode === 'versus') slot.classList.add('p2-cursor');
    });
  }

  confirmSelect(player) {
    AudioSys.playHit(true);
    if (this.gameMode === 'arcade' || this.gameMode === 'training') {
      // Pick random opponent that isn't P1
      const pool = this.availableChars.filter(c => c !== this.p1Char);
      this.p2Char = pool[Math.floor(Math.random() * pool.length)];
      this.switchScreen('vs');
      setTimeout(() => this.startMatch(), 2200);
    } else {
      this.switchScreen('vs');
      setTimeout(() => this.startMatch(), 2200);
    }
  }

  setupVsScreen() {
    const p1Img = document.getElementById('vs-p1-img');
    const p2Img = document.getElementById('vs-p2-img');
    p1Img.style.backgroundImage = `url('assets/${this.p1Char}.jpg')`;
    p2Img.style.backgroundImage = `url('assets/${this.p2Char}.jpg')`;

    document.getElementById('vs-p1-name').textContent = this.p1Char.toUpperCase();
    document.getElementById('vs-p2-name').textContent = this.p2Char.toUpperCase();

    // Stage Selection based on P2
    this.stageId = 'powerplant';
    const stageTitles = {
      powerplant: 'STAGE: SEASIDE INDUSTRIAL POWER PLANT &bull; SECTOR 7'
    };
    document.getElementById('vs-stage-name').innerHTML = stageTitles[this.stageId];

    AudioSys.speakAnnouncer('VERSUS !');
  }

  // --- Match Initialization ---
  startMatch() {
    this.switchScreen('battle');
    this.p1 = new Fighter('p1', this.p1Char, 260, 1, false);
    this.p2 = new Fighter('p2', this.p2Char, 700, -1, this.gameMode === 'arcade');
    
    if (this.gameMode === 'arcade') {
      this.ai = new FighterAI(this.p2, this.p1, 'medium');
    }

    if (this.gameMode === 'training') {
      this.p1.superMeter = 200;
      this.p2.superMeter = 200;
    }

    this.currentRound = 1;
    this.startRound();
  }

  startRound() {
    this.p1.resetRound(260, 1);
    this.p2.resetRound(700, -1);
    this.roundTimer = 99;
    this.matchState = 'intro';

    const roundCode = this.currentRound === 3 ? 'FINAL ROUND' : `ROUND ${this.currentRound}`;
    const roundText = this.currentRound === 3 ? 'AKHIR JAWLEH !' : `JAWLEH ${this.currentRound} !`;
    this.showBannerText(roundText, '#ffdd44');
    AudioSys.speakLebanese(roundCode);

    setTimeout(() => {
      this.showBannerText('YALLA BALLISH ! ⚔️', '#ff3300');
      AudioSys.speakLebanese('FIGHT');
      this.matchState = 'fighting';
      this.startTimer();
    }, 1200);
  }

  startTimer() {
    if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);
    this.roundTimerInterval = setInterval(() => {
      if (this.matchState === 'fighting' && this.roundTimer > 0) {
        this.roundTimer--;
        if (this.roundTimer <= 0) {
          this.endRound('time');
        }
      }
    }, 1000);
  }

  endRound(reason) {
    this.matchState = 'round_over';
    if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);

    let winner = null;
    if (this.p1.hp <= 0) winner = this.p2;
    else if (this.p2.hp <= 0) winner = this.p1;
    else winner = this.p1.hp > this.p2.hp ? this.p1 : this.p2;

    winner.roundsWon++;
    this.showBannerText('KHALAS FARATTO ! 💥', '#ff1133');
    AudioSys.speakLebanese('KO');

    setTimeout(() => {
      if (this.p1.roundsWon >= 2 || this.p2.roundsWon >= 2) {
        this.endMatch(winner);
      } else {
        this.currentRound++;
        this.startRound();
      }
    }, 2400);
  }

  endMatch(winner) {
    this.matchState = 'match_over';
    const isP1Win = winner === this.p1;
    const winnerChar = isP1Win ? this.p1Char : this.p2Char;

    document.getElementById('winner-img').src = `assets/${winnerChar}.jpg`;
    document.getElementById('winner-name').textContent = winnerChar.toUpperCase();
    document.getElementById('winner-quote').textContent = this.quotes[winnerChar];

    this.showBannerText(`MABROUK YA KBEER ! 🏆`, '#ffd700');
    AudioSys.speakLebanese('WIN');

    setTimeout(() => {
      this.switchScreen('victory');
    }, 2200);
  }

  // --- Visual & Audio FX Triggers ---
  showBannerText(text, color) {
    this.bannerText = text;
    this.bannerColor = color;
    this.bannerTimer = 75; // Frames
  }

  addScreenShake(intensity) {
    this.screenShake = intensity;
  }

  triggerSuperFreeze(charId) {
    this.superFreezeTimer = 45;
    this.superFreezeChar = charId;
  }

  // ==========================================
  // Main Game Loop & Rendering Pipeline
  // ==========================================
  loop(timestamp) {
    const dt = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // FPS calculation
    this.frameCount++;
    if (timestamp - this.lastFpsUpdate >= 1000) {
      if (this.fpsCounter) this.fpsCounter.textContent = `${this.frameCount} FPS`;
      this.frameCount = 0;
      this.lastFpsUpdate = timestamp;
    }

    this.update();
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update() {
    if (this.currentScreen !== 'battle') return;

    // Super Freeze Frame Stop
    if (this.superFreezeTimer > 0) {
      this.superFreezeTimer--;
      return;
    }

    if (this.screenShake > 0) this.screenShake *= 0.88;

    // In-game updates
    if (this.matchState === 'fighting') {
      const p1Input = this.getP1Input();
      const p2Input = this.getP2Input();

      this.p1.handleInput(p1Input);
      this.p2.handleInput(p2Input);

      this.p1.update(this.p2);
      this.p2.update(this.p1);

      // Check KO
      if (this.p1.hp <= 0 || this.p2.hp <= 0) {
        this.endRound('ko');
      }
    } else if (this.matchState === 'round_over' || this.matchState === 'match_over') {
      this.p1.update(this.p2);
      this.p2.update(this.p1);
    }

    // Banner display timer
    if (this.bannerTimer > 0) this.bannerTimer--;

    // Stage background ambient particles
    this.bgParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > 540) p.y = 0;
      if (p.x < 0) p.x = 960;
      if (p.x > 960) p.x = 0;
    });
  }

  render() {
    this.ctx.save();
    
    // Apply camera screen shake
    if (this.screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(sx, sy);
    }

    // Render Stage
    this.drawStage();

    if (this.currentScreen === 'battle') {
      // Render Fighters
      this.p1.draw(this.ctx);
      this.p2.draw(this.ctx);

      // Render FX (Hitsparks, Parry Shockwaves)
      Sprites.updateAndDrawFX(this.ctx);

      // Render Street Fighter III Retro HUD
      this.drawHUD();

      // Render Super Freeze Cut-in
      if (this.superFreezeTimer > 0 && this.superFreezeChar) {
        Sprites.drawSuperFlashCutIn(this.ctx, this.superFreezeChar, this.superFreezeTimer, 45);
      }

      // Render Announcer Big Text Banner
      if (this.bannerTimer > 0 && this.bannerText) {
        this.drawBanner();
      }
    }

    this.ctx.restore();
  }

  // --- Dynamic Stages ---
  drawStage() {
    const ctx = this.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Draw the pixelated Seaside Power Plant stage
    if (this.stagePowerplantImg.complete && this.stagePowerplantImg.naturalWidth > 0) {
      ctx.drawImage(this.stagePowerplantImg, 0, 0, 960, 540);
    } else {
      // Fallback industrial sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 460);
      skyGrad.addColorStop(0, '#5599dd');
      skyGrad.addColorStop(1, '#aaccff');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 960, 540);
      ctx.fillStyle = '#333740';
      ctx.fillRect(0, 460, 960, 80);
    }

    // 1. Animated Chimney Smoke Plumes (from the two red/white striped industrial stacks)
    // Tower 1 top is around x=518, y=10; Tower 2 top is around x=602, y=42
    this.smokeParticles.forEach(p => {
      p.y += p.vy;
      p.x += p.vx;
      p.size += 0.08;
      p.alpha -= 0.003;

      const baseX = p.stack;
      const baseY = p.stack === 520 ? 12 : 44;
      const curX = baseX + p.x;
      const curY = baseY + p.y;

      if (curY < -40 || p.alpha <= 0) {
        p.x = 0;
        p.y = 0;
        p.size = Math.random() * 6 + 4;
        p.alpha = Math.random() * 0.45 + 0.25;
      }

      ctx.fillStyle = `rgba(240, 245, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(curX, curY, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Animated Puddle Water Ripples (on the cracked wet asphalt at the bottom)
    const time = Date.now() * 0.003;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;
    // Puddle 1: left
    ctx.beginPath();
    ctx.ellipse(280, 505, 75 + Math.sin(time) * 4, 10 + Math.sin(time * 1.5) * 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Puddle 2: center chimney reflection
    ctx.beginPath();
    ctx.ellipse(520, 510, 60 + Math.cos(time) * 3, 8 + Math.cos(time * 1.5) * 1.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Ambient Seaside Light & Dust motes
    this.bgParticles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    ctx.restore();
  }

  // --- Street Fighter III Authentic HUD ---
  drawHUD() {
    const ctx = this.ctx;

    // --- HEALTH BARS ---
    const barWidth = 360;
    const barHeight = 22;

    // P1 Health Bar (Left to Right)
    // Dark background frame
    ctx.fillStyle = '#1b1b22';
    ctx.fillRect(50, 30, barWidth, barHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 30, barWidth, barHeight);

    // Yellow damage trail
    const p1Yellow = (this.p1.displayHp / this.p1.maxHp) * barWidth;
    ctx.fillStyle = '#ffea00';
    ctx.fillRect(50 + (barWidth - p1Yellow), 30, p1Yellow, barHeight);

    // Green / Orange health
    const p1Green = (this.p1.hp / this.p1.maxHp) * barWidth;
    const p1Color = this.p1.hp > 300 ? '#00e676' : '#ff3d00';
    ctx.fillStyle = p1Color;
    ctx.fillRect(50 + (barWidth - p1Green), 30, p1Green, barHeight);

    // P2 Health Bar (Right to Left)
    ctx.fillStyle = '#1b1b22';
    ctx.fillRect(550, 30, barWidth, barHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(550, 30, barWidth, barHeight);

    // Yellow damage trail
    const p2Yellow = (this.p2.displayHp / this.p2.maxHp) * barWidth;
    ctx.fillStyle = '#ffea00';
    ctx.fillRect(550, 30, p2Yellow, barHeight);

    // Green / Orange health
    const p2Green = (this.p2.hp / this.p2.maxHp) * barWidth;
    const p2Color = this.p2.hp > 300 ? '#00e676' : '#ff3d00';
    ctx.fillStyle = p2Color;
    ctx.fillRect(550, 30, p2Green, barHeight);

    // --- ROUND TIMER ---
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(445, 18, 70, 48);
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 3;
    ctx.strokeRect(445, 18, 70, 48);

    ctx.font = "bold 38px 'Teko', Impact, sans-serif";
    ctx.fillStyle = this.roundTimer <= 10 ? '#ff1133' : '#ffea00';
    ctx.textAlign = 'center';
    ctx.fillText(this.roundTimer.toString().padStart(2, '0'), 480, 54);

    // --- FIGHTER NAMES ---
    ctx.font = "12px 'Press Start 2P', monospace";
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(this.p1.characterId.toUpperCase(), 52, 22);

    ctx.textAlign = 'right';
    ctx.fillText(this.p2.characterId.toUpperCase(), 908, 22);
    ctx.shadowBlur = 0;

    // --- ROUND WIN ICONS (V Markers) ---
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i < this.p1.roundsWon ? '#ffea00' : '#444';
      ctx.beginPath();
      ctx.arc(420 - (i * 20), 40, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = i < this.p2.roundsWon ? '#ffea00' : '#444';
      ctx.beginPath();
      ctx.arc(540 + (i * 20), 40, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- SUPER ART GAUGES (SF3 Bottom Meters) ---
    const saBarWidth = 260;
    const saBarHeight = 14;

    // P1 Super Meter
    ctx.fillStyle = '#111';
    ctx.fillRect(50, 500, saBarWidth, saBarHeight);
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 500, saBarWidth, saBarHeight);

    const p1SaProgress = (this.p1.superMeter / this.p1.maxSuperMeter) * saBarWidth;
    ctx.fillStyle = this.p1.superMeter >= 100 ? '#00f0ff' : '#0077ff';
    ctx.fillRect(50, 500, p1SaProgress, saBarHeight);

    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00ffff';
    const p1Stocks = Math.floor(this.p1.superMeter / 100);
    ctx.fillText(`SUPER [${p1Stocks}]`, 50, 492);

    // P2 Super Meter
    ctx.fillStyle = '#111';
    ctx.fillRect(650, 500, saBarWidth, saBarHeight);
    ctx.strokeStyle = '#ffcc00';
    ctx.strokeRect(650, 500, saBarWidth, saBarHeight);

    const p2SaProgress = (this.p2.superMeter / this.p2.maxSuperMeter) * saBarWidth;
    ctx.fillStyle = this.p2.superMeter >= 100 ? '#ff3b30' : '#ff9500';
    ctx.fillRect(650 + (saBarWidth - p2SaProgress), 500, p2SaProgress, saBarHeight);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff9500';
    const p2Stocks = Math.floor(this.p2.superMeter / 100);
    ctx.fillText(`SUPER [${p2Stocks}]`, 910, 492);

    // --- COMBO HIT COUNTER ---
    if (this.p1.comboCounter > 1 && this.p1.comboTimer > 0) {
      this.p1.comboTimer--;
      ctx.textAlign = 'left';
      ctx.font = "bold 26px 'Teko', Impact";
      ctx.fillStyle = '#ffea00';
      ctx.fillText(`${this.p1.comboCounter} HITS !`, 60, 95);
    } else {
      this.p1.comboCounter = 0;
    }

    if (this.p2.comboCounter > 1 && this.p2.comboTimer > 0) {
      this.p2.comboTimer--;
      ctx.textAlign = 'right';
      ctx.font = "bold 26px 'Teko', Impact";
      ctx.fillStyle = '#ffea00';
      ctx.fillText(`${this.p2.comboCounter} HITS !`, 900, 95);
    } else {
      this.p2.comboCounter = 0;
    }
  }

  // --- Big Dramatic Announcer Text Banner ---
  drawBanner() {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = "bold 72px 'Teko', Impact, sans-serif";
    ctx.fillStyle = this.bannerColor;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 12;
    ctx.fillText(this.bannerText, 480, 260);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeText(this.bannerText, 480, 260);
    ctx.restore();
  }
}

// Initialize Game Engine on Page Load
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});
