const { drawImage, drawTintedImage } = require('draw');

const random = require('random');
const Rectangle = require('Rectangle');

const {
    TEST_ITEMS,
    FRAME_LENGTH, WIDTH, GAME_HEIGHT, OFFSCREEN_PADDING,
    POINTS_FOR_POWERUP, MAX_ENERGY,
    HERO_BEE, HERO_DRAGONFLY, HERO_MOTH,
    LOOT_COIN, LOOT_LIFE, LOOT_LADYBUG,
    LOOT_SPEED, LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_SPEED, LOOT_TRIPLE_POWER, LOOT_TRIPLE_RATE,
    LOOT_COMBO, LOOT_TRIPLE_COMBO,
    LOOT_PORTAL,
    LOOT_HELMET,
    EFFECT_RATE_UP, EFFECT_SIZE_UP, EFFECT_SPEED_UP,
    ENEMY_CARGO_BEETLE,
} = require('gameConstants');

const {
    getFrame,
    createAnimation,
    r,
    coinAnimation,
    powerupDiamondAnimation,
    powerupTriangleAnimation,
    powerupSquareAnimation,
    powerupTripleDiamondAnimation,
    powerupTripleSquareAnimation,
    powerupTripleTriangleAnimation,
    powerupComboAnimation,
    powerupTripleComboAnimation,
    powerupLadybugAnimation,
    ladybugAnimation,
    beePortraitAnimation,
} = require('animations');

const {
    playSound
} = require('sounds');

const { getNewSpriteState, getTargetVector } = require('sprites');

const helmetAnimation = createAnimation('gfx/items/helmet.png', r(17, 18));

const circleAcceleration = (state, lootIndex) => {
    let {vx, vy, seed, animationTime, radius} = state.loot[lootIndex];
    const theta = animationTime / 300;
    radius = radius || 2;
    vx = radius * Math.cos(theta);
    vy = radius * Math.sin(theta);
    return updateLoot(state, lootIndex, {vx, vy});
};

const drawNormal = (context, state, loot) => {
    const frame = getFrame(lootData[loot.type].animation, loot.animationTime);
    drawImage(context, frame.image, frame, loot);
}
const drawGlowing = (context, state, loot) => {
    const frame = getFrame(lootData[loot.type].animation, loot.animationTime);
    drawTintedImage(context, frame.image, 'white', .5 + .5 * Math.cos(loot.animationTime / 50), frame, loot);
};
const getCombinedType = (powerups) => {
    if (powerups.length < 3) return null;
    const typeA = powerups[powerups.length - 1],
        typeB = powerups[powerups.length - 2],
        typeC = powerups[powerups.length - 3];
    if (typeA === LOOT_ATTACK_POWER && typeB === LOOT_ATTACK_POWER && typeC === LOOT_ATTACK_POWER) {
        return LOOT_TRIPLE_POWER;
    }
    if (typeA === LOOT_ATTACK_SPEED && typeB === LOOT_ATTACK_SPEED && typeC === LOOT_ATTACK_SPEED) {
        return LOOT_TRIPLE_RATE;
    }
    if (typeA === LOOT_SPEED && typeB === LOOT_SPEED && typeC === LOOT_SPEED) {
        return LOOT_TRIPLE_SPEED;
    }
    if (typeA === LOOT_COMBO && typeB === LOOT_COMBO && typeC === LOOT_COMBO) {
        return LOOT_TRIPLE_COMBO;
    }
    const comboArray = [typeA, typeB, typeC];
    if (comboArray.includes(LOOT_ATTACK_SPEED) && comboArray.includes(LOOT_ATTACK_POWER) && comboArray.includes(LOOT_SPEED)) {
        return LOOT_COMBO;
    }
    if (comboArray.includes(LOOT_TRIPLE_RATE) && comboArray.includes(LOOT_TRIPLE_POWER) && comboArray.includes(LOOT_TRIPLE_SPEED)) {
        return LOOT_TRIPLE_COMBO;
    }
    return null;
};

