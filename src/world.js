const { FRAME_LENGTH, GAME_HEIGHT, WIDTH, HEIGHT, HUD_HEIGHT } = require('gameConstants');
const Rectangle = require('Rectangle');
const random = require('random');
const { drawImage } = require('draw');
const { getFrame } = require('animations');
const { getNewSpriteState } = require('sprites');

const allWorlds = {};
const checkpoints = {};
window.checkpoints = checkpoints;
window.allWorlds = allWorlds;

const getNewLayer = (props) => ({
    sprites: [],
    ...props
});

const getNewWorld = () => getFieldWorldStart();

const clearSprites = (state) => {
    return {...state,
        enemies: [], loot: [], effects: [], playerAttacks: [], neutralAttacks: [], enemyAttacks: [],
        newEnemies:[], newLoot: [], newEffects: [], newPlayerAttacks: [], newNeutralAttacks: [], newEnemyAttacks: [],
    };
};

const addElementToLayer = (state, layerName) => {
    let world = state.world;
    const layer = {...world[layerName]};
    if (!layer.spriteData) {
        return state;
    }
    const elementsData = layer.spriteData;
    let newSprite = null, lastSprite = layer.sprites[layer.sprites.length - 1];
    let safety = 0;
    const populating = !lastSprite;
    while ((!lastSprite || lastSprite.left < WIDTH) && !(lastSprite && layer.unique) && safety++ < 20) {
        let spriteData = (lastSprite && lastSprite.next)
            ? elementsData[random.element(lastSprite.next)]
            : random.element(elementsData);
        // This will often happen when transitioning between area types.
        if (!spriteData) {
            spriteData = random.element(elementsData);
            if (!spriteData) break;
        }
        let {animation, scale} = spriteData;
        if (Array.isArray(animation)) {
            animation = random.element(animation);
        }
        let offset = lastSprite ? (lastSprite.offset || 0) : (layer.xOffset || 0);
        if (Array.isArray(offset)) {
            offset = random.element(offset);
        }
        if (lastSprite) {
            offset *= (lastSprite.scale || 1);
            offset += populating ?
                lastSprite.left + lastSprite.width :
                Math.max(lastSprite.left + lastSprite.width, WIDTH);
        }
        let yOffset = spriteData.yOffset || 0
        if (Array.isArray(yOffset)) {
            yOffset = random.element(yOffset);
        }
        yOffset *= (spriteData.scale || 1);
        newSprite = getNewSpriteState({
            ...animation.frames[0],
            top: getBaseHeight(state, layer) + (layer.yOffset || 0) + yOffset,
            // only allow items to be added to directly to the visible portion of the
            // screen during the population section (no sprite on the layer yet).
            left: offset,
            ...spriteData,
            animation,
            animationTime: layer.syncAnimations ? ((lastSprite && lastSprite.animationTime) || 0) : offset,
        });
        newSprite.height *= (scale || 1);
        newSprite.width *= (scale || 1);
        //console.log(getBaseHeight(state), layer.yOffset, yOffset, -newSprite.height);
        newSprite.top -= newSprite.height;
        if (!lastSprite) newSprite.left -= newSprite.width / 2; // Start with the first sprite half off of the screen.
        layer.sprites = [...layer.sprites, newSprite];
        //if (layerName === 'ground') console.log(layer.sprites);
        //console.log(newSprite.left, newSprite.top, newSprite.width, newSprite.height);
        lastSprite = newSprite;
    }
    world = {...world, [layerName]: layer};
    return {...state, world};
};

function updateLayerSprite(state, layerName, spriteIndex, newProperties) {
    const sprites = [...state.world[layerName].sprites];
    sprites[spriteIndex] = {...sprites[spriteIndex], ...newProperties};
    const layer = {...state.world[layerName], sprites};
    const world = {...state.world, [layerName]: layer};
    return {...state, world};
}

function updateLayerSprites(state, layer, callback) {
    const sprites = [...state.world[layer].sprites];
    for (let i = 0; i < sprites.length; i++) {
        sprites[i] = callback(state, sprites[i]);
    }
    return {...state, world: {...state.world, [layer]: {...state.world[layer], sprites}}};
}
function clearLayers(state, layerNames) {
    const world = {...state.world};
    for (const layerName of layerNames) {
        const sprites = world[layerName].sprites.filter(sprite => sprite.left < WIDTH);
        world[layerName] = {...world[layerName], spriteData: false, sprites};
    }
    return {...state, world};
}

