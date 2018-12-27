const {
    WIDTH,
    GAME_HEIGHT,
    FRAME_LENGTH,
    CHARGE_FRAMES_FIRST,
    CHARGE_FRAMES_SECOND,
    DEATH_COOLDOWN,
    SHOT_COOLDOWN, ATTACK_OFFSET,
    ACCELERATION,
    ATTACK_ORB, ATTACK_LASER,
    EFFECT_NEEDLE_FLIP,
    HERO_BEE, HERO_DRAGONFLY, HERO_MOTH,
    MAX_ENERGY,
    LOOT_SPEED, LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_SPEED, LOOT_TRIPLE_POWER, LOOT_COMBO, LOOT_TRIPLE_COMBO,
    LOOT_LIGHTNING_LADYBUG, LOOT_PENETRATING_LADYBUG,
} = require('gameConstants');

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const Rectangle = require('Rectangle');
const random = require('random');

const {
    drawImage,
    drawTintedImage,
} = require('draw');

const { getNewSpriteState } = require('sprites');

const {
    r,
    createAnimation,
    getHitbox,
    getFrame,
} = require('animations');

const heroesData = { };

/*const testLightningBug = {
    color:"#4860A0",
    animationTime: 0,
    width:25, height:20,
    left: 0, top: 0,
    type:"lightningLadybug",
    vx:0, vy:0,
};*/
/*const testPenetratingLadybug = {
    color:"#4860A0",
    animationTime: 0,
    width:25, height:20,
    left: 0, top: 0,
    type:"penetratingLadybug",
    vx:0, vy:0,
};*/


const getNewPlayerState = () => ({
    score: 0,
    powerupPoints: 0,
    powerupIndex: 0,
    comboScore: 0,
    sprite: getNewSpriteState({...heroesData[HERO_DRAGONFLY].animation.frames[0],
        left: 160, top: 377,
        targetLeft: 170, targetTop: 200,
        spawnSpeed: 7,
    }),
    heroes: [HERO_DRAGONFLY, HERO_BEE, HERO_MOTH, ],
    [HERO_DRAGONFLY]: {energy: MAX_ENERGY / 2, deaths: 0},
    [HERO_BEE]: {energy: MAX_ENERGY / 2, deaths: 0, targets: []},
    [HERO_MOTH]: {energy: MAX_ENERGY / 2, deaths: 0},
    time: 0,
    invulnerableFor: 0,
    spawning: true,
    shotCooldown: 0,
    chargeAttackFrames: 0,
    powerups: [],
    relics: {
    },
    ladybugs: [],
    actions: {
        up: false,
        down: false,
        left: false,
        right: false,
        shoot: false,
        start: false,
    },
});

function updatePlayer(state, playerIndex, props, spriteProps = null) {
    const players = [...state.players];
    if (spriteProps) {
        props.sprite = {...players[playerIndex].sprite, ...spriteProps};
    }
    players[playerIndex] = {...players[playerIndex], ...props};
    return {...state, players};
}

function updatePlayerOnContinue(state, playerIndex) {
    return updatePlayer(state, playerIndex, {
        score: 0,
        powerupPoints: 0,
        powerupIndex: 0,
        chargeAttackFrames: 0,
        comboScore: 0,
        dead: false,
        done: false,
        [HERO_DRAGONFLY]: {energy: MAX_ENERGY / 2, deaths: 0},
        [HERO_BEE]: {energy: MAX_ENERGY / 2, deaths: 0, targets: []},
        [HERO_MOTH]: {energy: MAX_ENERGY / 2, deaths: 0},
        time: 0,
        invulnerableFor: 0,
        spawning: true,
        shotCooldown: 0,
    }, {
        left: -100, top: 300,
        targetLeft: 170, targetTop: 200,
        spawnSpeed: 7,
    });
}

const isPlayerInvulnerable = (state, playerIndex) => {
    const player = state.players[playerIndex];
    return player.invulnerableFor > 0 || player.usingSpecial ||
        player.usingFinisher || player.sprite.targetLeft || player.done;
};

