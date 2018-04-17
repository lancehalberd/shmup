const { drawImage, drawTintedImage } = require('draw');

const Rectangle = require('Rectangle');

const {
    FRAME_LENGTH, WIDTH, GAME_HEIGHT, OFFSCREEN_PADDING,
    LOOT_COIN, LOOT_LIFE,
} = require('gameConstants');

const {
    getFrame,
    coinAnimation,
    lifeAnimation,
} = require('animations');

const {
    playSound
} = require('sounds');

const lootData = {
    [LOOT_COIN]: {
        animation: coinAnimation,
        collect(player, loot) {
            return {...player, score: player.score + 50 };
        },
        sfx: 'sfx/coin.mp3',
        scale: 2,
    },
    [LOOT_LIFE]: {
        animation: lifeAnimation,
        accelerate: (state, loot) => {
            let {vx, vy, seed} = loot;
            const theta = loot.animationTime / 300;
            const radius = 2;
            vx = radius * Math.cos(theta);
            vy = radius * Math.sin(theta);
            return {...loot, vx, vy};
        },
        collect(player, loot) {
            return {...player, lives: player.lives + 1};
        },
        draw(context, loot) {
            const frame = getFrame(lootData[loot.type].animation, loot.animationTime);
            drawTintedImage(context, frame.image, 'white', .5 + .5 * Math.cos(loot.animationTime / 50), frame, loot);
        },
        sfx: 'sfx/heal.mp3',
        scale: 1,
    },
}

const createLoot = (type) => {
    const frame = lootData[type].animation.frames[0];
    return {
        ...new Rectangle(frame).scale(lootData[type].scale || 1),
        type,
    };
}

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


module.exports = {
    lootData,
    createLoot,
    advanceLoot,
    renderLoot,
};
