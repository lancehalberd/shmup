
const {
    WIDTH, GAME_HEIGHT, FRAME_LENGTH, OFFSCREEN_PADDING,
    ENEMY_COOLDOWN, DEATH_COOLDOWN, SPAWN_COOLDOWN, SPAWN_INV_TIME,
    ENEMY_FLY, ENEMY_HORNET, ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER,
} = require('gameConstants');

const {
    blastRectangle, heroRectangle,
} = require('animations');

const Rectangle = require('Rectangle');

const { getNewSpriteState } = require('sprites');
const { advanceHero, getHeroHitBox, damageHero } = require('heroes');
const { enemyData, createEnemy, addEnemyToState, damageEnemy, advanceEnemy, getEnemyHitBox } = require('enemies');
const { lootData, createLoot, advanceLoot } = require('loot');
const { createEffect, advanceEffect } = require('effects');

const ATTACK_OFFSET = -4;

const getNewPlayerState = () => ({
    score: 0,
    lives: 3,
    sprite: getNewSpriteState({...heroRectangle, left: -100, top: 100}),
    spawnCooldown: SPAWN_COOLDOWN,
    invulnerableFor: SPAWN_INV_TIME,
    shotCooldown: 0,
    actions: {
        up: false,
        down: false,
        left: false,
        right: false,
        shoot: false,
        start: false,
    },
});

const getNewState = () => ({
    players: [getNewPlayerState()],
    deathCooldown: 0,
    enemies: [],
    loot: [],
    effects: [],
    enemyCooldown: 0,
    spawnDuration: 200,
    playerAttacks: [],
    enemyAttacks: [],
    sfx: [],
    title: true,
    titleIndex: 0,
    paused: false,
    gameover: false,
    world: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        backgroundXFactor: .5,
        backgroundYFactor: 0,
        foregroundXFactor: 2,
        foregroundYFactor: 1,
        foregroundYOffset: 45,
        midgroundXFactor: 1,
        midgroundYFactor: 1,
        midgroundYOffset: 30,
        targetX: 1000,
        targetY: 0,
        targetFrames: 50 * 10,
        time: 0,
        bgm: 'bgm/area.mp3',
    }
});

const TEST_ENEMY = false;