const useMeleeAttack = (state, playerIndex) => {
    const player = state.players[playerIndex];
    const heroData = heroesData[player.heroes[0]];
    const meleeCooldown = 3 * SHOT_COOLDOWN - player.powerups.filter(powerup => powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO).length;
    const powers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO).length;
    const triplePowers = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO).length;
    let scale = 1 + heroData.meleeScaling * (powers + triplePowers / 2);
    const meleeAttack = createAttack(heroData.meleeAttack, {
        damage: heroData.meleePower + triplePowers + powers / 3,
        top: player.sprite.top + player.sprite.vy + player.sprite.height / 2,
        left: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET,
        playerIndex,
        scale,
    });
    if (player.chargeAttackFrames >= CHARGE_FRAMES_SECOND) {
        meleeAttack.scale = Math.max(meleeAttack.scale, (1 + heroData.meleeScaling) * 3);
        meleeAttack.damage += 5;
        meleeAttack.fullyCharged = true;
        meleeAttack.charged = true;
    } else if (player.chargeAttackFrames >= CHARGE_FRAMES_FIRST) {
        meleeAttack.scale = Math.max(meleeAttack.scale, (1 + heroData.meleeScaling) * 2);
        meleeAttack.damage += 2;
        meleeAttack.charged = true;
    }
    meleeAttack.left += meleeAttack.width * meleeAttack.scale / 2;
    state = addPlayerAttackToState(state, meleeAttack);
    return updatePlayer(state, playerIndex, {meleeAttackTime: 0, meleeCooldown});
};

const hasAnotherHero = (state, playerIndex) => {
    const player = state.players[playerIndex];
    for (let i = 1; i < player.heroes.length; i++) {
        if (player[player.heroes[i]].energy >= 0) return true;
    }
    return null;
};

function isHeroSwapping(player) {
    return player.sprite.targetLeft || player.chasingNeedle || player.catchingNeedleFrames > 0;
}

