// Street Fighter III Custom 2D Pixel Art & FX Rendering Engine

class SpriteRenderer {
  constructor() {
    this.portraits = {
      tony: new Image(),
      george: new Image(),
      amid: new Image()
    };
    this.portraits.tony.src = 'assets/tony.jpg';
    this.portraits.george.src = 'assets/george.jpg';
    this.portraits.amid.src = 'assets/amid.jpg';

    this.particles = [];
    this.hitSparks = [];
    this.parryEffects = [];
    this.slashTrails = [];
  }

  // Draw 2D Fighter Pixel Sprite based on state and animation frame
  drawFighter(ctx, fighter) {
    ctx.save();
    const facing = fighter.facing; // 1 for right, -1 for left
    const x = Math.round(fighter.x);
    const y = Math.round(fighter.y);

    ctx.translate(x, y);
    ctx.scale(facing, 1);

    // Character ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flash white on hit / parry / super
    if (fighter.parryFlashTimer > 0) {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 25;
    } else if (fighter.invincibleTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
      ctx.globalAlpha = 0.6;
    }

    // After-image ghost trails during dash or Super Art
    if (fighter.hasGhostTrail) {
      this.drawGhostTrails(ctx, fighter);
    }

    // Call individual character sprite generator
    switch (fighter.characterId) {
      case 'tony':
        this.renderTony(ctx, fighter);
        break;
      case 'george':
        this.renderGeorge(ctx, fighter);
        break;
      case 'amid':
        this.renderAmid(ctx, fighter);
        break;
    }

    ctx.restore();
  }

  // ==========================================
  // TONY: The Horned Punk Twin-Dagger Rogue
  // ==========================================
  renderTony(ctx, f) {
    const anim = f.currentAnim;
    const frame = Math.floor(f.animFrame);
    const bob = (anim === 'idle') ? Math.sin(frame * 0.4) * 3 : 0;

    // Red flowing tatter ribbon trails behind
    const sashSway = Math.sin(frame * 0.5) * 8;
    ctx.strokeStyle = '#d41130';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -50 + bob);
    ctx.quadraticCurveTo(-35, -45 + sashSway, -45, -30 + sashSway * 1.5);
    ctx.stroke();

    ctx.strokeStyle = '#8a091d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -45 + bob);
    ctx.quadraticCurveTo(-28, -35 - sashSway, -38, -15 - sashSway);
    ctx.stroke();

    // --- LEGS & COMBAT BOOTS ---
    ctx.fillStyle = '#1a1a24'; // Dark combat pants
    if (anim === 'walk_fwd') {
      const step = Math.sin(frame * 0.6) * 16;
      this.drawPixelLeg(ctx, -12 - step, -35, -14 - step, 0, '#111');
      this.drawPixelLeg(ctx, 10 + step, -35, 12 + step, 0, '#111');
    } else if (anim === 'jump') {
      this.drawPixelLeg(ctx, -14, -40, -18, -15, '#111');
      this.drawPixelLeg(ctx, 8, -40, 14, -18, '#111');
    } else if (anim === 'crouch') {
      this.drawPixelLeg(ctx, -14, -25, -20, 0, '#111');
      this.drawPixelLeg(ctx, 12, -25, 18, 0, '#111');
    } else {
      // Idle / ready stance
      this.drawPixelLeg(ctx, -15, -38 + bob, -20, 0, '#111');
      this.drawPixelLeg(ctx, 14, -38 + bob, 18, 0, '#111');
    }

    // --- TORSO & CHAINS ---
    const torsoY = (anim === 'crouch') ? -42 : -68 + bob;
    ctx.fillStyle = '#16161b'; // Black spiked sleeveless vest
    ctx.fillRect(-16, torsoY, 32, 34);

    // Bare muscular arms/chest skin
    ctx.fillStyle = '#bf8b6a';
    ctx.fillRect(-8, torsoY + 4, 16, 12);

    // Silver spiked chains crisscrossing
    ctx.strokeStyle = '#c5c8d0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, torsoY + 4);
    ctx.lineTo(16, torsoY + 28);
    ctx.moveTo(16, torsoY + 4);
    ctx.lineTo(-16, torsoY + 28);
    ctx.stroke();

