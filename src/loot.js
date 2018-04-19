const { drawImage, drawTintedImage } = require('draw');

const Rectangle = require('Rectangle');

const {
    FRAME_LENGTH, WIDTH, GAME_HEIGHT, OFFSCREEN_PADDING,
    POINTS_FOR_POWERUP,
    LOOT_COIN, LOOT_LIFE, LOOT_LADYBUG,
    LOOT_SPEED, LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED,
} = require('gameConstants');

const {
    getFrame,
    coinAnimation,
    powerupDiamondAnimation,
    powerupTriangleAnimation,
    powerupSquareAnimation,
    powerupLadybugAnimation,
    ladybugAnimation,
    lifeAnimation,
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

const drawGlowing = (context, loot) => {
    const frame = getFrame(lootData[loot.type].animation, loot.animationTime);
    drawTintedImage(context, frame.image, 'white', .5 + .5 * Math.cos(loot.animationTime / 50), frame, loot);
};

const updatePlayer = (state, playerIndex, props) => {
    const players = [...state.players];
    players[playerIndex] = {...players[playerIndex], ...props};
    return {...state, players};
};

const powerupLoot = (type, animation) => ({
    animation,
    // accelerate: circleAcceleration,
    collect(state, playerIndex, loot) {
        let powerups = [...state.players[playerIndex].powerups, type];
        if (powerups.length > 5) powerups.shift();
        return updatePlayer(state, playerIndex, {powerups});
    },
    // draw: drawGlowing,
    sfx: 'sfx/powerup.mp3',
    scale: 1,
    props: {
        radius: 1,
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
            return gainPoints(state, playerIndex, 50);
        },
        sfx: 'sfx/coin.mp3',
        scale: 2,
    },
    [LOOT_LIFE]: {
        animation: lifeAnimation,
        accelerate: circleAcceleration,
        collect(state, playerIndex, loot) {
            return updatePlayer(state, playerIndex, {lives: state.players[playerIndex].lives + 1});
        },
        draw: drawGlowing,
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
    [LOOT_ATTACK_POWER]: powerupLoot(LOOT_ATTACK_POWER, powerupSquareAnimation),
    [LOOT_ATTACK_SPEED]: powerupLoot(LOOT_ATTACK_SPEED, powerupDiamondAnimation),
    [LOOT_SPEED]: powerupLoot(LOOT_SPEED, powerupTriangleAnimation),
};

const createLoot = (type) => {
    const frame = lootData[type].animation.frames[0];
    return {
        ...new Rectangle(frame).scale(lootData[type].scale || 1),
        type,
    };
};

const renderLoot = (context, loot) => {
    if (lootData[loot.type].draw) {
        lootData[loot.type].draw(context, loot);
    } else {
        const frame = getFrame(lootData[loot.type].animation, loot.animationTime);
        drawImage(context, frame.image, frame, loot);
    }
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

    const done =
        left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING ||
        top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;

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
    if (state.players[0].powerups.length < 1) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 1) return LOOT_LADYBUG;
    if (state.players[0].powerups.length < 4) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 2) return LOOT_LADYBUG;
    if (state.players[0].powerups.length < 5) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 3) return LOOT_LADYBUG;
    return getRandomPowerupType();
};

const gainPoints = (state, playerIndex, points) => {
    let score = state.players[playerIndex].score + points;
    state = updatePlayer(state, playerIndex, {score});
    if (Math.floor(score / POINTS_FOR_POWERUP) > Math.floor((score - points) / POINTS_FOR_POWERUP)) {
        const loot = createLoot(getAdaptivePowerupType(state));
        state.newLoot.push(getNewSpriteState({
            ...loot,
            left: WIDTH + 30,
            top: GAME_HEIGHT / 2,
        }));
    }
    return state;
};


module.exports = {
    lootData,
    createLoot,
    advanceLoot,
    renderLoot,
    gainPoints,
    getRandomPowerupType,
    getAdaptivePowerupType,
};