const advanceHero = (state, playerIndex) => {
    if (state.players[playerIndex].done) {
        return state;
    }
    state = advanceLadybugs(state, playerIndex);
    state = updatePlayer(state, playerIndex, {time: state.players[playerIndex].time + FRAME_LENGTH});
    let player = state.players[playerIndex];
    if (!isHeroSwapping(player) && player.usingFinisher) {
        return advanceFinisher(state, playerIndex);
    }
    // Restore energy for all heroes each frame.
    if (!isHeroSwapping(player)) {
        for (const heroType of player.heroes) {
            if (state.debug) {
                state = updatePlayer(state, playerIndex,
                    {[heroType]: {...player[heroType], energy: MAX_ENERGY}}
                );
                continue;
            }
            if (player[heroType].energy < MAX_ENERGY &&
                // Dragonfly energy does not restore during her slowmotion effect.
                !(heroType === HERO_DRAGONFLY && state.slowTimeFor > 0) &&
                // Do not restore energy for the current hero if they are currently using a special
                // move or are invulnerable/slowing time.
                (heroType !== player.heroes[0] || (!(player.invulnerableFor > 0) && !player.usingSpecial))
            ) {
                const recoveryRate = player.relics[LOOT_GAUNTLET] ? 0.04 : 0.02;
                state = updatePlayer(state, playerIndex,
                    {[heroType]: {...player[heroType], energy: player[heroType].energy + recoveryRate}}
                );
                // Add an effect to show that a hero has revived when they first hit 0 energy.
                if (player[heroType].energy < 0 && state.players[playerIndex][heroType].energy >= 0) {
                    const sprite = player.sprite;
                    let reviveEffect = createEffect(heroesData[heroType].reviveEffect, {xScale: 1, yScale: 1});
                    reviveEffect.left = sprite.left + sprite.width - reviveEffect.width / 2 - 20;
                    reviveEffect.top = sprite.top + (sprite.height - reviveEffect.height ) / 2;
                    state = addEffectToState(state, reviveEffect);
                    reviveEffect = createEffect(heroesData[heroType].reviveEffect, {xScale: 1.5, yScale: 1.5, delay: 10});
                    reviveEffect.left = sprite.left + sprite.width - reviveEffect.width / 2 - 10;
                    reviveEffect.top = sprite.top + (sprite.height - reviveEffect.height ) / 2 + 10;
                    state = addEffectToState(state, reviveEffect);
                    reviveEffect = createEffect(heroesData[heroType].reviveEffect, {xScale: 2, yScale: 2, delay: 20});
                    reviveEffect.left = sprite.left + sprite.width - reviveEffect.width / 2;
                    reviveEffect.top = sprite.top + (sprite.height - reviveEffect.height ) / 2 - 10;
                    state = addEffectToState(state, reviveEffect);
                    state = {...state, sfx: {...state.sfx, [heroesData[heroType].reviveSfx]: true}};
                }
            }
        }
    }
    const heroType = player.heroes[0];
    const heroData = heroesData[heroType];
    if (heroData.advanceHero) {
        state = heroData.advanceHero(state, playerIndex);
    }
    let {shotCooldown, invulnerableFor, specialCooldownFrames} = player;
    if (player.usingSpecial) {
        state = updatePlayer(state, playerIndex, {}, {animationTime: player.sprite.animationTime + FRAME_LENGTH});
        return heroData.applySpecial(state, playerIndex);
    }
    // If the player runs out of energy from using a special move, they automatically switch out
    // after using it.
    if (player[player.heroes[0]].energy < 0 && !(player.invulnerableFor > 0)) {
        return switchHeroes(state, playerIndex);
    }
    // The buttons for shooting(if added again), special move or melee attack can all activate
    // the finisher.
    const buttonPressed = player.actions.special || player.actions.shoot || player.actions.melee;
    if (buttonPressed && !isHeroSwapping(player)) {
        const heroHitbox = getHeroHitbox(player);
        for (const finisherEffect of state.effects.filter(effect => effect.type === EFFECT_FINISHER)) {
            if (Rectangle.collision(heroHitbox, getEffectHitbox(finisherEffect))) {
                const enemy = state.idMap[finisherEffect.enemyId];
                if (!enemy || enemy.dead) continue;
                state = updateEffect(state, state.effects.indexOf(finisherEffect), {done: true});
                state = updateEnemy(state, enemy, {snaredForFinisher: true});
                return startFinisher(state, playerIndex);
            }
        }
    }
    if (player.actions.special && heroData.applySpecial && !isHeroSwapping(player)
        && player[heroType].energy > 0
        // Don't allow activating special while the moth is still running its invulnerability.
        // We add 1 to the invulnerableFor value to distinguish it from other types of
        // invulnerability.
        && !(player.invulnerableFor > 0 && player.invulnerableFor % FRAME_LENGTH === 1)
        // Player cannot use a special if the hero doesn't have enough energy.
        && (player[heroType].energy >= heroData.specialCost)
    ) {
        if (heroData.specialSfx) state = {...state, sfx: {...state.sfx, [heroData.specialSfx]: true}};
        return updatePlayer(state, playerIndex, {
            usingSpecial: true, specialFrames: 0,
            [heroType]: {...player[heroType], energy: player[heroType].energy - heroData.specialCost},
        }, {animationTime: 0});
    }
    if (player.meleeCooldown > 0) {
        state = updatePlayer(state, playerIndex, {meleeCooldown: player.meleeCooldown - 1});
        player = state.players[playerIndex];
    } else if (player.actions.melee && !isHeroSwapping(player)) {
        state = updatePlayer(state, playerIndex, {chargeAttackFrames: player.chargeAttackFrames + 1});
        player = state.players[playerIndex];
    } else if (player.chargeAttackFrames && !isHeroSwapping(player)) {
        state = useMeleeAttack(state, playerIndex);
        state = updatePlayer(state, playerIndex, {chargeAttackFrames: 0});
        player = state.players[playerIndex];
    } else if (shotCooldown > 0) {
        state = updatePlayer(state, playerIndex, {shotCooldown: shotCooldown - 1});
        player = state.players[playerIndex];
    } else if (!player.actions.melee && !player.chargeAttackFrames && !isHeroSwapping(player)) {
        state = heroData.shoot(state, playerIndex);
        player = state.players[playerIndex];
    }

    let {top, left, vx, vy, animationTime, targetLeft, targetTop} = player.sprite;
    const playerHitbox = getHeroHitbox(player);
    animationTime += FRAME_LENGTH;
    if (invulnerableFor > 0) {
        invulnerableFor -= FRAME_LENGTH;
    } else if (targetLeft === false && playerHitbox.top + playerHitbox.height > getHazardHeight(state)) {
        return damageHero(state, playerIndex);
    } else if (targetLeft === false && playerHitbox.top < getHazardCeilingHeight(state)) {
        return damageHero(state, playerIndex);
    }
    if (targetLeft !== false) {
        const theta = Math.atan2(targetTop - top, targetLeft - left);
        const nextLeft = left + player.sprite.spawnSpeed * Math.cos(theta);
        const nextTop = top + player.sprite.spawnSpeed * Math.sin(theta);
        if (left < targetLeft) left = Math.min(nextLeft, targetLeft);
        else left = Math.max(nextLeft, targetLeft);
        if (top < targetTop) top = Math.min(nextTop, targetTop);
        else top = Math.max(nextTop, targetTop);
        if (left === targetLeft && top === targetTop) {
            targetLeft = targetTop = false;
        }
        return updatePlayer(state, playerIndex, {
            invulnerableFor, spawning: true,
            bee: {...player.bee, targets: []},
            shotCooldown: 1, meleeCooldown: 1, specialCooldownFrames,
        }, {left, top, animationTime, targetLeft, targetTop});
    }
    if (!(player.cannotSwitchFrames > 0) && player.actions.switch && hasAnotherHero(state, playerIndex) && !isHeroSwapping(player)) {
        return switchHeroes(state, playerIndex);
    }
    const speedPowerups = player.powerups.filter(powerup => powerup === LOOT_SPEED || powerup === LOOT_COMBO).length;
    const tripleSpeedPowerups = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_SPEED || powerup === LOOT_TRIPLE_COMBO).length;
    const maxSpeed = heroData.baseSpeed + tripleSpeedPowerups;
    const accleration = ACCELERATION + speedPowerups / 2 + tripleSpeedPowerups;
    // Accelerate player based on their input.
    if (!isHeroSwapping(player)) {
        if (player.actions.up) vy -= accleration;
        if (player.actions.down) vy += accleration;
        if (player.actions.left) vx -= accleration;
        if (player.actions.right) vx += accleration;
        vy *= (.9 - tripleSpeedPowerups * .01);
        vy = Math.max(-maxSpeed, Math.min(maxSpeed, vy));
        vx *= (.9 - tripleSpeedPowerups * .01);
        vx = Math.max(-maxSpeed, Math.min(maxSpeed, vx));

        // Update player position based on their
        left += vx;
        top +=  vy;
    }
    const hitbox = new Rectangle(getHeroHitbox(player)).translate(-player.sprite.left, -player.sprite.top);
    if (top + hitbox.top < 0) {
        top = -hitbox.top;
        vy = 0;
    }
    const bottom = Math.min(getGroundHeight(state), GAME_HEIGHT);
    if (top + hitbox.top + hitbox.height > bottom) {
        top = bottom - (hitbox.top + hitbox.height);
        vy = 0;
    }
    if (left + hitbox.left < 0) {
        left = -hitbox.left;
        vx = 0;
    }
    let rightEdge = state.world.rightEdge || WIDTH;
    rightEdge = Math.min(rightEdge, WIDTH);
    if (left + hitbox.left + hitbox.width > rightEdge) {
        left = rightEdge - (hitbox.left + hitbox.width);
        vx = 0;
    }
    const sprite = {...player.sprite, left, top, vx, vy, animationTime};
    let sfx = {...state.sfx};
    let chasingNeedle = player.chasingNeedle,
        catchingNeedleFrames = player.catchingNeedleFrames,
        cannotSwitchFrames = player.cannotSwitchFrames;
    if (chasingNeedle) {
        chasingNeedle = false;
        catchingNeedleFrames = 6;
        sfx['sfx/needlegrab.mp3'] = true;
    } else if(catchingNeedleFrames > 0) {
        catchingNeedleFrames--;
    }
    if (cannotSwitchFrames > 0) {
        cannotSwitchFrames--;
    }
    let meleeAttackTime = player.meleeAttackTime;
    if (meleeAttackTime >= 0) {
        meleeAttackTime += FRAME_LENGTH;
        const animation = heroData.meleeAnimation;
        const attackLength = animation.frames.length * animation.frameDuration * FRAME_LENGTH;
        if (meleeAttackTime >= attackLength) {
            meleeAttackTime = undefined;
        }
    }
    // Hack, this applies only to the Moth special because of the extra
    // 1 millisecond added to that timer.
    if (invulnerableFor === 1001) {
        sfx['warnInvisibilityIsEnding'] = true;
    }
    const updatedProps = {
        meleeAttackTime,
        specialCooldownFrames,
        invulnerableFor, sprite,
        chasingNeedle, catchingNeedleFrames, cannotSwitchFrames,
        spawning: false,
    };
    return updatePlayer({...state, sfx}, playerIndex, updatedProps);
};

