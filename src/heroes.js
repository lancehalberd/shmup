const {
    WIDTH,
    GAME_HEIGHT,
    FRAME_LENGTH,
    DEATH_COOLDOWN,
    SHOT_COOLDOWN, ATTACK_OFFSET,
    SPAWN_INV_TIME,
    ACCELERATION,
    MAX_SPEED,
    EFFECT_EXPLOSION, EFFECT_DEAD_DRAGONFLY, EFFECT_SWITCH_DRAGONFLY,
    EFFECT_NEEDLE_FLIP,
    HERO_DRAGONFLY,
    LOOT_SPEED, LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED
} = require('gameConstants');

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const Rectangle = require('Rectangle');

const {
    drawImage,
} = require('draw');

const { getNewSpriteState } = require('sprites');

const {
    dragonflyAnimation,
    dragonflyEnterAnimation,
    dragonflyCatchAnimation,
    dragonflyDeathAnimation,
    dragonflyPortraitImage,
    ladybugAnimation,
    ladybugAttackAnimation,
    blastRectangle,
    getHitBox,
    getFrame,
} = require('animations');

const heroesData = {
    [HERO_DRAGONFLY]: {
        animation: dragonflyAnimation,
        enterAnimation: dragonflyEnterAnimation,
        catchAnimation: dragonflyCatchAnimation,
        deathEffect: EFFECT_DEAD_DRAGONFLY,
        switchEffect: EFFECT_SWITCH_DRAGONFLY,
        portraitImage: dragonflyPortraitImage,
    },
};

const getNewPlayerState = () => ({
    score: 0,
    sprite: getNewSpriteState({...dragonflyAnimation.frames[0], left: -100, top: 150, targetLeft: 100, targetTop: 100, spawnSpeed: MAX_SPEED}),
    heroes: [HERO_DRAGONFLY, HERO_DRAGONFLY, HERO_DRAGONFLY],
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
    if (state.players[playerIndex].done) {
        return state;
    }
    let player = state.players[playerIndex];
    let {shotCooldown, invulnerableFor, ladybugShotCooldown} = player;
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
                top: ladybug.top + player.sprite.vy + Math.round((ladybug.height - ladybugAttackAnimation.frames[0].height) / 2) + 6,
                vx: 15,
                playerIndex,
                damage: 1,
                type: 'ladybug'
            }));
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
            ladybugShotCooldown, invulnerableFor, shotCooldown: 1,
            sprite: {...player.sprite, left, top, animationTime, targetLeft, targetTop},
        });
    }
    if (player.actions.switch) {
        return switchHeroes(state, playerIndex);
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
    let chasingNeedle = player.chasingNeedle, catchingNeedleFrames = player.catchingNeedleFrames;
    if (chasingNeedle) {
        chasingNeedle = false;
        catchingNeedleFrames = 6;
    } else if(catchingNeedleFrames > 0) {
        catchingNeedleFrames--;
    }
    const updatedProps = {
        shotCooldown, ladybugShotCooldown, invulnerableFor, sprite,
        ladybugs, chasingNeedle, catchingNeedleFrames,
    };
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
        chasingNeedle: true,
    });
    player = updatedState.players[playerIndex];

    const sfx = [...updatedState.sfx, 'sfx/exclamation.mp3'];
    return {...updatedState, sfx};
};

const damageHero = (updatedState, playerIndex) => {
    let deathCooldown = updatedState.deathCooldown
    let player = updatedState.players[playerIndex];
    const sprite = player.sprite;
    const ladybugs = [...player.ladybugs];
    ladybugs.shift();

    // Display the dying character as a single animation effect.
    const deathEffect = createEffect(heroesData[player.heroes[0]].deathEffect);
    deathEffect.left = sprite.left + (sprite.width - deathEffect.width ) / 2;
    deathEffect.top = sprite.top + (sprite.height - deathEffect.height ) / 2;
    updatedState = addEffectToState(updatedState, deathEffect);
    const needleEffect = createEffect(EFFECT_NEEDLE_FLIP);
    needleEffect.left = sprite.left + (sprite.width - needleEffect.width ) / 2;
    needleEffect.top = sprite.top + (sprite.height - needleEffect.height ) / 2;
    updatedState = addEffectToState(updatedState, needleEffect);

    const heroes = [...player.heroes];
    heroes.shift();
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
        dead: true,
        done: heroes.length <= 0,
        invulnerableFor: SPAWN_INV_TIME,
        chasingNeedle: true,
        ladybugs,
    });
    player = updatedState.players[playerIndex];


    const sfx = [...updatedState.sfx];
    if (player.done) {
        deathCooldown = DEATH_COOLDOWN;
        sfx.push('sfx/death.mp3');
    } else {
        sfx.push('sfx/exclamation.mp3');
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
    let animation = heroData.animation;
    if (player.chasingNeedle) {
        animation = heroData.enterAnimation;
    }
    if (player.catchingNeedleFrames > 0) {
        animation = heroData.catchAnimation;
    }
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
};


const { getGroundHeight } = require('world');

const { createEffect, addEffectToState } = require('effects');