const advanceState = (state) => {
    let updatedState = {...state};
    if (updatedState.title) {
        let titleIndex = updatedState.titleIndex;
        if (updatedState.players[0].actions.start && titleIndex === 0) {
            return {...updatedState, title: false, world: {...updatedState.world, bgm: 'bgm/river.mp3'}};
        }
        if (updatedState.players[0].actions.up) {
            titleIndex = (titleIndex + 2 - 1) % 2;
        }
        if (updatedState.players[0].actions.down) {
            titleIndex = (titleIndex + 1) % 2;
        }
        return {...updatedState, titleIndex};
    }
    if (state.gameover) {
        if (state.players[0].actions.start) {
            return getNewState();
        }
        return state;
    }
    if (updatedState.deathCooldown > 0) {
        updatedState.deathCooldown -= FRAME_LENGTH;
        if (updatedState.deathCooldown <= 0) {
            return { ...updatedState, gameover: true };
        }
    }
    let { paused, world } = state;
    if (state.players[0].actions.start) {
        paused = !paused;
        if (!paused) {
            world.bgm = 'bgm/river.mp3';
        }
    }
    if (paused) {
        return {...state, paused};
    }
    updatedState.newPlayerAttacks = [];
    updatedState.players = state.players.map((player, index) => {
        if (!player.shotCooldown && player.actions.shoot) {
            updatedState.newPlayerAttacks.push(getNewSpriteState({
                ...blastRectangle,
                left: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET,
                top: player.sprite.top + player.sprite.vy + Math.round((player.sprite.height - blastRectangle.height) / 2),
                vx: 20,
                delay: 2,
                playerIndex: index,
                sfx: 'sfx/shoot.mp3'
            }));
        }
        return advanceHero(state, player);
    });
    world = advanceWorld(state, world);

    let currentPlayerAttacks = state.playerAttacks.map(attack => advanceAttack(state, attack)).filter(attack => !attack.done);
    updatedState.enemies = state.enemies.map(enemy => advanceEnemy(state, enemy)).filter(enemy => !enemy.done);
    updatedState.newEnemyAttacks = [];
    for (let enemyIndex = 0; enemyIndex < updatedState.enemies.length; enemyIndex++) {
        const enemy = updatedState.enemies[enemyIndex];
        if (enemyData[enemy.type].shoot) {
            updatedState = enemyData[enemy.type].shoot(updatedState, enemyIndex);
        }
    }
    updatedState.newEnemies = [];
    let {enemyCooldown} = state;
    const numHornets = updatedState.enemies.filter(enemy => enemy.type === ENEMY_HORNET).length;
    if (TEST_ENEMY) {
        if (!updatedState.enemies.length) {
            const newEnemy = createEnemy(TEST_ENEMY, {
                left: WIDTH + 10,
                top: 40 + (GAME_HEIGHT - 80) * (0.5 + 0.5 * Math.sin(world.time / (1000 - updatedState.spawnDuration / 5))),
                vx: -6 + 3 * (world.time % 5000) / updatedState.spawnDuration,
            });
            newEnemy.top -= newEnemy.height / 2;
            updatedState = addEnemyToState(updatedState, newEnemy);
        }
    } else if (enemyCooldown > 0) {
        enemyCooldown--;
    } else if (world.time % 5000 < updatedState.spawnDuration - 800 * numHornets) {
        let newEnemyType = ENEMY_FLY;
        if (world.time > 15000 && Math.random() < 1 / 3) {
            newEnemyType = ENEMY_FLYING_ANT_SOLDIER;
        } else if (world.time > 10000 && Math.random() < 1 / 3) {
            newEnemyType = ENEMY_FLYING_ANT;
        } else if (world.time > 20000 && Math.random() > Math.max(.9, 1 - .1 * updatedState.players[0].score / 3000)) {
            newEnemyType = ENEMY_HORNET;
        }
        const newEnemy = createEnemy(newEnemyType, {
            left: WIDTH + 10,
            top: 40 + (GAME_HEIGHT - 80) * (0.5 + 0.5 * Math.sin(world.time / (1000 - updatedState.spawnDuration / 5))),
            vx: -6 + 3 * (world.time % 5000) / updatedState.spawnDuration,
        });
        newEnemy.top -= newEnemy.height / 2;
        updatedState = addEnemyToState(updatedState, newEnemy);
        switch (newEnemy.type) {
            case ENEMY_HORNET:
                enemyCooldown = 3 * ENEMY_COOLDOWN;
                break;
            case ENEMY_FLYING_ANT_SOLDIER:
                enemyCooldown = 2 * ENEMY_COOLDOWN;
                break;
            default:
                enemyCooldown = ENEMY_COOLDOWN;
                break;
        }
    }

    updatedState.newEffects = [];
    updatedState.newLoot = [];
    updatedState.sfx = [...updatedState.sfx];
    // Check for enemies hit by attacks.
    for (let i = 0; i < updatedState.enemies.length; i++) {
        const enemy = updatedState.enemies[i];
        if (enemy.done || enemy.dead) continue;
        const enemyHitBox = getEnemyHitBox(enemy);
        for (let j = 0; j < currentPlayerAttacks.length; j++) {
            const attack = currentPlayerAttacks[j];
            if (Rectangle.collision(enemyHitBox, attack)) {

                currentPlayerAttacks[j] = {...attack, done: true};
                updatedState = damageEnemy(updatedState, i, attack);
            }
        }
        for (let j = 0; j < updatedState.players.length; j++) {
            const sprite = updatedState.players[j].sprite;
            if (!updatedState.players[j].invulnerableFor && !updatedState.players[j].done &&
                !enemy.done && !enemy.dead &&
                Rectangle.collision(enemyHitBox, getHeroHitBox(sprite))
            ) {
                updatedState = damageHero(updatedState, j);
            }
        }
    }
    currentPlayerAttacks = currentPlayerAttacks.filter(attack => !attack.done);
    updatedState.enemies = updatedState.enemies.filter(enemy => !enemy.done);

    // Advance enemy attacks and check for hitting the player.
    let currentEnemyAttacks = state.enemyAttacks.map(attack => advanceAttack(state, attack)).filter(attack => !attack.done);
    for (let i = 0; i < updatedState.players.length; i++) {
        if (updatedState.players[i].invulnerableFor) continue;
        const sprite = updatedState.players[i].sprite;
        const playerHitBox = getHeroHitBox(sprite);
        for (let j = 0; j < currentEnemyAttacks.length && !updatedState.players[i].done; j++) {
            const attack = currentEnemyAttacks[j];
            if (Rectangle.collision(playerHitBox, attack)) {
                updatedState = damageHero(updatedState, i);
                currentEnemyAttacks[j] = {...attack, done: true};
            }
        }
    }
    currentEnemyAttacks = currentEnemyAttacks.filter(attack => !attack.done);

    updatedState.loot = updatedState.loot.map(loot => advanceLoot(state, loot)).filter(loot => !loot.done);
    for (let i = 0; i < updatedState.loot.length; i++) {
        const lootDrop = updatedState.loot[i];
        if (lootDrop.done) continue;
        for (let j = 0; j < updatedState.players.length; j++) {
            if (updatedState.players[j].done) continue;
            const sprite = updatedState.players[j].sprite;
            if (Rectangle.collision(lootDrop, getHeroHitBox(sprite))) {
                updatedState.players[j] = lootData[lootDrop.type].collect(updatedState.players[j], lootDrop)
                updatedState.loot[i] = {...lootDrop, done: true};
                updatedState.sfx.push(lootData[lootDrop.type].sfx);
            }
        }
    }
    updatedState.loot = updatedState.loot.filter(lootDrop => !lootDrop.done);

    // Add new enemies/attacks.
    updatedState.enemies = [...updatedState.enemies, ...updatedState.newEnemies];
    const playerAttacks = [...currentPlayerAttacks, ...updatedState.newPlayerAttacks];
    const enemyAttacks = [...currentEnemyAttacks, ...updatedState.newEnemyAttacks];
    updatedState.effects = updatedState.effects.map(effect => advanceEffect(state, effect)).filter(effect => !effect.done);
    updatedState.effects = [...updatedState.effects, ...updatedState.newEffects];
    updatedState.loot = [...updatedState.loot, ...updatedState.newLoot];

    return {...updatedState, enemyCooldown,
        playerAttacks, enemyAttacks,
        world, paused: false
    };
};