const advanceLadybugs = (state, playerIndex) => {
    const player = state.players[playerIndex];
    const sprite = player.sprite;
    const ladybugs = [...player.ladybugs];
    for (let i = 0; i < ladybugs.length; i++) {
        const ladybug = ladybugs[i];
        const delta = [[-5, -32], [-5, 32], [52, -16], [52, 16]][i % 4];
        let factor = 1;
        if (ladybug.type === LOOT_LIGHTNING_LADYBUG) factor = 2;
        const tx = sprite.left + sprite.width / 2 - ladybug.width / 2 + factor * delta[0];
        const ty = sprite.top + sprite.height / 2 - ladybug.height / 2 + factor * delta[1];
        let shotCooldown = ladybug.shotCooldown || 0;
        if (shotCooldown > 0) {
            shotCooldown--;
        } else if (!player.actions.melee && !player.chargeAttackFrames && !player.spawning) {
            if (ladybug.type === LOOT_PENETRATING_LADYBUG) {
                shotCooldown = 5 * SHOT_COOLDOWN;
                const laser = createAttack(ATTACK_LASER, {
                    yOffset: 6,
                    xOffset: 2,
                    playerIndex,
                    ladybugIndex: i,
                });
                laser.width *= 3;
                laser.top = ladybug.top + player.sprite.vy + Math.round((ladybug.height - laser.height) / 2) + 6
                state = addPlayerAttackToState(state, laser);
            } else if (ladybug.type === LOOT_LIGHTNING_LADYBUG) {
                shotCooldown = 0.5 * SHOT_COOLDOWN;
                state = checkToAddLightning(state,
                    {
                        type: EFFECT_FAST_LIGHTNING,
                        charges: 0, damage: 1,
                        left: ladybug.left + ladybug.width / 2 + player.sprite.vx,
                        top: ladybug.top + ladybug.height / 2 + player.sprite.vy,
                        rotation: Math.random() * 2 * Math.PI,
                        scale: 1,
                        vx: player.sprite.vx,
                        vy: player.sprite.vy,
                    });
            } else {
                shotCooldown = 1.5 * SHOT_COOLDOWN;
                const orb = createAttack(ATTACK_ORB, {
                    damage: 1,
                    left: ladybug.left + player.sprite.vx + ladybug.width + ATTACK_OFFSET,
                    vx: 15,
                    playerIndex,
                });
                orb.top = ladybug.top + player.sprite.vy + Math.round((ladybug.height - orb.height) / 2) + 6
                state = addPlayerAttackToState(state, orb);
            }
            if (random.chance(0.5)) shotCooldown += i;
        }
        ladybugs[i] = {
            ...ladybugs[i],
            shotCooldown,
            left: (ladybugs[i].left + tx) / 2,
            top: (ladybugs[i].top + ty) / 2,
            animationTime: ladybugs[i].animationTime + FRAME_LENGTH,
        };
    }
    return updatePlayer(state, playerIndex, {ladybugs});
};

