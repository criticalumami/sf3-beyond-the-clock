// CHALET III: 8-Bit Anime & Lebanese Arcade Sound Engine
// Featuring 8-Bit Dabke Chiptune BGM, Derbake Percussion, Anime SFX & Lebanese Voice Synthesizer

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.bgmPlaying = false;
    this.bgmStep = 0;
    this.bgmInterval = null;
    this.isMuted = false;
    this.speechUnlocked = false;

    this.initAudioTriggers();
  }

  ensureContext() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.40, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);
      } catch (e) {
        console.warn('AudioContext init error', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  initAudioTriggers() {
    const unlock = () => {
      this.ensureContext();
      this.speechUnlocked = true;
      if (!this.bgmPlaying) {
        this.startBGM();
      }
    };
    ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(ev => {
      window.addEventListener(ev, unlock, { once: false });
    });
  }

  toggleAudio() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  // ==========================================
  // 1. ANIME 8-BIT SOUND EFFECTS (SHARP & PUNCHY)
  // ==========================================

  playHit(isHeavy = false) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Anime crunch white-noise burst
    const dur = isHeavy ? 0.12 : 0.07;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.22));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isHeavy ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(isHeavy ? 600 : 1400, now);

    // Anime pitch-chirp oscillator (Dragon Ball / CPS3 punch)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = isHeavy ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(isHeavy ? 320 : 540, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + dur);

    oscGain.gain.setValueAtTime(isHeavy ? 0.9 : 0.65, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    noise.connect(filter);
    filter.connect(this.sfxGain);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    noise.start(now);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  playWhoosh() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Anime Street Fighter III Crystal Parry "SHIIING!"
  playParry() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 3 high crystalline harmonized bell frequencies
    [1320, 1760, 2640].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.95, now + 0.35);

      gain.gain.setValueAtTime(0.4 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.36);
    });

    // Metallic chime sweep
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(3200, now);
    sweep.frequency.linearRampToValueAtTime(5000, now + 0.15);
    sweepGain.gain.setValueAtTime(0.3, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    sweep.connect(sweepGain);
    sweepGain.connect(this.sfxGain);
    sweep.start(now);
    sweep.stop(now + 0.22);
  }

  // Super Art Freeze Chime & Bass Drop
  playSuperFlash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(4200, now + 0.22);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.45);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.48);

    // Bass Drop
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(120, now);
    bass.frequency.exponentialRampToValueAtTime(28, now + 0.55);
    bassGain.gain.setValueAtTime(0.85, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    bass.connect(bassGain);
    bassGain.connect(this.sfxGain);

    osc.start(now);
    bass.start(now);
    osc.stop(now + 0.5);
    bass.stop(now + 0.56);
  }

  // ==========================================
  // 2. LEBANESE SIGNATURE POWERS SOUNDS
  // ==========================================

  // TONY: GROUP CALL (Classic Lebanese WhatsApp / Nokia phone ring tone)
  playGroupCall() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Nokia / Fairouz arpeggiated 8-bit ringtone (E5 - D5 - F#4 - G#4)
    const notes = [659.25, 587.33, 369.99, 415.30];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + (idx * 0.08);

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.35, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.08);
    });
  }

  // GEORGE: MEDITATION (Lebanese Nay / Spiritual Singing Bowl drone)
  playMeditation() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Warm spiritual Maqam drone (D3 + A3 + D4)
    [146.83, 220.00, 293.66].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.35 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.86);
    });
  }

  // AMID: JOKES (Derbake comedy rimshot: Dum... Tak! + Cackle)
  playJoke() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Derbake Dum
    this.playDerbakeDum(now);
    // Derbake Tak
    this.playDerbakeTak(now + 0.1);
    // High comic squeak
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(700, now + 0.2);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.28);
    gain.gain.setValueAtTime(0.3, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now + 0.2);
    osc.stop(now + 0.33);
  }

  playDash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(360, now + 0.08);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playKnockdown() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    this.playDerbakeDum(now);
    this.playHit(true);
  }

  playChairSpin() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.linearRampToValueAtTime(520, now + 0.18);
    osc.frequency.linearRampToValueAtTime(260, now + 0.38);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.41);
  }

  // ==========================================
  // 3. LEBANESE ANNOUNCER VOICE & SPEECH
  // ==========================================
  speakLebanese(phraseCode) {
    this.ensureContext();

    // Mapping Lebanese Arabic phrases
    const phrases = {
      'ROUND 1': { text: 'Jawleh Wehdeh! Yalla!', arabic: 'جولة واحدة! يلا!' },
      'ROUND 2': { text: 'Jawleh Tanyeh! Shidd!', arabic: 'جولة ثانية! شد!' },
      'FINAL ROUND': { text: 'Akhir Jawleh! Ya Rab!', arabic: 'آخر جولة! يا رب!' },
      'FIGHT': { text: 'Yalla Ballish!', arabic: 'يلا بلش!' },
      'PARRY': { text: 'Ya Haraam! Laqatto!', arabic: 'يا حرام! لقطّو!' },
      'SUPER ART': { text: 'Wallaakh! Super!', arabic: 'ولّعها! سوبر!' },
      'GROUP CALL': { text: 'Alo! Fouto aal group!', arabic: 'ألو! فوتو عالغروب!' },
      'MEDITATION': { text: 'Sakineh w Rouqaan!', arabic: 'سكينة وروقان!' },
      'JOKES': { text: 'Nekteh Baykha!', arabic: 'نكتة بايخة!' },
      'KO': { text: 'Khalas Faratto!', arabic: 'خلص فرطو!' },
      'WIN': { text: 'Mabrouk ya Kbeer!', arabic: 'مبروك يا كبير!' }
    };

    const item = phrases[phraseCode] || { text: phraseCode, arabic: phraseCode };

    // 1. Synthesize 8-bit robotic anime vocal chime
    this.synthesizeAnimeChirp(phraseCode);

    // 2. Play Web Speech in Arabic if available
    if ('speechSynthesis' in window) {
      try {
        const utter = new SpeechSynthesisUtterance(item.arabic);
        utter.lang = 'ar-LB'; // Lebanese Arabic
        utter.rate = 1.25;
        utter.pitch = 1.05;
        utter.volume = this.isMuted ? 0 : 0.95;
        window.speechSynthesis.speak(utter);
      } catch (e) {
        // Fallback gracefully
      }
    }
  }

  speakAnnouncer(phrase) {
    this.speakLebanese(phrase);
  }

  synthesizeAnimeChirp(code) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Characteristic 8-bit voice synthesized formant
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(580, now + 0.08);
    osc.frequency.linearRampToValueAtTime(380, now + 0.16);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // ==========================================
  // 4. 8-BIT LEBANESE DABKE CHIPTUNE BGM (CPS3 ARCADE)
  // ==========================================

  playDerbakeDum(time) {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

    gain.gain.setValueAtTime(0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.14);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  playDerbakeTak(time) {
    if (!this.ctx || this.isMuted) return;
    const dur = 0.04;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.2));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(2200, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, time);

    src.connect(hp);
    hp.connect(gain);
    gain.connect(this.bgmGain);
    src.start(time);
  }

  startBGM() {
    this.ensureContext();
    if (this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // Iconic Lebanese Dabke / Mijwiz Chiptune Melody (Maqam Bayati / Hijaz in D)
    // Notes: D4, Eb4, F#4, G4, A4, Bb4, C5, D5
    const D4 = 293.66, Eb4 = 311.13, Fs4 = 369.99, G4 = 392.00, A4 = 440.00, Bb4 = 466.16, C5 = 523.25, D5 = 587.33;
    const dabkeMelody = [
      D4,  D4,  Eb4, Fs4,  G4,  G4,  Fs4, Eb4,
      Fs4, G4,  A4,  Bb4,  A4,  G4,  Fs4, Eb4,
      D5,  C5,  Bb4, A4,   G4,  Fs4, G4,  A4,
      D4,  Fs4, G4,  Fs4,  Eb4, D4,  D4,  null
    ];

    // Dabke Bassline (D2, G2, A2)
    const D2 = 73.42, G2 = 98.00, A2 = 110.00;
    const bassline = [
      D2, null, D2, null, G2, null, A2, null,
      D2, D2,   null, D2, G2, null, A2, G2,
      D2, null, D2, null, G2, null, A2, null,
      D2, D2,   D2, null, G2, A2,  D2, null
    ];

    // Fast 16th notes at ~126 BPM (approx 119ms per step)
    const stepDuration = 118;
    this.bgmInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const idx = this.bgmStep % 32;

      // 1. Derbake / Tabla Lebanese Rhythm:
      // Pattern: Dum (0), Tak (4), Tak (6), Dum (8), Dum (10), Tak (12), Tak (14)
      if (idx === 0 || idx === 8 || idx === 10 || idx === 16 || idx === 24 || idx === 26) {
        this.playDerbakeDum(now);
      } else if (idx === 4 || idx === 6 || idx === 12 || idx === 14 || idx === 20 || idx === 22 || idx === 28 || idx === 30) {
        this.playDerbakeTak(now);
      }

      // 2. Dabke Mijwiz Lead Synth (8-bit square pulse wave with Arabic vibrato)
      const melNote = dabkeMelody[idx];
      if (melNote) {
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = 'square';
        mOsc.frequency.setValueAtTime(melNote, now);

        // Fast micro-pitch trill for authentic Dabke feel
        mOsc.frequency.linearRampToValueAtTime(melNote * 1.015, now + 0.04);
        mOsc.frequency.linearRampToValueAtTime(melNote, now + 0.09);

        mGain.gain.setValueAtTime(0.24, now);
        mGain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

        mOsc.connect(mGain);
        mGain.connect(this.bgmGain);
        mOsc.start(now);
        mOsc.stop(now + 0.12);
      }

      // 3. Bass Synth
      const bassNote = bassline[idx];
      if (bassNote) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.setValueAtTime(bassNote, now);

        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(260, now);

        bGain.gain.setValueAtTime(0.4, now);
        bGain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

        bOsc.connect(lp);
        lp.connect(bGain);
        bGain.connect(this.bgmGain);

        bOsc.start(now);
        bOsc.stop(now + 0.12);
      }

      this.bgmStep++;
    }, stepDuration);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const AudioSys = new SoundEngine();
