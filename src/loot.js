const { drawImage, drawTintedImage } = require('draw');

const Rectangle = require('Rectangle');

const {
    FRAME_LENGTH, WIDTH, GAME_HEIGHT, OFFSCREEN_PADDING,
    POINTS_FOR_POWERUP,
    LOOT_COIN, LOOT_LIFE, LOOT_LADYBUG,
    LOOT_SPEED, LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_SPEED, LOOT_TRIPLE_POWER, LOOT_TRIPLE_RATE,
    LOOT_COMBO, LOOT_TRIPLE_COMBO,
    EFFECT_RATE_UP, EFFECT_SIZE_UP, EFFECT_SPEED_UP,
    HERO_DRAGONFLY,
    ENEMY_CARGO_BEETLE,
} = require('gameConstants');

const {
    getFrame,
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

const { getNewSpriteState } = require('sprites');

const circleAcceleration = (state, loot) => {
    let {vx, vy, seed} = loot;
    const theta = loot.animationTime / 300;
    const radius = loot.radius || 2;
    vx = radius * Math.cos(theta);
    vy = radius * Math.sin(theta);
    return {...loot, vx, vy};
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
    scale: 1,
    props: {
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
    scale: 1,
    props: {
    },
});

const getNewLadyBug = (playerSprite) => {
    return getNewSpriteState({
        ...ladybugAnimation.frames[0],
        left: playerSprite.left + playerSprite.width / 2 - ladybugAnimation.frames[0].width / 2,
        top: playerSprite.top + playerSprite.height / 2 - ladybugAnimation.frames[0].height / 2,
    });
};

const lootData = {
    [LOOT_COIN]: {
        animation: coinAnimation,
        collect(state, playerIndex, loot) {
            let comboScore = Math.min(1000, state.players[playerIndex].comboScore + 20);
            state = updatePlayer(state, playerIndex, { comboScore });
            return gainPoints(state, playerIndex, 50);
        },
        sfx: 'sfx/coin.mp3',
        scale: 2,
    },
    [LOOT_LIFE]: {
        animation: beePortraitAnimation, // This is just used for sizing purposes.
        accelerate: circleAcceleration,
        collect(state, playerIndex, loot) {
            const heroes = [...state.players[playerIndex].heroes];
            const missingHeroes = [...state.players[playerIndex].missingHeroes];
            if (missingHeroes.length) {
                heroes.push(missingHeroes.shift());
            } else {
                // extra life life loots become coins if the players have max lives.
                return gainPoints(state, playerIndex, 500);
            }
            return updatePlayer(state, playerIndex, {heroes, missingHeroes});
        },
        draw(context, state, loot) {
            // extra life life loots become coins if the players have max lives.
            let animation = coinAnimation;
            if (state.players[0].missingHeroes.length) {
                animation = heroesData[state.players[0].missingHeroes[0]].portraitAnimation;
            }
            const frame = getFrame(animation, loot.animationTime);
            drawTintedImage(context, frame.image, 'white', .5 + .5 * Math.cos(loot.animationTime / 50), frame, loot);
        },
        sfx: 'sfx/heal.mp3',
        scale: 1,
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
        scale: 1,
    },
    [LOOT_ATTACK_POWER]: powerupLoot(LOOT_ATTACK_POWER, powerupSquareAnimation, EFFECT_SIZE_UP),
    [LOOT_ATTACK_SPEED]: powerupLoot(LOOT_ATTACK_SPEED, powerupDiamondAnimation, EFFECT_RATE_UP),
    [LOOT_SPEED]: powerupLoot(LOOT_SPEED, powerupTriangleAnimation, EFFECT_SPEED_UP),
    [LOOT_TRIPLE_SPEED]: triplePowerupLoot(LOOT_TRIPLE_SPEED, powerupTripleTriangleAnimation, EFFECT_SPEED_UP),
    [LOOT_TRIPLE_POWER]: triplePowerupLoot(LOOT_TRIPLE_POWER, powerupTripleSquareAnimation, EFFECT_SIZE_UP),
    [LOOT_TRIPLE_RATE]: triplePowerupLoot(LOOT_TRIPLE_RATE, powerupTripleDiamondAnimation, EFFECT_RATE_UP),
    [LOOT_COMBO]: triplePowerupLoot(LOOT_COMBO, powerupComboAnimation),
    [LOOT_TRIPLE_COMBO]: triplePowerupLoot(LOOT_TRIPLE_COMBO, powerupTripleComboAnimation),
};

const createLoot = (type) => {
    const frame = lootData[type].animation.frames[0];
    return {
        ...new Rectangle(frame).scale(lootData[type].scale || 1),
        type,
    };
};

const renderLoot = (context, loot) => {
    if (lootData[loot.type].draw) lootData[loot.type].draw(context, state, loot);
    else drawNormal(context, state, loot);
    if (loot.sfx) {
        playSound(loot.sfx);
        loot.sfx = false;
    }
};

const advanceLoot = (state, loot) => {
    let { left, top, width, height, vx, vy, delay, duration, animationTime, type } = loot;
    let data = lootData[type];
    const animation = data.animation;
    left += vx - state.world.vx;
    top += vy + state.world.vy;
    animationTime += FRAME_LENGTH;
    if (data.accelerate) {
        loot = data.accelerate(state, loot);
    }

    const done = left + width < 0;;

    return {...loot, left, top, animationTime, done};
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
    // return Math.random() < .5 ? LOOT_COMBO : LOOT_TRIPLE_COMBO;
    if (state.players[0].heroes.length < 2 && Math.random() < .25) return LOOT_LIFE;
    if (state.players[0].heroes.length < 3 && Math.random() < .25) return LOOT_LIFE;
    if (state.players[0].powerups.length < 2) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 1) return LOOT_LADYBUG;
    if (state.players[0].powerups.length < 4) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 2) return LOOT_LADYBUG;
    if (state.players[0].powerups.length < 5) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 3) return LOOT_LADYBUG;
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
    state = lootData[loot.type].collect(state, playerIndex, loot);
    state = {...state, loot: [...state.loot]};
    state.loot[lootIndex] = {...loot, done: true};
    return {...state, sfx: [...state.sfx, lootData[loot.type].sfx]};
};

module.exports = {
    lootData,
    createLoot,
    advanceLoot,
    renderLoot,
    gainPoints,
    getRandomPowerupType,
    getAdaptivePowerupType,
    getComboMultiplier,
    collectLoot,
    powerupGoals,
};

// Move possible circular imports to after exports.
const { addEnemyToState, createEnemy } = require('enemies');

const { heroesData, updatePlayer } = require('heroes');

const { createEffect, addEffectToState } = require('effects');
