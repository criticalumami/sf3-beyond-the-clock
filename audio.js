// Street Fighter III Chiptune & Arcade Sound Engine using Web Audio API

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.bgmPlaying = false;
    this.bgmStep = 0;
    this.bgmInterval = null;
    this.enabled = true;
    this.isMuted = false;
    this.initOnUserGesture();
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  initOnUserGesture() {
    const resume = () => {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('keydown', resume);
      window.removeEventListener('click', resume);
      window.removeEventListener('touchstart', resume);
    };
    window.addEventListener('keydown', resume);
    window.addEventListener('click', resume);
    window.addEventListener('touchstart', resume);
  }

  toggleAudio() {
    if (!this.ctx) this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  // --- Retro Sound Effects ---

  playHit(isHeavy = false) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Noise blast for impact
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = isHeavy ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(isHeavy ? 400 : 900, now);

    // Punch body oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = isHeavy ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(isHeavy ? 160 : 220, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    oscGain.gain.setValueAtTime(isHeavy ? 0.9 : 0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(this.sfxGain);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    noise.start(now);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playWhoosh() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Iconic Street Fighter 3 Metallic Parry Sound
  playParry() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // 3 dissonant high square / ring oscillators for that unmistakable metallic "CLANG!"
    const freqs = [1046.5, 1318.5, 1760.0];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.35);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.36);
    });

    // Metallic shimmer
    const noiseSize = this.ctx.sampleRate * 0.1;
    const noiseBuf = this.ctx.createBuffer(1, noiseSize, this.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseSize; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseSize * 0.1));
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(3000, now);
    noise.connect(hp);
    hp.connect(this.sfxGain);
    noise.start(now);
  }

  // SF3 Super Art Flash (Screen Freeze Chime)
  playSuperFlash() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // High crystalline freeze sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(3200, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    // Sub-bass boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(90, now);
    sub.frequency.exponentialRampToValueAtTime(25, now + 0.6);
    subGain.gain.setValueAtTime(0.8, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 0.6);
    sub.stop(now + 0.65);
  }

  playHadouken() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(540, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  playOfficeToss() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // TONY'S SPECIAL: Group Call (Phone ringing & audio feedback chime)
  playGroupCall() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Dual tone phone ring (440Hz + 480Hz)
    [440, 480, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.setValueAtTime(freq * 1.2, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.29);
    });
  }

  // GEORGE'S SPECIAL: Meditation (Resonant Singing Bowl & OM Drone)
  playMeditation() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Warm Tibetan singing bowl harmonics (136.1 Hz Ohm frequency)
    [136.1, 272.2, 408.3, 544.4].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.4 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.76);
    });
  }

  // AMID'S SPECIAL: Jokes (Classic Stand-up Comedy Rimshot Ba-dum-tss!)
  playJoke() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Drum 1: Ba (now)
    const d1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    d1.frequency.setValueAtTime(180, now);
    d1.frequency.exponentialRampToValueAtTime(70, now + 0.06);
    g1.gain.setValueAtTime(0.5, now);
    g1.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
    d1.connect(g1); g1.connect(this.sfxGain);
    d1.start(now); d1.stop(now + 0.07);

    // Drum 2: Dum (now + 0.09)
    const d2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    d2.frequency.setValueAtTime(220, now + 0.09);
    d2.frequency.exponentialRampToValueAtTime(90, now + 0.16);
    g2.gain.setValueAtTime(0.5, now + 0.09);
    g2.gain.exponentialRampToValueAtTime(0.01, now + 0.17);
    d2.connect(g2); g2.connect(this.sfxGain);
    d2.start(now + 0.09); d2.stop(now + 0.17);

    // Cymbal: Tss! (now + 0.19)
    const cSize = this.ctx.sampleRate * 0.25;
    const cBuf = this.ctx.createBuffer(1, cSize, this.ctx.sampleRate);
    const cd = cBuf.getChannelData(0);
    for (let i = 0; i < cSize; i++) cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (cSize * 0.2));
    const cSrc = this.ctx.createBufferSource();
    cSrc.buffer = cBuf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(4500, now + 0.19);
    cSrc.connect(hp);
    hp.connect(this.sfxGain);
    cSrc.start(now + 0.19);
  }

  playChairSpin() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(450, now + 0.2);
    osc.frequency.linearRampToValueAtTime(260, now + 0.4);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.43);
  }

  playDash() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.07);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playKnockdown() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.33);
  }

  // Retro Announcer Voice
  speakAnnouncer(phrase) {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(phrase.toUpperCase());
      utter.pitch = 0.85;
      utter.rate = 1.15;
      utter.volume = this.isMuted ? 0 : 0.9;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      // Speech synthesis fallback
    }
  }

  // --- Dynamic Street Fighter 3 Arcade Chiptune BGM ---
  startBGM() {
    if (this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // SF3 3rd Strike Jazzy / Hip-Hop Funk Beat in D Minor
    // Bassline notes (Hz)
    const D2 = 73.42, F2 = 87.31, G2 = 98.00, A2 = 110.00, C3 = 130.81, D3 = 146.83;
    const bassline = [
      D2, null, D2, F2, null, G2, null, A2,
      D2, D2, null, C3, null, A2, G2, F2,
      D2, null, D3, null, C3, null, A2, null,
      G2, G2, F2, null, D2, null, null, null
    ];

    // Synth Melody notes
    const D4 = 293.66, F4 = 349.23, G4 = 392.00, A4 = 440.00, C5 = 523.25, D5 = 587.33;
    const melody = [
      null, null, D4, null, F4, G4, A4, null,
      null, C5, null, A4, G4, F4, D4, null,
      null, D4, null, F4, G4, null, A4, C5,
      D5, null, C5, A4, G4, F4, D4, null
    ];

    const stepDuration = 135; // ~111 BPM 16th notes
    this.bgmInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const idx = this.bgmStep % 32;

      // Bass Synth
      const bassNote = bassline[idx];
      if (bassNote) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassNote, now);
        
        // Lowpass filter for warm synth bass
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(320, now);
        lp.frequency.exponentialRampToValueAtTime(120, now + 0.12);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);

        osc.connect(lp);
        lp.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + 0.14);
      }

      // Melody Lead
      const melNote = melody[idx];
      if (melNote) {
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = 'square';
        mOsc.frequency.setValueAtTime(melNote, now);

        mGain.gain.setValueAtTime(0.2, now);
        mGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        mOsc.connect(mGain);
        mGain.connect(this.bgmGain);

        mOsc.start(now);
        mOsc.stop(now + 0.13);
      }

      // Drum: Kick on 0, 8, 16, 24; Snare on 4, 12, 20, 28; Hi-hat on every 2
      if (idx % 8 === 0) {
        // Kick
        const kOsc = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kOsc.frequency.setValueAtTime(140, now);
        kOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
        kGain.gain.setValueAtTime(0.6, now);
        kGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        kOsc.connect(kGain);
        kGain.connect(this.bgmGain);
        kOsc.start(now);
        kOsc.stop(now + 0.09);
      } else if (idx % 8 === 4) {
        // Snare
        const sBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.06, this.ctx.sampleRate);
        const sd = sBuf.getChannelData(0);
        for (let i = 0; i < sd.length; i++) sd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sd.length * 0.3));
        const sSrc = this.ctx.createBufferSource();
        sSrc.buffer = sBuf;
        const sFilt = this.ctx.createBiquadFilter();
        sFilt.type = 'highpass';
        sFilt.frequency.setValueAtTime(1200, now);
        sSrc.connect(sFilt);
        sFilt.connect(this.bgmGain);
        sSrc.start(now);
      }

      // Hi-hat
      if (idx % 2 === 0) {
        const hBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate);
        const hd = hBuf.getChannelData(0);
        for (let i = 0; i < hd.length; i++) hd[i] = (Math.random() * 2 - 1);
        const hSrc = this.ctx.createBufferSource();
        hSrc.buffer = hBuf;
        const hGain = this.ctx.createGain();
        hGain.gain.setValueAtTime(0.08, now);
        hSrc.connect(hGain);
        hGain.connect(this.bgmGain);
        hSrc.start(now);
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
