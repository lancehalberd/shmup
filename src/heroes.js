const {
    WIDTH,
    GAME_HEIGHT,
    FRAME_LENGTH,
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

const {
    drawImage,
    drawTintedImage,
} = require('draw');

const { getNewSpriteState } = require('sprites');

const {
    r,
    createAnimation,
    getHitBox,
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
    [HERO_DRAGONFLY]: {energy: 0, deaths: 0},
    [HERO_BEE]: {energy: 0, deaths: 0, targets: []},
    [HERO_MOTH]: {energy: 0, deaths: 0},
    time: 0,
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

function updatePlayerOnContinue(state, playerIndex) {
    return updatePlayer(state, playerIndex, {
        score: 0,
        powerupPoints: 0,
        powerupIndex: 0,
        comboScore: 0,
        dead: false,
        done: false,
        [HERO_DRAGONFLY]: {energy: 0, deaths: 0},
        [HERO_BEE]: {energy: 0, deaths: 0, targets: []},
        [HERO_MOTH]: {energy: 0, deaths: 0},
        time: 0,
        invulnerableFor: 0,
        spawning: true,
        shotCooldown: 0,
        powerups: [],
        ladybugs: []
    }, {
        left: -100, top: 300,
        targetLeft: 170, targetTop: 200,
        spawnSpeed: 7,
    });
}

const isPlayerInvulnerable = (state, playerIndex) => {
    const player = state.players[playerIndex];
    return player.invulnerableFor > 0 || player.usingSpecial || player.usingFinisher;
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
        const ballIndex = getEffectIndex(state, EFFECT_FINISHER_BALL);
        const finisherBall = state.effects[ballIndex];
        let baseScale = 0;
        if (finisherBall.xScale >= 2) baseScale = 2;
        else if (finisherBall.xScale >= 1) baseScale = 1;
        const heroType = player.heroes[0];
        let energy = state.players[playerIndex][heroType].energy;
        // Drain energy from the player until it hits 0.
        if (energy > 0) {
            if (energy === MAX_ENERGY) {
                state = {...state, sfx: {...state.sfx, [heroesData[heroType].specialSfx]: true}};
            }
            energy--;
            state = updatePlayer(state, playerIndex, {[heroType]: {...player[heroType], energy}});
        } else if (finisherBall.xScale < 3) {
            return switchHeroes(state, playerIndex);
        } else {
            // fire beam here.
        }
        const heroHitBox = getHeroHitBox(player);
        const xScale = baseScale + (MAX_ENERGY - energy) / MAX_ENERGY;
        const yScale = xScale;
        //console.log(heroHitBox.left + heroHitBox.width / 2, heroHitBox.top + heroHitBox.height / 2);
        /*console.log({
            x: finisherBall.left + finisherBall.xScale * finisherBall.width / 2,
            y: finisherBall.top + finisherBall.yScale * finisherBall.height / 2,
        });*/
        const targetLeft = heroHitBox.left + heroHitBox.width / 2 + 50 - xScale * finisherBall.width / 2;
        const targetTop = heroHitBox.top + heroHitBox.height / 2 - yScale * finisherBall.height / 2;
        const left = (finisherBall.left + targetLeft) / 2;
        const top = (finisherBall.top + targetTop) / 2;
        state = updateEffect(state, ballIndex, { top, left, xScale, yScale });

        return state;
    }
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
    if (player[player.heroes[0]].energy < 0 && !player.invulnerableFor) {
        return switchHeroes(state, playerIndex);
    }
    if (player.actions.special && !player.sprite.targetLeft) {
        const heroHitBox = getHeroHitBox(player);
        for (const finisherEffect of state.effects.filter(effect => effect.type === EFFECT_FINISHER)) {
            if (Rectangle.collision(heroHitBox, getEffectHitBox(finisherEffect))) {
                const enemy = state.idMap[finisherEffect.enemyId];
                if (!enemy || enemy.dead) continue;
                state = updateEffect(state, state.effects.indexOf(finisherEffect), {done: true});
                state = updateEnemy(state, enemy, {snaredForFinisher: true});
                for (const heroType of player.heroes) {
                    state = updatePlayer(state, playerIndex,
                        {[heroType]: {...player[heroType], energy: MAX_ENERGY}}
                    );
                }
                const finisherBall = createEffect(EFFECT_FINISHER_BALL,
                    {xScale: 0.01, yScale: 0.01,
                        top: heroHitBox.top + heroHitBox.height / 2,
                        left: heroHitBox.left + heroHitBox.width / 2 + 50,
                });
                state = addEffectToState(state, finisherBall);
                return updatePlayer(state, playerIndex, {usingFinisher: true});
            }
        }
    }
    if (player.actions.special && heroData.applySpecial && !player.sprite.targetLeft
        && !player.invulnerableFor
        // You can use a special when you don't have enough energy *if* another hero is available.
        && (player[heroType].energy >= heroData.specialCost || hasAnotherHero(state, playerIndex))
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
    } else if (player.actions.melee) {
        state = useMeleeAttack(state, playerIndex);
        player = state.players[playerIndex];
    } else if (shotCooldown > 0) {
        state = updatePlayer({...state, sfx}, playerIndex, {shotCooldown: shotCooldown - 1});
        player = state.players[playerIndex];
    } else if (player.actions.shoot) {
        state = heroData.shoot(state, playerIndex);
        player = state.players[playerIndex];
    }

    let {top, left, vx, vy, animationTime, targetLeft, targetTop} = player.sprite;
    animationTime += FRAME_LENGTH;
    if (invulnerableFor > 0) {
        invulnerableFor -= FRAME_LENGTH;
    } else if (top + player.sprite.height > getHazardHeight(state)) {
        return damageHero(state, playerIndex);
    } else if (top < getHazardCeilingHeight(state)) {
        return damageHero(state, playerIndex);
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
    if (player.actions.switch && hasAnotherHero(state, playerIndex)) {
        return switchHeroes(state, playerIndex);
    }
    const speedPowerups = player.powerups.filter(powerup => powerup === LOOT_SPEED || powerup === LOOT_COMBO).length;
    const tripleSpeedPowerups = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_SPEED || powerup === LOOT_TRIPLE_COMBO).length;
    const maxSpeed = heroData.baseSpeed + tripleSpeedPowerups;
    const accleration = ACCELERATION + speedPowerups / 2 + tripleSpeedPowerups;
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
    let rightEdge = state.world.rightEdge || WIDTH;
    rightEdge = Math.min(rightEdge, WIDTH);
    if (left + hitBox.left + hitBox.width > rightEdge) {
        left = rightEdge - (hitBox.left + hitBox.width);
        vx = 0;
    }
    const sprite = {...player.sprite, left, top, vx, vy, animationTime};
    let sfx = {...state.sfx};
    let chasingNeedle = player.chasingNeedle, catchingNeedleFrames = player.catchingNeedleFrames;
    if (chasingNeedle) {
        chasingNeedle = false;
        catchingNeedleFrames = 6;
        sfx['sfx/needlegrab.mp3'] = true;
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
    // Hack, this applies only to the Moth special because of the extra
    // 1 millisecond added to that timer.
    if (invulnerableFor === 1001) {
        sfx['warnInvisibilityIsEnding'] = true;
    }
    const updatedProps = {
        meleeAttackTime,
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
    const hitBoxA = getHeroHitBox(player);
    // If the first hero has no energy, switch to the next hero.
    if (player[heroes[0]].energy < 0) {
        heroes.push(heroes.shift());
    }
    updatedState = updatePlayer(updatedState, playerIndex, {heroes});
    player = updatedState.players[playerIndex];
    const hitBoxB = getHeroHitBox(player);
    // Set the target coords so that the center of the incoming hero matches the center of the leaving hero.
    const targetLeft = sprite.left + hitBoxA.left + hitBoxA.width / 2 - hitBoxB.left - hitBoxB.width / 2;
    const targetTop = sprite.top + hitBoxA.top + hitBoxA.height / 2 - hitBoxB.top - hitBoxB.height / 2;
    const left = -100, top = GAME_HEIGHT - 100;
    const dx = left - targetLeft, dy = targetTop - top;
    const spawnSpeed = Math.sqrt(dx * dx + dy * dy) / 25;
    updatedState = updatePlayer(updatedState, playerIndex, {
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

    const sfx = {...updatedState.sfx, 'sfx/needledropflip.mp3': true};
    return {...updatedState, sfx};
};

const damageHero = (updatedState, playerIndex) => {
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
        dead: true,
        usingSpecial: false,
        done,
        invulnerableFor: 2000,
        spawning: true,
        chasingNeedle: true,
        // powerupIndex: 0,
        // powerupPoints: 0,
        comboScore: 0,
        powerups,
        ladybugs,
    }, {
        ...heroesData[player.heroes[0]].animation.frames[0],
        left, top, targetLeft, targetTop, spawnSpeed,
        vx: 0, vy: 0,
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
    if (!isHeroSwapping(player) && player.usingFinisher) {
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
    if (isKeyDown(KEY_SHIFT)) {
        const hitBox = getHeroHitBox(player);
        context.save();
        context.globalAlpha = .6;
        context.fillStyle = 'green';
        context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
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
    getHeroHitBox,
    damageHero,
    renderHero,
    heroesData,
    updatePlayer,
    updatePlayerOnContinue,
    isPlayerInvulnerable,
    ladybugAnimation,
    useMeleeAttack,
};

const { getGroundHeight, getHazardHeight, getHazardCeilingHeight } = require('world');

const { createAttack, addPlayerAttackToState } = require('attacks');
const {
    createEffect,
    getEffectIndex,
    addEffectToState,
    getEffectHitBox,
    updateEffect,
    EFFECT_FINISHER, EFFECT_FINISHER_BALL,
} = require('effects');
const { EFFECT_FAST_LIGHTNING, checkToAddLightning} = require('effects/lightning');
const { updateEnemy } = require('enemies');

require('heroes/bee');
require('heroes/dragonfly');
require('heroes/moth');

