const {
    WIDTH,
    GAME_HEIGHT,
    FRAME_LENGTH,
    DEATH_COOLDOWN,
    SHOT_COOLDOWN, ATTACK_OFFSET,
    SPAWN_INV_TIME,
    ACCELERATION,
    ATTACK_BLAST, ATTACK_SLASH, ATTACK_STAB,
    ATTACK_ORB, ATTACK_LASER,
    EFFECT_EXPLOSION,
    EFFECT_DEAD_BEE, EFFECT_SWITCH_BEE,
    EFFECT_DEAD_DRAGONFLY, EFFECT_SWITCH_DRAGONFLY,
    EFFECT_DEAD_MOTH, EFFECT_SWITCH_MOTH,
    EFFECT_NEEDLE_FLIP,
    HERO_BEE, HERO_DRAGONFLY, HERO_MOTH,
    MAX_ENERGY,
    LOOT_SPEED, LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_SPEED, LOOT_TRIPLE_POWER, LOOT_TRIPLE_RATE, LOOT_COMBO, LOOT_TRIPLE_COMBO,
    LOOT_NORMAL_LADYBUG, LOOT_LIGHTNING_LADYBUG, LOOT_PENETRATING_LADYBUG,
} = require('gameConstants');

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const Rectangle = require('Rectangle');

const {
    drawImage,
    drawTintedImage,
} = require('draw');

const { getNewSpriteState } = require('sprites');

