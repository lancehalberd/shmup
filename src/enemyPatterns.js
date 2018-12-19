const {
    GAME_HEIGHT, WIDTH,
    ENEMY_FLY,
    LOOT_LIFE,
} = require('gameConstants');

const random = require('random');

function minHeight(state) {
    return Math.max(0, getHazardCeilingHeight(state));
}
function maxHeight(state) {
    return Math.min(GAME_HEIGHT, getHazardHeight(state));
}
function getTop(state, p) {
    const min = minHeight(state), max = maxHeight(state);
    return min + (max - min) * p;
}
function nothing(duration, next) {
    return function(state, eventTime) {
        if (eventTime >= duration) return setEvent(state, next);
    };
}
function easyFlies(next) {
    return function (state, eventTime) {
        if (eventTime === 0) {
            let top = getTop(state, random.element([1, 2, 3]) / 4);
            return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
        }
        eventTime -= 2000
        if (eventTime === 0) {
            let top = getTop(state, random.element([1, 2, 3]) / 4);
            return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
        }
        eventTime -= 2000
        if (eventTime === 0) {
            let top = getTop(state, random.element([1, 2, 3]) / 4);
            return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
        }
        eventTime -= 2000;
        if (eventTime >= 0) {
            return setEvent(state, next);
        }
    };
}
function powerup(next) {
    return function (state, eventTime) {
        if (eventTime === 0) {
            return spawnEnemy(state, ENEMY_CARGO_BEETLE, {left: WIDTH, top: getTop(state, 0.5)});
        }
        eventTime -= 3000;
        if (eventTime >= 0) {
            return setEvent(state, next);
        }
    };
}
function explodingBeetle(next) {
    return function (state, eventTime) {
        if (eventTime === 0) {
            let top = getTop(state, random.element([1, 2, 3]) / 4);
            return spawnEnemy(state, ENEMY_EXPLOSIVE_BEETLE, {left: WIDTH, top});
        }
        eventTime -= 3000;
        if (eventTime >= 0) {
            return setEvent(state, next);
        }
    };
}
function lightningBeetle(next) {
    return function (state, eventTime) {
        if (eventTime === 0) {
            let top = getTop(state, random.element([1, 2, 3]) / 4);
            return spawnEnemy(state, ENEMY_LIGHTNING_BEETLE, {left: WIDTH, top});
        }
        eventTime -= 3000;
        if (eventTime >= 0) {
            return setEvent(state, next);
        }
    };
}

function easyRoaches(next) {
    return function (state, eventTime) {
        if (eventTime === 0) {
            state = spawnEnemy(state, ENEMY_COCKROACH, {left: WIDTH, top: 100});
            state = spawnEnemy(state, ENEMY_COCKROACH, {left: WIDTH + 200, top: 300});
            return spawnEnemy(state, ENEMY_COCKROACH, {left: WIDTH + 400, top: 500});
        }
        eventTime -= 4000;
        if (eventTime >= 0) {
            return setEvent(state, next);
        }
    };
}

function normalRoaches(easyDuration, next) {
    return function (state, eventTime) {
        let spacing = (state.world.time < easyDuration) ? 1500 : 500;
        const tops = [100, 200, 300];
        if (eventTime === 0) {
            return spawnEnemy(state, ENEMY_COCKROACH, {left: WIDTH, top: random.element(tops)});
        }
        eventTime -= spacing;
        if (eventTime === 0) {
            return spawnEnemy(state, ENEMY_COCKROACH, {left: WIDTH, top: random.element(tops)});
        }
        eventTime -= spacing;
        if (eventTime === 0) {
            return spawnEnemy(state, ENEMY_COCKROACH_SOLDIER, {left: WIDTH, top: random.element(tops)});
        }
        eventTime -= spacing;
        if (eventTime >= 0) {
            return setEvent(state, next);
        }
    };
}

function singleEnemy(type, delay, next) {
    return function (state, eventTime) {
        if (eventTime === 0) {
            let top = getTop(state, random.element([1, 2, 3]) / 4);
            return spawnEnemy(state, type, {left: WIDTH, top});
        }
        eventTime -= delay;
        if (eventTime >= 0) {
            return setEvent(state, next);
        }
    }
}

function singleEasyHardEnemy(easyEnemies, hardEnemies, easyDuration, delay, next) {
    return function (state, eventTime) {
        if (eventTime === 0) {
            const list = state.world.time <= easyDuration ? easyEnemies : hardEnemies;
            const type = random.element(list);
            let top = getTop(state, random.element([1, 2, 3]) / 4);
            return spawnEnemy(state, type, {left: WIDTH, top});
        }
        eventTime -= delay;
        if (eventTime >= 0) {
            return setEvent(state, next);
        }
    }
}

// Spawn a cargo beetle with a full life powerup before each boss.
function bossPowerup(checkpoint, transitionMethod, delay = 3000) {
    return function (state, eventTime) {
        if (eventTime === delay) {
            return spawnEnemy(state, ENEMY_CARGO_BEETLE, {left: WIDTH, top: getTop(state, 0.5), lootType: LOOT_LIFE});
        }
        if (eventTime > delay && state.enemies.length === 0 && state.loot.length === 0) {
            state = setCheckpoint(state, checkpoint);
            return transitionMethod(state);
        }
    }
}

module.exports = {
    nothing,
    easyFlies,
    easyRoaches,
    normalRoaches,
    powerup,
    singleEnemy,
    singleEasyHardEnemy,
    explodingBeetle,
    lightningBeetle,
    bossPowerup,
};

const {
    getHazardHeight,
    getHazardCeilingHeight,
    setEvent,
    setCheckpoint,
} = require('world');

const { spawnEnemy } = require('enemies');

const {
    ENEMY_CARGO_BEETLE,
    ENEMY_EXPLOSIVE_BEETLE,
    ENEMY_LIGHTNING_BEETLE,
} = require('enemies/beetles');
const {
    ENEMY_COCKROACH_SOLDIER, ENEMY_COCKROACH,
} = require('areas/city');
