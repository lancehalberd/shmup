
const { FRAME_LENGTH, GAME_HEIGHT, WIDTH, HUD_HEIGHT } = require('gameConstants');

const Rectangle = require('Rectangle');

const random = require('random');

const {
    drawImage,
    drawTintedImage,
    embossText,
} = require('draw');

const {
    backgroundSky,
    plainsBackground,
    plainsMidground,
    plainsNearground,
    requireImage,
    getFrame,
    createFrames,
} = require('animations');

const { getNewSpriteState } = require('sprites');

const getNewLayer = ({animation, xFactor, yFactor, yOffset, maxY, spriteData}) => ({
    sprites: [],
    animation, spriteData,
    xFactor, yFactor, yOffset,
    maxY,
});

const getNewWorld = () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    groundHeight: 30,
    background: getNewLayer({
        xFactor: 0, yFactor: 0.2, yOffset: -100, maxY: 0,
        animation: {frames: [plainsBg], frameDuration: 1},
    }),
    midgroundA: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: -20,
        // animation: {frames: [plainsMidground], frameDuration: 1}
        spriteData: {
            wheatBunch: {animation: wheatAnimation, scale: 4, next: ['wheatCouple'], offset: [-140, -120]},
            wheatCouple: {animation: wheatAnimation, scale: 5, next: ['wheat'], offset: [-100, -80]},
            wheat: {animation: wheatAnimation, scale: 4, next: ['wheatBunch'], offset: [-40, 400]},
        },
    }),
    midgroundB: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: -20,
        spriteData: {
            darkGrass: {animation: darkGrass, scale: 1.75, next: ['darkGrass'], offset: [-40, -20]},
        },
    }),
    midgroundC: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: 0,
        spriteData: {
            thickGrass: {animation: thickGrass, scale: 1.75, next: ['thickGrass'], offset: [-40, -20]},
        },
    }),
    midgroundD: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: -20,
        spriteData: {
            clover: {animation: cloverAnimation, scale: 1, next: ['clover'], offset: [-40, -20, 200]},
        },
    }),
    nearground: {...getNewLayer({
            xFactor: 1, yFactor: 0.5, yOffset: -15,
            spriteData: {
                dandyA: {animation: dandyAAnimation, onHit: onHitDandy, scale: 2, next: ['dandyB', 'dandyC', 'leaves', 'grassOrBerries'], offset: 80},
                dandyB: {animation: dandyBAnimation, onHit: onHitDandy, scale: 2, next: ['leaves'], offset: -20},
                dandyC: {animation: dandyCAnimation, onHit: onHitDandy, scale: 2, next: ['dandyA', 'leaves', 'grassOrBerries'], offset: 100},
                leaves: {animation: [leavesAnimation, smallCloverAnimation], scale: 2, next: ['dandyA', 'dandyC', 'leaves', 'grassOrBerries'], offset: -20},
                grassOrBerries: {animation: [grassAnimation, grass2Animation, grass3Animation, berriesAnimation], scale: 2, next: ['grassOrBerries', 'dandyB', 'leaves'], offset: 0},
            },
        }),
        sprites: [getNewSpriteState({
            ...townAnimation.frames[0],
            top: 263,
            left: -10,
            offset: 50,
            animation: townAnimation,
            next: ['grassOrBerries'],
        })]
    },
    foreground: getNewLayer({
        xFactor: 1, yFactor: 0.5, yOffset: 25,
        spriteData: {
            grass: {animation: grassTuft, scale: 1.5, next: ['grass'], offset: [-10, 400, 550, 610]},
        },
    }),
    bgLayerNames: ['background',],
    mgLayerNames: ['midgroundA', 'midgroundB', 'midgroundC', 'midgroundD'],
    ngLayerNames: ['nearground'],
    fgLayerNames: ['foreground'],
    targetX: 1000,
    targetY: 0,
    targetFrames: 50 * 10,
    time: 0,
    bgm: 'bgm/area.mp3',
});
/*
Add new background elements
try switching the BG file to the new static background (John may hate this)
Adjusting and adding the new midground and foreground elements to spawn at various rates
If it doesn’t look good, skip the midground assets
Adding the animated foreground elements that interact with enemys/player
Tufts of grass
Dandelions
*/
const i = (width, height, source) => ({left: 0, top: 0, width, height, image: requireImage(source)});
const r = (width, height, props) => ({left: 0, top: 0, width, height, ...props});
const plainsBg = i(800, 800, 'gfx/scene/plainsbg.png');
const groundLoop = i(200, 60, 'gfx/scene/groundloop.png')

