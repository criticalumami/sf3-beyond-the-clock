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

    this.stageFaddoulImg = new Image();
    this.stageFaddoulImg.src = 'assets/stage_faddoul.png';

    this.availableStages = ['faddoul', 'powerplant'];
    this.stageIndex = 0;
    this.stageId = 'faddoul';

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

  selectMenuOption() {
    AudioSys.init();
    AudioSys.playHit(true);
    this.gameMode = 'arcade';
    this.switchScreen('select');
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
    document.getElementById('btn-arcade').onclick = (e) => {
      e.stopPropagation();
      AudioSys.init();
      AudioSys.startBGM();
      this.gameMode = 'arcade';
      this.switchScreen('select');
    };
    document.getElementById('btn-versus').onclick = (e) => {
      e.stopPropagation();
      AudioSys.init();
      AudioSys.startBGM();
      this.gameMode = 'versus';
      this.switchScreen('select');
    };
    document.getElementById('btn-training').onclick = (e) => {
      e.stopPropagation();
      AudioSys.init();
      AudioSys.startBGM();
      this.gameMode = 'training';
      this.switchScreen('select');
    };
    document.getElementById('btn-howtoplay').onclick = (e) => {
      e.stopPropagation();
      document.getElementById('help-modal').classList.add('active');
    };
    document.getElementById('btn-controls-quick').onclick = (e) => {
      e.stopPropagation();
      document.getElementById('help-modal').classList.add('active');
    };
    document.getElementById('close-help').onclick = (e) => {
      e.stopPropagation();
      document.getElementById('help-modal').classList.remove('active');
    };

    // Character select slots
    const charSlots = document.querySelectorAll('.char-slot');
    charSlots.forEach(slot => {
      slot.onclick = () => {
        AudioSys.init();
        const charId = slot.getAttribute('data-char');
        this.p1Char = charId;
        this.confirmSelect('p1');
      };
    });

    // Victory screen buttons
    document.getElementById('btn-rematch').onclick = () => {
      AudioSys.init();
      this.startMatch();
    };
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
      audioBtn.textContent = active ? 'AUDIO: ON 🔊' : 'AUDIO: MUTED 🔇';
    };

    // Stage toggle button
    const stageToggleBtn = document.getElementById('btn-toggle-stage');
    if (stageToggleBtn) {
      stageToggleBtn.onclick = (e) => {
        e.stopPropagation();
        this.stageIndex = (this.stageIndex + 1) % this.availableStages.length;
        this.stageId = this.availableStages[this.stageIndex];
        const labels = {
          faddoul: '📍 STAGE: FADDOUL SUPERMARKET (JOUNIEH)',
          powerplant: '📍 STAGE: SEASIDE POWER PLANT (SECTOR 7)'
        };
        stageToggleBtn.textContent = labels[this.stageId];
        AudioSys.playHit(false);
      };
    }
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

    // Set Stage
    const stageTitles = {
      faddoul: 'STAGE: FADDOUL SUPERMARKET &bull; JOUNIEH / SARBA',
      powerplant: 'STAGE: SEASIDE INDUSTRIAL POWER PLANT &bull; SECTOR 7'
    };
    document.getElementById('vs-stage-name').innerHTML = stageTitles[this.stageId] || stageTitles['faddoul'];

    AudioSys.speakLebanese('FIGHT');
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

  canTriggerFinishHim() {
    return (this.p1.roundsWon >= 1 || this.p2.roundsWon >= 1) && this.matchState === 'fighting';
  }

  triggerFinishHim(loser) {
    this.matchState = 'finish_him';
    this.finishHimLoser = loser;
    this.finishHimTimer = 300; // 5-second fatality window
    this.showBannerText('FINISH HIM !', '#ff0022');
    AudioSys.speakMK('FINISH HIM');
  }

  triggerFatality() {
    this.matchState = 'fatality';
    this.fatalityTimer = 180;
    this.showBannerText('FATALITY', '#ff0022');
    AudioSys.speakMK('FATALITY');
    const winner = this.p1.hp > 0 ? this.p1 : this.p2;
    winner.roundsWon++;
    setTimeout(() => {
      this.endMatch(winner);
    }, 3200);
  }

  startRound() {
    this.p1.resetRound(260, 1);
    this.p2.resetRound(700, -1);
    this.roundTimer = 99;
    this.matchState = 'intro';

    // Alternate stages between rounds in Arcade mode
    if (this.gameMode === 'arcade' && this.currentRound === 2) {
      this.stageId = 'powerplant';
    }

    // Play Temple Gong
    AudioSys.playGong();

    const roundCode = this.currentRound === 3 ? 'FINAL ROUND' : `ROUND ${this.currentRound}`;
    const roundText = this.currentRound === 3 ? 'FINAL ROUND' : `ROUND ${this.currentRound}`;
    this.showBannerText(roundText, '#ffd700');
    AudioSys.speakMK(roundCode);

    setTimeout(() => {
      this.showBannerText('FIGHT !', '#ff2200');
      AudioSys.speakMK('FIGHT');
      this.matchState = 'fighting';
      this.startTimer();
    }, 1300);
  }

  startTimer() {
    if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);
    this.roundTimerInterval = setInterval(() => {
      if ((this.matchState === 'fighting' || this.matchState === 'finish_him') && this.roundTimer > 0) {
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
    this.showBannerText(`${winner.characterId.toUpperCase()} WINS !`, '#ffdd44');
    AudioSys.speakMK(`${winner.characterId.toUpperCase()} WINS`);

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
      // 1. Dark Crimson Vignette during FINISH HIM!
      if (this.matchState === 'finish_him') {
        this.ctx.fillStyle = 'rgba(60, 0, 10, 0.45)';
        this.ctx.fillRect(0, 0, 960, 540);
      }

      // 2. Persistent Floor Blood Stains & Flying Blood Droplets
      Sprites.updateAndDrawBlood(this.ctx, 460);

      // 3. Render Digitized Fighters
      this.p1.draw(this.ctx);
      this.p2.draw(this.ctx);

      // 4. Render FX (Hitsparks, Parry Rings)
      Sprites.drawEffects(this.ctx);

      // 5. Render "TOASTY!" Easter Egg
      Sprites.drawToasty(this.ctx);

      // 6. Render Mortal Kombat 1 Authentic 1992 HUD
      this.drawHUD();

      // 7. Render Super Flash Cut-in
      if (this.superFreezeTimer > 0 && this.superFreezeChar) {
        Sprites.drawSuperFlashCutIn(this.ctx, this.superFreezeChar, this.superFreezeTimer, 45);
      }

      // 8. Render Announcer Big Text Banner
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

    if (this.stageId === 'faddoul') {
      // ==========================================
      // STAGE 1: FADDOUL SUPERMARKET (JOUNIEH / SARBA)
      // ==========================================
      if (this.stageFaddoulImg.complete && this.stageFaddoulImg.naturalWidth > 0) {
        ctx.drawImage(this.stageFaddoulImg, 0, 0, 960, 540);
      } else {
        ctx.fillStyle = '#6699cc';
        ctx.fillRect(0, 0, 960, 540);
      }

      const time = Date.now() * 0.003;

      // 1. Animated 24/7 Red Neon Pulse on Supermarket facade (x: 512, y: 300)
      const neonAlpha = 0.25 + Math.sin(time * 3) * 0.15;
      ctx.fillStyle = `rgba(255, 30, 30, ${neonAlpha})`;
      ctx.beginPath();
      ctx.arc(514, 305, 36, 0, Math.PI * 2);
      ctx.fill();

      // 2. Lebanese Flag Fluttering wave on lamp pole (x: 322, y: 140 to 220)
      const flagWave = Math.sin(time * 2) * 3;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(302 + flagWave, 145, 42, 60);

      // 3. Wet Asphalt Parking Lot Reflections (bottom puddles)
      ctx.strokeStyle = 'rgba(255, 230, 150, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(320, 508, 85 + Math.sin(time) * 5, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(680, 514, 110 + Math.cos(time) * 6, 14, 0, 0, Math.PI * 2);
      ctx.stroke();

    } else {
      // ==========================================
      // STAGE 2: SEASIDE INDUSTRIAL POWER PLANT
      // ==========================================
      if (this.stagePowerplantImg.complete && this.stagePowerplantImg.naturalWidth > 0) {
        ctx.drawImage(this.stagePowerplantImg, 0, 0, 960, 540);
      } else {
        ctx.fillStyle = '#5599dd';
        ctx.fillRect(0, 0, 960, 540);
      }

      // Chimney smoke plumes
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

      // Puddle ripples
      const time = Date.now() * 0.003;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(280, 505, 75 + Math.sin(time) * 4, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ambient floating dust & seaside sunlight motes
    this.bgParticles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    ctx.restore();
  }

  // --- MORTAL KOMBAT 1 (1992 ARCADE) AUTHENTIC HUD ---
  drawHUD() {
    const ctx = this.ctx;

    // --- HEALTH BARS (Thick Emerald Green with Gold Bevels & Stone Frame) ---
    const barWidth = 370;
    const barHeight = 24;

    // Helper: Draw MK1 Stone Health Bar
    const drawMKHealthBar = (x, y, fighter, isLeft) => {
      // 1. Dark Carved Stone Bevel Frame
      ctx.fillStyle = '#16171d';
      ctx.fillRect(x - 3, y - 3, barWidth + 6, barHeight + 6);
      ctx.strokeStyle = '#383c48';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 3, y - 3, barWidth + 6, barHeight + 6);

      // Gold Outer Trim
      ctx.strokeStyle = '#c89b3c';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

      // 2. Interior Blood Red Empty Fill
      ctx.fillStyle = '#4a0008';
      ctx.fillRect(x, y, barWidth, barHeight);

      // 3. Yellow/Orange Damage Lag Trail
      const yellowWidth = (fighter.displayHp / fighter.maxHp) * barWidth;
      ctx.fillStyle = '#d48800';
      if (isLeft) {
        ctx.fillRect(x + (barWidth - yellowWidth), y, yellowWidth, barHeight);
      } else {
        ctx.fillRect(x, y, yellowWidth, barHeight);
      }

      // 4. Emerald Lime-Green Active Health Bar (Iconic MK1 Green)
      const greenWidth = (fighter.hp / fighter.maxHp) * barWidth;
      const isLow = fighter.hp < 220;
      const pulse = isLow ? Math.sin(Date.now() * 0.012) > 0 : false;
      const barColor = pulse ? '#ff1133' : '#00e611';

      ctx.fillStyle = barColor;
      if (isLeft) {
        ctx.fillRect(x + (barWidth - greenWidth), y, greenWidth, barHeight);
        // Top highlight shine
        ctx.fillStyle = pulse ? '#ff8899' : '#88ff88';
        ctx.fillRect(x + (barWidth - greenWidth), y, greenWidth, 5);
      } else {
        ctx.fillRect(x, y, greenWidth, barHeight);
        ctx.fillStyle = pulse ? '#ff8899' : '#88ff88';
        ctx.fillRect(x, y, greenWidth, 5);
      }
    };

    // Draw P1 (Left) and P2 (Right) Bars
    drawMKHealthBar(50, 26, this.p1, true);
    drawMKHealthBar(540, 26, this.p2, false);

    // --- ROUND TIMER (Carved Dark Stone Tablet in Center) ---
    ctx.fillStyle = '#101218';
    ctx.fillRect(445, 16, 70, 46);
    ctx.strokeStyle = '#c89b3c';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(445, 16, 70, 46);

    ctx.font = "bold 36px 'Teko', Impact, sans-serif";
    ctx.fillStyle = this.roundTimer <= 10 ? '#ff1133' : '#ffc400';
    ctx.textAlign = 'center';
    ctx.fillText(this.roundTimer.toString().padStart(2, '0'), 480, 50);

    // --- FIGHTER NAMES (Bold Golden Gothic Typography Below Health Bars) ---
    ctx.font = "bold 20px 'Teko', Impact, sans-serif";
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'left';
    ctx.fillText(this.p1.characterId.toUpperCase(), 52, 68);

    ctx.textAlign = 'right';
    ctx.fillText(this.p2.characterId.toUpperCase(), 908, 68);
    ctx.shadowBlur = 0;

    // --- GOLDEN DRAGON MEDALLIONS / WIN TOKENS ---
    for (let i = 0; i < 2; i++) {
      // P1 Medallions
      ctx.fillStyle = i < this.p1.roundsWon ? '#ffd700' : '#2a2d36';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(58 + (i * 22), 82, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // P2 Medallions
      ctx.fillStyle = i < this.p2.roundsWon ? '#ffd700' : '#2a2d36';
      ctx.beginPath();
      ctx.arc(902 - (i * 22), 82, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // --- BOTTOM SUPER / POWER METERS ---
    const saBarWidth = 260;
    const saBarHeight = 14;

    // P1 Meter
    ctx.fillStyle = '#111';
    ctx.fillRect(50, 504, saBarWidth, saBarHeight);
    ctx.strokeStyle = '#c89b3c';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 504, saBarWidth, saBarHeight);

    const p1SaProgress = (this.p1.superMeter / this.p1.maxSuperMeter) * saBarWidth;
    ctx.fillStyle = this.p1.superMeter >= 100 ? '#ff1133' : '#b30000';
    ctx.fillRect(50, 504, p1SaProgress, saBarHeight);

    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd700';
    const p1Stocks = Math.floor(this.p1.superMeter / 100);
    ctx.fillText(`KOMBAT POWER [${p1Stocks}]`, 50, 496);

    // P2 Super Meter
    ctx.fillStyle = '#111';
    ctx.fillRect(650, 504, saBarWidth, saBarHeight);
    ctx.strokeStyle = '#c89b3c';
    ctx.lineWidth = 2;
    ctx.strokeRect(650, 504, saBarWidth, saBarHeight);

    const p2SaProgress = (this.p2.superMeter / this.p2.maxSuperMeter) * saBarWidth;
    ctx.fillStyle = this.p2.superMeter >= 100 ? '#ff1133' : '#b30000';
    ctx.fillRect(650 + (saBarWidth - p2SaProgress), 504, p2SaProgress, saBarHeight);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd700';
    const p2Stocks = Math.floor(this.p2.superMeter / 100);
    ctx.fillText(`KOMBAT POWER [${p2Stocks}]`, 910, 496);

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