const switchHeroes = (updatedState, playerIndex) => {
    if (!hasAnotherHero(updatedState, playerIndex)) {
        return updatedState;
    }
    let player = updatedState.players[playerIndex];
    const sprite = player.sprite;

    // Display the dying character as a single animation effect.
    const switchEffect = createEffect(heroesData[player.heroes[0]].switchEffect);
    switchEffect.left = sprite.left + (sprite.width - switchEffect.width ) / 2;
    switchEffect.top = sprite.top + (sprite.height - switchEffect.height ) / 2;
    updatedState = addEffectToState(updatedState, switchEffect);
    const needleEffect = createEffect(EFFECT_NEEDLE_FLIP);
    needleEffect.left = sprite.left + (sprite.width - needleEffect.width ) / 2;
    needleEffect.top = sprite.top + (sprite.height - needleEffect.height ) / 2;
    updatedState = addEffectToState(updatedState, needleEffect);

    const heroes = [...player.heroes];
    heroes.push(heroes.shift());
    const hitboxA = getHeroHitbox(player);
    // If the first hero has no energy, switch to the next hero.
    if (player[heroes[0]].energy < 0) {
        heroes.push(heroes.shift());
    }
    updatedState = updatePlayer(updatedState, playerIndex, {heroes});
    player = updatedState.players[playerIndex];
    const hitboxB = getHeroHitbox(player);
    // Set the target coords so that the center of the incoming hero matches the center of the leaving hero.
    const targetLeft = sprite.left + hitboxA.left + hitboxA.width / 2 - hitboxB.left - hitboxB.width / 2;
    const targetTop = sprite.top + hitboxA.top + hitboxA.height / 2 - hitboxB.top - hitboxB.height / 2;
    const left = -100, top = GAME_HEIGHT - 100;
    const dx = left - targetLeft, dy = targetTop - top;
    const spawnSpeed = Math.sqrt(dx * dx + dy * dy) / 25;
    updatedState = updatePlayer(updatedState, playerIndex, {
            invulnerableFor: 25 * FRAME_LENGTH,
            chargeAttackFrames: 0,
            spawning: true,
            chasingNeedle: true,
            [player.heroes[0]]: {...player[player.heroes[0]], targets: [] },
        }, {
            ...heroesData[player.heroes[0]].animation.frames[0],
            left, top, targetLeft, targetTop, spawnSpeed,
            vx: 0, vy: 0,
        }
    );
    player = updatedState.players[playerIndex];

    const sfx = {...updatedState.sfx, 'sfx/needledropflip.mp3': true};
    return {...updatedState, sfx};
};

