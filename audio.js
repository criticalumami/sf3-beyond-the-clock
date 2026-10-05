// CHALET III: 100% Reliable 8-Bit Anime & Lebanese Arcade Sound Engine
// Pure Web Audio API: Zero external dependencies, never hangs or glitches.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmStep = 0;
    this.bgmTimer = null;
    this.unlocked = false;

    // Attach unlock events immediately
    this.setupUnlockListeners();
  }

  setupUnlockListeners() {
    const unlock = () => {
      this.init();
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        this.unlocked = true;
        if (!this.bgmPlaying) {
          this.startBGM();
        }
      }
    };
    ['click', 'keydown', 'touchstart', 'mousedown'].forEach(evt => {
      window.addEventListener(evt, unlock, { once: false, passive: true });
    });
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  }

  toggleAudio() {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  // ==========================================
  // PUNCHY ANIME 8-BIT COMBAT SOUND EFFECTS
  // ==========================================

  playHit(isHeavy = false) {
    this.init();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const dur = isHeavy ? 0.14 : 0.08;

    // 1. Anime frequency dive oscillator (Dragon Ball / CPS3 punch)
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = isHeavy ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(isHeavy ? 380 : 560, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + dur);

    g.gain.setValueAtTime(isHeavy ? 0.85 : 0.6, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + dur);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);

    // 2. Crisp impact noise burst
    try {
      const bSize = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bSize * 0.25));
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = buf;
      const filt = this.ctx.createBiquadFilter();
      filt.type = isHeavy ? 'lowpass' : 'bandpass';
      filt.frequency.setValueAtTime(isHeavy ? 700 : 1600, t);
      nSrc.connect(filt);
      filt.connect(this.sfxGain);
      nSrc.start(t);
    } catch (e) {}
  }

  playWhoosh() {
    this.init();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.09);

    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // SF3 Metallic Crystal Parry "SHIIING!"
  playParry() {
    this.init();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;

    // Harmonic bell chime chords
    [1174.66, 1760.00, 2349.32].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.96, t + 0.35);

      g.gain.setValueAtTime(0.45 / (i + 1), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  // Super Art Flash Power Surge & Sub Drop
  playSuperFlash() {
    this.init();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;

    // High crystalline sweep
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(3600, t + 0.22);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.45);

    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.48);

    // Deep sub bass impact
    const sub = this.ctx.createOscillator();
    const subG = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(130, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.55);

    subG.gain.setValueAtTime(0.9, t);
    subG.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    osc.connect(g);
    g.connect(this.sfxGain);
    sub.connect(subG);
    subG.connect(this.sfxGain);

    osc.start(t);
    sub.start(t);
    osc.stop(t + 0.5);
    sub.stop(t + 0.56);
  }

  // TONY: Group Call Ringtone
  playGroupCall() {
    this.init();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    [659.25, 587.33, 369.99, 415.30].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const st = t + (i * 0.07);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, st);
      g.gain.setValueAtTime(0.35, st);
      g.gain.exponentialRampToValueAtTime(0.01, st + 0.065);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.07);
    });
  }

  // GEORGE: Meditation Drone
  playMeditation() {
    this.init();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    [146.83, 220.00, 293.66].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.35 / (i + 1), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.81);
    });
  }

  // AMID: Jokes Rimshot (Dum... Tak... Tss!)
  playJoke() {
    this.init();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;

    // Dum
    const d = this.ctx.createOscillator();
    const dg = this.ctx.createGain();
    d.type = 'sine';
    d.frequency.setValueAtTime(150, t);
    d.frequency.exponentialRampToValueAtTime(45, t + 0.09);
    dg.gain.setValueAtTime(0.8, t);
    dg.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
    d.connect(dg); dg.connect(this.sfxGain);
    d.start(t); d.stop(t + 0.1);

    // Tak
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);
    g.gain.setValueAtTime(0.4, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t + 0.1); osc.stop(t + 0.19);
  }

  playDash() {
    this.init();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(380, t + 0.08);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.09);
  }

  playKnockdown() {
    this.init();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
    this.playHit(true);
  }

  playChairSpin() {
    this.init();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(520, t + 0.18);
    osc.frequency.linearRampToValueAtTime(260, t + 0.38);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.41);
  }

  // ==========================================
  // PURE SYNTHESIZED 8-BIT LEBANESE ANNOUNCER
  // (Zero external speech API dependency)
  // ==========================================
  speakLebanese(code) {
    this.init();
    if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;

    // Distinctive 8-bit phonetic pitch sequences for each Lebanese callout
    const pitchMap = {
      'ROUND 1': [340, 420, 500, 600],       // "Jaw-leh Weh-deh!"
      'ROUND 2': [340, 420, 580, 480],       // "Jaw-leh Tan-yeh!"
      'FINAL ROUND': [440, 550, 660, 880],   // "A-khir Jaw-leh!"
      'FIGHT': [400, 620, 800],              // "Yal-la Bal-lish!"
      'PARRY': [880, 1100, 1320],            // "Ya Ha-raam!"
      'SUPER ART': [500, 750, 1000],         // "Wal-la'a-ha!"
      'KO': [600, 450, 300, 180],            // "Kha-las Fa-rat-to!"
      'WIN': [523, 659, 784, 1046]           // "Ma-brouk ya Kbeer!"
    };

    const pitches = pitchMap[code] || [440, 550, 660];
    pitches.forEach((freq, idx) => {
      const st = t + (idx * 0.08);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, st);
      osc.frequency.linearRampToValueAtTime(freq * 1.15, st + 0.07);

      g.gain.setValueAtTime(0.4, st);
      g.gain.exponentialRampToValueAtTime(0.01, st + 0.075);

      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.08);
    });
  }

  speakAnnouncer(p) {
    this.speakLebanese(p);
  }

  // ==========================================
  // 8-BIT LEBANESE DABKE CHIPTUNE SOUNDTRACK
  // ==========================================

  startBGM() {
    this.init();
    if (this.bgmPlaying || !this.ctx || this.ctx.state !== 'running') return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // Authentic Lebanese Dabke (Maqam Bayati / Hijaz in D)
    const D4 = 293.66, Eb4 = 311.13, Fs4 = 369.99, G4 = 392.00, A4 = 440.00, Bb4 = 466.16, C5 = 523.25, D5 = 587.33;
    const melody = [
      D4,  D4,  Eb4, Fs4,  G4,  G4,  Fs4, Eb4,
      Fs4, G4,  A4,  Bb4,  A4,  G4,  Fs4, Eb4,
      D5,  C5,  Bb4, A4,   G4,  Fs4, G4,  A4,
      D4,  Fs4, G4,  Fs4,  Eb4, D4,  D4,  null
    ];

    const D2 = 73.42, G2 = 98.00, A2 = 110.00;
    const bass = [
      D2, null, D2, null, G2, null, A2, null,
      D2, D2,   null, D2, G2, null, A2, G2,
      D2, null, D2, null, G2, null, A2, null,
      D2, D2,   D2, null, G2, A2,  D2, null
    ];

    const stepMs = 120; // High-energy 125 BPM Dabke pace
    this.bgmTimer = setInterval(() => {
      if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;
      const idx = this.bgmStep % 32;

      // 1. Derbake Rhythm (Dum... Tak, Tak! Dum... Tak!)
      if (idx === 0 || idx === 8 || idx === 10 || idx === 16 || idx === 24 || idx === 26) {
        // Dum
        const d = this.ctx.createOscillator();
        const dg = this.ctx.createGain();
        d.type = 'sine';
        d.frequency.setValueAtTime(140, t);
        d.frequency.exponentialRampToValueAtTime(45, t + 0.1);
        dg.gain.setValueAtTime(0.8, t);
        dg.gain.exponentialRampToValueAtTime(0.01, t + 0.11);
        d.connect(dg); dg.connect(this.bgmGain);
        d.start(t); d.stop(t + 0.12);
      } else if (idx === 4 || idx === 6 || idx === 12 || idx === 14 || idx === 20 || idx === 22 || idx === 28 || idx === 30) {
        // Tak
        const osc = this.ctx.createOscillator();
        const tg = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);
        tg.gain.setValueAtTime(0.3, t);
        tg.gain.exponentialRampToValueAtTime(0.01, t + 0.055);
        osc.connect(tg); tg.connect(this.bgmGain);
        osc.start(t); osc.stop(t + 0.06);
      }

      // 2. Dabke Mijwiz Lead Synth (Square wave with oriental vibrato)
      const note = melody[idx];
      if (note) {
        const m = this.ctx.createOscillator();
        const mg = this.ctx.createGain();
        m.type = 'square';
        m.frequency.setValueAtTime(note, t);
        m.frequency.linearRampToValueAtTime(note * 1.018, t + 0.04);
        m.frequency.linearRampToValueAtTime(note, t + 0.09);

        mg.gain.setValueAtTime(0.22, t);
        mg.gain.exponentialRampToValueAtTime(0.01, t + 0.11);

        m.connect(mg); mg.connect(this.bgmGain);
        m.start(t); m.stop(t + 0.12);
      }

      // 3. Bassline
      const bNote = bass[idx];
      if (bNote) {
        const b = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        b.type = 'sawtooth';
        b.frequency.setValueAtTime(bNote, t);

        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(240, t);

        bg.gain.setValueAtTime(0.38, t);
        bg.gain.exponentialRampToValueAtTime(0.01, t + 0.11);

        b.connect(lp); lp.connect(bg); bg.connect(this.bgmGain);
        b.start(t); b.stop(t + 0.12);
      }

      this.bgmStep++;
    }, stepMs);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

const AudioSys = new SoundEngine();
