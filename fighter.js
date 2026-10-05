// Street Fighter III Fighter Mechanics, State Machine & Parry System

const GRAVITY = 0.65;
const GROUND_Y = 460;
const PARRY_WINDOW_FRAMES = 9; // ~150ms tight Street Fighter 3 parry timing

class Projectile {
  constructor(owner, type, x, y, vx, damage, color, extraText = '') {
    this.owner = owner;
    this.type = type; // 'hadou', 'paper', 'coffee', 'calc', 'phone', 'joke', 'om_wave'
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.damage = damage;
    this.color = color;
    this.radius = 18;
    this.active = true;
    this.life = 120;
    this.rotation = 0;
    this.extraText = extraText;
  }

  update() {
    this.x += this.vx;
    this.rotation += 0.15;
    this.life--;
    if (this.x < 20 || this.x > 940 || this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.type === 'phone') {
      // Tony's Group Call: Ringing smartphone with soundwave rings
      ctx.fillStyle = '#111';
      ctx.fillRect(-10, -16, 20, 32);
      ctx.fillStyle = '#00f0ff'; // Glowing call screen
      ctx.fillRect(-8, -13, 16, 24);
      ctx.fillStyle = '#00ff66'; // Green call icon
      ctx.fillRect(-4, -4, 8, 8);
      // Ringing radio waves
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === 'om_wave') {
      // George's Meditation: Expanding golden Sanskrit / OM ripple
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ॐ', 0, 6);
    } else if (this.type === 'joke') {
      // Amid's Jokes: Floating laughter "HA HA!" comic balloon
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = "bold 9px 'Press Start 2P', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(this.extraText || 'HA!', 0, 4);
    } else if (this.type === 'hadou') {
      // Swirling Blue Chakra Orb
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === 'coffee') {
      // Splashing Coffee Mug
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.fillStyle = '#5c3110';
      ctx.fillRect(-8, -10, 16, 6);
    } else if (this.type === 'calc') {
      // Flying Calculator
      ctx.fillStyle = '#222';
      ctx.fillRect(-12, -16, 24, 32);
      ctx.fillStyle = '#8fbf8f';
      ctx.fillRect(-9, -13, 18, 8);
    } else {
      // Urgent Invoices / Paper Sheets
      ctx.fillStyle = '#fffdf0';
      ctx.fillRect(-12, -16, 24, 32);
      ctx.strokeStyle = '#888';
      ctx.strokeRect(-12, -16, 24, 32);
    }
    ctx.restore();
  }
}

class Fighter {
  constructor(id, characterId, x, facing, isCPU = false) {
    this.id = id; // 'p1' or 'p2'
    this.characterId = characterId; // 'tony', 'george', 'amid'
    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing; // 1 = facing right, -1 = facing left
    this.isCPU = isCPU;

    // Health & Stats
    this.maxHp = 1000;
    this.hp = 1000;
    this.displayHp = 1000; // For yellow delayed damage bar
    this.stun = 0;
    this.maxStun = 100;
    this.superMeter = 0;
    this.maxSuperMeter = 200; // 2 stocks of 100
    this.roundsWon = 0;

    // State machine
    this.state = 'idle'; // idle, walk, jump, crouch, attack, hurt, knockdown, parry, super
    this.currentAnim = 'idle';
    this.animFrame = 0;
    this.animSpeed = 0.2;

    // Movement & Frame timers
    this.isGrounded = true;
    this.isCrouching = false;
    this.stateTimer = 0;
    this.hitstopTimer = 0;
    this.invincibleTimer = 0;
    this.parryFlashTimer = 0;
    this.hasGhostTrail = false;

    // SF3 Parry input buffering
    this.parryBuffer = 0; // Frames remaining in parry window
    this.parryType = null; // 'high' or 'low'
    this.parryCooldown = 0;

    // Current attack metadata
    this.currentAttack = null;
    this.hasHitOpponent = false;
    this.comboCounter = 0;
    this.comboTimer = 0;

    // Input double-tap dash tracking
    this.lastTapDir = null;
    this.lastTapTime = 0;

    // Associated projectiles
    this.projectiles = [];
  }

  resetRound(x, facing) {
    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.hp = this.maxHp;
    this.displayHp = this.maxHp;
    this.stun = 0;
    this.state = 'idle';
    this.currentAnim = 'idle';
    this.animFrame = 0;
    this.isGrounded = true;
    this.isCrouching = false;
    this.stateTimer = 0;
    this.hitstopTimer = 0;
    this.invincibleTimer = 0;
    this.parryFlashTimer = 0;
    this.hasGhostTrail = false;
    this.currentAttack = null;
    this.projectiles = [];
  }

