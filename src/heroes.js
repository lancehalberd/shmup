const {
    WIDTH,
    GAME_HEIGHT,
    FRAME_LENGTH,
    DEATH_COOLDOWN,
    SHOT_COOLDOWN,
    SPAWN_COOLDOWN,
    SPAWN_INV_TIME,
    ACCELERATION,
    MAX_SPEED,
    EFFECT_EXPLOSION,
} = require('gameConstants');

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const Rectangle = require('Rectangle');

const {
    drawImage,
} = require('draw');

const { getNewSpriteState } = require('sprites');

const { createEffect } = require('effects');

const {
    heroAnimation,
    getHitBox,
    getFrame,
} = require('animations');

const advanceHero = (state, player) => {
    let {shotCooldown, spawnCooldown, invulnerableFor} = player;
    // Might be nicer to have this closer to the code that generates the shot somehow...
    if (shotCooldown > 0) {
        shotCooldown--;
    } else if (player.actions.shoot) {
        shotCooldown = SHOT_COOLDOWN;
    }
    let {top, left, vx, vy, width, height, animationTime} = player.sprite;
    animationTime += FRAME_LENGTH;
    if (invulnerableFor > 0) {
        invulnerableFor -= FRAME_LENGTH;
    }
    if (spawnCooldown > 0) {
        spawnCooldown -= FRAME_LENGTH;
        left += 4;
        return {...player, spawnCooldown, invulnerableFor, shotCooldown: 1, sprite: {...player.sprite, left, animationTime}};
    }
    // Accelerate player based on their input.
    if (player.actions.up) vy -= ACCELERATION;
    if (player.actions.down) vy += ACCELERATION;
    if (player.actions.left) vx -= ACCELERATION;
    if (player.actions.right) vx += ACCELERATION;
    vy *= .9;
    vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vy));
    vx *= .9;
    vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vx));

    // Update player position based on their
    left += vx;
    top += vy;
    const hitBox = getHeroHitBox({animationTime, left: 0, top: 0});
    if (top + hitBox.top < 0) {
        top = -hitBox.top;
        vy = 0;
    }
    if (top + hitBox.top + hitBox.height > GAME_HEIGHT) {
        top = GAME_HEIGHT - (hitBox.top + hitBox.height);
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

    return {...player, shotCooldown, spawnCooldown, invulnerableFor, sprite: {...player.sprite, left, top, vx, vy, animationTime}};
};

const damageHero = (updatedState, playerIndex) => {
    let deathCooldown = updatedState.deathCooldown
    const players = [...updatedState.players];
    const player = players[playerIndex];
    const sprite = player.sprite;
    players[playerIndex] = {
        ...player,
        sprite: {...sprite, left: -150, top: 100},
        lives: Math.max(0, player.lives - 1),
        done: player.lives <= 0,
        spawnCooldown: SPAWN_COOLDOWN,
        invulnerableFor: SPAWN_INV_TIME,
    };
    const explosion = createEffect(EFFECT_EXPLOSION);
    const newEffects = [
        ...updatedState.newEffects,
        getNewSpriteState({
            ...explosion,
            left: sprite.left + (sprite.width - explosion.width ) / 2,
            top: sprite.top + (sprite.height - explosion.height ) / 2,
        })
    ];
    const sfx = [...updatedState.sfx];
    if (players[playerIndex].done) {
        deathCooldown = DEATH_COOLDOWN;
        sfx.push('sfx/death.mp3');
    } else {
        sfx.push('sfx/exclamation.mp3');
    }
    return {...updatedState, deathCooldown, players, sfx, newEffects};
};

const getHeroHitBox = ({animationTime, left, top}) => {
    return new Rectangle(getHitBox(heroAnimation, animationTime)).translate(left, top);
};

const renderHero = (context, {sprite, invulnerableFor, done}) => {
    if (done) return;
    const animation = heroAnimation;
    context.save();
    if (invulnerableFor > 1000) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 40) * .2;
    } else if (invulnerableFor > 400) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 20) * .2;
    } else if (invulnerableFor > 0) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 10) * .2;
    }
    const frame = getFrame(animation, sprite.animationTime);
    drawImage(context, frame.image, frame, sprite);
    context.restore();
    if (isKeyDown(KEY_SHIFT)) {
        const hitBox = getHeroHitBox(sprite);
        context.save();
        context.globalAlpha = .6;
        context.fillStyle = 'green';
        context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
        context.restore();
    }
};

module.exports = {
    advanceHero,
    getHeroHitBox,
    damageHero,
    renderHero,
}