const advanceLayer = (state, layerName) => {
    // Check to add a new element to scroll onto the screen.
    state = addElementToLayer(state, layerName);
    const layer = {...state.world[layerName]};
    if (!layer) return state;
    if (!layer.sprites) console.log(layerName, layer);

    for (let i = 0; i < state.world[layerName].sprites.length; i++) {
        let sprite = state.world[layerName].sprites[i];
        state = updateLayerSprite(state, layerName, i, {
            ...sprite,
            left: sprite.left + (sprite.vx - state.world.vx) * layer.xFactor,
            top: sprite.top + (sprite.vy + state.world.vy) * layer.yFactor,
            animationTime: sprite.animationTime + FRAME_LENGTH,
        });
        sprite = state.world[layerName].sprites[i];
        if (sprite.accelerate) {
            state = sprite.accelerate(state, layerName, i);
        }
        if (sprite.onHit) {
            const frame = getFrame(sprite.animation, sprite.animationTime);
            const hitBox = new Rectangle(frame.hitBox || frame).scale(sprite.scale).moveTo(sprite.left, sprite.top);
            for (const attack of state.playerAttacks) {
                if (Rectangle.collision(hitBox, attack)) {
                    state = sprite.onHit(state, layerName, i);
                    sprite = state.world[layerName].sprites[i];
                    break;
                }
            }
        }
        if (sprite.onContact) {
            const frame = getFrame(sprite.animation, sprite.animationTime);
            const hitBox = new Rectangle(frame.hitBox || frame).scale(sprite.scale).moveTo(sprite.left, sprite.top);
            const player = state.players[0];
            const heroHitBox = new Rectangle(getHeroHitBox(player));
            if (Rectangle.collision(hitBox, heroHitBox)) {
                state = sprite.onContact(state, layerName, i);
            } else {
                for (const enemy of state.enemies) {
                    if (Rectangle.collision(hitBox, getEnemyHitBox(state, enemy))) {
                        state = sprite.onContact(state, layerName, i);
                        break;
                    }
                }
            }
        }
    }
    const sprites = state.world[layerName].sprites.filter(sprite => sprite.left + sprite.width > 0);
    return {...state, world: {...state.world, [layerName]: {...state.world[layerName], sprites}}};
};

const advanceWorld = (state) => {
    let world = state.world;
    world = {...world, x: world.x + world.vx, y: Math.max(0, world.y + world.vy)};
    state = {...state, world};
    let {x, y, vx, vy, targetX, targetY, targetFrames, transitionFrames} = world
    if (transitionFrames > 0) {
        transitionFrames--;
    }
    targetFrames--;
    if (targetFrames >= 1) {
        const targetVx = (targetX - x) / Math.ceil(targetFrames);
        vx = (targetVx + vx) / 2;
        const targetVy = (targetY - y) / Math.ceil(targetFrames);
        vy = Math.max((targetVy + vy) / 2, -y);
    } else {
        vx = (targetX - x);
        vy = Math.max((targetY - y), -y);
    }
    world = {...world, x, y, vx, vy, transitionFrames, targetFrames};
    state = {...state, world};
    if (allWorlds[world.type].advanceWorld) {
        state = allWorlds[world.type].advanceWorld(state);
    }
    for (const layerName of state.world.bgLayerNames) state = advanceLayer(state, layerName);
    for (const layerName of state.world.mgLayerNames) state = advanceLayer(state, layerName);
    for (const layerName of state.world.fgLayerNames) state = advanceLayer(state, layerName);
    return state;
};

const getHazardHeight = (state) => {
    if (!state.world.hazardHeight) return 10000;
    return GAME_HEIGHT - state.world.hazardHeight + state.world.y * state.world.ground.yFactor;
};

const getHazardCeilingHeight = (state) => {
    if (!state.world.hazardCeilingHeight) return -10000;
    return state.world.hazardCeilingHeight + state.world.y * state.world.ground.yFactor;
};

const getGroundHeight = (state) => {
    // If the world has no ground layer, just return a very large number here.
    if (!state.world.ground) return 10000;
    return GAME_HEIGHT - state.world.groundHeight + state.world.y * state.world.ground.yFactor;
};