const damageHero = (updatedState, playerIndex) => {
    // Don't damage a hero if they are invulnerable.
    if (isPlayerInvulnerable(updatedState, playerIndex)) {
        return updatedState;
    }
    let deathCooldown = updatedState.deathCooldown
    let player = updatedState.players[playerIndex];
    const sprite = player.sprite;
    const ladybugs = [...player.ladybugs];
    // ladybugs.shift();

    // Display the dying character as a single animation effect.
    const deadHeroData = heroesData[player.heroes[0]];
    const deathEffect = createEffect(deadHeroData.deathEffect);
    deathEffect.left = sprite.left + (sprite.width - deathEffect.width ) / 2;
    deathEffect.top = sprite.top + (sprite.height - deathEffect.height ) / 2;
    updatedState = addEffectToState(updatedState, deathEffect);
    // Increment deaths for the current hero, and set energy negative based on
    // the total number of deaths (this is reset on continue or completing a level).
    const deaths = player[player.heroes[0]].deaths + 1;
    updatedState = updatePlayer(updatedState, playerIndex, {
        [player.heroes[0]]: {...player[player.heroes[0]], energy: -10 - 10 * (deaths - 1), deaths},
    });
    player = updatedState.players[playerIndex];
    const needleEffect = createEffect(EFFECT_NEEDLE_FLIP);
    needleEffect.left = sprite.left + (sprite.width - needleEffect.width ) / 2;
    needleEffect.top = sprite.top + (sprite.height - needleEffect.height ) / 2;
    updatedState = addEffectToState(updatedState, needleEffect);

    const heroes = [...player.heroes];
    let done = false;
    heroes.push(heroes.shift());
    // If the first hero has no energy, switch to the next hero.
    if (player[heroes[0]].energy < 0) {
        heroes.push(heroes.shift());
    }
    // If the last hero still has no energy, it is game over.
    if (player[heroes[0]].energy < 0) {
        done = true;
    }
    const targetLeft = sprite.left, targetTop = sprite.top;
    const powerups = [...player.powerups];
    // powerups.pop();
    const left = -100, top = GAME_HEIGHT - 100;
    const dx = left - targetLeft, dy = targetTop - top;
    const spawnSpeed = Math.sqrt(dx * dx + dy * dy) / 25;
    updatedState = updatePlayer(updatedState, playerIndex, {
        heroes,
        usingSpecial: false,
        done,
        invulnerableFor: 2000,
        spawning: true,
        chasingNeedle: true,
        chargeAttackFrames: 0,
        // powerupIndex: 0,
        // powerupPoints: 0,
        comboScore: 0,
        powerups,
        ladybugs,
        bee: {...player.bee, targets: [] },
    }, {
        ...heroesData[player.heroes[0]].animation.frames[0],
        left, top, targetLeft, targetTop, spawnSpeed,
        vx: 0, vy: 0,
    });
    player = updatedState.players[playerIndex];
    // Remove the targets if the current player happens to be the bee.
    updatedState = updatePlayer(updatedState, playerIndex, {

    });
    player = updatedState.players[playerIndex];


    let sfx = {...updatedState.sfx, [deadHeroData.deathSfx]: true};
    if (player.done) {
        deathCooldown = DEATH_COOLDOWN;
        sfx['sfx/death.mp3'] = true;
    } else {
        sfx['sfx/needledropflip.mp3'] = true;
    }
    return {...updatedState, deathCooldown, sfx};
};

