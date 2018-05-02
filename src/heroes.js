const {
    WIDTH,
    GAME_HEIGHT,
    FRAME_LENGTH,
    DEATH_COOLDOWN,
    SHOT_COOLDOWN, ATTACK_OFFSET,
    SPAWN_INV_TIME,
    ACCELERATION,
    ATTACK_BLAST, ATTACK_ORB, ATTACK_SLASH, ATTACK_STAB,
    EFFECT_EXPLOSION,
    EFFECT_DEAD_BEE, EFFECT_SWITCH_BEE,
    EFFECT_DEAD_DRAGONFLY, EFFECT_SWITCH_DRAGONFLY,
    EFFECT_DEAD_MOTH, EFFECT_SWITCH_MOTH,
    EFFECT_NEEDLE_FLIP,
    HERO_BEE, HERO_DRAGONFLY, HERO_MOTH,
    LOOT_SPEED, LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_SPEED, LOOT_TRIPLE_POWER, LOOT_TRIPLE_RATE, LOOT_COMBO, LOOT_TRIPLE_COMBO,
} = require('gameConstants');

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const Rectangle = require('Rectangle');

const {
    drawImage,
} = require('draw');

const { getNewSpriteState } = require('sprites');

const {
    beeAnimation,
    beeEnterAnimation,
    beeCatchAnimation,
    beeMeleeAnimation,
    beePortraitAnimation,
    dragonflyAnimation,
    dragonflyEnterAnimation,
    dragonflyCatchAnimation,
    dragonflyMeleeAnimation,
    dragonflyPortraitAnimation,
    dragonflyIdleAnimation,
    mothAnimation,
    mothEnterAnimation,
    mothCatchAnimation,
    mothMeleeAnimation,
    mothPortraitAnimation,
    ladybugAnimation,
    getHitBox,
    getFrame,
} = require('animations');