const dandyHitBox = r(36, 36, {left: 7});
const dandyRectangle = r(80, 98, {hitBox: dandyHitBox});
const townAnimation = {
    frames: [{...r(300, 300), image: requireImage('gfx/scene/town.png')}],
    frameDuration: 1,
};
const dandyAAnimation = {
    frames: [
        {...dandyRectangle, image: requireImage('gfx/scene/dandyidleabc.png')},
        {...dandyRectangle, left: 80, image: requireImage('gfx/scene/dandyidleabc.png')},
    ],
    frameDuration: 30,
};
const dandyAPoofAnimation = {
    frames: createFrames(dandyRectangle, 6, 'gfx/scene/dandya.png'), frameDuration: 8, loop: false,
};
const dandyBAnimation = {
    frames: [
        {...dandyRectangle, left: 160, image: requireImage('gfx/scene/dandyidleabc.png')},
        {...dandyRectangle, left: 240, image: requireImage('gfx/scene/dandyidleabc.png')},
    ],
    frameDuration: 30,
};
const dandyBPoofAnimation = {
    frames: createFrames(dandyRectangle, 6, 'gfx/scene/dandyb.png'), frameDuration: 8, loop: false,
};
const dandyCAnimation = {
    frames: [
        {...dandyRectangle, left: 320, image: requireImage('gfx/scene/dandyidleabc.png')},
        {...dandyRectangle, left: 400, image: requireImage('gfx/scene/dandyidleabc.png')},
    ],
    frameDuration: 30,
};
const dandyCPoofAnimation = {
    frames: createFrames(dandyRectangle, 6, 'gfx/scene/dandyc.png'), frameDuration: 8, loop: false,
};
const grassTuftRectangle = r(92, 64);
const grassTuft = {
    frames: [
        {...grassTuftRectangle, image: requireImage('gfx/scene/tuft.png')},
        {...grassTuftRectangle, left: 184, image: requireImage('gfx/scene/tuft.png')},
        {...grassTuftRectangle, left: 92, image: requireImage('gfx/scene/tuft.png')},
        {...grassTuftRectangle, left: 184, image: requireImage('gfx/scene/tuft.png')},
    ],
    frameDuration: 20,
};

const onHitDandy = (state, layerName, spriteIndex) => {
    let world = state.world;
    let layer = world[layerName];
    let sprites = [...layer.sprites];
    const sprite = sprites[spriteIndex];
    let newAnimation = dandyAPoofAnimation;
    if (sprite.animation === dandyBAnimation) {
        newAnimation = dandyBPoofAnimation;
    } else if (sprite.animation === dandyCAnimation) {
        newAnimation = dandyCPoofAnimation;
    }
    sprites[spriteIndex] = {...sprite, animation: newAnimation, onHit: null, animationTime: FRAME_LENGTH * newAnimation.frameDuration};
    layer = {...layer, sprites};
    world = {...world, [layerName]: layer};
    return {...state, world};
};

