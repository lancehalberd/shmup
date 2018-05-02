
const random = require('random');

const {
    WIDTH, GAME_HEIGHT, FRAME_LENGTH, OFFSCREEN_PADDING,
    ENEMY_COOLDOWN, DEATH_COOLDOWN, SPAWN_COOLDOWN, SPAWN_INV_TIME,
    EFFECT_DEFLECT_BULLET,
    ENEMY_FLY, ENEMY_MONK,
    ENEMY_HORNET, ENEMY_HORNET_SOLDIER,
    ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER,
    ENEMY_LOCUST, ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE, ENEMY_EXPLOSIVE_BEETLE,
} = require('gameConstants');

const Rectangle = require('Rectangle');

const { getNewSpriteState } = require('sprites');
const { getNewWorld, advanceWorld, getGroundHeight } = require('world');

const getNewState = () => (advanceWorld({
    players: [getNewPlayerState()],
    deathCooldown: 0,
    enemies: [],
    loot: [],
    effects: [],
    enemyCooldown: 0,
    playerAttacks: [],
    neutralAttacks: [],
    enemyAttacks: [],
    sfx: [],
    title: true,
    titleIndex: 0,
    paused: false,
    gameover: false,
    world: getNewWorld(),
}));

const TEST_ENEMY = false;
const TEST_TIME = 0;