  // Handle inputs
  handleInput(input) {
    if (this.hitstopTimer > 0 || this.state === 'hurt' || this.state === 'knockdown') return;

    // SF3 Parry buffer trigger (Tapping FORWARD or DOWN)
    if (input.tapForward && this.parryCooldown <= 0) {
      this.parryBuffer = PARRY_WINDOW_FRAMES;
      this.parryType = this.isCrouching ? 'low' : 'high';
      this.parryCooldown = 18;
    } else if (input.tapDown && this.parryCooldown <= 0) {
      this.parryBuffer = PARRY_WINDOW_FRAMES;
      this.parryType = 'low';
      this.parryCooldown = 18;
    }

    // If attacking or performing super, lock movement
    if (this.state === 'attack' || this.state === 'super' || this.state === 'parry') return;

    // Crouch
    this.isCrouching = input.down && this.isGrounded;

    // Jump
    if (input.up && this.isGrounded) {
      this.vy = -16.5;
      this.isGrounded = false;
      this.state = 'jump';
      this.currentAnim = 'jump';
      AudioSys.playWhoosh();
      return;
    }

    // Horizontal Movement
    if (this.isGrounded && !this.isCrouching) {
      if (input.forward) {
        this.vx = this.facing * 4.2;
        this.state = 'walk';
        this.currentAnim = 'walk_fwd';
      } else if (input.backward) {
        this.vx = -this.facing * 3.4;
        this.state = 'walk';
        this.currentAnim = 'walk_fwd'; // Reverse walking animation
      } else {
        this.vx = 0;
        this.state = 'idle';
        this.currentAnim = 'idle';
      }
    } else if (this.isCrouching) {
      this.vx = 0;
      this.state = 'crouch';
      this.currentAnim = 'crouch';
    }

    // Attacks & Specials Execution
    if (input.superArt && this.superMeter >= 100) {
      this.performSuperArt();
    } else if (input.special1) {
      this.performSpecial1();
    } else if (input.special2) {
      this.performSpecial2();
    } else if (input.heavyPunch) {
      this.performNormal('punch_heavy', 22, 110, 55, 14);
    } else if (input.lightPunch) {
      this.performNormal('punch_light', 14, 50, 45, 8);
    } else if (input.heavyKick) {
      this.performNormal('kick_heavy', 24, 120, 60, 16);
    } else if (input.lightKick) {
      this.performNormal('kick_light', 16, 55, 48, 9);
    }
  }

  // --- Attack Actions ---
  performNormal(name, duration, damage, reach, hitFrame) {
    this.state = 'attack';
    this.currentAnim = name.startsWith('punch') ? (name.includes('heavy') ? 'attack_heavy' : 'attack_light') :
                                                   (name.includes('heavy') ? 'attack_heavy' : 'attack_light');
    this.stateTimer = duration;
    this.animFrame = 0;
    this.hasHitOpponent = false;
    this.currentAttack = {
      name,
      damage,
      reach,
      hitFrame,
      isHeavy: name.includes('heavy'),
      isLow: this.isCrouching,
      knockback: name.includes('heavy') ? 8 : 4
    };
    AudioSys.playWhoosh();
  }

