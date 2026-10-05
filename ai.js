// Street Fighter III Intelligent AI Engine: Footsies, Spacing & Reactive Parrying

class FighterAI {
  constructor(fighter, opponent, difficulty = 'medium') {
    this.fighter = fighter;
    this.opponent = opponent;
    this.difficulty = difficulty; // 'easy', 'medium', 'hard' (EVO Champion)

    this.decisionTimer = 0;
    this.currentIntent = 'neutral'; // 'approach', 'retreat', 'poke', 'zone', 'parry'
    this.parryChance = difficulty === 'hard' ? 0.75 : (difficulty === 'medium' ? 0.40 : 0.15);
  }

  update() {
    const f = this.fighter;
    const opp = this.opponent;

    const input = {
      forward: false,
      backward: false,
      up: false,
      down: false,
      tapForward: false,
      tapDown: false,
      lightPunch: false,
      heavyPunch: false,
      lightKick: false,
      heavyKick: false,
      special1: false,
      special2: false,
      superArt: false
    };

    const dist = Math.abs(f.x - opp.x);

    // 1. REACTION PARRY: Roll only once per incoming attack (not 60 times per second!)
    if ((opp.state === 'attack' || opp.state === 'super') && !this.hasRolledParry) {
      this.hasRolledParry = true;
      const chance = this.difficulty === 'hard' ? 0.40 : 0.18;
      if (Math.random() < chance && f.parryCooldown <= 0) {
        if (opp.isCrouching) {
          input.tapDown = true;
        } else {
          input.tapForward = true;
        }
      }
    } else if (opp.state !== 'attack' && opp.state !== 'super') {
      this.hasRolledParry = false;
    }

    // 2. High-Priority: Super Art Punish
    if (f.superMeter >= 100 && (dist < 120 || opp.state === 'hurt' || opp.hitstopTimer > 0)) {
      if (Math.random() < 0.6) {
        input.superArt = true;
        return input;
      }
    }

    // 3. Strategic decisions based on character archetype
    this.decisionTimer--;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = 10 + Math.floor(Math.random() * 15);
      const rand = Math.random();

      if (f.characterId === 'tony') {
        // TONY: Aggressive Rushdown with Group Call zoning
        if (dist > 180) {
          this.currentIntent = rand < 0.4 ? 'group_call' : (rand < 0.7 ? 'approach' : 'special_rush');
        } else if (dist < 75) {
          this.currentIntent = rand < 0.5 ? 'melee_heavy' : 'melee_light';
        } else {
          this.currentIntent = rand < 0.35 ? 'group_call' : (rand < 0.7 ? 'special_rush' : 'approach');
        }
      } else if (f.characterId === 'george') {
        // GEORGE: Shoto with Meditation Healing & Counter
        if (f.hp < 500 && Math.random() < 0.4) {
          this.currentIntent = 'meditation';
        } else if (dist > 200) {
          this.currentIntent = rand < 0.45 ? 'meditation' : 'approach';
        } else if (dist < 90) {
          this.currentIntent = rand < 0.4 ? 'anti_air' : 'retreat';
        } else {
          this.currentIntent = rand < 0.4 ? 'melee_poke' : 'meditation';
        }
      } else if (f.characterId === 'amid') {
        // AMID: Stand-up Jokes & Chair Hurricane Brawler
        if (dist > 190) {
          this.currentIntent = rand < 0.5 ? 'jokes' : 'chair_spin';
        } else if (dist < 80) {
          this.currentIntent = rand < 0.5 ? 'melee_heavy' : 'jokes';
        } else {
          this.currentIntent = rand < 0.4 ? 'jokes' : 'chair_spin';
        }
      }
    }

    // 4. Translate intent to inputs
    switch (this.currentIntent) {
      case 'group_call':
      case 'meditation':
      case 'jokes':
        input.special1 = true;
        break;
      case 'approach':
        input.forward = true;
        // Occasional jump in
        if (dist > 150 && Math.random() < 0.05) input.up = true;
        break;

      case 'retreat':
        input.backward = true;
        break;

      case 'melee_light':
        input.lightPunch = true;
        break;

      case 'melee_heavy':
        input.heavyPunch = true;
        break;

      case 'melee_poke':
        input.lightKick = true;
        break;

      case 'fireball':
        input.special1 = true;
        break;

      case 'anti_air':
        input.special2 = true;
        break;

      case 'special_rush':
        input.special2 = true;
        break;

      case 'chair_spin':
        input.special2 = true;
        break;
    }

    return input;
  }
}