const powerupLoot = (type, animation, effectType) => ({
    animation,
    // accelerate: circleAcceleration,
    collect(state, playerIndex, loot) {
        let powerups = [...state.players[playerIndex].powerups, type];
        if (powerups.length > 5) powerups.shift();
        let comboType = getCombinedType(powerups);
        if (comboType) {
            powerups.pop();
            powerups.pop();
            powerups.pop();
            powerups.push(comboType);
            // The combo can combine again for the triple combo powerup.
            comboType = getCombinedType(powerups);
            if (comboType) {
                powerups.pop();
                powerups.pop();
                powerups.pop();
                powerups.push(comboType);
            }
        }
        if (effectType) {
            const powerupText = createEffect(effectType);
            powerupText.left = loot.left + (loot.width - powerupText.width ) / 2;
            powerupText.top = loot.top + (loot.height - powerupText.height ) / 2;
            state = addEffectToState(state, powerupText);
        }
        return updatePlayer(state, playerIndex, {powerups});
    },
    draw(context, state, loot) {
        if (getCombinedType([...state.players[0].powerups, type])) {
            drawGlowing(context, state, loot);
        } else {
            drawNormal(context, state, loot);
        }
    },
    // draw: drawGlowing,
    sfx: 'sfx/powerup.mp3',
    props: {
        scale: 1,
    },
});

const triplePowerupLoot = (type, animation) => ({
    animation,
    // accelerate: circleAcceleration,
    collect(state, playerIndex, loot) {
        let powerups = [...state.players[playerIndex].powerups, type];
        if (powerups.length > 5) powerups.shift();
        return updatePlayer(state, playerIndex, {powerups});
    },
    sfx: 'sfx/powerup.mp3',
    props: {
        scale: 1,
    },
});

const getNewLadyBug = (playerSprite) => {
    return getNewSpriteState({
        ...ladybugAnimation.frames[0],
        left: playerSprite.left + playerSprite.width / 2 - ladybugAnimation.frames[0].width / 2,
        top: playerSprite.top + playerSprite.height / 2 - ladybugAnimation.frames[0].height / 2,
    });
};

const portalAnimation = createAnimation('gfx/scene/portal/portal.png', r(50, 80), {rows: 6, duration: 8}, {loopFrame: 3});