function getHeroHitbox(player) {
    const {animationTime, left, top} = player.sprite;
    const animation = heroesData[player.heroes[0]].animation;
    return new Rectangle(getHitbox(animation, animationTime)).translate(left, top);
}
function getHeroCenter(player) {
    return getHeroHitbox(player).getCenter();
}

const chargingAnimation = createAnimation('gfx/heroes/charging.png', r(80, 79), {rows: 2, cols: 3});
const chargedAnimation = createAnimation('gfx/heroes/charging.png', r(80, 79), {y: 2, cols: 2});
const renderHero = (context, player) => {
    let {sprite, invulnerableFor, done, ladybugs} = player;
    if (done) return;
    const heroData = heroesData[player.heroes[0]];
    let animation = heroData.animation, animationTime = sprite.animationTime;
    // Show the special animation when charging the finisher (not swapping or firing it).
    if (!isHeroSwapping(player) && !player.shootingFinisher && player.usingFinisher) {
        animation = heroData.specialAnimation;
        // Tie the animation frame to the depletion of the energy bar.
        const p = (MAX_ENERGY - player[player.heroes[0]].energy) / MAX_ENERGY;
        animationTime = Math.round(animation.frames.length * animation.frameDuration * FRAME_LENGTH * p);
    }
    if (player.usingSpecial) {
        animation = heroData.specialAnimation;
    }
    if (player.chasingNeedle) {
        animation = heroData.enterAnimation;
    }
    if (player.catchingNeedleFrames > 0) {
        animation = heroData.catchAnimation;
    }
    if (player.meleeAttackTime >= 0) {
        animation = heroData.meleeAnimation;
        animationTime = player.meleeAttackTime;
    }
    context.save();
    if (invulnerableFor > 1000) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 40) * .2;
    } else if (invulnerableFor > 400) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 20) * .2;
    } else if (invulnerableFor > 0) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 10) * .2;
    }
    const frame = getFrame(animation, animationTime);
    drawImage(context, frame.image, frame, sprite);
    context.restore();
    if (player.chargeAttackFrames > 10) {
        context.save();
        if (player.chargeAttackFrames < CHARGE_FRAMES_SECOND) {
            context.globalAlpha = 0.8;
            let chargingFrameIndex = Math.floor(player.chargeAttackFrames / chargingAnimation.frameDuration);
            chargingFrameIndex %= chargingAnimation.frames.length;
            let chargingFrame = chargingAnimation.frames[chargingFrameIndex];
            let targetRectangle = new Rectangle(chargingFrame).moveCenterTo(
                sprite.left + sprite.width - chargingFrame.width / 2,
                sprite.top + sprite.height / 2,
            );
            drawImage(context, chargingFrame.image, chargingFrame, targetRectangle);
        }
        if (player.chargeAttackFrames > CHARGE_FRAMES_FIRST) {
            const scale = (player.chargeAttackFrames >= CHARGE_FRAMES_SECOND) ? 1 : 0.5;
            context.globalAlpha = 0.8;
            let chargedFrameIndex = Math.floor(player.chargeAttackFrames / chargedAnimation.frameDuration);
            chargedFrameIndex %= chargedAnimation.frames.length;
            let chargedFrame = chargedAnimation.frames[chargedFrameIndex];
            let targetRectangle = new Rectangle(chargedFrame).scale(scale).moveCenterTo(
                sprite.left + sprite.width + heroData.chargeXOffset,
                sprite.top + sprite.height / 2,
            );
            drawImage(context, chargedFrame.image, chargedFrame, targetRectangle);

        }
        context.restore();
    }
    if (isKeyDown(KEY_SHIFT)) {
        const hitbox = getHeroHitbox(player);
        context.save();
        context.globalAlpha = .6;
        context.fillStyle = 'green';
        context.fillRect(hitbox.left, hitbox.top, hitbox.width, hitbox.height);
        context.restore();
    }
    if (heroData.render) {
        heroData.render(context, player);
    }
    for (const ladybug of ladybugs) {
        renderLadybug(context, ladybug);
    }
};

