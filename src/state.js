
const {
    WIDTH, GAME_HEIGHT, FRAME_LENGTH, OFFSCREEN_PADDING, ATTACK_OFFSET,
    ENEMY_COOLDOWN, DEATH_COOLDOWN, SPAWN_COOLDOWN, SPAWN_INV_TIME,
    ENEMY_FLY, ENEMY_HORNET, ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER, ENEMY_MONK, ENEMY_CARGO_BEETLE,
} = require('gameConstants');

const {
    blastRectangle,
} = require('animations');

const Rectangle = require('Rectangle');

const { getNewSpriteState } = require('sprites');
const { getNewWorld, advanceWorld, getGroundHeight } = require('world');
const { getNewPlayerState, advanceHero, getHeroHitBox, damageHero } = require('heroes');
const { enemyData, createEnemy, addEnemyToState, damageEnemy, advanceEnemy, getEnemyHitBox } = require('enemies');
const { lootData, createLoot, advanceLoot } = require('loot');
const { createEffect, advanceEffect } = require('effects');

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
    world: getNewWorld(),
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
        if (updatedState.players[0].actions.start) {
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
    if (updatedState.players[0].actions.start) {
        paused = !paused;
        if (!paused) {
            world.bgm = 'bgm/river.mp3';
        }
    }
    if (paused) {
        return {...state, paused};
    }
    updatedState.newPlayerAttacks = [];
    updatedState.newEffects = [];
    updatedState.newLoot = [];
    updatedState.newEnemies = [];
    updatedState.newEnemyAttacks = [];
    for (let playerIndex = 0; playerIndex < updatedState.players.length; playerIndex++) {
        updatedState = advanceHero(updatedState, playerIndex);
    }
    world = advanceWorld(updatedState, world);

    let currentPlayerAttacks = updatedState.playerAttacks.map(attack => advanceAttack(updatedState, attack)).filter(attack => !attack.done);
    for (let enemyIndex = 0; enemyIndex < updatedState.enemies.length; enemyIndex++) {
        updatedState = advanceEnemy(updatedState, enemyIndex);
    }
    for (let enemyIndex = 0; enemyIndex < updatedState.enemies.length; enemyIndex++) {
        const enemy = updatedState.enemies[enemyIndex];
        if (!enemy.dead && !enemy.done && enemyData[enemy.type].shoot && enemy.left > 0) {
            updatedState = enemyData[enemy.type].shoot(updatedState, enemyIndex);
        }
    }
    let {enemyCooldown} = updatedState;
    const numHornets = updatedState.enemies.filter(enemy => enemy.type === ENEMY_HORNET).length;
    if (TEST_ENEMY) {
        if (!updatedState.enemies.length) {
            const newEnemy = createEnemy(TEST_ENEMY, {
                left: WIDTH + 10,
                top: 100 + (GAME_HEIGHT - 200) * (0.5 + 0.5 * Math.sin(world.time / (1000 - updatedState.spawnDuration / 5))),
            });
            newEnemy.vx = newEnemy.vx || -5;
            newEnemy.top = newEnemy.grounded ? getGroundHeight(updatedState) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
            updatedState = addEnemyToState(updatedState, newEnemy);
        }
    } else if (enemyCooldown > 0) {
        enemyCooldown--;
    } else if (world.time % 5000 < updatedState.spawnDuration - 800 * numHornets) {
        let newEnemyType = ENEMY_FLY;
        if (world.time > 15000 && Math.random() < 1 / 6) {
            newEnemyType = ENEMY_FLYING_ANT_SOLDIER;
        } else if (world.time > 10000 && Math.random() < 1 / 3) {
            newEnemyType = ENEMY_FLYING_ANT;
        } else if (world.time > 20000 && Math.random() > Math.max(.9, 1 - .1 * updatedState.players[0].score / 3000)) {
            newEnemyType = ENEMY_HORNET;
        } else if (getGroundHeight(updatedState) < GAME_HEIGHT && Math.random() < 1 / 10) {
            newEnemyType = ENEMY_MONK;
        }
        const newEnemy = createEnemy(newEnemyType, {
            left: WIDTH + 10,
            top: 40 + (GAME_HEIGHT - 80) * (0.5 + 0.5 * Math.sin(world.time / (1000 - updatedState.spawnDuration / 5))),
            vx: -6 + 3 * (world.time % 5000) / updatedState.spawnDuration,
        });
        newEnemy.top = newEnemy.grounded ? getGroundHeight(updatedState) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
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

    updatedState.sfx = [...updatedState.sfx];
    // Check for enemies hit by attacks.
    for (let i = 0; i < updatedState.enemies.length; i++) {
        let enemy = updatedState.enemies[i];
        const enemyHitBox = getEnemyHitBox(enemy);
        for (let j = 0; j < currentPlayerAttacks.length && !enemy.dead && !enemy.done; j++) {
            const attack = currentPlayerAttacks[j];
            if (!attack.done && Rectangle.collision(enemyHitBox, attack)) {
                currentPlayerAttacks[j] = {...attack,
                    damage: attack.damage - enemy.life,
                    done: (attack.damage - enemy.life) <= 0,
                };
                updatedState = damageEnemy(updatedState, i, attack);
                enemy = updatedState.enemies[i];
            }
        }
        for (let j = 0; j < updatedState.players.length; j++) {
            if (!updatedState.players[j].invulnerableFor && !updatedState.players[j].done &&
                !enemy.done && !enemy.dead &&
                Rectangle.collision(enemyHitBox, getHeroHitBox(updatedState.players[j]))
            ) {
                updatedState = damageHero(updatedState, j);
            }
        }
    }
    currentPlayerAttacks = currentPlayerAttacks.filter(attack => !attack.done);
    updatedState.enemies = updatedState.enemies.filter(enemy => !enemy.done);

    // Advance enemy attacks and check for hitting the player.
    let currentEnemyAttacks = updatedState.enemyAttacks.map(attack => advanceAttack(updatedState, attack)).filter(attack => !attack.done);
    for (let i = 0; i < updatedState.players.length; i++) {
        if (updatedState.players[i].invulnerableFor) continue;
        const playerHitBox = getHeroHitBox(updatedState.players[i]);
        for (let j = 0; j < currentEnemyAttacks.length && !updatedState.players[i].done; j++) {
            const attack = currentEnemyAttacks[j];
            if (Rectangle.collision(playerHitBox, attack)) {
                updatedState = damageHero(updatedState, i);
                currentEnemyAttacks[j] = {...attack, done: true};
            }
        }
    }
    currentEnemyAttacks = currentEnemyAttacks.filter(attack => !attack.done);

    updatedState.loot = updatedState.loot.map(loot => advanceLoot(updatedState, loot)).filter(loot => !loot.done);
    for (let i = 0; i < updatedState.loot.length; i++) {
        const lootDrop = updatedState.loot[i];
        if (lootDrop.done) continue;
        for (let j = 0; j < updatedState.players.length; j++) {
            if (updatedState.players[j].done) continue;
            if (Rectangle.collision(lootDrop, getHeroHitBox(updatedState.players[j]))) {
                updatedState = lootData[lootDrop.type].collect(updatedState, j, lootDrop)
                updatedState.loot[i] = {...lootDrop, done: true};
                updatedState.sfx.push(lootData[lootDrop.type].sfx);
            }
        }
    }
    updatedState.loot = updatedState.loot.filter(lootDrop => !lootDrop.done);

    // Add new enemies/attacks.
    updatedState.enemies = [...updatedState.enemies, ...updatedState.newEnemies];
    updatedState.playerAttacks = [...currentPlayerAttacks, ...updatedState.newPlayerAttacks];
    updatedState.enemyAttacks = [...currentEnemyAttacks, ...updatedState.newEnemyAttacks];
    updatedState.effects = updatedState.effects.map(effect => advanceEffect(updatedState, effect)).filter(effect => !effect.done);
    updatedState.effects = [...updatedState.effects, ...updatedState.newEffects];
    updatedState.loot = [...updatedState.loot, ...updatedState.newLoot];

    return {...updatedState, enemyCooldown, world, paused: false};
};

const advanceAttack = (state, attack) => {
    let {left, top, width, height, vx, vy, delay, animationTime, playerIndex} = attack;
    if (delay > 0) {
        delay--;
        const source = state.players[playerIndex].sprite;
        left = source.left + source.vx + source.width + ATTACK_OFFSET;
        top = source.top + source.vy + Math.round((source.height - height) / 2);
    }
    if (!(delay > 0)) {
        left += vx;
        top += vy;
    }
    animationTime += FRAME_LENGTH;

    const done = left + width  < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING ||
        top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;


    return {...attack, delay, left, top, animationTime, done};
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