const getBaseHeight = (state, layer) => {
    layer = layer || state.world.ground;
    return GAME_HEIGHT + state.world.y * (layer ? layer.yFactor : 1);
}

const renderBackgroundLayer = (context, {frame, x, y, maxY}) => {
    x = Math.round(x);
    y = Math.round(y);
    if (typeof maxY === 'number') {
        y = Math.min(maxY, y);
    }
    const scale = frame.scale || 1;
    const left = Math.floor(x / scale) % frame.width;
    const right = Math.floor(x + WIDTH / scale) % frame.width;
    if (right <= left) {
        let leftWidth = frame.width - left;
        drawImage(context, frame.image, new Rectangle(left, 0, leftWidth, frame.height),
            new Rectangle(0, y, leftWidth, frame.height));
        drawImage(context, frame.image, new Rectangle(0, 0, right, frame.height),
            new Rectangle(leftWidth, y, right, frame.height));
    } else {
        drawImage(context, frame.image, new Rectangle(left, 0, frame.width, frame.height),
            new Rectangle(0, y, frame.width, frame.height));
    }
};
// Render scenery that appear behind the main game sprites.
const renderBackground = (context, state) => {
    // The background needs to be rendered behind the HUD so that it can cover the screen
    // even when the HUD is not rendered (for example on the title screen).
    for (const layerName of state.world.bgLayerNames) renderLayer(context, state, layerName);
    context.save();
    context.translate(0, HUD_HEIGHT);
    for (const layerName of state.world.mgLayerNames) renderLayer(context, state, layerName);
    context.restore();
};
// Render scenery that appears in front of the main game sprites.
const renderForeground = (context, state) => {
    context.save();
    context.translate(0, HUD_HEIGHT);
    for (const layerName of state.world.fgLayerNames) renderLayer(context, state, layerName);
    context.restore();
};

const renderLayer = (context, state, layerName) => {
    const layer = state.world[layerName];
    let frame;
    if (layer.backgroundColor) {
        context.fillStyle = layer.backgroundColor;
        context.fillRect(0, 0, WIDTH, HEIGHT);
    }
    const maxY = layer.maxY;
    if (layer.animation) {
        frame = getFrame(layer.animation, state.world.time);
        renderBackgroundLayer(context, {frame,
            x: state.world.x * layer.xFactor + (layer.xOffset || 0),
            y: state.world.y * layer.yFactor + (layer.yOffset || 0),
        });
    }
    for (const sprite of layer.sprites) {
        frame = getFrame(sprite.animation, sprite.animationTime);
        context.save();
        if (typeof(sprite.alpha) === 'number') context.globalAlpha = sprite.alpha;
        const yScale = (sprite.yScale || 1);
        const xScale = (sprite.xScale || 1);
        const target = new Rectangle(sprite);
        if (typeof maxY === 'number') {
            target.top = Math.min(target.top, maxY);
        }
        if (xScale !== 1 || yScale !==1) {
            context.translate(target.left + target.width / 2, target.top + target.height / 2);
            context.scale(xScale, yScale);
            drawImage(context, frame.image, frame, target.moveCenterTo(0, 0));
        } else {
            drawImage(context, frame.image, frame, target);
        }
        context.restore();
    }
};

function setCheckpoint(state, checkpoint) {
    return {...state, checkpoint};
}

function applyCheckpointToState(state, checkpoint, clearAllSprites = true) {
    if (!checkpoint) checkpoint = state.checkpoint || CHECK_POINT_FIELD_START;
    state = checkpoints[checkpoint](state);
    if (!clearAllSprites) return {...state, bgm: state.world.bgm};
    return clearSprites({...state, bgm: state.world.bgm});
}

module.exports = {
    allWorlds,
    checkpoints,
    getNewWorld,
    getNewLayer,
    advanceWorld,
    addElementToLayer,
    getHazardHeight,
    getHazardCeilingHeight,
    getGroundHeight,
    renderBackground,
    renderForeground,
    clearSprites,
    updateLayerSprite,
    updateLayerSprites,
    clearLayers,
    setCheckpoint,
    applyCheckpointToState,
};

const { getFieldWorldStart, CHECK_POINT_FIELD_START} = require('areas/field');
// require('areas/forestLower');
// require('areas/forestUpper');
const { getEnemyHitBox } = require('enemies');
const { getHeroHitBox } = require('heroes');