const ladybugAnimation = createAnimation('gfx/heroes/ladybug.png', r(25, 20), {top: 20, cols: 4, duration: 4});
const ladybugAnimationTint = createAnimation('gfx/heroes/ladybug.png', r(25, 20), {top: 0, cols: 4, duration: 4});
const renderLadybug = (context, ladybug) => {
    let frame = getFrame(ladybugAnimationTint, ladybug.animationTime);
    drawTintedImage(context, frame.image, ladybug.color, 1, frame, ladybug);
    frame = getFrame(ladybugAnimation, ladybug.animationTime);
    drawImage(context, frame.image, frame, ladybug);
};

module.exports = {
    getNewPlayerState,
    advanceHero,
    getHeroHitbox,
    getHeroCenter,
    damageHero,
    renderHero,
    heroesData,
    updatePlayer,
    updatePlayerOnContinue,
    isPlayerInvulnerable,
    isHeroSwapping,
    ladybugAnimation,
    useMeleeAttack,
    switchHeroes,
};

const { getGroundHeight, getHazardHeight, getHazardCeilingHeight } = require('world');

const { createAttack, addPlayerAttackToState } = require('attacks');
const {
    createEffect,
    addEffectToState,
    getEffectHitbox,
    updateEffect,
} = require('effects');
const { EFFECT_FAST_LIGHTNING, checkToAddLightning} = require('effects/lightning');
const { updateEnemy } = require('enemies');
const { advanceFinisher, startFinisher, EFFECT_FINISHER } = require('effects/finisher');
const { LOOT_GAUNTLET } = require('loot');

require('heroes/bee');
require('heroes/dragonfly');
require('heroes/moth');