const grassAnimation = {
    frames: [
        r(122, 52, {'image': requireImage('gfx/scene/plainsfg1.png')})
    ],
    frameDuration: 30,
};
const grass2Animation = {
    frames: [
        r(110, 51, {'image': requireImage('gfx/scene/plainsfg4.png')})
    ],
    frameDuration: 30,
};
const grass3Animation = {
    frames: [
        r(122, 52, {'image': requireImage('gfx/scene/plainsfg5.png')})
    ],
    frameDuration: 30,
};
const smallCloverAnimation = {
    frames: [
        r(69, 38, {'image': requireImage('gfx/scene/plainsfg6.png')})
    ],
    frameDuration: 30,
};
const leavesAnimation = {
    frames: [
        r(200, 100, {'image': requireImage('gfx/scene/plainsfg2.png')})
    ],
    frameDuration: 30,
};
const berriesAnimation = {
    frames: [
        r(200, 100, {'image': requireImage('gfx/scene/plainsfg3.png')})
    ],
    frameDuration: 30,
};
const cloverAnimation = {
    frames: [
        r(318, 86, {'image': requireImage('gfx/scene/plainsmg4.png')})
    ],
    frameDuration: 30,
};
const wheatAnimation = {
    frames: [
        r(200, 100, {'image': requireImage('gfx/scene/plainsmg1.png')})
    ],
    frameDuration: 30,
};
const thickGrass = {
    frames: [
        r(300, 300, {'image': requireImage('gfx/scene/plainsmg.png')})
    ],
    frameDuration: 30,
};
const darkGrass = {
    frames: [
        r(300, 300, {'image': requireImage('gfx/scene/plainsmg2.png')})
    ],
    frameDuration: 30,
};
const lightGrass = {
    frames: [
        r(300, 300, {'image': requireImage('gfx/scene/plainsmg3.png')})
    ],
    frameDuration: 30,
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
    while ((!lastSprite || lastSprite.left < WIDTH) && safety++ < 20) {
        const spriteData = lastSprite ? elementsData[random.element(lastSprite.next)] : random.element(elementsData);
        if (!spriteData) {
            throw new Error('missing sprite date from one of: ' + lastSprite.next);
        }
        let {animation, scale} = spriteData;
        if (Array.isArray(animation)) {
            animation = random.element(animation);
        }
        let offset = lastSprite ? lastSprite.offset : 0;
        if (Array.isArray(offset)) {
            offset = random.element(offset);
        }
        if (lastSprite) {
            offset *= (lastSprite.scale || 1);
            offset += lastSprite.left + lastSprite.width;
        }
        newSprite = getNewSpriteState({
            ...animation.frames[0],
            top: getGroundHeight(state) + layer.yOffset,
            left: offset,
            ...spriteData,
            animation,
        });
        newSprite.height *= scale;
        newSprite.width *= scale;
        newSprite.top -= newSprite.height;
        if (!lastSprite) newSprite.left -= newSprite.width / 2; // Start with the first sprite half off of the screen.
        layer.sprites = [...layer.sprites, newSprite];
        lastSprite = newSprite;
    }
    world = {...world, [layerName]: layer};
    return {...state, world};
};

const advanceLayer = (state, layerName) => {
    let layer = {...state.world[layerName]};
    let sprites = [...layer.sprites];
    for (let i = 0; i < sprites.length; i++) {
        const sprite = sprites[i];
        sprites[i] = {
            ...sprite,
            left: sprite.left + sprite.vx - state.world.vx * layer.xFactor,
            top: sprite.top + sprite.vy + state.world.vy * layer.yFactor,
            animationTime: sprite.animationTime + FRAME_LENGTH,
        };
        if (sprites[i].onHit) {
            const frame = getFrame(sprites[i].animation, sprites[i].animationTime);
            const hitBox = new Rectangle(frame.hitBox || frame).scale(sprites[i].scale).moveTo(sprites[i].left, sprites[i].top);
            for (const attack of state.playerAttacks) {
                if (Rectangle.collision(hitBox, attack)) {
                    state = sprites[i].onHit(state, layerName, i);
                    layer = {...state.world[layerName]};
                    sprites = [...layer.sprites];
                    break;
                }
            }
        }
    }
    sprites = sprites.filter(sprite => sprite.left + sprite.width > 0);
    const world = {...state.world, [layerName]: {...layer, sprites}};
    return {...state, world };
};