const heroesData = {
    [HERO_BEE]: {
        animation: beeAnimation,
        enterAnimation: beeEnterAnimation,
        catchAnimation: beeCatchAnimation,
        meleeAnimation: beeMeleeAnimation,
        meleeAttack: ATTACK_STAB,
        deathEffect: EFFECT_DEAD_BEE,
        deathSfx: 'sfx/exclamation.mp3',
        switchEffect: EFFECT_SWITCH_BEE,
        portraitAnimation: beePortraitAnimation,
        baseSpeed: 7,
        meleePower: 2,
        meleeScaling: 0.25,
    },
    [HERO_DRAGONFLY]: {
        animation: dragonflyAnimation,
        enterAnimation: dragonflyEnterAnimation,
        catchAnimation: dragonflyCatchAnimation,
        meleeAnimation: dragonflyMeleeAnimation,
        idleAnimation: dragonflyIdleAnimation,
        meleeAttack: ATTACK_SLASH,
        deathEffect: EFFECT_DEAD_DRAGONFLY,
        deathSfx: 'sfx/exclamation3.mp3',
        switchEffect: EFFECT_SWITCH_DRAGONFLY,
        portraitAnimation: dragonflyPortraitAnimation,
        baseSpeed: 8,
        meleePower: 1,
        meleeScaling: 0.25,
    },
    [HERO_MOTH]: {
        animation: mothAnimation,
        enterAnimation: mothEnterAnimation,
        catchAnimation: mothCatchAnimation,
        meleeAnimation: mothMeleeAnimation,
        meleeAttack: ATTACK_SLASH,
        deathEffect: EFFECT_DEAD_MOTH,
        deathSfx: 'sfx/exclamation2.mp3',
        switchEffect: EFFECT_SWITCH_MOTH,
        portraitAnimation: mothPortraitAnimation,
        baseSpeed: 6,
        meleePower: 1,
        meleeScaling: 0.5,
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
    missingHeroes: [],
    invulnerableFor: 0,
    spawning: true,
    shotCooldown: 0,
    ladybugShotCooldown: 0,
    powerups: [],
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

const updatePlayer = (state, playerIndex, props) => {
    const players = [...state.players];
    players[playerIndex] = {...players[playerIndex], ...props};
    return {...state, players};
};

const advanceHero = (state, playerIndex) => {
    if (state.players[playerIndex].done) {
        return state;
    }
    let player = state.players[playerIndex];
    let {meleeAttackTime, meleeCooldown, shotCooldown, invulnerableFor, ladybugShotCooldown} = player;
    const heroData = heroesData[player.heroes[0]];
    if (meleeCooldown > 0) {
        meleeCooldown--;
    } else if (player.actions.melee) {
        meleeCooldown = 3 * SHOT_COOLDOWN - player.powerups.filter(powerup => powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO).length;
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
        meleeAttackTime = 0;

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

    if (ladybugShotCooldown > 0) {
        ladybugShotCooldown--;
    } else if (player.actions.shoot && player.ladybugs.length) {
        ladybugShotCooldown = SHOT_COOLDOWN * 1.5;
        for (let i = 0; i < player.ladybugs.length; i++) {
            const ladybug = player.ladybugs[i];
            const orb = createAttack(ATTACK_ORB, {
                damage: 1,
                left: ladybug.left + player.sprite.vx + ladybug.width + ATTACK_OFFSET,
                vx: 15,
                playerIndex,
            });
            orb.top = ladybug.top + player.sprite.vy + Math.round((ladybug.height - orb.height) / 2) + 6
            state = addPlayerAttackToState(state, orb);

            player = state.players[playerIndex];
        }
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
            ladybugShotCooldown: 1, invulnerableFor, spawning: true,
            shotCooldown: 1, meleeCooldown: 1,
            sprite: {...player.sprite, left, top, animationTime, targetLeft, targetTop},
        });
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
    const ladybugs = updateLadyBugs(player);
    let sfx = state.sfx;
    let chasingNeedle = player.chasingNeedle, catchingNeedleFrames = player.catchingNeedleFrames;
    if (chasingNeedle) {
        chasingNeedle = false;
        catchingNeedleFrames = 6;
        sfx.push('sfx/needlegrab.mp3');
    } else if(catchingNeedleFrames > 0) {
        catchingNeedleFrames--;
    }
    if (meleeAttackTime >= 0) {
        meleeAttackTime += FRAME_LENGTH;
        const animation = heroData.meleeAnimation;
        const attackLength = animation.frames.length * animation.frameDuration * FRAME_LENGTH;
        if (meleeAttackTime >= attackLength) {
            meleeAttackTime = undefined;
        }
    }
    const updatedProps = {
        shotCooldown, meleeCooldown, meleeAttackTime,
        ladybugShotCooldown, invulnerableFor, sprite,
        ladybugs, chasingNeedle, catchingNeedleFrames,
        spawning: false,
    };
    return updatePlayer({...state, sfx}, playerIndex, updatedProps);
};

const updateLadyBugs = (player) => {
    const sprite = player.sprite;
    const ladybugs = [...player.ladybugs];
    for (let i = 0; i < ladybugs.length; i++) {
        const delta = [[-5, -32], [-5, 32], [52, -16], [52, 16]][i % 4];
        const tx = sprite.left + sprite.width / 2 - ladybugAnimation.frames[0].width / 2 + delta[0];
        const ty = sprite.top + sprite.height / 2 - ladybugAnimation.frames[0].height / 2 + delta[1];
        ladybugs[i] = {
            ...ladybugs[i],
            left: (ladybugs[i].left + tx) / 2,
            top: (ladybugs[i].top + ty) / 2,
            animationTime: ladybugs[i].animationTime + FRAME_LENGTH,
        };
    }
    return ladybugs;
}

const switchHeroes = (updatedState, playerIndex) => {
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
    const targetLeft = sprite.left, targetTop = sprite.top;
    const left = -100, top = GAME_HEIGHT - 100;
    const dx = left - targetLeft, dy = targetTop - top;
    const spawnSpeed = Math.sqrt(dx * dx + dy * dy) / 25;
    updatedState = updatePlayer(updatedState, playerIndex, {
        sprite: {
            ...sprite,
            ...heroesData[player.heroes[0]].animation.frames[0],
            left, top, targetLeft, targetTop, spawnSpeed,
            vx: 0, vy: 0,
        },
        heroes,
        invulnerableFor: 25 * FRAME_LENGTH,
        spawning: true,
        chasingNeedle: true,
    });
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
    const needleEffect = createEffect(EFFECT_NEEDLE_FLIP);
    needleEffect.left = sprite.left + (sprite.width - needleEffect.width ) / 2;
    needleEffect.top = sprite.top + (sprite.height - needleEffect.height ) / 2;
    updatedState = addEffectToState(updatedState, needleEffect);

    const heroes = [...player.heroes];
    const missingHeroes = [...player.missingHeroes, heroes.shift()];
    const targetLeft = sprite.left, targetTop = sprite.top;
    const powerups = [...player.powerups];
    powerups.pop();
    const left = -100, top = GAME_HEIGHT - 100;
    const dx = left - targetLeft, dy = targetTop - top;
    const spawnSpeed = Math.sqrt(dx * dx + dy * dy) / 25;
    updatedState = updatePlayer(updatedState, playerIndex, {
        sprite: {
            ...sprite,
            ...heroesData[player.heroes[0]].animation.frames[0],
            left, top, targetLeft, targetTop, spawnSpeed,
            vx: 0, vy: 0,
        },
        heroes,
        missingHeroes,
        dead: true,
        done: heroes.length <= 0,
        invulnerableFor: SPAWN_INV_TIME,
        spawning: true,
        chasingNeedle: true,
        powerupIndex: 0,
        powerupPoints: 0,
        comboScore: 0,
        powerups,
        ladybugs,
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

const renderLadybug = (context, ladybug) => {
    const frame = getFrame(ladybugAnimation, ladybug.animationTime);
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
};


const { getGroundHeight } = require('world');

const { createAttack, addPlayerAttackToState } = require('attacks');
const { createEffect, addEffectToState } = require('effects');