  performSpecial1() {
    this.state = 'attack';
    this.currentAnim = 'special_1';
    this.stateTimer = 40;
    this.animFrame = 0;
    this.hasHitOpponent = false;

    if (this.characterId === 'tony') {
      // TONY'S SPECIAL POWER: "GROUP CALL"
      // Tony screams "EVERYONE JOIN THE CALL!", summoning ringing smartphones & audio frequency waves!
      this.currentAttack = { name: 'group_call', damage: 155, reach: 0, hitFrame: 8, isProjectile: true };
      AudioSys.playGroupCall();
      window.gameEngine.showBannerText('📞 GROUP CALL !', '#00f0ff');
      AudioSys.speakAnnouncer('GROUP CALL !');

      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (this.state === 'attack' || this.state === 'idle') {
            this.projectiles.push(new Projectile(
              this,
              'phone',
              this.x + this.facing * (30 + i * 20),
              this.y - 45 - (i * 12),
              this.facing * (7 + i * 1.2),
              55,
              '#00f0ff'
            ));
            AudioSys.playGroupCall();
          }
        }, 120 + (i * 110));
      }

    } else if (this.characterId === 'george') {
      // GEORGE'S SPECIAL POWER: "MEDITATION"
      // George floats in deep lotus meditation, generating an impenetrable Zen Barrier and OM aura wave!
      this.currentAttack = { name: 'meditation', damage: 120, reach: 85, hitFrame: 10, isHeavy: true };
      this.invincibleTimer = 35; // Invincible during meditation chant!
      this.hp = Math.min(this.maxHp, this.hp + 120); // Meditative healing!
      this.superMeter = Math.min(this.maxSuperMeter, this.superMeter + 35); // Spiritual focus!
      
      AudioSys.playMeditation();
      window.gameEngine.showBannerText('🧘 MEDITATION !', '#ffd700');
      AudioSys.speakAnnouncer('MEDITATION !');

      // Expand Sanskrit OM wave ring
      setTimeout(() => {
        this.projectiles.push(new Projectile(this, 'om_wave', this.x + this.facing * 40, this.y - 45, this.facing * 6.5, 120, '#00ffff'));
      }, 180);

    } else if (this.characterId === 'amid') {
      // AMID'S SPECIAL POWER: "JOKES"
      // Amid drops a dad joke punchline that inflicts emotional & comedy damage!
      const jokesList = [
        'EXCEL!', 'DUE TODAY!', 'PER MY EMAIL!', 'COFFEE!', 'TAX AUDIT!'
      ];
      const jokeText = jokesList[Math.floor(Math.random() * jokesList.length)];
      
      this.currentAttack = { name: 'jokes', damage: 165, reach: 0, hitFrame: 8, isProjectile: true };
      AudioSys.playJoke();
      window.gameEngine.showBannerText(`😂 JOKES: "${jokeText}"`, '#ffea00');
      AudioSys.speakAnnouncer('JOKES !');

      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.projectiles.push(new Projectile(
            this,
            'joke',
            this.x + this.facing * 35,
            this.y - 50 + (i * 12),
            this.facing * (6 + i),
            55,
            '#ffea00',
            jokeText
          ));
        }, 120 + (i * 90));
      }
    }
  }

  performSpecial2() {
    this.state = 'attack';
    this.currentAnim = 'special_2';
    this.stateTimer = 38;
    this.animFrame = 0;
    this.hasHitOpponent = false;

    if (this.characterId === 'tony') {
      // Horn Ram Charge
      this.vx = this.facing * 9.5;
      this.currentAttack = { name: 'horn_ram', damage: 180, reach: 60, hitFrame: 6, isHeavy: true, knockback: 14 };
      AudioSys.playDash();
    } else if (this.characterId === 'george') {
      // Astral Shoryu Rising Palm
      this.vy = -12;
      this.vx = this.facing * 4;
      this.isGrounded = false;
      this.currentAttack = { name: 'astral_palm', damage: 190, reach: 55, hitFrame: 5, isHeavy: true, knockback: 15 };
      AudioSys.playWhoosh();
    } else if (this.characterId === 'amid') {
      // Ergonomic Swivel Chair Hurricane
      this.vx = this.facing * 7;
      this.currentAttack = { name: 'chair_spin', damage: 175, reach: 60, hitFrame: 6, isHeavy: true, knockback: 13 };
      AudioSys.playChairSpin();
    }
  }

  performSuperArt() {
    this.superMeter -= 100;
    this.state = 'super';
    this.currentAnim = 'super';
    this.stateTimer = 55;
    this.animFrame = 0;
    this.hasHitOpponent = false;
    this.invincibleTimer = 40;
    this.hasGhostTrail = true;

    // Trigger Screen Freeze & Super Flash Cut-in
    window.gameEngine.triggerSuperFreeze(this.characterId);
    AudioSys.playSuperFlash();
    AudioSys.speakLebanese('SUPER ART');

    this.currentAttack = {
      name: 'super_art',
      damage: 340,
      reach: 95,
      hitFrame: 14,
      isHeavy: true,
      knockback: 20
    };

    if (this.characterId === 'amid') {
      // Telekinetic flying office frenzy
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          this.projectiles.push(new Projectile(this, 'calc', this.x + this.facing * 25, this.y - 40 - (i * 12), this.facing * 8, 70, '#ffd700'));
        }, 300 + (i * 90));
      }
    }
  }

  // --- Parry Success Execution (SF3 Hallmark) ---
  triggerParrySuccess(opponent) {
    this.parryBuffer = 0;
    this.parryFlashTimer = 16;
    this.hitstopTimer = 14;
    opponent.hitstopTimer = 22; // Massive attacker freeze advantage for parrier!
    this.superMeter = Math.min(this.maxSuperMeter, this.superMeter + 25); // Bonus meter on parry!

    // Reset defender state to actionable immediately
    this.state = 'idle';
    this.currentAnim = 'idle';
    this.vx = 0;

    // Audio & Visual SF3 parry effect
    AudioSys.playParry();
    AudioSys.speakLebanese('PARRY');
    Sprites.addParryRing(this.x + this.facing * 15, this.y - 50);
    Sprites.addHitSpark(this.x + this.facing * 15, this.y - 50, true, true);
    window.gameEngine.showBannerText('YA HARAAM ! PARRY ⚡', '#00f0ff');
  }

  takeHit(damage, isHeavy, knockback, attackerFacing) {
    this.hp = Math.max(0, this.hp - damage);
    this.hitstopTimer = isHeavy ? 10 : 6;
    this.superMeter = Math.min(this.maxSuperMeter, this.superMeter + 10);
    this.state = 'hurt';
    this.currentAnim = 'hurt';
    this.stateTimer = isHeavy ? 24 : 14;
    this.vx = attackerFacing * knockback;

    AudioSys.playHit(isHeavy);
    Sprites.addHitSpark(this.x, this.y - 45, isHeavy, false);
    window.gameEngine.addScreenShake(isHeavy ? 10 : 5);

    if (this.hp <= 0) {
      this.state = 'knockdown';
      this.currentAnim = 'knockdown';
      this.vy = -10;
      this.vx = attackerFacing * 8;
      AudioSys.playKnockdown();
    }
  }

  // --- Physics & State Update Loop ---
  update(opponent) {
    // Gradual yellow damage meter decay
    if (this.displayHp > this.hp) {
      this.displayHp -= (this.displayHp - this.hp) * 0.12;
      if (Math.abs(this.displayHp - this.hp) < 1) this.displayHp = this.hp;
    }

    // Hitstop / Freeze frames
    if (this.hitstopTimer > 0) {
      this.hitstopTimer--;
      return;
    }

    // Parry buffer ticking down
    if (this.parryBuffer > 0) this.parryBuffer--;
    if (this.parryCooldown > 0) this.parryCooldown--;
    if (this.parryFlashTimer > 0) this.parryFlashTimer--;
    if (this.invincibleTimer > 0) this.invincibleTimer--;

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update();

      // Check collision with opponent
      if (p.active && Math.abs(p.x - opponent.x) < 40 && Math.abs(p.y - (opponent.y - 45)) < 45) {
        // Can opponent parry projectile?
        if (opponent.parryBuffer > 0) {
          opponent.triggerParrySuccess(this);
          p.active = false;
        } else if (opponent.invincibleTimer <= 0 && opponent.state !== 'knockdown') {
          opponent.takeHit(p.damage, true, 8, this.facing);
          p.active = false;
        }
      }

      if (!p.active) this.projectiles.splice(i, 1);
    }

    // Apply movement physics
    this.x += this.vx;
    this.y += this.vy;

    // Apply gravity if airborne
    if (!this.isGrounded) {
      this.vy += GRAVITY;
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
        this.isGrounded = true;
        if (this.state === 'jump') {
          this.state = 'idle';
          this.currentAnim = 'idle';
        }
      }
    }

    // Arena horizontal bounds
    if (this.x < 45) this.x = 45;
    if (this.x > 915) this.x = 915;

    // Face each other
    if (this.state !== 'attack' && this.state !== 'super' && this.state !== 'knockdown') {
      this.facing = this.x < opponent.x ? 1 : -1;
    }

    // State timers
    if (this.stateTimer > 0) {
      this.stateTimer--;

      // Active attack frame check
      if ((this.state === 'attack' || this.state === 'super') && this.currentAttack && !this.hasHitOpponent) {
        this.checkAttackCollision(opponent);
      }

      if (this.stateTimer <= 0) {
        this.state = 'idle';
        this.currentAnim = 'idle';
        this.hasGhostTrail = false;
        this.currentAttack = null;
        this.vx = 0;
      }
    }

    // Friction
    if (this.isGrounded && this.state !== 'walk') {
      this.vx *= 0.82;
    }

    // Animation frame progression
    this.animFrame += this.animSpeed;
  }

  // Check melee collision against opponent
  checkAttackCollision(opponent) {
    if (!this.currentAttack || opponent.invincibleTimer > 0 || opponent.state === 'knockdown') return;

    const atk = this.currentAttack;
    const distanceX = (opponent.x - this.x) * this.facing;
    const distanceY = Math.abs((opponent.y - 45) - (this.y - 45));

    // In attack range
    if (distanceX > 0 && distanceX < atk.reach && distanceY < 65) {
      this.hasHitOpponent = true;
      this.superMeter = Math.min(this.maxSuperMeter, this.superMeter + 15);

      // Check if Opponent Parries! (The Magic of SF3)
      if (opponent.parryBuffer > 0) {
        opponent.triggerParrySuccess(this);
      } else {
        // Standard Hit lands!
        opponent.takeHit(atk.damage, atk.isHeavy, atk.knockback, this.facing);
        this.comboCounter++;
        this.comboTimer = 60;
      }
    }
  }

  draw(ctx) {
    // Draw associated projectiles
    this.projectiles.forEach(p => p.draw(ctx));

    // Draw sprite
    Sprites.drawFighter(ctx, this);
  }
}
