// MORTAL KOMBAT 1 (1992 ARCADE) RETRO SPRITE & BLOOD RENDERING ENGINE
// Digitized Photorealistic Combatants, Chunky Blood Sprays, Floor Blood Pools & "TOASTY!"

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

    // Particle engines
    this.bloodDrops = [];
    this.floorBloodStains = [];
    this.hitSparks = [];
    this.parryEffects = [];
    this.ghostTrails = [];

    // "TOASTY!" Easter egg
    this.toastyActive = false;
    this.toastyTimer = 0;
    this.toastyMaxTimer = 65;

    // Fatality dark flash
    this.fatalityFlashTimer = 0;
  }

  // ==========================================
  // MORTAL KOMBAT 1 DIGITIZED FIGHTER RENDERER
  // ==========================================
  drawFighter(ctx, fighter) {
    ctx.save();
    const facing = fighter.facing; // 1 for right, -1 for left
    const x = Math.round(fighter.x);
    const y = Math.round(fighter.y);

    ctx.translate(x, y);
    ctx.scale(facing, 1);

    // 1. Digitized Dark Ground Shadow (Classic MK1 Oval)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Invincible / Parry Hit Flashing
    if (fighter.parryFlashTimer > 0) {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;
    } else if (fighter.invincibleTimer > 0 && Math.floor(Date.now() / 40) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    // 3. Render Fighter based on ID
    switch (fighter.characterId) {
      case 'tony':
        this.renderDigitizedTony(ctx, fighter);
        break;
      case 'george':
        this.renderDigitizedGeorge(ctx, fighter);
        break;
      case 'amid':
        this.renderDigitizedAmid(ctx, fighter);
        break;
    }

    ctx.restore();
  }

  // Helper: Draw Digitized Head with Photographic Face Cutout
  drawDigitizedHead(ctx, charId, x, y, radius, extraOptions = {}) {
    const img = this.portraits[charId];
    ctx.save();

    // 1. Neck & Collar
    ctx.fillStyle = extraOptions.skinColor || '#d49b72';
    ctx.fillRect(x - 8, y + radius - 4, 16, 14);
    // Neck shading
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x - 8, y + radius + 2, 16, 8);

    // 2. Head Silhouette & Photo Mask
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    if (img && img.complete && img.naturalWidth > 0) {
      // Crop upper face/head from the photo
      // tony face is roughly centered around upper 30%, george upper 28%, amid upper 25%
      const cropOffsets = {
        tony:   { sx: 0.15, sy: 0.05, sw: 0.70, sh: 0.40 },
        george: { sx: 0.15, sy: 0.04, sw: 0.70, sh: 0.40 },
        amid:   { sx: 0.12, sy: 0.04, sw: 0.75, sh: 0.42 }
      };
      const c = cropOffsets[charId] || { sx: 0.2, sy: 0.1, sw: 0.6, sh: 0.4 };
      const sx = img.naturalWidth * c.sx;
      const sy = img.naturalHeight * c.sy;
      const sw = img.naturalWidth * c.sw;
      const sh = img.naturalHeight * c.sh;

      // Draw photo inside clipped circle with digitized 1992 arcade contrast
      ctx.drawImage(img, sx, sy, sw, sh, x - radius, y - radius, radius * 2, radius * 2);

      // MK1 1992 Digitized Dither & Shadow Tint Overlay
      ctx.fillStyle = 'rgba(10, 5, 0, 0.15)';
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

      if (extraOptions.isHurt) {
        // Red hit flash tint on face
        ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
    } else {
      // Fallback stylized face
      ctx.fillStyle = extraOptions.skinColor || '#d49b72';
      ctx.fill();
    }

    ctx.restore();

    // 3. Digitized Head Border / Shadow (Classic MK1 cut-out rim)
    ctx.save();
    ctx.strokeStyle = '#1a1008';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Character Specific Head Accessories
    if (charId === 'tony') {
      // Tony's Demonic Crimson Horns protruding from head
      ctx.fillStyle = '#b3001e';
      ctx.beginPath();
      // Left horn
      ctx.moveTo(x - 12, y - radius + 5);
      ctx.quadraticCurveTo(x - 22, y - radius - 15, x - 18, y - radius - 24);
      ctx.quadraticCurveTo(x - 12, y - radius - 12, x - 6, y - radius + 2);
      ctx.fill();
      ctx.strokeStyle = '#330005';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Right horn
      ctx.beginPath();
      ctx.moveTo(x + 12, y - radius + 5);
      ctx.quadraticCurveTo(x + 22, y - radius - 15, x + 18, y - radius - 24);
      ctx.quadraticCurveTo(x + 12, y - radius - 12, x + 6, y - radius + 2);
      ctx.fill();
      ctx.stroke();

      // Horn tip highlights
      ctx.fillStyle = '#ff3355';
      ctx.fillRect(x - 19, y - radius - 24, 3, 4);
      ctx.fillRect(x + 17, y - radius - 24, 3, 4);

    } else if (charId === 'george') {
      // George's Mystic Chakra Third Eye / Aura Glow
      const glow = Math.sin(Date.now() * 0.006) * 3;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(x, y - 6, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 6, 6 + glow, 0, Math.PI * 2);
      ctx.stroke();

    } else if (charId === 'amid') {
      // Amid's Corporate Specs / Glasses Shine
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 12, y - 6, 10, 8);
      ctx.strokeRect(x + 2, y - 6, 10, 8);
      ctx.beginPath();
      ctx.moveTo(x - 2, y - 2);
      ctx.lineTo(x + 2, y - 2);
      ctx.stroke();
      // White glare tick
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 10, y - 5, 3, 2);
      ctx.fillRect(x + 4, y - 5, 3, 2);
    }

    ctx.restore();
  }

  // ==========================================
  // TONY: The Horned Crimson Assassin
  // MK1 Style: Black Martial Arts Gi with Red Trim, Spiked Gauntlets & Twin Daggers
  // ==========================================
  renderDigitizedTony(ctx, f) {
    const anim = f.currentAnim;
    const frame = Math.floor(f.animFrame);
    const isHurt = anim === 'hurt';
    const isDizzy = anim === 'dizzy';

    // MK1 Digitized Breathing bob
    const bob = (anim === 'idle') ? Math.sin(frame * 0.25) * 4 : 0;
    const sway = isDizzy ? Math.sin(Date.now() * 0.005) * 14 : 0;

    ctx.save();
    ctx.translate(sway, 0);

    // --- LEGS & COMBAT BOOTS ---
    ctx.fillStyle = '#14141a'; // Dark MK1 Gi pants
    if (anim === 'walk_fwd') {
      const step = Math.sin(frame * 0.4) * 18;
      this.drawDigitizedLeg(ctx, -12 - step, -45, -14 - step, 0, '#111116', '#a00a20');
      this.drawDigitizedLeg(ctx, 12 + step, -45, 14 + step, 0, '#111116', '#a00a20');
    } else if (anim === 'walk_back') {
      const step = Math.sin(frame * 0.4) * 14;
      this.drawDigitizedLeg(ctx, -10 + step, -45, -12 + step, 0, '#111116', '#a00a20');
      this.drawDigitizedLeg(ctx, 10 - step, -45, 12 - step, 0, '#111116', '#a00a20');
    } else if (anim === 'jump') {
      this.drawDigitizedLeg(ctx, -15, -55, -22, -20, '#111116', '#a00a20');
      this.drawDigitizedLeg(ctx, 10, -55, 18, -25, '#111116', '#a00a20');
    } else if (anim === 'crouch') {
      this.drawDigitizedLeg(ctx, -16, -30, -26, 0, '#111116', '#a00a20');
      this.drawDigitizedLeg(ctx, 14, -30, 24, 0, '#111116', '#a00a20');
    } else if (anim === 'heavy_kick') {
      // High Roundhouse
      this.drawDigitizedLeg(ctx, -12, -45, -14, 0, '#111116', '#a00a20');
      this.drawDigitizedLeg(ctx, 10, -45, 52, -75, '#111116', '#a00a20');
    } else {
      // Classic MK1 Martial Arts Stance
      this.drawDigitizedLeg(ctx, -14, -45, -18, 0, '#111116', '#a00a20');
      this.drawDigitizedLeg(ctx, 12, -45, 18, 0, '#111116', '#a00a20');
    }

    // --- TORSO (Black Ninja Gi with Red Trim) ---
    const torsoY = (anim === 'crouch') ? -65 : -95 + bob;
    ctx.fillStyle = '#1c1c24';
    ctx.beginPath();
    ctx.moveTo(-20, torsoY + 12);
    ctx.lineTo(20, torsoY + 12);
    ctx.lineTo(14, torsoY + 52);
    ctx.lineTo(-14, torsoY + 52);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#09090d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Red sash & trim
    ctx.fillStyle = '#b3001e';
    ctx.fillRect(-15, torsoY + 44, 30, 8); // Belt
    ctx.fillRect(-4, torsoY + 12, 8, 32);  // Red chest piping

    // Ribbon tails swaying
    const ribbonWave = Math.sin(frame * 0.3) * 6;
    ctx.strokeStyle = '#d41130';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, torsoY + 50);
    ctx.quadraticCurveTo(-24, torsoY + 65 + ribbonWave, -32, torsoY + 80);
    ctx.stroke();

    // --- ARMS & WEAPONS ---
    if (anim === 'light_punch') {
      // Snappy forward jab
      this.drawDigitizedArm(ctx, -16, torsoY + 18, -12, torsoY + 38, '#1c1c24', '#d49b72');
      this.drawDigitizedArm(ctx, 16, torsoY + 18, 56, torsoY + 18, '#1c1c24', '#d49b72', true, 'dagger');
    } else if (anim === 'heavy_punch') {
      // Crouching Uppercut or Heavy Slash
      if (f.isCrouching) {
        // THE ICONIC MK1 UPPERCUT!
        this.drawDigitizedArm(ctx, -14, torsoY + 18, -10, torsoY + 36, '#1c1c24', '#d49b72');
        this.drawDigitizedArm(ctx, 12, torsoY + 18, 22, torsoY - 45, '#1c1c24', '#d49b72', true, 'uppercut_fist');
      } else {
        // Heavy Twin Dagger Cross Slash
        this.drawDigitizedArm(ctx, -14, torsoY + 18, 48, torsoY + 12, '#1c1c24', '#d49b72', true, 'dagger');
        this.drawDigitizedArm(ctx, 14, torsoY + 18, 54, torsoY + 28, '#1c1c24', '#d49b72', true, 'dagger');
      }
    } else if (anim === 'special_1') {
      // GROUP CALL: Calling on ringing phone
      this.drawDigitizedArm(ctx, -14, torsoY + 18, -8, torsoY + 36, '#1c1c24', '#d49b72');
      this.drawDigitizedArm(ctx, 12, torsoY + 18, 16, torsoY - 10, '#1c1c24', '#d49b72', true, 'phone');
    } else if (anim === 'special_2') {
      // HORN RAM: Leaning forward bull charge
      this.drawDigitizedArm(ctx, -14, torsoY + 18, 30, torsoY + 28, '#1c1c24', '#d49b72', true, 'dagger');
      this.drawDigitizedArm(ctx, 12, torsoY + 18, 45, torsoY + 32, '#1c1c24', '#d49b72', true, 'dagger');
    } else if (isDizzy) {
      // Finish Him stagger - limp hanging arms
      const armSway = Math.sin(Date.now() * 0.007) * 8;
      this.drawDigitizedArm(ctx, -16, torsoY + 18, -20 + armSway, torsoY + 45, '#1c1c24', '#d49b72');
      this.drawDigitizedArm(ctx, 16, torsoY + 18, 18 - armSway, torsoY + 45, '#1c1c24', '#d49b72');
    } else {
      // Guard stance
      this.drawDigitizedArm(ctx, -16, torsoY + 18, -8, torsoY + 28, '#1c1c24', '#d49b72', true, 'dagger');
      this.drawDigitizedArm(ctx, 14, torsoY + 18, 28, torsoY + 22, '#1c1c24', '#d49b72', true, 'dagger');
    }

    // --- DIGITIZED HEAD ---
    const headY = torsoY - 2;
    this.drawDigitizedHead(ctx, 'tony', 0, headY, 18, { skinColor: '#d49b72', isHurt });

    ctx.restore();
  }

  // ==========================================
  // GEORGE: The Shaolin Mystic Sage
  // MK1 Style: Saffron & Gold Monk Robes, Bare Muscular Shoulder, Floating Lotus
  // ==========================================
  renderDigitizedGeorge(ctx, f) {
    const anim = f.currentAnim;
    const frame = Math.floor(f.animFrame);
    const isHurt = anim === 'hurt';
    const isDizzy = anim === 'dizzy';

    // Deep meditative breathing
    const bob = (anim === 'idle') ? Math.sin(frame * 0.2) * 3 : 0;
    const sway = isDizzy ? Math.sin(Date.now() * 0.005) * 14 : 0;

    ctx.save();
    ctx.translate(sway, 0);

    // --- SPECIAL 1: MEDITATION (FLOATING LOTUS POSE) ---
    if (anim === 'special_1') {
      const floatY = -85 + Math.sin(Date.now() * 0.006) * 16;
      // Golden Zen Barrier Sphere
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, floatY + 20, 55, 0, Math.PI * 2);
      ctx.stroke();

      // Crossed Lotus Legs
      ctx.fillStyle = '#b84414';
      ctx.beginPath();
      ctx.ellipse(0, floatY + 48, 38, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Torso in Robes
      ctx.fillStyle = '#d4881e';
      ctx.fillRect(-18, floatY + 10, 36, 38);

      // Praying Hands (Anjali Mudra)
      ctx.fillStyle = '#c88e63';
      ctx.fillRect(-6, floatY + 18, 12, 16);

      // Head
      this.drawDigitizedHead(ctx, 'george', 0, floatY - 6, 18, { skinColor: '#c88e63', isHurt });
      ctx.restore();
      return;
    }

    // --- NORMAL LEGS & BOOTS ---
    if (anim === 'walk_fwd') {
      const step = Math.sin(frame * 0.4) * 18;
      this.drawDigitizedLeg(ctx, -12 - step, -45, -14 - step, 0, '#b84414', '#e8a020');
      this.drawDigitizedLeg(ctx, 12 + step, -45, 14 + step, 0, '#b84414', '#e8a020');
    } else if (anim === 'crouch') {
      this.drawDigitizedLeg(ctx, -16, -30, -26, 0, '#b84414', '#e8a020');
      this.drawDigitizedLeg(ctx, 14, -30, 24, 0, '#b84414', '#e8a020');
    } else if (anim === 'heavy_kick') {
      // Dragon Flying Kick
      this.drawDigitizedLeg(ctx, -12, -45, -14, 0, '#b84414', '#e8a020');
      this.drawDigitizedLeg(ctx, 10, -45, 54, -70, '#b84414', '#e8a020');
    } else {
      this.drawDigitizedLeg(ctx, -14, -45, -18, 0, '#b84414', '#e8a020');
      this.drawDigitizedLeg(ctx, 12, -45, 18, 0, '#b84414', '#e8a020');
    }

    // --- TORSO (Saffron Monk Robes Draped Over Muscular Shoulder) ---
    const torsoY = (anim === 'crouch') ? -65 : -95 + bob;
    ctx.fillStyle = '#c88e63'; // Bare muscular chest
    ctx.beginPath();
    ctx.moveTo(-18, torsoY + 12);
    ctx.lineTo(18, torsoY + 12);
    ctx.lineTo(12, torsoY + 50);
    ctx.lineTo(-12, torsoY + 50);
    ctx.closePath();
    ctx.fill();

    // Saffron Robe draped diagonally across body
    ctx.fillStyle = '#d4881e';
    ctx.beginPath();
    ctx.moveTo(-20, torsoY + 12);
    ctx.lineTo(2, torsoY + 12);
    ctx.lineTo(14, torsoY + 50);
    ctx.lineTo(-14, torsoY + 50);
    ctx.closePath();
    ctx.fill();

    // Red prayer beads necklace
    ctx.strokeStyle = '#8a1818';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, torsoY + 18, 12, 0, Math.PI);
    ctx.stroke();

    // --- ARMS & STRIKES ---
    if (anim === 'light_punch') {
      // Shaolin Palm Strike
      this.drawDigitizedArm(ctx, -16, torsoY + 18, -12, torsoY + 36, '#d4881e', '#c88e63');
      this.drawDigitizedArm(ctx, 16, torsoY + 18, 54, torsoY + 20, '#c88e63', '#c88e63', true, 'palm');
    } else if (anim === 'heavy_punch') {
      if (f.isCrouching) {
        // UPPERCUT (Dragon Uppercut)
        this.drawDigitizedArm(ctx, -14, torsoY + 18, -10, torsoY + 36, '#d4881e', '#c88e63');
        this.drawDigitizedArm(ctx, 12, torsoY + 18, 20, torsoY - 45, '#c88e63', '#c88e63', true, 'uppercut_fist');
      } else {
        // Astral Palm Blast
        this.drawDigitizedArm(ctx, -14, torsoY + 18, 45, torsoY + 15, '#d4881e', '#c88e63', true, 'palm');
        this.drawDigitizedArm(ctx, 14, torsoY + 18, 52, torsoY + 25, '#c88e63', '#c88e63', true, 'palm');
      }
    } else if (isDizzy) {
      const armSway = Math.sin(Date.now() * 0.007) * 8;
      this.drawDigitizedArm(ctx, -16, torsoY + 18, -20 + armSway, torsoY + 45, '#d4881e', '#c88e63');
      this.drawDigitizedArm(ctx, 16, torsoY + 18, 18 - armSway, torsoY + 45, '#c88e63', '#c88e63');
    } else {
      // Classic Kung Fu / Karate guard
      this.drawDigitizedArm(ctx, -16, torsoY + 18, -6, torsoY + 32, '#d4881e', '#c88e63', true, 'palm');
      this.drawDigitizedArm(ctx, 14, torsoY + 18, 26, torsoY + 20, '#c88e63', '#c88e63', true, 'palm');
    }

    // --- DIGITIZED HEAD ---
    const headY = torsoY - 2;
    this.drawDigitizedHead(ctx, 'george', 0, headY, 18, { skinColor: '#c88e63', isHurt });

    ctx.restore();
  }

  // ==========================================
  // AMID: Burnout Overtime Executive Enforcer
  // MK1 Style: Business Vest over Rolled-up Shirt, Loosened Tie, Combat Stance
  // ==========================================
  renderDigitizedAmid(ctx, f) {
    const anim = f.currentAnim;
    const frame = Math.floor(f.animFrame);
    const isHurt = anim === 'hurt';
    const isDizzy = anim === 'dizzy';

    const bob = (anim === 'idle') ? Math.sin(frame * 0.25) * 3 : 0;
    const sway = isDizzy ? Math.sin(Date.now() * 0.005) * 14 : 0;

    ctx.save();
    ctx.translate(sway, 0);

    // --- LEGS & SHOES ---
    if (anim === 'walk_fwd') {
      const step = Math.sin(frame * 0.4) * 18;
      this.drawDigitizedLeg(ctx, -12 - step, -45, -14 - step, 0, '#2b2d35', '#111');
      this.drawDigitizedLeg(ctx, 12 + step, -45, 14 + step, 0, '#2b2d35', '#111');
    } else if (anim === 'crouch') {
      this.drawDigitizedLeg(ctx, -16, -30, -26, 0, '#2b2d35', '#111');
      this.drawDigitizedLeg(ctx, 14, -30, 24, 0, '#2b2d35', '#111');
    } else if (anim === 'heavy_kick') {
      this.drawDigitizedLeg(ctx, -12, -45, -14, 0, '#2b2d35', '#111');
      this.drawDigitizedLeg(ctx, 10, -45, 52, -72, '#2b2d35', '#111');
    } else {
      this.drawDigitizedLeg(ctx, -14, -45, -18, 0, '#2b2d35', '#111');
      this.drawDigitizedLeg(ctx, 12, -45, 18, 0, '#2b2d35', '#111');
    }

    // --- TORSO (Charcoal Vest over White Shirt & Red Tie) ---
    const torsoY = (anim === 'crouch') ? -65 : -95 + bob;
    // White dress shirt
    ctx.fillStyle = '#e8ecf2';
    ctx.beginPath();
    ctx.moveTo(-18, torsoY + 12);
    ctx.lineTo(18, torsoY + 12);
    ctx.lineTo(14, torsoY + 50);
    ctx.lineTo(-14, torsoY + 50);
    ctx.closePath();
    ctx.fill();

    // Charcoal Vest
    ctx.fillStyle = '#22252e';
    ctx.beginPath();
    ctx.moveTo(-18, torsoY + 12);
    ctx.lineTo(-6, torsoY + 12);
    ctx.lineTo(-2, torsoY + 36);
    ctx.lineTo(-14, torsoY + 50);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(18, torsoY + 12);
    ctx.lineTo(6, torsoY + 12);
    ctx.lineTo(2, torsoY + 36);
    ctx.lineTo(14, torsoY + 50);
    ctx.closePath();
    ctx.fill();

    // Loosened crimson tie
    ctx.fillStyle = '#b81428';
    ctx.fillRect(-3, torsoY + 14, 6, 26);

    // --- ARMS & MOVES ---
    if (anim === 'light_punch') {
      // Snappy straight punch
      this.drawDigitizedArm(ctx, -16, torsoY + 18, -10, torsoY + 36, '#e8ecf2', '#deb08d');
      this.drawDigitizedArm(ctx, 16, torsoY + 18, 54, torsoY + 20, '#e8ecf2', '#deb08d', true, 'fist');
    } else if (anim === 'heavy_punch') {
      if (f.isCrouching) {
        // UPPERCUT!
        this.drawDigitizedArm(ctx, -14, torsoY + 18, -10, torsoY + 36, '#e8ecf2', '#deb08d');
        this.drawDigitizedArm(ctx, 12, torsoY + 18, 20, torsoY - 45, '#e8ecf2', '#deb08d', true, 'uppercut_fist');
      } else {
        // Heavy Briefcase Slam / Microphone Strike
        this.drawDigitizedArm(ctx, -14, torsoY + 18, 48, torsoY + 15, '#e8ecf2', '#deb08d', true, 'fist');
        this.drawDigitizedArm(ctx, 14, torsoY + 18, 52, torsoY + 28, '#e8ecf2', '#deb08d', true, 'mic');
      }
    } else if (anim === 'special_1') {
      // JOKES: Stand-up comedy mic pose!
      this.drawDigitizedArm(ctx, -14, torsoY + 18, -6, torsoY + 32, '#e8ecf2', '#deb08d');
      this.drawDigitizedArm(ctx, 12, torsoY + 18, 18, torsoY - 6, '#e8ecf2', '#deb08d', true, 'mic');
    } else if (anim === 'special_2') {
      // CHAIR SPIN
      ctx.fillStyle = '#111';
      ctx.fillRect(-25, torsoY + 10, 50, 16);
      this.drawDigitizedArm(ctx, -16, torsoY + 18, 45, torsoY + 20, '#e8ecf2', '#deb08d');
      this.drawDigitizedArm(ctx, 16, torsoY + 18, -45, torsoY + 20, '#e8ecf2', '#deb08d');
    } else if (isDizzy) {
      const armSway = Math.sin(Date.now() * 0.007) * 8;
      this.drawDigitizedArm(ctx, -16, torsoY + 18, -20 + armSway, torsoY + 45, '#e8ecf2', '#deb08d');
      this.drawDigitizedArm(ctx, 16, torsoY + 18, 18 - armSway, torsoY + 45, '#e8ecf2', '#deb08d');
    } else {
      // Boxing brawler guard
      this.drawDigitizedArm(ctx, -16, torsoY + 18, -6, torsoY + 26, '#e8ecf2', '#deb08d', true, 'fist');
      this.drawDigitizedArm(ctx, 14, torsoY + 18, 24, torsoY + 20, '#e8ecf2', '#deb08d', true, 'fist');
    }

    // --- DIGITIZED HEAD ---
    const headY = torsoY - 2;
    this.drawDigitizedHead(ctx, 'amid', 0, headY, 18, { skinColor: '#deb08d', isHurt });

    ctx.restore();
  }

  // Helper: Draw Digitized Leg with Realistic Shading
  drawDigitizedLeg(ctx, hipX, hipY, footX, footY, pantsColor, bootColor) {
    ctx.save();
    const kneeX = (hipX + footX) / 2 + 4;
    const kneeY = (hipY + footY) / 2;

    // Pants (Thigh & Calf)
    ctx.strokeStyle = pantsColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY - 8);
    ctx.stroke();

    // Muscle highlight line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hipX + 1, hipY);
    ctx.lineTo(kneeX + 1, kneeY);
    ctx.stroke();

    // Combat Boot
    ctx.fillStyle = bootColor;
    ctx.fillRect(footX - 8, footY - 12, 16, 12);
    // Boot toe
    ctx.fillRect(footX, footY - 6, 12, 6);
    ctx.restore();
  }

  // Helper: Draw Digitized Arm with Clothing & Hand/Weapon
  drawDigitizedArm(ctx, shoulderX, shoulderY, handX, handY, sleeveColor, skinColor, hasWeapon = false, weaponType = '') {
    ctx.save();
    const elbowX = (shoulderX + handX) / 2 - 3;
    const elbowY = (shoulderY + handY) / 2 + 5;

    // Sleeve / Upper Arm
    ctx.strokeStyle = sleeveColor;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.stroke();

    // Forearm
    ctx.strokeStyle = skinColor;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // Fist / Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(handX, handY, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Weapons / Accessories
    if (hasWeapon) {
      if (weaponType === 'dagger') {
        // Tony's Combat Blade
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(handX, handY);
        ctx.lineTo(handX + 18, handY - 12);
        ctx.stroke();
        ctx.fillStyle = '#ff2244';
        ctx.fillRect(handX - 2, handY - 2, 5, 5); // Red hilt gem
      } else if (weaponType === 'uppercut_fist') {
        // Uppercut impact aura
        ctx.fillStyle = 'rgba(255, 220, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(handX, handY, 9, 0, Math.PI * 2);
        ctx.fill();
      } else if (weaponType === 'mic') {
        // Amid's Stand-up microphone
        ctx.fillStyle = '#111';
        ctx.fillRect(handX - 2, handY - 14, 4, 16);
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.arc(handX, handY - 16, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (weaponType === 'phone') {
        // Ringing smartphone
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(handX - 4, handY - 12, 8, 14);
      }
    }

    ctx.restore();
  }

  // ==========================================
  // MORTAL KOMBAT 1 VISCERAL BLOOD ENGINE
  // Chunky Flying Droplets, Floor Blood Splatters & Geysers
  // ==========================================

  spawnBloodSpurt(x, y, count = 18, isHeavy = false, direction = 1, isUppercut = false) {
    const total = isUppercut ? count * 2.5 : (isHeavy ? count * 1.6 : count);
    const colors = ['#b30000', '#d4001a', '#800000', '#ff002e'];

    for (let i = 0; i < total; i++) {
      let vx, vy;
      if (isUppercut) {
        // High vertical blood geyser
        vx = (Math.random() - 0.5) * 8 + (direction * 3);
        vy = -(Math.random() * 12 + 10); // Shoots high into sky!
      } else if (isHeavy) {
        vx = (Math.random() * 9 + 4) * direction;
        vy = -(Math.random() * 8 + 2);
      } else {
        vx = (Math.random() * 6 + 2) * direction;
        vy = -(Math.random() * 5 + 1);
      }

      this.bloodDrops.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 20,
        vx,
        vy,
        size: Math.random() * 4 + 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: Math.random() * 0.015 + 0.01
      });
    }
  }

  // Radial Fatality Blood Explosion
  spawnFatalityBlood(x, y) {
    const colors = ['#990000', '#cc0015', '#ff0022', '#550000'];
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 4;
      this.bloodDrops.push({
        x,
        y: y - 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.008
      });
    }
  }

  // Update and draw flying blood droplets and floor pools
  updateAndDrawBlood(ctx, groundY = 460) {
    // 1. Draw Persistent Floor Blood Pools (Rendered underneath fighters)
    for (let i = this.floorBloodStains.length - 1; i >= 0; i--) {
      const stain = this.floorBloodStains[i];
      stain.alpha -= stain.fadeRate;

      ctx.save();
      ctx.fillStyle = stain.color;
      ctx.globalAlpha = Math.max(0, stain.alpha);
      ctx.beginPath();
      ctx.ellipse(stain.x, stain.y, stain.radiusX, stain.radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (stain.alpha <= 0) {
        this.floorBloodStains.splice(i, 1);
      }
    }

    // 2. Update and Draw Flying Blood Droplets
    for (let i = this.bloodDrops.length - 1; i >= 0; i--) {
      const b = this.bloodDrops[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.45; // Gravity
      b.vx *= 0.97; // Air drag

      // Hit Ground -> Create Blood Splatter Stain
      if (b.y >= groundY) {
        b.y = groundY;
        // Add to floor stains
        if (this.floorBloodStains.length < 80) {
          this.floorBloodStains.push({
            x: b.x,
            y: groundY + (Math.random() * 6 - 3),
            radiusX: b.size * (Math.random() * 2.5 + 2),
            radiusY: b.size * (Math.random() * 0.8 + 0.6),
            color: b.color,
            alpha: 0.85,
            fadeRate: 0.0006 // Persists through the round
          });
        }
        this.bloodDrops.splice(i, 1);
        continue;
      }

      // Draw chunky square / circle digitized blood drop
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.globalAlpha = b.life;
      ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
      // Trailing blood streak
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.size * 0.7;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 1.5, b.y - b.vy * 1.5);
      ctx.stroke();
      ctx.restore();

      b.life -= b.decay;
      if (b.life <= 0) {
        this.bloodDrops.splice(i, 1);
      }
    }
  }

  // ==========================================
  // "TOASTY!" EASTER EGG (DAN FORDEN POP-UP)
  // ==========================================
  triggerToasty() {
    this.toastyActive = true;
    this.toastyTimer = this.toastyMaxTimer;
  }

  drawToasty(ctx) {
    if (!this.toastyActive || this.toastyTimer <= 0) return;
    this.toastyTimer--;

    // Progress: slides in from bottom right (960, 540)
    const p = this.toastyTimer / this.toastyMaxTimer;
    // Bell curve slide in and out
    const slide = Math.sin((1 - p) * Math.PI) * 110;

    const x = 960 - slide;
    const y = 540 - 70;

    ctx.save();
    // 1. Digitized Dan Forden Face Silhouette
    ctx.fillStyle = '#ffccaa';
    ctx.beginPath();
    ctx.arc(x + 35, y + 25, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Big grin & eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 28, y + 18, 4, 4);
    ctx.fillRect(x + 40, y + 18, 4, 4);
    // Smiling mouth
    ctx.strokeStyle = '#900';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + 35, y + 25, 12, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // 2. Comic Speech Bubble: "TOASTY!"
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fillRect(x - 85, y + 5, 80, 28);
    ctx.strokeRect(x - 85, y + 5, 80, 28);

    ctx.font = "bold 13px 'Press Start 2P', monospace";
    ctx.fillStyle = '#ff1133';
    ctx.textAlign = 'center';
    ctx.fillText("TOASTY!", x - 45, y + 24);

    ctx.restore();

    if (this.toastyTimer <= 0) {
      this.toastyActive = false;
    }
  }

  // ==========================================
  // PARRIES, EFFECTS & SUPER FLASH
  // ==========================================
  addParryRing(x, y) {
    this.parryEffects.push({ x, y, radius: 10, life: 1.0, decay: 0.08 });
  }

  addHitSpark(x, y, isHeavy, isParry) {
    const count = isHeavy ? 14 : 7;
    const sparks = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      sparks.push({
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: isParry ? '#00f0ff' : (isHeavy ? '#ff3344' : '#ffea00')
      });
    }
    this.hitSparks.push({ x, y, sparks, life: 1.0, decay: 0.08, isHeavy, isParry });
  }

  drawEffects(ctx) {
    // 1. Parry Rings
    for (let i = this.parryEffects.length - 1; i >= 0; i--) {
      const p = this.parryEffects[i];
      p.radius += 5;
      p.life -= p.decay;

      ctx.save();
      ctx.strokeStyle = `rgba(0, 240, 255, ${p.life})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (p.life <= 0) this.parryEffects.splice(i, 1);
    }

    // 2. Hit Sparks
    for (let i = this.hitSparks.length - 1; i >= 0; i--) {
      const h = this.hitSparks[i];
      h.life -= h.decay;

      ctx.save();
      h.sparks.forEach(s => {
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, h.life);
        ctx.fillRect(h.x + s.vx * (1 - h.life) * 16, h.y + s.vy * (1 - h.life) * 16, 4, 4);
      });
      ctx.restore();

      if (h.life <= 0) this.hitSparks.splice(i, 1);
    }
  }

  drawSuperFlashCutIn(ctx, charId, timer, maxTimer) {
    const progress = 1 - (timer / maxTimer);
    const img = this.portraits[charId];
    if (!img) return;

    ctx.save();
    // MK1 Dark Screen Red Tint
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, 960, 540);

    // Glowing Red Speed Bar
    ctx.fillStyle = 'rgba(180, 0, 20, 0.45)';
    ctx.fillRect(0, 160, 960, 220);

    // Portrait Cut-In Strip
    const slideOffset = (1 - Math.sin(progress * Math.PI)) * 300;
    const portX = 220 - slideOffset;
    if (img.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(portX, 170, 520, 200);
      ctx.clip();
      ctx.drawImage(img, portX, 120, 520, 320);
      ctx.restore();
    }

    // Carved Golden Frame Border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(portX, 170, 520, 200);

    // Banner Text
    ctx.font = "bold 36px 'Teko', Impact, sans-serif";
    ctx.fillStyle = '#ff1133';
    ctx.fillText("MORTAL KOMBAT !", 40, 240);

    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.fillStyle = '#ffd700';
    const saName = charId === 'tony' ? 'CRIMSON EXECUTION' :
                   charId === 'george' ? 'NIRVANA JUDGMENT' :
                   'OVERTIME CALAMITY';
    ctx.fillText(saName, 40, 280);

    ctx.restore();
  }
}

const Sprites = new SpriteRenderer();
