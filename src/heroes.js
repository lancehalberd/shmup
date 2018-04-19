const {
    WIDTH,
    GAME_HEIGHT,
    FRAME_LENGTH,
    DEATH_COOLDOWN,
    SHOT_COOLDOWN, ATTACK_OFFSET,
    SPAWN_COOLDOWN,
    SPAWN_INV_TIME,
    ACCELERATION,
    MAX_SPEED,
    EFFECT_EXPLOSION,
    LOOT_SPEED, LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED
} = require('gameConstants');

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const Rectangle = require('Rectangle');

const {
    drawImage,
} = require('draw');

const { getNewSpriteState } = require('sprites');

const { getGroundHeight } = require('world');

const { createEffect, addEffectToState } = require('effects');

const {
    heroAnimation,
    heroRectangle,
    ladybugAnimation,
    ladybugAttackAnimation,
    blastRectangle,
    getHitBox,
    getFrame,
} = require('animations');


const getNewPlayerState = () => ({
    score: 0,
    lives: 3,
    sprite: getNewSpriteState({...heroRectangle, left: -100, top: 100}),
    spawnCooldown: SPAWN_COOLDOWN,
    invulnerableFor: SPAWN_INV_TIME,
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

const addNewPlayerAttack = (state, playerIndex, attack) => {
    const newPlayerAttacks = [...state.newPlayerAttacks];
    newPlayerAttacks.push(attack);
    return {...state, newPlayerAttacks};
};

const updatePlayer = (state, playerIndex, props) => {
    const players = [...state.players];
    players[playerIndex] = {...players[playerIndex], ...props};
    return {...state, players};
};

const advanceHero = (state, playerIndex) => {
    let player = state.players[playerIndex];
    let {shotCooldown, spawnCooldown, invulnerableFor, ladybugShotCooldown} = player;
    if (shotCooldown > 0) {
        shotCooldown--;
    } else if (player.actions.shoot) {
        shotCooldown = SHOT_COOLDOWN - player.powerups.filter(powerup => powerup === LOOT_ATTACK_SPEED).length;
        const attackPowerups = player.powerups.filter(powerup => powerup === LOOT_ATTACK_POWER).length;
        const scale = 1 + attackPowerups;
        state = addNewPlayerAttack(state, playerIndex, getNewSpriteState({
            ...blastRectangle,
            width: blastRectangle.width * scale,
            height: blastRectangle.height * scale,
            left: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET,
            top: player.sprite.top + player.sprite.vy + Math.round((player.sprite.height - blastRectangle.height * scale) / 2),
            vx: 20,
            delay: 2,
            playerIndex,
            sfx: 'sfx/shoot.mp3',
            damage: 1 + Math.floor(attackPowerups / 2),
            scale,
        }));
        player = state.players[playerIndex];
    }

    if (ladybugShotCooldown > 0) {
        ladybugShotCooldown--;
    } else if (player.actions.shoot && player.ladybugs.length) {
        ladybugShotCooldown = SHOT_COOLDOWN * 1.5;
        for (let i = 0; i < player.ladybugs.length; i++) {
            const ladybug = player.ladybugs[i];
            state = addNewPlayerAttack(state, playerIndex, getNewSpriteState({
                ...ladybugAttackAnimation.frames[0],
                left: ladybug.left + player.sprite.vx + ladybug.width + ATTACK_OFFSET,
                top: ladybug.top + player.sprite.vy + Math.round((ladybug.height - ladybugAttackAnimation.frames[0].height) / 2),
                vx: 15,
                playerIndex,
                damage: 1,
                type: 'ladybug'
            }));
            player = state.players[playerIndex];
        }
    }

    let {top, left, vx, vy, width, height, animationTime} = player.sprite;
    animationTime += FRAME_LENGTH;
    if (invulnerableFor > 0) {
        invulnerableFor -= FRAME_LENGTH;
    }
    if (spawnCooldown > 0) {
        spawnCooldown -= FRAME_LENGTH;
        left += 4;
        const ladybugs = updateLadyBugs(player);
        return updatePlayer(state, playerIndex, {
            spawnCooldown, ladybugShotCooldown, invulnerableFor, shotCooldown: 1,
            ladybugs,
            sprite: {...player.sprite, left, animationTime},
        });
    }
    const speedPowerups = player.powerups.filter(powerup => powerup === LOOT_SPEED).length;
    const maxSpeed = MAX_SPEED + speedPowerups * 3;
    const accleration = ACCELERATION + speedPowerups / 3;
    // Accelerate player based on their input.
    if (player.actions.up) vy -= accleration;
    if (player.actions.down) vy += accleration;
    if (player.actions.left) vx -= accleration;
    if (player.actions.right) vx += accleration;
    vy *= (.9 - speedPowerups * .01);
    vy = Math.max(-maxSpeed, Math.min(maxSpeed, vy));
    vx *= (.9 - speedPowerups * .01);
    vx = Math.max(-maxSpeed, Math.min(maxSpeed, vx));

    // Update player position based on their
    const animation = heroAnimation;
    const frame = getFrame(animation, animationTime);
    left += vx;
    top = Math.min(top + vy, getGroundHeight(state) - frame.height);
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
    const sprite = {...player.sprite, left, top, vx, vy, animationTime};
    const ladybugs = updateLadyBugs(player);
    const updatedProps = {shotCooldown, ladybugShotCooldown, spawnCooldown, invulnerableFor, sprite, ladybugs};
    return updatePlayer(state, playerIndex, updatedProps);
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

const damageHero = (updatedState, playerIndex) => {
    let deathCooldown = updatedState.deathCooldown
    let player = updatedState.players[playerIndex];
    const sprite = player.sprite;
    const ladybugs = [...player.ladybugs];
    ladybugs.shift();
    updatedState = updatePlayer(updatedState, playerIndex, {
        sprite: {...sprite, left: -150, top: 100},
        lives: Math.max(0, player.lives - 1),
        done: player.lives <= 0,
        spawnCooldown: SPAWN_COOLDOWN,
        invulnerableFor: SPAWN_INV_TIME,
        ladybugs,
    });
    player = updatedState.players[playerIndex];

    // Display an explosion where the player was defeated.
    const explosion = createEffect(EFFECT_EXPLOSION);
    explosion.left = sprite.left + (sprite.width - explosion.width ) / 2;
    explosion.top = sprite.top + (sprite.height - explosion.height ) / 2;
    updatedState = addEffectToState(updatedState, explosion);

    const sfx = [...updatedState.sfx];
    if (player.done) {
        deathCooldown = DEATH_COOLDOWN;
        sfx.push('sfx/death.mp3');
    } else {
        sfx.push('sfx/exclamation.mp3');
    }
    return {...updatedState, deathCooldown, sfx};
};

const getHeroHitBox = ({animationTime, left, top}) => {
    return new Rectangle(getHitBox(heroAnimation, animationTime)).translate(left, top);
};

const renderHero = (context, {sprite, invulnerableFor, done, ladybugs}) => {
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
}