    // Spiked red shoulder pads
    ctx.fillStyle = '#b30e28';
    ctx.fillRect(-20, torsoY - 2, 8, 8);
    ctx.fillRect(12, torsoY - 2, 8, 8);

    // --- HEAD & ICONIC HORNS ---
    const headY = torsoY - 24;
    // Neck
    ctx.fillStyle = '#a67254';
    ctx.fillRect(-6, torsoY - 6, 12, 8);
    // Face (rugged, sharp chin)
    ctx.fillStyle = '#bf8b6a';
    ctx.fillRect(-11, headY, 22, 22);

    // Hair / receding punk stubble
    ctx.fillStyle = '#222026';
    ctx.fillRect(-11, headY - 4, 22, 6);
    ctx.fillRect(-12, headY, 4, 14);

    // Intense eyes & piercing brow
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, headY + 7, 5, 4);
    ctx.fillStyle = '#e60000'; // Fierce red glow iris
    ctx.fillRect(2, headY + 8, 3, 3);
    // Stubble
    ctx.fillStyle = '#6e5040';
    ctx.fillRect(-8, headY + 16, 16, 4);

    // The signature Minotaur Horns!
    ctx.fillStyle = '#e8d8be';
    ctx.beginPath();
    // Left horn curving back
    ctx.moveTo(-11, headY + 2);
    ctx.quadraticCurveTo(-26, headY - 14, -20, headY - 24);
    ctx.quadraticCurveTo(-14, headY - 14, -8, headY + 4);
    ctx.fill();
    // Right horn curving forward
    ctx.moveTo(8, headY + 4);
    ctx.quadraticCurveTo(24, headY - 14, 26, headY - 22);
    ctx.quadraticCurveTo(16, headY - 12, 11, headY + 2);
    ctx.fill();
    // Metal horn base rings
    ctx.fillStyle = '#555964';
    ctx.fillRect(-13, headY + 2, 6, 4);
    ctx.fillRect(7, headY + 2, 6, 4);

    // --- ARMS & DUAL DAGGERS ---
    if (anim === 'special_1') {
      // Group Call: Holds up ringing smartphone in hand, soundwaves radiating!
      this.drawDaggerArm(ctx, 10, torsoY + 2, 32, torsoY - 14, false);
      this.drawDaggerArm(ctx, -12, torsoY + 10, -18, torsoY + 16, true);
      // Smartphone in hand
      ctx.fillStyle = '#1a1a24';
      ctx.fillRect(28, torsoY - 26, 12, 22);
      ctx.fillStyle = '#00f0ff'; // Screen glow
      ctx.fillRect(30, torsoY - 24, 8, 16);
      // Radio audio wave arcs
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(34, torsoY - 15, 14, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(34, torsoY - 15, 22, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    } else if (anim === 'attack_light') {
      // Fast thrust with lead dagger
      this.drawDaggerArm(ctx, 10, torsoY + 6, 45, torsoY + 2, true);
      this.drawDaggerArm(ctx, -12, torsoY + 10, -2, torsoY + 14, false);
    } else if (anim === 'attack_heavy') {
      // Scissor cross slash
      const slashReach = 50 + Math.sin(frame * 0.8) * 15;
      this.drawDaggerArm(ctx, 10, torsoY + 2, slashReach, torsoY - 8, true);
      this.drawDaggerArm(ctx, -10, torsoY + 4, slashReach - 10, torsoY + 18, true);
    } else if (anim === 'special_2') {
      // Horn Ram bull rush pose
      this.drawDaggerArm(ctx, -10, torsoY + 12, -25, torsoY + 22, false);
      this.drawDaggerArm(ctx, 10, torsoY + 14, 20, torsoY + 25, false);
    } else {
      // Idle combat dagger hold
      this.drawDaggerArm(ctx, -14, torsoY + 10, -20, torsoY + 24, false);
      this.drawDaggerArm(ctx, 12, torsoY + 8, 26, torsoY + 18, true);
    }
  }

  // ==========================================
  // GEORGE: The Mystic Sage / Chakra Master
  // ==========================================
  renderGeorge(ctx, f) {
    const anim = f.currentAnim;
    const frame = Math.floor(f.animFrame);
    const bob = (anim === 'idle') ? Math.sin(frame * 0.35) * 4 : 0;

    // Glowing mystic chakra ring behind head
    const ringPulse = Math.sin(Date.now() * 0.006) * 4;
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -90 + bob, 22 + ringPulse, 0, Math.PI * 2);
    ctx.stroke();

    // Chakra particle dots
    ctx.fillStyle = '#00ffff';
    for (let i = 0; i < 4; i++) {
      const angle = (Date.now() * 0.003) + (i * Math.PI / 2);
      const px = Math.cos(angle) * (24 + ringPulse);
      const py = -90 + bob + Math.sin(angle) * (24 + ringPulse);
      ctx.fillRect(px - 2, py - 2, 4, 4);
    }

    // --- LEGS & FLOWING ASCETIC WHITE PANTS ---
    const pantsY = -40 + bob;
    ctx.fillStyle = '#eaeef4'; // Creamy white monk pants
    if (anim === 'walk_fwd') {
      const step = Math.sin(frame * 0.5) * 14;
      this.drawMonkLeg(ctx, -10 - step, pantsY, -14 - step, 0);
      this.drawMonkLeg(ctx, 12 + step, pantsY, 14 + step, 0);
    } else if (anim === 'jump') {
      this.drawMonkLeg(ctx, -12, pantsY - 5, -16, -15);
      this.drawMonkLeg(ctx, 14, pantsY - 5, 22, -10);
    } else {
      this.drawMonkLeg(ctx, -14, pantsY, -18, 0);
      this.drawMonkLeg(ctx, 14, pantsY, 18, 0);
    }

    // --- ROBES & BLUE CHAKRA SASH ---
    const torsoY = (anim === 'crouch') ? -45 : -70 + bob;
    // White upper gi
    ctx.fillStyle = '#f2f4f8';
    ctx.fillRect(-17, torsoY, 34, 34);

    // Bare chest V-neck
    ctx.fillStyle = '#c4906a';
    ctx.beginPath();
    ctx.moveTo(-7, torsoY);
    ctx.lineTo(7, torsoY);
    ctx.lineTo(0, torsoY + 16);
    ctx.fill();

    // Deep blue patterned ceremonial sash
    ctx.fillStyle = '#1e3860';
    ctx.fillRect(-18, torsoY + 2, 8, 32);
    ctx.fillRect(10, torsoY + 2, 8, 32);

    // Beaded prayer necklace
    ctx.fillStyle = '#8b5a2b';
    for (let i = -6; i <= 6; i += 3) {
      ctx.fillRect(i, torsoY + 14 + Math.abs(i) * 0.5, 3, 3);
    }

    // Flowing blue ribbon tail
    const ribbonWave = Math.sin(frame * 0.4) * 10;
    ctx.strokeStyle = '#1e3860';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-4, torsoY + 30);
    ctx.quadraticCurveTo(-20, torsoY + 45 + ribbonWave, -15, torsoY + 65 + ribbonWave);
    ctx.stroke();

    // --- HEAD, BEARD & TOPKNOT ---
    const headY = torsoY - 26;
    // Face
    ctx.fillStyle = '#c4906a';
    ctx.fillRect(-11, headY, 22, 22);

    // Black Hair & Topknot bun
    ctx.fillStyle = '#1c1b22';
    ctx.fillRect(-12, headY - 6, 24, 8);
    // Bun
    ctx.fillRect(-6, headY - 14, 12, 10);
    ctx.fillStyle = '#9e7343'; // Bun pin
    ctx.fillRect(-8, headY - 10, 16, 2);

    // Magnificent Full Black Beard!
    ctx.fillStyle = '#15141a';
    ctx.beginPath();
    ctx.moveTo(-11, headY + 12);
    ctx.lineTo(11, headY + 12);
    ctx.lineTo(8, headY + 28);
    ctx.lineTo(-4, headY + 28);
    ctx.fill();

    // Focused calm eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, headY + 7, 5, 4);
    ctx.fillStyle = '#00a8ff'; // Glowing cyan spiritual pupil
    ctx.fillRect(2, headY + 8, 3, 3);

    // --- ARMS & GLOWING KI ENERGY ---
    if (anim === 'special_1') {
      // MEDITATION: Floating Lotus Pose with Golden Zen Aura & Sanskrit glyph
      this.drawMonkArm(ctx, 10, torsoY + 12, 16, torsoY + 28, true);
      this.drawMonkArm(ctx, -10, torsoY + 12, -16, torsoY + 28, true);
      
      // Radiant Golden Meditation Aura Sphere
      ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(0, -50 + bob, 45, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Floating Sanskrit symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ॐ', 0, -42 + bob);

    } else if (anim === 'attack_light' || anim === 'attack_heavy') {
      // Palm thrust with blue ki flare
      this.drawMonkArm(ctx, 12, torsoY + 8, 45, torsoY + 6, true);
      this.drawMonkArm(ctx, -10, torsoY + 10, -5, torsoY + 15, false);
      // Ki glow on thrusting hand
      ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(45, torsoY + 6, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (anim === 'special_2') {
      // Leaping Astral Shoryu Palm
      this.drawMonkArm(ctx, 10, torsoY + 4, 20, torsoY - 35, true);
      this.drawMonkArm(ctx, -10, torsoY + 12, -18, torsoY + 22, false);
    } else {
      // Ready Zen palm stance
      this.drawMonkArm(ctx, -12, torsoY + 10, -8, torsoY + 20, false);
      this.drawMonkArm(ctx, 12, torsoY + 8, 28, torsoY + 14, true);
    }
  }

  // ==========================================
  // AMID: The Telekinetic Corporate Accountant
  // ==========================================
  renderAmid(ctx, f) {
    const anim = f.currentAnim;
    const frame = Math.floor(f.animFrame);
    const bob = (anim === 'idle') ? Math.sin(frame * 0.3) * 3 : 0;

    // --- TELEKINETIC FLOATING OFFICE ITEMS IN ORBIT ---
    const orbitTime = Date.now() * 0.004;
    // 1. Floating Coffee Mug
    const mugX = Math.cos(orbitTime) * 38;
    const mugY = -70 + bob + Math.sin(orbitTime) * 16;
    ctx.fillStyle = '#f0f0f5';
    ctx.fillRect(mugX - 6, mugY - 6, 12, 12);
    ctx.fillStyle = '#4a2511'; // Steaming coffee top
    ctx.fillRect(mugX - 4, mugY - 6, 8, 3);
    // Mug handle
    ctx.strokeStyle = '#f0f0f5';
    ctx.lineWidth = 2;
    ctx.strokeRect(mugX + 6, mugY - 3, 3, 6);

    // 2. Floating Calculator
    const calcX = Math.cos(orbitTime + 2.1) * 42;
    const calcY = -65 + bob + Math.sin(orbitTime + 2.1) * 18;
    ctx.fillStyle = '#2b2d35';
    ctx.fillRect(calcX - 7, calcY - 10, 14, 20);
    ctx.fillStyle = '#8cb080'; // LCD screen
    ctx.fillRect(calcX - 5, calcY - 8, 10, 5);
    // Tiny orange/red buttons
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(calcX - 4, calcY - 1, 3, 3);
    ctx.fillRect(calcX + 1, calcY - 1, 3, 3);
    ctx.fillRect(calcX - 4, calcY + 3, 3, 3);
    ctx.fillRect(calcX + 1, calcY + 3, 3, 3);

    // 3. Floating Tax Receipts / Dossiers
    const docX = Math.cos(orbitTime + 4.2) * 35;
    const docY = -80 + bob + Math.sin(orbitTime + 4.2) * 20;
    ctx.fillStyle = '#fffdf0';
    ctx.save();
    ctx.translate(docX, docY);
    ctx.rotate(Math.sin(orbitTime * 2) * 0.4);
    ctx.fillRect(-8, -12, 16, 24);
    // Print lines
    ctx.fillStyle = '#999';
    ctx.fillRect(-6, -8, 12, 2);
    ctx.fillRect(-6, -4, 10, 2);
    ctx.fillRect(-6, 0, 12, 2);
    ctx.fillRect(-6, 4, 8, 2);
    ctx.restore();

    // Golden telekinetic psychic aura sparks
    ctx.strokeStyle = 'rgba(255, 200, 50, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -60 + bob, 36 + Math.sin(orbitTime * 3) * 5, 0, Math.PI * 2);
    ctx.stroke();

    // --- SPECIAL MOVE: CHAIR SPIN ---
    if (anim === 'special_2') {
      // Spinning in Executive Swivel Chair!
      ctx.save();
      const spinAngle = Date.now() * 0.03;
      ctx.translate(0, -35);
      // Wheels
      ctx.fillStyle = '#333';
      ctx.fillRect(-22, 28, 44, 6);
      ctx.fillStyle = '#777'; // Chrome base
      ctx.fillRect(-4, 18, 8, 12);
      // Chair leather seat & back
      ctx.fillStyle = '#1a1816';
      ctx.fillRect(-24, 10, 48, 10);
      ctx.fillRect(-20, -20, 40, 30);
      // Spinning blur
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-15, -15, 30, 25);
      ctx.fillStyle = '#c41d1d'; // Blurring red tie
      ctx.fillRect(-3, -8, 6, 18);
      ctx.restore();
      return;
    }

    // --- LEGS & SNEAKERS ---
    const pantsY = -38 + bob;
    ctx.fillStyle = '#3a3e4d'; // Corporate charcoal trousers
    if (anim === 'walk_fwd') {
      const step = Math.sin(frame * 0.6) * 15;
      this.drawOfficeLeg(ctx, -12 - step, pantsY, -14 - step, 0);
      this.drawOfficeLeg(ctx, 12 + step, pantsY, 14 + step, 0);
    } else if (anim === 'jump') {
      this.drawOfficeLeg(ctx, -14, pantsY - 6, -18, -12);
      this.drawOfficeLeg(ctx, 12, pantsY - 6, 16, -14);
    } else {
      this.drawOfficeLeg(ctx, -14, pantsY, -16, 0);
      this.drawOfficeLeg(ctx, 14, pantsY, 16, 0);
    }

    // --- WHITE DRESS SHIRT & LOOSENED RED TIE ---
    const torsoY = (anim === 'crouch') ? -42 : -68 + bob;
    // White untucked shirt (slightly wide belly / middle-aged build)
    ctx.fillStyle = '#eef0f5';
    ctx.fillRect(-18, torsoY, 36, 34);

    // Unbuttoned collar
    ctx.fillStyle = '#d5987a';
    ctx.fillRect(-6, torsoY + 2, 12, 10);

    // Crooked Red Necktie
    ctx.fillStyle = '#b81424';
    ctx.beginPath();
    ctx.moveTo(-3, torsoY + 8);
    ctx.lineTo(3, torsoY + 8);
    const tieSway = Math.sin(frame * 0.45) * 4;
    ctx.lineTo(4 + tieSway, torsoY + 28);
    ctx.lineTo(0 + tieSway, torsoY + 34);
    ctx.lineTo(-4 + tieSway, torsoY + 28);
    ctx.fill();

    // Wrist watch
    ctx.fillStyle = '#445';
    ctx.fillRect(-19, torsoY + 24, 4, 4);

    // --- HEAD, STUBBLE & TIRED CORPORATE GLOW ---
    const headY = torsoY - 24;
    ctx.fillStyle = '#d5987a';
    ctx.fillRect(-12, headY, 24, 22);

    // Short styled dark hair
    ctx.fillStyle = '#22232a';
    ctx.fillRect(-13, headY - 6, 26, 8);
    ctx.fillRect(-14, headY, 4, 12);

    // 5 o'clock shadow stubble
    ctx.fillStyle = '#826555';
    ctx.fillRect(-10, headY + 14, 20, 6);

    // Stressed dark circles under eyes & furrowed brow
    ctx.fillStyle = '#9e7565';
    ctx.fillRect(0, headY + 6, 6, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, headY + 8, 5, 4);
    ctx.fillStyle = '#1a1820'; // Pupil
    ctx.fillRect(3, headY + 9, 3, 3);

    // Reading glasses hanging from collar
    ctx.strokeStyle = '#8a7040';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-5, torsoY + 14, 10, 5);

    // --- ARMS & TELEKINETIC PALM THRUSTS ---
    if (anim === 'special_1') {
      // JOKES: Stand-up comedy gesture, holding mic / gesturing punchline with floating "HA HA!"
      this.drawOfficeArm(ctx, 12, torsoY + 4, 34, torsoY - 8, true);
      this.drawOfficeArm(ctx, -10, torsoY + 10, -22, torsoY + 24, false);
      
      // Comedy microphone in hand
      ctx.fillStyle = '#111';
      ctx.fillRect(32, torsoY - 18, 5, 14);
      ctx.fillStyle = '#aaa'; // Mic grille
      ctx.beginPath();
      ctx.arc(34, torsoY - 20, 5, 0, Math.PI * 2);
      ctx.fill();

      // Comic speech bubble / Laughing sparks
      ctx.fillStyle = '#fff';
      ctx.fillRect(40, torsoY - 40, 48, 22);
      ctx.fillStyle = '#000';
      ctx.font = "bold 8px 'Press Start 2P', monospace";
      ctx.fillText("HA! HA!", 44, torsoY - 26);

    } else if (anim === 'attack_light') {
      // Rapid backhand paper slap
      this.drawOfficeArm(ctx, 12, torsoY + 6, 42, torsoY + 4, true);
      this.drawOfficeArm(ctx, -12, torsoY + 12, -8, torsoY + 18, false);
    } else if (anim === 'attack_heavy') {
      // Double telekinetic palm blast sending files forward!
      this.drawOfficeArm(ctx, 12, torsoY + 4, 44, torsoY + 8, true);
      this.drawOfficeArm(ctx, -8, torsoY + 6, 38, torsoY + 14, true);
      // Flying paper burst effect
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(48, torsoY + 2, 8, 12);
      ctx.fillRect(52, torsoY + 16, 12, 8);
    } else {
      // Stressed telekinetic stance (one hand on forehead / coffee pose)
      this.drawOfficeArm(ctx, -14, torsoY + 12, -18, torsoY + 20, false);
      this.drawOfficeArm(ctx, 12, torsoY + 8, 26, torsoY + 12, true);
    }
  }

  // --- Helper Pixel Limb Renderers ---
  drawPixelLeg(ctx, hipX, hipY, footX, footY, bootColor) {
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#22232e';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(footX, footY);
    ctx.stroke();

    // Combat Boot
    ctx.fillStyle = bootColor;
    ctx.fillRect(footX - 6, footY - 8, 16, 8);
    // Red laces
    ctx.fillStyle = '#d41130';
    ctx.fillRect(footX - 2, footY - 6, 6, 2);
  }

  drawMonkLeg(ctx, hipX, hipY, footX, footY) {
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#e0e4eb';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(footX, footY);
    ctx.stroke();

    // Ankle bandages
    ctx.fillStyle = '#b8c0cc';
    ctx.fillRect(footX - 5, footY - 10, 10, 6);
    // Barefoot
    ctx.fillStyle = '#c4906a';
    ctx.fillRect(footX - 6, footY - 4, 14, 4);
  }

  drawOfficeLeg(ctx, hipX, hipY, footX, footY) {
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#323746';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(footX, footY);
    ctx.stroke();

    // White casual corporate sneakers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(footX - 6, footY - 7, 15, 7);
    ctx.fillStyle = '#445'; // Sneaker sole
    ctx.fillRect(footX - 6, footY - 2, 16, 2);
  }

  drawDaggerArm(ctx, shoulderX, shoulderY, handX, handY, hasDagger) {
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#bf8b6a'; // Muscular arm
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // Spiked gauntlet
    ctx.fillStyle = '#1b1b22';
    ctx.fillRect(handX - 5, handY - 4, 10, 8);

    if (hasDagger) {
      // Jagged jagged steel dagger blade
      ctx.fillStyle = '#d8dbe5';
      ctx.beginPath();
      ctx.moveTo(handX + 4, handY - 3);
      ctx.lineTo(handX + 32, handY);
      ctx.lineTo(handX + 4, handY + 5);
      ctx.fill();

      // Glowing crimson bloodline edge
      ctx.fillStyle = '#ff1133';
      ctx.fillRect(handX + 6, handY - 1, 22, 2);
    }
  }

  drawMonkArm(ctx, shoulderX, shoulderY, handX, handY, hasAura) {
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#c4906a';
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // Wrist beads
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(handX - 4, handY - 4, 8, 8);

    if (hasAura) {
      ctx.fillStyle = 'rgba(0, 210, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(handX, handY, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawOfficeArm(ctx, shoulderX, shoulderY, handX, handY, isFlinging) {
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#eef0f5'; // White shirt sleeve
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // Hand
    ctx.fillStyle = '#d5987a';
    ctx.fillRect(handX - 4, handY - 4, 8, 8);

    if (isFlinging) {
      // Psychic golden fingers glow
      ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.fillRect(handX, handY - 6, 8, 12);
    }
  }

  drawGhostTrails(ctx, fighter) {
    const color = fighter.characterId === 'tony' ? 'rgba(255, 30, 60, 0.35)' :
                  fighter.characterId === 'george' ? 'rgba(0, 200, 255, 0.35)' :
                  'rgba(255, 200, 40, 0.35)';
    ctx.fillStyle = color;
    ctx.fillRect(-20, -75, 40, 75);
  }

  // --- Visual FX Pipeline ---
  addHitSpark(x, y, isHeavy = false, isParry = false) {
    this.hitSparks.push({
      x, y,
      isHeavy,
      isParry,
      life: 1.0,
      decay: isParry ? 0.08 : 0.12,
      sparks: Array.from({ length: isHeavy ? 14 : 8 }, () => ({
        vx: (Math.random() - 0.5) * (isHeavy ? 12 : 7),
        vy: (Math.random() - 0.5) * (isHeavy ? 12 : 7),
        color: isParry ? '#00ffff' : (isHeavy ? '#ff3b30' : '#ffcc00')
      }))
    });
  }

  addParryRing(x, y) {
    this.parryEffects.push({
      x, y,
      radius: 10,
      maxRadius: 65,
      life: 1.0,
      decay: 0.07
    });
  }

  updateAndDrawFX(ctx) {
    // 1. Parry Rings (Iconic SF3 blue expanding shockwave)
    for (let i = this.parryEffects.length - 1; i >= 0; i--) {
      const p = this.parryEffects[i];
      p.radius += 4;
      p.life -= p.decay;

      ctx.save();
      ctx.strokeStyle = `rgba(0, 240, 255, ${p.life})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Center bright star
      ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
      ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
      ctx.restore();

      if (p.life <= 0) this.parryEffects.splice(i, 1);
    }

    // 2. Hit Sparks
    for (let i = this.hitSparks.length - 1; i >= 0; i--) {
      const h = this.hitSparks[i];
      h.life -= h.decay;

      ctx.save();
      h.sparks.forEach(s => {
        s.vx *= 0.92;
        s.vy *= 0.92;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, h.life);
        ctx.fillRect(h.x + s.vx * (1 - h.life) * 15, h.y + s.vy * (1 - h.life) * 15, 4, 4);
      });

      // Central burst
      ctx.fillStyle = h.isParry ? '#ffffff' : (h.isHeavy ? '#ffea00' : '#ffffff');
      ctx.globalAlpha = Math.max(0, h.life * 0.8);
      ctx.beginPath();
      ctx.arc(h.x, h.y, (1 - h.life) * 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (h.life <= 0) this.hitSparks.splice(i, 1);
    }
  }

  // Draw Super Art Cut-in Flash
  drawSuperFlashCutIn(ctx, charId, timer, maxTimer) {
    const progress = 1 - (timer / maxTimer);
    const img = this.portraits[charId];
    if (!img) return;

    ctx.save();
    // Screen diagonal slide
    const slideOffset = (1 - Math.sin(progress * Math.PI)) * 300;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 160, 960, 220);

    // Speed lines background
    ctx.strokeStyle = charId === 'tony' ? '#ff1144' : (charId === 'george' ? '#00d2ff' : '#ffbb00');
    ctx.lineWidth = 3;
    for (let i = 0; i < 960; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 160);
      ctx.lineTo(i + 40, 380);
      ctx.stroke();
    }

    // Portrait Cut-In Strip
    const portX = 220 - slideOffset;
    if (img.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(portX, 170, 520, 200);
      ctx.clip();
      ctx.drawImage(img, portX, 120, 520, 320);
      ctx.restore();
    }

    // Golden frame border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeRect(portX, 170, 520, 200);

    // SUPER ART BANNER TEXT
    ctx.font = "bold 32px 'Teko', sans-serif";
    ctx.fillStyle = '#ffea00';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 8;
    ctx.fillText("SUPER ART !", 40, 240);

    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.fillStyle = '#ffffff';
    const saName = charId === 'tony' ? 'CRIMSON EXECUTION' :
                   charId === 'george' ? 'NIRVANA JUDGMENT' :
                   'OVERTIME CALAMITY';
    ctx.fillText(saName, 40, 280);

    ctx.restore();
  }
}

const Sprites = new SpriteRenderer();