const advanceState = (state) => {
    let updatedState = {...state};
    if (state.world.time < TEST_TIME) {
        state.world.time = TEST_TIME;
    }
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
        //if (updatedState.players[0].actions.down)
        //return advanceWorld({...updatedState, titleIndex});
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
    let { paused } = updatedState;
    if (updatedState.players[0].actions.start) {
        paused = !paused;
        if (!paused) {
            updatedState = {...updatedState, world: {...updatedState.world, bgm: 'bgm/river.mp3'}};
        }
    }
    if (paused) {
        return {...updatedState, paused};
    }
    updatedState.newPlayerAttacks = [];
    updatedState.newEffects = [];
    updatedState.newLoot = [];
    updatedState.newEnemies = [];
    updatedState.newEnemyAttacks = [];
    updatedState.newNeutralAttacks = [];
    for (let playerIndex = 0; playerIndex < updatedState.players.length; playerIndex++) {
        updatedState = advanceHero(updatedState, playerIndex);
    }
    updatedState = advanceWorld(updatedState);
    let world = updatedState.world;

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
    const formidableEnemies = [ENEMY_HORNET, ENEMY_LOCUST, ENEMY_HORNET_SOLDIER, ENEMY_LOCUST_SOLDIER, ENEMY_EXPLOSIVE_BEETLE];
    const numFormidable = updatedState.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
    const spawnDuration = Math.min(2500, 100 + world.time / 20 + state.players[0].score / 10);
    if (TEST_ENEMY) {
        if (!updatedState.enemies.length) {
            const newEnemy = createEnemy(TEST_ENEMY, {
                left: WIDTH + 10,
                top: 100 + (GAME_HEIGHT - 200) * (0.5 + 0.5 * Math.sin(world.time / (1000 - spawnDuration / 5))),
            });
            newEnemy.vx = newEnemy.vx || -5;
            newEnemy.top = newEnemy.grounded ? getGroundHeight(updatedState) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
            updatedState = addEnemyToState(updatedState, newEnemy);
        }
    } else if (enemyCooldown > 0) {
        enemyCooldown--;
    } else if (world.time % 5000 < spawnDuration - 800 * numFormidable) {
        let newEnemyType = ENEMY_FLY;
        if (world.time > 15000 && Math.random() < 1 / 6) {
            newEnemyType = ENEMY_FLYING_ANT_SOLDIER;
        } else if (world.time > 10000 && Math.random() < 1 / 3) {
            newEnemyType = ENEMY_FLYING_ANT;
        } else if (world.time > 20000 && Math.random() > Math.max(.9, 1 - .1 * updatedState.players[0].score / 3000)) {
            newEnemyType = random.element(formidableEnemies);
        } else if (getGroundHeight(updatedState) < GAME_HEIGHT && Math.random() < 1 / 10) {
            newEnemyType = ENEMY_MONK;
        }
        const newEnemy = createEnemy(newEnemyType, {
            left: WIDTH + 10,
            top: 40 + (GAME_HEIGHT - 80) * (0.5 + 0.5 * Math.sin(world.time / (1000 - spawnDuration / 5))),
        });
        newEnemy.vx = newEnemy.vx || -6 + 3 * (world.time % 5000) / spawnDuration;
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
            if (!attack.done && !attack.hitIds[enemy.id] && Rectangle.collision(enemyHitBox, attack)) {
                currentPlayerAttacks[j] = {...attack,
                    damage: attack.piercing ? attack.damage : attack.damage - enemy.life,
                    done: !attack.piercing && (attack.damage - enemy.life) <= 0,
                    hitIds: {...attack.hitIds, [enemy.id]: true},
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
    // Player melee attacks can destroy enemy projectiles.
    for (let i = 0; i < currentPlayerAttacks.length; i++) {
        const attack = currentPlayerAttacks[i];
        if (!attack.melee || attack.done) continue;
        for (let j = 0; j < currentEnemyAttacks.length; j++) {
            const enemyAttack = currentEnemyAttacks[j];
            if (Rectangle.collision(attack, enemyAttack)) {
                currentEnemyAttacks[j] = {...enemyAttack, done: true};
                const deflectEffect = createEffect(EFFECT_DEFLECT_BULLET);
                deflectEffect.left = enemyAttack.left + (enemyAttack.width - deflectEffect.width ) / 2;
                deflectEffect.top = enemyAttack.top + (enemyAttack.height - deflectEffect.height ) / 2;
                updatedState = addEffectToState(updatedState, deflectEffect);
            }
        }
    }
    currentEnemyAttacks = currentEnemyAttacks.filter(attack => !attack.done);

    let currentNeutralAttacks = updatedState.neutralAttacks.map(attack => advanceAttack(updatedState, attack)).filter(attack => !attack.done);
    for (let i = 0; i < currentNeutralAttacks.length; i++) {
        const attack = currentNeutralAttacks[i];
        for (let j = 0; j < updatedState.players.length; j++) {
            const player = updatedState.players[j];
            const playerKey = `player${j}`;
            if (player.invulnerableFor || attack.hitIds[playerKey]) continue;
            const playerHitBox = getHeroHitBox(player);
            if (Rectangle.collision(playerHitBox, attack)) {
                updatedState = damageHero(updatedState, j);
                currentNeutralAttacks[i] = {...attack,
                    damage: attack.piercing ? attack.damage : attack.damage - 1,
                    done: !attack.piercing && (attack.damage - 1) <= 0,
                    hitIds: {...attack.hitIds, [playerKey]: true},
                };
            }
        }
        for (let j = 0; j < updatedState.enemies.length; j++) {
            const enemy = updatedState.enemies[j];
            if (enemy.dead || enemy.done || attack.hitIds[enemy.id]) continue;
            const enemyHitBox = getEnemyHitBox(enemy);
            if (Rectangle.collision(enemyHitBox, attack)) {
                currentNeutralAttacks[i] = {...attack,
                    damage: attack.piercing ? attack.damage : attack.damage - enemy.life,
                    done: !attack.piercing && (attack.damage - enemy.life) <= 0,
                    hitIds: {...attack.hitIds, [enemy.id]: true},
                };
                updatedState = damageEnemy(updatedState, j, attack);
            }
        }
    }

    updatedState.loot = updatedState.loot.map(loot => advanceLoot(updatedState, loot)).filter(loot => !loot.done);
    for (let i = 0; i < updatedState.loot.length; i++) {
        const loot = updatedState.loot[i];
        if (loot.done) continue;
        for (let j = 0; j < updatedState.players.length; j++) {
            if (updatedState.players[j].done || updatedState.players[j].spawning) continue;
            if (Rectangle.collision(loot, getHeroHitBox(updatedState.players[j]))) {
                updatedState = collectLoot(updatedState, j, i);
            }
        }
    }
    updatedState.loot = updatedState.loot.filter(loot => !loot.done);

    // Add new enemies/attacks.
    updatedState.enemies = [...updatedState.enemies, ...updatedState.newEnemies];
    updatedState.playerAttacks = [...currentPlayerAttacks, ...updatedState.newPlayerAttacks];
    updatedState.enemyAttacks = [...currentEnemyAttacks, ...updatedState.newEnemyAttacks];
    updatedState.neutralAttacks = [...currentNeutralAttacks, ...updatedState.newNeutralAttacks];
    updatedState.effects = updatedState.effects.map(effect => advanceEffect(updatedState, effect)).filter(effect => !effect.done);
    updatedState.effects = [...updatedState.effects, ...updatedState.newEffects];
    updatedState.loot = [...updatedState.loot, ...updatedState.newLoot];

    return {...updatedState, enemyCooldown, paused: false};
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


const {
    advanceAttack,
} = require('attacks');
const { getNewPlayerState, advanceHero, getHeroHitBox, damageHero } = require('heroes');
const { enemyData, createEnemy, addEnemyToState, damageEnemy, advanceEnemy, getEnemyHitBox } = require('enemies');
const { collectLoot, advanceLoot } = require('loot');
const { createEffect, addEffectToState, advanceEffect } = require('effects');