const lootData = {
    [LOOT_COIN]: {
        animation: coinAnimation,
        accelerate: (state, lootIndex) => {
            if (!state.players[0].relics[LOOT_HELMET]) {
                return state;
            }
            const {dx, dy} = getTargetVector(state.loot[lootIndex], state.players[0].sprite);
            const mag = Math.sqrt(dx*dx+dy*dy);
            if (mag > 200) return state;
            return updateLoot(state, lootIndex, {vx: 20 * dx / mag, vy: 20 * dy / mag});
        },
        collect(state, playerIndex, loot) {
            let comboScore = Math.min(1000, state.players[playerIndex].comboScore + loot.comboPoints);
            state = updatePlayer(state, playerIndex, { comboScore });
            return gainPoints(state, playerIndex, loot.points);
        },
        sfx: 'sfx/coin.mp3',
        props: {
            scale: 2,
            comboPoints: 20,
            points: 50,
        },
    },
    [LOOT_LIFE]: {
        animation: createAnimation('gfx/items/goldenheart.png', r(17, 18)),
        accelerate: circleAcceleration,
        collect(state, playerIndex, loot) {
            const player = state.players[playerIndex];
            // Set all heroes to max energy. This revives them if they were defeated.
            return updatePlayer(state, playerIndex, {
                [HERO_BEE]: {...player[HERO_BEE], energy: MAX_ENERGY},
                [HERO_DRAGONFLY]: {...player[HERO_DRAGONFLY], energy: MAX_ENERGY},
                [HERO_MOTH]: {...player[HERO_MOTH], energy: MAX_ENERGY},
            });
        },
        draw: drawGlowing,
        sfx: 'sfx/heal.mp3',
        props: {
            scale: 1,
        },
    },
    [LOOT_LADYBUG]: {
        animation: powerupLadybugAnimation,
        accelerate: circleAcceleration,
        collect(state, playerIndex, loot) {
            const ladybugs = [
                ...state.players[playerIndex].ladybugs,
                getNewLadyBug(state.players[playerIndex].sprite),
            ];
            if (ladybugs.length > 3) ladybugs.shift();
            return updatePlayer(state, playerIndex, {ladybugs});
        },
        draw: drawGlowing,
        sfx: 'sfx/powerup.mp3',
        props: {
            scale: 1,
        },
    },
    [LOOT_HELMET]: {
        animation: helmetAnimation,
        accelerate: circleAcceleration,
        collect(state, playerIndex, loot) {
            const props = {
                relics: {...state.players[playerIndex].relics, [loot.type]: true},
            };
            return updatePlayer(state, playerIndex, props);
        },
        draw: drawGlowing,
        sfx: 'sfx/powerup.mp3',
        props: {
            scale: 2,
        },
    },
    [LOOT_ATTACK_POWER]: powerupLoot(LOOT_ATTACK_POWER, powerupSquareAnimation, EFFECT_SIZE_UP),
    [LOOT_ATTACK_SPEED]: powerupLoot(LOOT_ATTACK_SPEED, powerupDiamondAnimation, EFFECT_RATE_UP),
    [LOOT_SPEED]: powerupLoot(LOOT_SPEED, powerupTriangleAnimation, EFFECT_SPEED_UP),
    [LOOT_TRIPLE_SPEED]: triplePowerupLoot(LOOT_TRIPLE_SPEED, powerupTripleTriangleAnimation, EFFECT_SPEED_UP),
    [LOOT_TRIPLE_POWER]: triplePowerupLoot(LOOT_TRIPLE_POWER, powerupTripleSquareAnimation, EFFECT_SIZE_UP),
    [LOOT_TRIPLE_RATE]: triplePowerupLoot(LOOT_TRIPLE_RATE, powerupTripleDiamondAnimation, EFFECT_RATE_UP),
    [LOOT_COMBO]: triplePowerupLoot(LOOT_COMBO, powerupComboAnimation),
    [LOOT_TRIPLE_COMBO]: triplePowerupLoot(LOOT_TRIPLE_COMBO, powerupTripleComboAnimation),
    [LOOT_PORTAL]: {
        animation: portalAnimation,
        accelerate: (state, lootIndex) => {
            // play the portal sfx periodically while it is on the screen.
            if (state.loot[lootIndex].animationTime % 2000 === 0) {
                return {...state, sfx: [...state.sfx, 'sfx/portal.mp3+0+5']};
            }
            return state;
        },
        collect(state, playerIndex, loot) {
            return enterStarWorld(state);
        },
        spawnSfx: 'sfx/portal.mp3',
        sfx: 'sfx/portaltravel.mp3',
        props: {
            scale: 1,
        },
    },
};
const createLoot = (type, props) => {
    const lootInfo = lootData[type];
    const frame = lootInfo.animation.frames[0];
    return getNewSpriteState({
        ...new Rectangle(frame).scale((props && props.scale) || (lootInfo.props && lootInfo.props.scale) || 1),
        type,
        ...lootInfo.props,
        ...props,
    });
};

const addLootToState = (state, loot) => {
    if (lootData[loot.type].spawnSfx) {
        return {...state, newLoot: [...state.newLoot, loot], sfx: [...state.sfx, lootData[loot.type].spawnSfx]};
    }
    return {...state, newLoot: [...state.newLoot, loot]};
};

const renderLoot = (context, loot) => {
    if (lootData[loot.type].draw) lootData[loot.type].draw(context, state, loot);
    else drawNormal(context, state, loot);
    if (loot.sfx) {
        playSound(loot.sfx);
        loot.sfx = false;
    }
};

const updateLoot = (state, lootIndex, props) => {
    const loot = [...state.loot];
    loot[lootIndex] = {...loot[lootIndex], ...props};
    return {...state, loot};
};

const advanceLoot = (state, lootIndex) => {
    let { left, top, width, height, vx, vy, delay, duration, animationTime, type } = state.loot[lootIndex];
    let data = lootData[type];
    left += vx - state.world.vx;
    top += vy + state.world.vy;
    animationTime += FRAME_LENGTH;
    const done = left + width < 0;
    state = updateLoot(state, lootIndex, {left, top, animationTime, done});
    if (data.accelerate) {
        state = data.accelerate(state, lootIndex);
    }
    return state;
};