const advanceWorld = (state) => {
    let world = state.world;
    let {x, y, vx, vy, targetX, targetY, targetFrames, time} = world
    x += vx;
    y += vy;
    y = Math.max(0, y);
    targetFrames--;
    const targetVx = (targetX - x) / targetFrames;
    vx = (targetVx + vx) / 2;
    const targetVy = (targetY - y) / targetFrames;
    //vy = (targetVy + vy) / 2;
    vy = Math.max((targetVy + vy) / 2, -y);
    world = {...world, x, y, vx, vy};
    state = {...state, world};

    for (const layerName of world.bgLayerNames) {
        state = addElementToLayer(state, layerName);
        state = advanceLayer(state, layerName);
    }
    for (const layerName of world.mgLayerNames) {
        state = addElementToLayer(state, layerName);
        state = advanceLayer(state, layerName);
    }
    for (const layerName of world.ngLayerNames) {
        state = addElementToLayer(state, layerName);
        state = advanceLayer(state, layerName);
    }
    for (const layerName of world.fgLayerNames) {
        state = addElementToLayer(state, layerName);
        state = advanceLayer(state, layerName);
    }
    world = state.world;

    // For now just set the targetFrame and destination constantly ahead.
    // Later we can change this depending on the scenario.
    targetFrames = 50 * 5;
    targetX = x + 1000;
    if (time % 60000 > 45000) {
        targetY = y;
    } else if (time % 60000 > 30000) {
        targetY = 400;
    } else if (time % 60000 > 15000) {
        targetY = y;
    } else {
        targetY = -100;
    }
    time += FRAME_LENGTH;
    world = {...world, targetX, targetY, targetFrames, time};
    return {...state, world};
};

const getGroundHeight = (state) => {
    return GAME_HEIGHT - state.world.groundHeight + state.world.y * state.world.nearground.yFactor;
};


const renderBackgroundLayer = (context, {frame, x, y, maxY}) => {
    x = Math.round(x);
    y = Math.round(y);
    if (typeof maxY === 'number') {
        y = Math.min(maxY, y);
    }
    const left = (x) % frame.width;
    const right = (x + WIDTH) % frame.width;
    if (right <= left) {
        let leftWidth = frame.width - left;
        context.drawImage(frame.image, left, 0, leftWidth, frame.height,
            0, y, leftWidth, frame.height);
        context.drawImage(frame.image, 0, 0, right, frame.height,
            leftWidth, y, right, frame.height);
    } else {
        context.drawImage(frame.image, left, 0, frame.width, frame.height,
            0, y, frame.width, frame.height);
    }
};
const renderBackground = (context, state) => {
    const world = state.world;
    const {
        x, y,
    } = world;
    for (const layerName of world.bgLayerNames) {
        renderLayer(context, state, layerName);
    }
    context.save();
    context.translate(0, HUD_HEIGHT);
    for (const layerName of world.mgLayerNames) {
        renderLayer(context, state, layerName);
    }
    const groundHeight = getGroundHeight(state)
    let target = new Rectangle(groundLoop).moveTo(-(x * world.nearground.xFactor % groundLoop.width), groundHeight - groundLoop.height / 2);
    if (target.top < GAME_HEIGHT) {
        let safety = 0;
        while (target.left >= -10000 && target.left < WIDTH && safety++ < 10) {
            drawImage(context, groundLoop.image, groundLoop, target);
            target = target.translate(groundLoop.width, 0);
        }
    }
    for (const layerName of world.ngLayerNames) {
        renderLayer(context, state, layerName);
    }
    context.restore();
};

const renderForeground = (context, state) => {
    context.save();
    context.translate(0, HUD_HEIGHT);
    for (const layerName of state.world.fgLayerNames) {
        renderLayer(context, state, layerName);
    }
    context.restore();
};

const renderLayer = (context, state, layerName) => {
    const layer = state.world[layerName];
    let frame;
    if (layer.animation) {
        frame = getFrame(layer.animation, state.world.time);
        renderBackgroundLayer(context, {frame,
            x: state.world.x * layer.xFactor + (layer.xOffset || 0),
            y: state.world.y * layer.yFactor + (layer.yOffset || 0),
        });
    }
    for (const sprite of layer.sprites) {
        frame = getFrame(sprite.animation, sprite.animationTime);
        drawImage(context, frame.image, frame, sprite);
    }
};


module.exports = {
    getNewWorld,
    advanceWorld,
    getGroundHeight,
    renderBackground,
    renderForeground,
};