const {
    requireImage, r,
    createAnimation,
    beeAnimation,
    beeEnterAnimation,
    beeCatchAnimation,
    beeMeleeAnimation,
    dragonflyAnimation,
    dragonflyEnterAnimation,
    dragonflyCatchAnimation,
    dragonflyMeleeAnimation,
    dragonflyIdleAnimation,
    mothAnimation,
    mothEnterAnimation,
    mothCatchAnimation,
    mothMeleeAnimation,
    getHitBox,
    getFrame,
} = require('animations');
/*
Dragonfly - I don't know how long the dash should be, but I made a little sprite for a trail behind wherever
she goes. I figure it'll mostly be in a single direction, but the idea is she can dash in that direction and
anyone she dashes through is hit with a standard melee attack. The dash trail is left behind to show this for half
a second.

Moth - There is a short animation of her initializing the invisibility, then she goes invisible.
 At first I thought of doing an outline for the moth, but I thought outlines possibly can be hidden by backgrounds
 if the color is too similar. So, is it possible for you to simply change the opacity to 50% for any moves the moth
  does during the invisibility? I can also do it via photoshop, but I did not know if there was a programming method
  to do it without creating a bunch more files.

Brighten screen during lightning.
*/
const heroesData = {
    [HERO_BEE]: {
        animation: beeAnimation,
        enterAnimation: beeEnterAnimation,
        catchAnimation: beeCatchAnimation,
        meleeAnimation: beeMeleeAnimation,
        specialAnimation: {
            frames: [
                {...r(88, 56), image: requireImage('gfx/heroes/bee/beespecial1.png')},
                {...r(88, 56), image: requireImage('gfx/heroes/bee/beespecial2.png')},
                {...r(88, 56), image: requireImage('gfx/heroes/bee/beespecial3.png')},
            ],
            frameDuration: 6,
        },
        meleeAttack: ATTACK_STAB,
        deathEffect: EFFECT_DEAD_BEE,
        deathSfx: 'sfx/exclamation.mp3',
        switchEffect: EFFECT_SWITCH_BEE,
        portraitAnimation: createAnimation('gfx/heroes/bee/beeportrait.png', r(17, 18)),
        defeatedPortraitAnimation: createAnimation('gfx/heroes/bee/beeportraitdead.png', r(17, 18)),
        baseSpeed: 7,
        meleePower: 2,
        meleeScaling: 0.25,
        hudColor: '#603820',
        // hudColor: '#E85038'
        specialCost: 12,
        applySpecial(state, playerIndex) {
            const player = state.players[playerIndex];
            if (player.specialFrames < 6 * 3) {
                return updatePlayer(state, playerIndex,
                    {specialFrames: player.specialFrames + 1},
                );
            }
            state = checkToAddLightning(state, {
                left: player.sprite.left + player.sprite.width - 10,
                top: player.sprite.top + player.sprite.height / 2,
            });
            return updatePlayer(state, playerIndex,
                {usingSpecial: false, invulnerableFor: 500},
            );
        },
    },
    [HERO_DRAGONFLY]: {
        animation: dragonflyAnimation,
        enterAnimation: dragonflyEnterAnimation,
        catchAnimation: dragonflyCatchAnimation,
        meleeAnimation: dragonflyMeleeAnimation,
        idleAnimation: dragonflyIdleAnimation,
        specialAnimation: {
            frames: [
                {...r(88, 56), image: requireImage('gfx/heroes/dragonfly/knightspecial1.png')},
                {...r(88, 56), image: requireImage('gfx/heroes/dragonfly/knightspecial2.png')},
            ],
            frameDuration: 8,
        },
        meleeAttack: ATTACK_SLASH,
        deathEffect: EFFECT_DEAD_DRAGONFLY,
        deathSfx: 'sfx/exclamation3.mp3',
        specialSfx: 'sfx/dash.mp3',
        switchEffect: EFFECT_SWITCH_DRAGONFLY,
        portraitAnimation: createAnimation('gfx/heroes/dragonfly/dragonflyportrait.png', r(17, 18)),
        defeatedPortraitAnimation: createAnimation('gfx/heroes/dragonfly/dragonflyportraitdead.png', r(17, 18)),
        baseSpeed: 8,
        meleePower: 1,
        meleeScaling: 0.25,
        hudColor: '#F03010',
        specialCost: 8,
        applySpecial(state, playerIndex) {
            const player = state.players[playerIndex];
            for (let i = 0; i < state.enemies.length; i++) {
                let enemy = state.enemies[i];
                const enemyHitBox = getEnemyHitBox(enemy);
                if (enemy && !enemy.done && !enemy.dead &&
                    Rectangle.collision(enemyHitBox, getHeroHitBox(player))
                ) {
                    state = damageEnemy(state, i, {playerIndex});
                }
            }
            if (player.specialFrames <= 20) {
                return updatePlayer(state, playerIndex,
                    {specialFrames: player.specialFrames + 1},
                    {left: player.sprite.left + 15}
                );
            }
            state = useMeleeAttack(state, playerIndex);
            return updatePlayer(state, playerIndex,
                {usingSpecial: false, invulnerableFor: 500},
            );
        },
    },
    [HERO_MOTH]: {
        animation: mothAnimation,
        enterAnimation: mothEnterAnimation,
        catchAnimation: mothCatchAnimation,
        meleeAnimation: mothMeleeAnimation,
        specialAnimation: {
            frames: [
                {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial1.png')},
                {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial2.png')},
                {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial3.png')},
                {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial4.png')},
            ],
            frameDuration: 6,
        },
        meleeAttack: ATTACK_SLASH,
        deathEffect: EFFECT_DEAD_MOTH,
        deathSfx: 'sfx/exclamation2.mp3',
        specialSfx: 'sfx/special.mp3',
        switchEffect: EFFECT_SWITCH_MOTH,
        portraitAnimation: createAnimation('gfx/heroes/moth/mothportrait.png', r(17, 18)),
        defeatedPortraitAnimation: createAnimation('gfx/heroes/moth/mothportraitdead.png', r(17, 18)),
        baseSpeed: 6,
        meleePower: 1,
        meleeScaling: 0.5,
        hudColor: '#B0B0B0',
        specialCost: 10,
        applySpecial(state, playerIndex) {
            const player = state.players[playerIndex];
            if (player.specialFrames < 6 * 4) {
                return updatePlayer(state, playerIndex,
                    {specialFrames: player.specialFrames + 1},
                );
            }
            return updatePlayer(state, playerIndex,
                {usingSpecial: false, invulnerableFor: 4000},
            );
        },
    },
};

const getNewPlayerState = () => ({
    score: 0,
    powerupPoints: 0,
    powerupIndex: 0,
    comboScore: 0,
    sprite: getNewSpriteState({...dragonflyAnimation.frames[0],
        left: 160, top: 377,
        targetLeft: 170, targetTop: 200,
        spawnSpeed: 7,
    }),
    heroes: [HERO_DRAGONFLY, HERO_BEE, HERO_MOTH],
    [HERO_DRAGONFLY]: {energy: 0, deaths: 0},
    [HERO_BEE]: {energy: 0, deaths: 0},
    [HERO_MOTH]: {energy: 0, deaths: 0},
    invulnerableFor: 0,
    spawning: true,
    shotCooldown: 0,
    powerups: [],
    relics: {},
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

const updatePlayer = (state, playerIndex, props, spriteProps = null) => {
    const players = [...state.players];
    if (spriteProps) {
        props.sprite = {...players[playerIndex].sprite, ...spriteProps};
    }
    players[playerIndex] = {...players[playerIndex], ...props};
    return {...state, players};
};

const isPlayerInvulnerable = (state, playerIndex) => {
    const player = state.players[playerIndex];
    return player.invulnerableFor || player.usingSpecial;
};

const useMeleeAttack = (state, playerIndex) => {
    const player = state.players[playerIndex];
    const heroData = heroesData[player.heroes[0]];
    const meleeCooldown = 3 * SHOT_COOLDOWN - player.powerups.filter(powerup => powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO).length;
    const powers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO).length;
    const triplePowers = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO).length;
    const scale = 1 + heroData.meleeScaling * (powers + triplePowers / 2);
    const meleeAttack = createAttack(heroData.meleeAttack, {
        damage: heroData.meleePower + triplePowers,
        top: player.sprite.top + player.sprite.vy + player.sprite.height / 2,
        left: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET,
        playerIndex,
    });
    meleeAttack.width *= scale;
    meleeAttack.height *= scale;
    meleeAttack.top -=  meleeAttack.height / 2;
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

const advanceHero = (state, playerIndex) => {
    if (state.players[playerIndex].done) {
        return state;
    }
    state = advanceLadybugs(state, playerIndex);
    let player = state.players[playerIndex];
    // Restore energy for all heroes each frame.
    for (const heroType of player.heroes) {
        if (player[heroType].energy < MAX_ENERGY &&
            (heroType !== player.heroes[0] || (!player.invulnerableFor && !player.usingSpecial))
        ) {
            state = updatePlayer(state, playerIndex,
                {[heroType]: {...player[heroType], energy: player[heroType].energy + 0.02}}
            );
        }
    }
    let {shotCooldown, invulnerableFor, specialCooldownFrames} = player;
    const heroType = player.heroes[0];
    const heroData = heroesData[heroType];
    if (player.usingSpecial) {
        state = updatePlayer(state, playerIndex, {}, {animationTime: player.sprite.animationTime + FRAME_LENGTH});
        return heroData.applySpecial(state, playerIndex);
    }
    // If the player runs out of energy from using a special move, they automatically switch out
    // after using it.
    if (player[player.heroes[0]].energy < 0 && !player.invulnerableFor) {
        return switchHeroes(state, playerIndex);
    }
    if (player.actions.special && heroData.applySpecial && !player.sprite.targetLeft
        && !player.invulnerableFor
        // You can use a special when you don't have enough energy *if* another hero is available.
        && (player[heroType].energy >= heroData.specialCost || hasAnotherHero(state, playerIndex))
    ) {
        if (heroData.specialSfx) state = {...state, sfx: [...state.sfx, heroData.specialSfx]};
        return updatePlayer(state, playerIndex, {
            usingSpecial: true, specialFrames: 0,
            [heroType]: {...player[heroType], energy: player[heroType].energy - heroData.specialCost},
        }, {animationTime: 0});
    }
    if (player.meleeCooldown > 0) {
        state = updatePlayer(state, playerIndex, {meleeCooldown: player.meleeCooldown - 1});
        player = state.players[playerIndex];
    } else if (player.actions.melee) {
        state = useMeleeAttack(state, playerIndex);
        player = state.players[playerIndex];
    } else if (shotCooldown > 0) {
        shotCooldown--;
    } else if (player.actions.shoot) {
        shotCooldown = SHOT_COOLDOWN - player.powerups.filter(powerup => powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO).length;
        const powers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO).length;
        const triplePowers = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO).length;
        const tripleRates = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_RATE || powerup === LOOT_TRIPLE_COMBO).length;
        const middleShot = {x: ATTACK_OFFSET, y: 0, vx: 20, vy: 0};
        const upperA = {x: ATTACK_OFFSET, y: -5, vx: 19, vy: -1}, lowerA = {x: ATTACK_OFFSET, y: 5, vx: 19, vy: 1};
        const upperB = {x: ATTACK_OFFSET - 4, y: -10, vx: 18.5, vy: -2}, lowerB = {x: ATTACK_OFFSET - 4, y: 10, vx: 18.5, vy: 2};
        const upperC = {x: ATTACK_OFFSET - 4, y: -15, vx: 17, vy: -4}, lowerC = {x: ATTACK_OFFSET - 4, y: 15, vx: 18, vy: 4};
        const upperD = {x: ATTACK_OFFSET - 10, y: -20, vx: 15, vy: -6}, lowerD = {x: ATTACK_OFFSET - 10, y: 20, vx: 15, vy: 6};
        const upperE = {x: ATTACK_OFFSET - 10, y: -25, vx: 15, vy: -6}, lowerE = {x: ATTACK_OFFSET - 10, y: 25, vx: 15, vy: 6};
        const blastPattern = [
                                [middleShot],
                                [upperA, lowerA],
                                [upperB, middleShot, lowerB],
                                [upperC, upperA, lowerA, lowerC],
                                [upperD, upperB, middleShot, lowerB, lowerD],
                                [upperE, upperC, upperA, lowerA, lowerC, lowerE],
                            ][tripleRates];
        let mute = false;
        const scale = 1 + powers + triplePowers / 2;
        for (const blastOffsets of blastPattern) {
            const blast = createAttack(ATTACK_BLAST, {
                damage: 1 + triplePowers,
                left: player.sprite.left + player.sprite.vx + player.sprite.width,
                /*xOffset: blastOffsets.x,
                yOffset: blastOffsets.y,
                vx: 20,*/
                xOffset: ATTACK_OFFSET,
                yOffset: 0,
                vx: blastOffsets.vx,
                vy: blastOffsets.vy,
                delay: 2,
                playerIndex,
            });
            blast.width *= scale;
            blast.height *= scale;
            blast.top = player.sprite.top + player.sprite.vy + Math.round((player.sprite.height - blast.height) / 2);
            // Only play 1 attack sound per frame.
            if (mute) delete blast.sfx;
            state = addPlayerAttackToState(state, blast);
            mute = true;
        }

        player = state.players[playerIndex];
    }

    let {top, left, vx, vy, width, height, animationTime, targetLeft, targetTop} = player.sprite;
    animationTime += FRAME_LENGTH;
    if (invulnerableFor > 0) {
        invulnerableFor -= FRAME_LENGTH;
    }
    if (targetLeft != false) {
        const theta = Math.atan2(targetTop - top, targetLeft - left);
        left = Math.min(left + player.sprite.spawnSpeed * Math.cos(theta), targetLeft);
        top = Math.max(top + player.sprite.spawnSpeed * Math.sin(theta), targetTop);
        if (left === targetLeft && top === targetTop) {
            targetLeft = targetTop = false;
        }
        return updatePlayer(state, playerIndex, {
            invulnerableFor, spawning: true,
            shotCooldown: 1, meleeCooldown: 1, specialCooldownFrames,
        }, {left, top, animationTime, targetLeft, targetTop});
    }
    if (player.actions.switch) {
        return switchHeroes(state, playerIndex);
    }
    const speedPowerups = player.powerups.filter(powerup => powerup === LOOT_SPEED || powerup === LOOT_COMBO).length;
    const tripleSpeedPowerups = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_SPEED || powerup === LOOT_TRIPLE_COMBO).length;
    const maxSpeed = heroData.baseSpeed + tripleSpeedPowerups * 2;
    const accleration = ACCELERATION + speedPowerups + tripleSpeedPowerups;
    // Accelerate player based on their input.
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
    const hitBox = new Rectangle(getHeroHitBox(player)).translate(-player.sprite.left, -player.sprite.top);
    if (top + hitBox.top < 0) {
        top = -hitBox.top;
        vy = 0;
    }
    const bottom = Math.min(getGroundHeight(state), GAME_HEIGHT);
    if (top + hitBox.top + hitBox.height > bottom) {
        top = bottom - (hitBox.top + hitBox.height);
        vy = 0;
    }
    if (left + hitBox.left < 0) {
        left = -hitBox.left;
        vx = 0;
    }
    if (left + hitBox.left + hitBox.width > WIDTH ) {
        left = WIDTH - (hitBox.left + hitBox.width);
        vx = 0;
    }
    const sprite = {...player.sprite, left, top, vx, vy, animationTime};
    let sfx = state.sfx;
    let chasingNeedle = player.chasingNeedle, catchingNeedleFrames = player.catchingNeedleFrames;
    if (chasingNeedle) {
        chasingNeedle = false;
        catchingNeedleFrames = 6;
        sfx.push('sfx/needlegrab.mp3');
    } else if(catchingNeedleFrames > 0) {
        catchingNeedleFrames--;
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
    const updatedProps = {
        shotCooldown, meleeAttackTime,
        specialCooldownFrames,
        invulnerableFor, sprite,
        chasingNeedle, catchingNeedleFrames,
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
        } else if (player.actions.shoot && !player.spawning) {
            if (ladybug.type === LOOT_PENETRATING_LADYBUG) {
                shotCooldown = 2 * SHOT_COOLDOWN;
                const laser = createAttack(ATTACK_LASER, {
                    left: ladybug.left + player.sprite.vx + ladybug.width + ATTACK_OFFSET,
                    vx: 25,
                    playerIndex,
                });
                laser.width *= 2;
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
    // If the first hero has no energy, switch to the next hero.
    if (player[heroes[0]].energy < 0) {
        heroes.push(heroes.shift());
    }
    const targetLeft = sprite.left, targetTop = sprite.top;
    const left = -100, top = GAME_HEIGHT - 100;
    const dx = left - targetLeft, dy = targetTop - top;
    const spawnSpeed = Math.sqrt(dx * dx + dy * dy) / 25;
    updatedState = updatePlayer(updatedState, playerIndex, {
            heroes,
            invulnerableFor: 25 * FRAME_LENGTH,
            spawning: true,
            chasingNeedle: true,
        }, {
            ...heroesData[player.heroes[0]].animation.frames[0],
            left, top, targetLeft, targetTop, spawnSpeed,
            vx: 0, vy: 0,
        }
    );
    player = updatedState.players[playerIndex];

    const sfx = [...updatedState.sfx, 'sfx/needledropflip.mp3'];
    return {...updatedState, sfx};
};

const damageHero = (updatedState, playerIndex) => {
    let deathCooldown = updatedState.deathCooldown
    let player = updatedState.players[playerIndex];
    const sprite = player.sprite;
    const ladybugs = [...player.ladybugs];
    ladybugs.shift();

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
    powerups.pop();
    const left = -100, top = GAME_HEIGHT - 100;
    const dx = left - targetLeft, dy = targetTop - top;
    const spawnSpeed = Math.sqrt(dx * dx + dy * dy) / 25;
    updatedState = updatePlayer(updatedState, playerIndex, {
        heroes,
        dead: true,
        usingSpecial: false,
        done,
        invulnerableFor: SPAWN_INV_TIME,
        spawning: true,
        chasingNeedle: true,
        powerupIndex: 0,
        powerupPoints: 0,
        comboScore: 0,
        powerups,
        ladybugs,
    }, {
        ...heroesData[player.heroes[0]].animation.frames[0],
        left, top, targetLeft, targetTop, spawnSpeed,
        vx: 0, vy: 0,
    });
    player = updatedState.players[playerIndex];


    let sfx = [...updatedState.sfx, deadHeroData.deathSfx];
    if (player.done) {
        deathCooldown = DEATH_COOLDOWN;
        sfx.push('sfx/death.mp3');
    } else {
        sfx.push('sfx/needledropflip.mp3');
    }
    return {...updatedState, deathCooldown, sfx};
};

const getHeroHitBox = (player) => {
    const {animationTime, left, top} = player.sprite;
    const animation = heroesData[player.heroes[0]].animation;
    return new Rectangle(getHitBox(animation, animationTime)).translate(left, top);
};

const renderHero = (context, player) => {
    let {sprite, invulnerableFor, done, ladybugs} = player;
    if (done) return;
    const heroData = heroesData[player.heroes[0]];
    let animation = heroData.animation, animationTime = sprite.animationTime;
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
    if (isKeyDown(KEY_SHIFT)) {
        const hitBox = getHeroHitBox(player);
        context.save();
        context.globalAlpha = .6;
        context.fillStyle = 'green';
        context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
        context.restore();
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
    getHeroHitBox,
    damageHero,
    renderHero,
    heroesData,
    updatePlayer,
    isPlayerInvulnerable,
    ladybugAnimation,
};


const { getGroundHeight } = require('world');

const { createAttack, addPlayerAttackToState } = require('attacks');
const { effects, createEffect, addEffectToState } = require('effects');

const lightningFrames = [
    {...r(50, 10), image: requireImage('gfx/attacks/chain1.png')},
    {...r(50, 10), image: requireImage('gfx/attacks/chain2.png')},
    {...r(50, 10), image: requireImage('gfx/attacks/chain3.png')},
    {...r(50, 10), image: requireImage('gfx/attacks/chain4.png')},
];
function advanceLightning(state, effectIndex) {
    const effect = state.effects[effectIndex];
    if (effect.charges > 0 && effect.animationTime === FRAME_LENGTH) {
        const center = [effect.left + effect.width / 2, effect.top + effect.height / 2];
        const left = center[0] + Math.cos(effect.rotation) * effect.width / 2;
        const top = center[1] + Math.sin(effect.rotation) * effect.width / 2;
        state = checkToAddLightning(state, {...effect, left, top});
    }
    return state;
}
const EFFECT_LIGHTNING = 'lightning';
effects[EFFECT_LIGHTNING] = {
    animation: {
        frames: lightningFrames,
        frameDuration: 4,
    },
    advanceEffect: advanceLightning,
    props: {
        loops: 1,
        damage: 5,
        charges: 8,
        branchChance: .9,
        rotation: 0,
        sfx: 'sfx/fastlightning.mp3',
    },
};
const EFFECT_FAST_LIGHTNING = 'fastLightning';
effects[EFFECT_FAST_LIGHTNING] = {
    animation: {
        frames: lightningFrames,
        frameDuration: 1,
    },
    advanceEffect: advanceLightning,
    props: {
        loops: 1,
        damage: 1,
        charges: 0,
        branchChance: 0,
        rotation: 0,
    },
};

const checkToAddLightning = (state, {left, top, charges = 8, damage = 5, branchChance = 0, rotation = 0, scale = 2, vx = 0, vy = 0, type = EFFECT_LIGHTNING}) => {
    const addLightning = (rotation, branchChance) => {
        const lightning = createEffect(type, {
            left, top,
            charges: charges - 1,
            rotation,
            branchChance,
            xScale: scale, yScale: scale,
            vx, vy,
        });
        lightning.width *= scale;
        lightning.height *= scale;
        lightning.left -= lightning.width / 2;
        lightning.left += Math.cos(rotation) * lightning.width / 2;
        lightning.top -= lightning.height / 2;
        lightning.top += Math.sin(rotation) * lightning.width / 2;
        state = addEffectToState(state, lightning);
    }
    const targetRotations = [];
    for (let i = 0; i < state.enemies.length; i++) {
        const enemy = state.enemies[i];
        if (enemy.done || enemy.dead) continue;
        // The large lightning attack can only hit enemies in front of each bolt.
        if (type === EFFECT_LIGHTNING && enemy.left + enemy.width / 2 <= left) continue;
        const hitBox = getEnemyHitBox(enemy);
        const dx = hitBox.left + hitBox.width / 2 - left,
            dy = hitBox.top + hitBox.height / 2 - top;
        const radius = Math.sqrt(hitBox.width * hitBox.width + hitBox.height * hitBox.height) / 2;
        if (Math.sqrt(dx * dx + dy * dy) <= 50 * scale + radius) {
            targetRotations.push(Math.atan2(dy, dx));
            state = damageEnemy(state, i, {playerIndex: 0, damage});
            state = {...state, sfx: [...state.sfx, 'sfx/hit.mp3']};
        }
    }
    if (targetRotations.length) {
        const branchChance = targetRotations.length > 1 ? 0 : branchChance + 0.2;
        for (var enemyRotation of targetRotations) {
            addLightning(enemyRotation, branchChance);
        }
    } else if (Math.random() < branchChance) {
        addLightning(rotation - (Math.PI / 12), 0);
        addLightning(rotation + (Math.PI / 13), 0);
    } else {
        addLightning(rotation, branchChance + 0.2);
    }
    return state;
}

const { getEnemyHitBox, damageEnemy } = require('enemies');