const advanceAttack = (state, attack) => {
    let {left, top, width, height, vx, vy, delay, animationTime, playerIndex} = attack;
    if (delay > 0) {
        delay--;
        const source = state.players[playerIndex].sprite;
        left = source.left + source.vx + source.width + ATTACK_OFFSET;
        top = source.top + source.vy + Math.round((source.height - blastRectangle.height) / 2);
    }
    if (!(delay > 0)) {
        left += vx;
        top += vy;
    }
    animationTime += FRAME_LENGTH;

    const done = left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING ||
        top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;


    return {...attack, delay, left, top, animationTime, done};
};

const advanceWorld = (state, world) => {
    let {x, y, vx, vy, targetX, targetY, targetFrames, time} = world
    x += vx;
    y += vy;
    targetFrames--;
    const targetVx = (targetX - x) / targetFrames;
    vx = (targetVx + vx) / 2;
    const targetVy = (targetY - y) / targetFrames;
    vy = (targetVy + vy) / 2;

    // For now just set the targetFrame and destination constantly ahead.
    // Later we can change this depending on the scenario.
    targetFrames = 50 * 10;
    targetX = x + 1000;
    if (time % 60000 > 45000) {
        targetY = y;
    } else if (time % 60000 > 30000) {
        targetY = 400;
    } else if (time % 60000 > 15000) {
        targetY = y;
    } else {
        targetY = 0;
    }
    time += FRAME_LENGTH;
    return {...world, x, y, vx, vy, targetX, targetY, targetFrames, time};
};

const applyPlayerActions = (state, playerIndex, actions) => {
    const players = [...state.players];
    players[playerIndex] = {...players[playerIndex], actions};
    return {...state, players};
};

module.exports = {
    getNewState,
    advanceState,
    applyPlayerActions,
};