const advanceAllLoot = (state) => {
    for (let i = 0; i < state.loot.length; i++) {
        state = advanceLoot(state, i);
        const loot = state.loot[i];
        if (loot.done) continue;
        for (let j = 0; j < state.players.length; j++) {
            if (state.players[j].done || state.players[j].spawning) continue;
            if (Rectangle.collision(loot, getHeroHitBox(state.players[j]))) {
                state = collectLoot(state, j, i);
            }
        }
    }
    state.loot = state.loot.filter(loot => !loot.done);
    return state;
};

const getRandomPowerupType = () => {
    if (Math.random() < 1 / 3) return LOOT_ATTACK_POWER;
    if (Math.random() < 1 / 2) return LOOT_SPEED;
    return LOOT_ATTACK_SPEED;
};

/*
1: If they are missing a character, it always drops an extra character. Otherwise...
2: If they have no(or maybe only 1) powerups, drop a random of the 3 main powerups. Otherwise...
3: If they have 0 ladybugs, it drops a ladybug. Otherwise...
4: If they don't have a full powerup bar, it drops a random of the main 3 powerups. Otherwise...
5: If they only have 1 ladybug, it drops a ladybug. Otherwise...
6: Drops a random of the main 3 powerups.*/
const getAdaptivePowerupType = (state) => {
    if (TEST_ITEMS) return random.element(TEST_ITEMS);
    //if (!state.players[0].relics[LOOT_HELMET]) return LOOT_HELMET;
    if (getComboMultiplier(state, 0) === 5) return LOOT_PORTAL;
    // return Math.random() < .5 ? LOOT_COMBO : LOOT_TRIPLE_COMBO;
    if (state.players[0].powerups.length < 1) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 1) return LOOT_LADYBUG;
    if (state.players[0].powerups.length < 3) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 2) return LOOT_LADYBUG;
    if (state.players[0].powerups.length < 5) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 3) return LOOT_LADYBUG;
    if (Math.random() < 1 / 10) return LOOT_LIFE;
    return getRandomPowerupType();
};

const getComboMultiplier = (state, playerIndex) => {
    const comboScore = state.players[playerIndex].comboScore;
    if (comboScore >= 1000) return 5;
    if (comboScore >= 600) return 4;
    if (comboScore >= 400) return 3;
    if (comboScore >= 200) return 2;
    if (comboScore >= 100) return 1.5;
    return 1;
};

const powerupGoals = [500, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 10000];

const gainPoints = (state, playerIndex, points) => {
    points *= getComboMultiplier(state, playerIndex);
    let score = state.players[playerIndex].score + points;
    let powerupPoints = state.players[playerIndex].powerupPoints + points;
    let powerupIndex = state.players[playerIndex].powerupIndex;
    if (powerupPoints >= powerupGoals[powerupIndex]) {
        powerupPoints -= powerupGoals[powerupIndex];
        powerupIndex = Math.min(powerupIndex + 1, powerupGoals.length - 1);
        const cargoBeetle = createEnemy(ENEMY_CARGO_BEETLE, {
            left: WIDTH + 10,
            top: GAME_HEIGHT / 6 + Math.floor(Math.random() * 2 * GAME_HEIGHT / 3),
        });
        cargoBeetle.top -= cargoBeetle.height / 2;
        state = addEnemyToState(state, cargoBeetle);
    }
    state = updatePlayer(state, playerIndex, {score, powerupPoints, powerupIndex});
    return state;
};

const collectLoot = (state, playerIndex, lootIndex) => {
    const loot = state.loot[lootIndex];
    const lootInfo = lootData[loot.type];
    state = lootInfo.collect(state, playerIndex, loot);
    state = {...state, loot: [...state.loot]};
    state.loot[lootIndex] = {...loot, done: true};
    if (lootInfo.sfx) {
        state = {...state, sfx: [...state.sfx, lootData[loot.type].sfx]};
    }
    return state;
};

module.exports = {
    lootData,
    createLoot,
    addLootToState,
    advanceAllLoot,
    renderLoot,
    gainPoints,
    getRandomPowerupType,
    getAdaptivePowerupType,
    getComboMultiplier,
    collectLoot,
    powerupGoals,
    helmetAnimation,
};

// Move possible circular imports to after exports.
const { addEnemyToState, createEnemy } = require('enemies');

const { heroesData, updatePlayer, getHeroHitBox } = require('heroes');

const { createEffect, addEffectToState } = require('effects');

const { enterStarWorld } = require('areas/stars');
