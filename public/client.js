(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Rectangle = function () {
    _createClass(Rectangle, null, [{
        key: 'defineByCenter',
        value: function defineByCenter(x, y, width, height) {
            return new Rectangle(x - width / 2, y - height / 2, width, height);
        }
    }, {
        key: 'defineFromPoints',
        value: function defineFromPoints(A, B) {
            // convert arrays to objects.
            if (A.length) A = { x: A[0], y: A[1] };
            if (B.length) B = { x: B[0], y: B[1] };
            return new Rectangle(Math.min(A.x, B.x), Math.min(A.y, B.y), Math.abs(A.x - B.x), Math.abs(A.y - B.y));
        }
    }, {
        key: 'defineFromElement',
        value: function defineFromElement($element) {
            return new Rectangle($element.offset().left, $element.offset().top, $element.outerWidth(true), $element.outerHeight(true));
        }

        // Image needs to be loaded already.

    }, {
        key: 'defineFromImage',
        value: function defineFromImage(image) {
            return new Rectangle(0, 0, image.width, image.height);
        }
    }, {
        key: 'collision',
        value: function collision(A, B) {
            return !(A.top + A.height <= B.top || A.top >= B.top + B.height || A.left + A.width <= B.left || A.left >= B.left + B.width);
        }
    }]);

    function Rectangle() {
        var left = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var top = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

        _classCallCheck(this, Rectangle);

        if ((typeof left === 'undefined' ? 'undefined' : _typeof(left)) === 'object') {
            top = left.top || 0;
            width = left.width || 0;
            height = left.height || 0;
            left = left.left || 0;
        }
        this.left = left;
        this.top = top;
        // Don't allow negative width/height. Update left/top so
        // that width/height are always positive.
        if (width <= 0) {
            width *= -1;
            this.left -= width;
        }
        this.width = width;
        if (height <= 0) {
            height *= -1;
            this.top -= height;
        }
        this.height = height;
        this.right = left + width;
        this.bottom = top + height;
    }

    _createClass(Rectangle, [{
        key: 'snap',
        value: function snap() {
            return new Rectangle(Math.round(this.left), Math.round(this.top), Math.round(this.width), Math.round(this.height));
        }
    }, {
        key: 'translate',
        value: function translate(dx, dy) {
            return new Rectangle(this.left + dx, this.top + dy, this.width, this.height);
        }
    }, {
        key: 'moveTo',
        value: function moveTo(x, y) {
            return new Rectangle(x, y, this.width, this.height);
        }
    }, {
        key: 'moveCenterTo',
        value: function moveCenterTo(x, y) {
            return this.moveTo(x - this.width / 2, y - this.height / 2);
        }
    }, {
        key: 'resize',
        value: function resize(width, height) {
            return new Rectangle(this.left, this.top, width, height);
        }
    }, {
        key: 'pad',
        value: function pad(padding) {
            return new Rectangle(this.left - padding, this.top - padding, this.width + 2 * padding, this.height + 2 * padding);
        }
    }, {
        key: 'scale',
        value: function scale(_scale) {
            return new Rectangle(this.left * _scale, this.top * _scale, this.width * _scale, this.height * _scale);
        }
    }, {
        key: 'scaleFromCenter',
        value: function scaleFromCenter(scale) {
            var center = this.getCenter();
            return this.moveCenterTo(0, 0).scale(scale).moveCenterTo(center[0], center[1]);
        }
    }, {
        key: 'stretch',
        value: function stretch(scaleX, scaleY) {
            return new Rectangle(this.left * scaleX, this.top * scaleY, this.width * scaleX, this.height * scaleY);
        }
    }, {
        key: 'stretchFromCenter',
        value: function stretchFromCenter(scaleX, scaleY) {
            var center = this.getCenter();
            return this.moveCenterTo(0, 0).stretch(scaleX, scaleY).moveCenterTo(center[0], center[1]);
        }
    }, {
        key: 'getCenter',
        value: function getCenter() {
            return [this.left + this.width / 2, this.top + this.height / 2];
        }
    }, {
        key: 'containsPoint',
        value: function containsPoint(x, y) {
            return !(y < this.top || y > this.bottom || x < this.left || x > this.right);
        }

        // By default overlapping at a single point counts, but if includeBoundary is false, then the overlap counts
        // only if the overlapping area has positive area,

    }, {
        key: 'overlapsRectangle',
        value: function overlapsRectangle(rectangle) {
            var includeBoundary = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            if (includeBoundary) {
                return !(this.bottom < rectangle.top || this.top > rectangle.bottom || this.right < rectangle.left || this.left > rectangle.right);
            }
            return !(this.bottom <= rectangle.top || this.top >= rectangle.bottom || this.right <= rectangle.left || this.left >= rectangle.right);
        }
    }]);

    return Rectangle;
}();

module.exports = Rectangle;

},{}],2:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('gameConstants'),
    FRAME_LENGTH = _require.FRAME_LENGTH;

var assetVersion = assetVersion || 0.4;
var images = {};
function loadImage(source, callback) {
    images[source] = new Image();
    images[source].onload = function () {
        return callback();
    };
    images[source].src = source + '?v=' + assetVersion;
    images[source].originalSource = source;
    return images[source];
}
var numberOfImagesLeftToLoad = 0;
function requireImage(imageFile) {
    if (images[imageFile]) return images[imageFile];
    numberOfImagesLeftToLoad++;
    return loadImage(imageFile, function () {
        return numberOfImagesLeftToLoad--;
    });
}
var initialImagesToLoad = [];
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
    for (var _iterator = initialImagesToLoad[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var initialImageToLoad = _step.value;

        requireImage(initialImageToLoad);
    }
} catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
} finally {
    try {
        if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
        }
    } finally {
        if (_didIteratorError) {
            throw _iteratorError;
        }
    }
}

var rectangleToFrames = function rectangleToFrames(rectangle, image, numberOfFrames) {
    var frames = [];
    for (var i = 0; i < numberOfFrames; i++) {
        frames[i] = rectangle.moveTo(i * rectangle.width, 0);
        frames[i].image = image;
    }
    return frames;
};

var r = function r(width, height, props) {
    return _extends({ left: 0, top: 0, width: width, height: height }, props);
};

var heroHitBox = { left: 10, top: 15, width: 70, height: 30 };
var heroRectangle = r(88, 56, { hitBox: heroHitBox });
var heroAnimation = {
    frames: [_extends({}, heroRectangle, { image: requireImage('gfx/hero1.png') }), _extends({}, heroRectangle, { image: requireImage('gfx/hero2.png') }), _extends({}, heroRectangle, { image: requireImage('gfx/hero3.png') }), _extends({}, heroRectangle, { image: requireImage('gfx/hero4.png') }), _extends({}, heroRectangle, { image: requireImage('gfx/hero3.png') }), _extends({}, heroRectangle, { image: requireImage('gfx/hero2.png') })],
    frameDuration: 3
};

var blastRectangle = r(20, 7);
var blastStartAnimation = {
    frames: [_extends({}, blastRectangle, { image: requireImage('gfx/attacks/b1.png') })],
    frameDuration: 2
};
var blastLoopAnimation = {
    frames: [_extends({}, blastRectangle, { image: requireImage('gfx/attacks/b2.png') }), _extends({}, blastRectangle, { image: requireImage('gfx/attacks/b3.png') }), _extends({}, blastRectangle, { image: requireImage('gfx/attacks/b4.png') })],
    frameDuration: 2
};

var bulletRectangle = r(14, 15);
var bulletAnimation = {
    frames: [_extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb1.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb2.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb3.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb4.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb5.png') })],
    frameDuration: 2
};

var flyRectangle = r(55, 40);
var flyAnimation = {
    frames: [_extends({}, flyRectangle, { image: requireImage('gfx/enemies/fly1.png') }), _extends({}, flyRectangle, { image: requireImage('gfx/enemies/fly2.png') }), _extends({}, flyRectangle, { image: requireImage('gfx/enemies/fly3.png') }), _extends({}, flyRectangle, { image: requireImage('gfx/enemies/fly4.png') })],
    frameDuration: 3
};
var flyDeathAnimation = {
    frames: [_extends({}, flyRectangle, { image: requireImage('gfx/enemies/flyded.png') })],
    frameDuration: 3
};

var hornetRectangle = r(120, 120);
var hornetHitBox = { left: 0, top: 33, width: 110, height: 87 };
var hornetAnimation = {
    frames: [_extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet1.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet2.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet3.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet4.png') })],
    frameDuration: 3
};
var hornetDeathAnimation = {
    frames: [_extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornetded.png') })],
    frameDuration: 3
};

var flyingAntHitBox = { left: 0, top: 20, width: 35, height: 20 };
var flyingAntRectangle = r(46, 41, { hitBox: flyingAntHitBox });
var flyingAntAnimation = {
    frames: [_extends({}, flyingAntRectangle, { image: requireImage('gfx/enemies/fant1.png') }), _extends({}, flyingAntRectangle, { image: requireImage('gfx/enemies/fant2.png') }), _extends({}, flyingAntRectangle, { image: requireImage('gfx/enemies/fant3.png') }), _extends({}, flyingAntRectangle, { image: requireImage('gfx/enemies/fant4.png') })],
    frameDuration: 3
};
var flyingAntDeathAnimation = {
    frames: [_extends({}, flyingAntRectangle, { image: requireImage('gfx/enemies/fantded.png') })],
    frameDuration: 3
};

var flyingAntSoldierHitBox = { left: 0, top: 4, width: 35, height: 36 };
var flyingAntSoldierRectangle = r(46, 41, { hitBox: flyingAntSoldierHitBox });
var flyingAntSoldierAnimation = {
    frames: [_extends({}, flyingAntSoldierRectangle, { image: requireImage('gfx/enemies/mfant1.png') }), _extends({}, flyingAntSoldierRectangle, { image: requireImage('gfx/enemies/mfant2.png') }), _extends({}, flyingAntSoldierRectangle, { image: requireImage('gfx/enemies/mfant3.png') }), _extends({}, flyingAntSoldierRectangle, { image: requireImage('gfx/enemies/mfant4.png') })],
    frameDuration: 3
};
var flyingAntSoldierDeathAnimation = {
    frames: [_extends({}, flyingAntSoldierRectangle, { image: requireImage('gfx/enemies/mfantded.png') })],
    frameDuration: 3
};

var damageRectangle = r(28, 28);
var damageAnimation = {
    frames: [_extends({}, damageRectangle, { image: requireImage('gfx/effects/dmg1.png') }), _extends({}, damageRectangle, { image: requireImage('gfx/effects/dmg2.png') }), _extends({}, damageRectangle, { image: requireImage('gfx/effects/dmg3.png') }), _extends({}, damageRectangle, { image: requireImage('gfx/effects/dmg4.png') })],
    frameDuration: 3
};

var explosionRectangle = r(50, 39);
var explosionAnimation = {
    frames: [_extends({}, explosionRectangle, { image: requireImage('gfx/effects/dead1.png') }), _extends({}, explosionRectangle, { image: requireImage('gfx/effects/dead2.png') }), _extends({}, explosionRectangle, { image: requireImage('gfx/effects/dead3.png') }), _extends({}, explosionRectangle, { image: requireImage('gfx/effects/dead4.png') })],
    frameDuration: 3
};

var coinRectangle = r(9, 9);
var coinAnimation = {
    frames: [_extends({}, coinRectangle, { image: requireImage('gfx/items/coin1.png') }), _extends({}, coinRectangle, { image: requireImage('gfx/items/coin2.png') }), _extends({}, coinRectangle, { image: requireImage('gfx/items/coin3.png') }), _extends({}, coinRectangle, { image: requireImage('gfx/items/coin4.png') })],
    frameDuration: 5
};

var getFrame = function getFrame(animation, animationTime) {
    var frameIndex = Math.floor(animationTime / (FRAME_LENGTH * (animation.frameDuration || 1)));
    return animation.frames[frameIndex % animation.frames.length];
};
var getHitBox = function getHitBox(animation, animationTime) {
    var frame = getFrame(animation, animationTime);
    return frame.hitBox || frame;
};

var plainsBackground = r(1200, 600, { image: requireImage('gfx/scene/plains_bg.png') });
var plainsMidground = r(2000, 600, { image: requireImage('gfx/scene/plains_mg.png') });
var plainsForeground = r(1200, 600, { image: requireImage('gfx/scene/plains_fg.png') });
var backgroundSky = r(1600, 600, { image: requireImage('gfx/scene/background_sky.png') });

var portraitImage = r(17, 18, { image: requireImage('gfx/lifeportrait.png') });
var lifeAnimation = {
    frames: [_extends({}, portraitImage)],
    frameDuration: 5
};

var selectNeedleImage = r(58, 7, { image: requireImage('gfx/needle.png') });
var startGameImage = r(58, 13, { image: requireImage('gfx/startgame.png') });
var optionsImage = r(43, 13, { image: requireImage('gfx/options.png') });

var gameOverImage = r(82, 30, { image: requireImage('gfx/gameover.png') });

var startImage = r(58, 30, { image: requireImage('gfx/start.png') });

var hudImage = r(800, 36, { image: requireImage('gfx/hud.png') });

module.exports = {
    getFrame: getFrame,
    getHitBox: getHitBox,
    backgroundSky: backgroundSky,
    plainsBackground: plainsBackground,
    plainsMidground: plainsMidground,
    plainsForeground: plainsForeground,
    heroRectangle: heroRectangle,
    heroAnimation: heroAnimation,
    requireImage: requireImage,
    blastRectangle: blastRectangle,
    blastStartAnimation: blastStartAnimation,
    blastLoopAnimation: blastLoopAnimation,
    bulletAnimation: bulletAnimation,
    damageRectangle: damageRectangle,
    damageAnimation: damageAnimation,
    explosionRectangle: explosionRectangle,
    explosionAnimation: explosionAnimation,
    coinRectangle: coinRectangle,
    coinAnimation: coinAnimation,
    lifeAnimation: lifeAnimation,
    flyRectangle: flyRectangle,
    flyAnimation: flyAnimation,
    flyDeathAnimation: flyDeathAnimation,
    hornetRectangle: hornetRectangle,
    hornetAnimation: hornetAnimation,
    hornetDeathAnimation: hornetDeathAnimation,
    flyingAntAnimation: flyingAntAnimation,
    flyingAntDeathAnimation: flyingAntDeathAnimation,
    flyingAntSoldierAnimation: flyingAntSoldierAnimation,
    flyingAntSoldierDeathAnimation: flyingAntSoldierDeathAnimation,
    selectNeedleImage: selectNeedleImage,
    startGameImage: startGameImage,
    optionsImage: optionsImage,
    startImage: startImage,
    portraitImage: portraitImage,
    gameOverImage: gameOverImage,
    hudImage: hudImage
};

},{"gameConstants":7}],3:[function(require,module,exports){
'use strict';

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    HEIGHT = _require.HEIGHT,
    FRAME_LENGTH = _require.FRAME_LENGTH;

var _require2 = require('state'),
    getNewState = _require2.getNewState,
    advanceState = _require2.advanceState,
    applyPlayerActions = _require2.applyPlayerActions;

var render = require('render');

var _require3 = require('keyboard'),
    isKeyDown = _require3.isKeyDown,
    KEY_UP = _require3.KEY_UP,
    KEY_DOWN = _require3.KEY_DOWN,
    KEY_LEFT = _require3.KEY_LEFT,
    KEY_RIGHT = _require3.KEY_RIGHT,
    KEY_SPACE = _require3.KEY_SPACE,
    KEY_ENTER = _require3.KEY_ENTER,
    KEY_R = _require3.KEY_R;

var now = function now() {
    return Date.now();
};

// Currently we only support a single player.
var playerIndex = 0;

var stateQueue = [];
var state = getNewState();

var update = function update() {
    state = applyPlayerActions(state, playerIndex, {
        // Make sure up/down only trigger once per press during the title sequence.
        up: isKeyDown(KEY_UP, state.title), down: isKeyDown(KEY_DOWN, state.title),
        left: isKeyDown(KEY_LEFT), right: isKeyDown(KEY_RIGHT),
        shoot: isKeyDown(KEY_SPACE),
        start: isKeyDown(KEY_ENTER, true)
    });

    if (stateQueue.length && isKeyDown(KEY_R)) {
        state = stateQueue.shift();
    } else {
        state = advanceState(state);
        if (!state.title && !state.paused) {
            stateQueue.unshift(state);
        }
    }

    stateQueue = stateQueue.slice(0, 100);
    //render(state);
    // This is here to help with debugging from console.
    window.state = state;
};
setInterval(update, FRAME_LENGTH);

var renderLoop = function renderLoop() {
    try {
        render(state);
        window.requestAnimationFrame(renderLoop);
    } catch (e) {
        console.log(e);
        debugger;
    }
};
renderLoop();

},{"gameConstants":7,"keyboard":9,"render":11,"state":14}],4:[function(require,module,exports){
'use strict';

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    HEIGHT = _require.HEIGHT;

var drawImage = function drawImage(context, image, source, target) {
    context.drawImage(image, source.left, source.top, source.width, source.height, target.left, target.top, target.width, target.height);
};

var tintCanvas = document.createElement('canvas');
tintCanvas.width = WIDTH;
tintCanvas.height = HEIGHT;
var tintContext = tintCanvas.getContext('2d');
tintContext.imageSmoothingEnabled = false;

var drawTintedImage = function drawTintedImage(context, image, tint, amount, source, target) {
    context.save();
    // First make a solid color in the shape of the image to tint.
    tintContext.save();
    tintContext.fillStyle = tint;
    tintContext.clearRect(0, 0, source.width, source.height);
    tintContext.drawImage(image, source.left, source.top, source.width, source.height, 0, 0, source.width, source.height);
    tintContext.globalCompositeOperation = "source-in";
    tintContext.fillRect(0, 0, source.width, source.height);
    tintContext.restore();
    // Next draw the untinted image to the target.
    context.drawImage(image, source.left, source.top, source.width, source.height, target.left, target.top, target.width, target.height);
    // Finally draw the tint color on top of the target with the desired opacity.
    context.globalAlpha *= amount; // This needs to be multiplicative since we might be drawing a partially transparent image already.
    context.drawImage(tintCanvas, 0, 0, source.width, source.height, target.left, target.top, target.width, target.height);
    context.restore();
};

var embossText = function embossText(context, _ref) {
    var left = _ref.left,
        top = _ref.top,
        text = _ref.text,
        _ref$color = _ref.color,
        color = _ref$color === undefined ? 'white' : _ref$color,
        _ref$backgroundColor = _ref.backgroundColor,
        backgroundColor = _ref$backgroundColor === undefined ? 'black' : _ref$backgroundColor;

    context.fillStyle = backgroundColor;
    context.fillText(text, left + 1, top + 1);
    context.fillStyle = color;
    context.fillText(text, left, top);
};

module.exports = {
    drawImage: drawImage,
    drawTintedImage: drawTintedImage,
    embossText: embossText
};

},{"gameConstants":7}],5:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _effects;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('draw'),
    drawImage = _require.drawImage;

var _require2 = require('gameConstants'),
    FRAME_LENGTH = _require2.FRAME_LENGTH,
    WIDTH = _require2.WIDTH,
    GAME_HEIGHT = _require2.GAME_HEIGHT,
    OFFSCREEN_PADDING = _require2.OFFSCREEN_PADDING,
    EFFECT_DAMAGE = _require2.EFFECT_DAMAGE,
    EFFECT_EXPLOSION = _require2.EFFECT_EXPLOSION;

var _require3 = require('animations'),
    getFrame = _require3.getFrame,
    damageAnimation = _require3.damageAnimation,
    explosionAnimation = _require3.explosionAnimation;

var _require4 = require('sounds'),
    playSound = _require4.playSound;

var effects = (_effects = {}, _defineProperty(_effects, EFFECT_DAMAGE, {
    animation: damageAnimation
}), _defineProperty(_effects, EFFECT_EXPLOSION, {
    animation: explosionAnimation
}), _effects);

var createEffect = function createEffect(type) {
    var frame = effects[type].animation.frames[0];
    return _extends({}, frame, {
        type: type
    });
};

var renderEffect = function renderEffect(context, effect) {
    var frame = getFrame(effects[effect.type].animation, effect.animationTime);
    drawImage(context, frame.image, frame, effect);
    if (effect.sfx) {
        playSound(effect.sfx);
        effect.sfx = false;
    }
};

var advanceEffect = function advanceEffect(state, effect) {
    var left = effect.left,
        top = effect.top,
        width = effect.width,
        height = effect.height,
        vx = effect.vx,
        vy = effect.vy,
        delay = effect.delay,
        duration = effect.duration,
        animationTime = effect.animationTime,
        type = effect.type;

    var animation = effects[type].animation;
    left += vx;
    top += vy;
    animationTime += FRAME_LENGTH;

    var done = animationTime >= FRAME_LENGTH * animation.frames.length * animation.frameDuration || left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING || top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;

    return _extends({}, effect, { left: left, top: top, animationTime: animationTime, done: done });
};

module.exports = {
    createEffect: createEffect,
    advanceEffect: advanceEffect,
    renderEffect: renderEffect
};

},{"animations":2,"draw":4,"gameConstants":7,"sounds":12}],6:[function(require,module,exports){
'use strict';

var _enemyData;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Rectangle = require('Rectangle');

var _require = require('draw'),
    drawImage = _require.drawImage;

var _require2 = require('gameConstants'),
    WIDTH = _require2.WIDTH,
    GAME_HEIGHT = _require2.GAME_HEIGHT,
    FRAME_LENGTH = _require2.FRAME_LENGTH,
    OFFSCREEN_PADDING = _require2.OFFSCREEN_PADDING,
    ENEMY_FLY = _require2.ENEMY_FLY,
    ENEMY_HORNET = _require2.ENEMY_HORNET,
    ENEMY_FLYING_ANT = _require2.ENEMY_FLYING_ANT,
    ENEMY_FLYING_ANT_SOLDIER = _require2.ENEMY_FLYING_ANT_SOLDIER,
    EFFECT_EXPLOSION = _require2.EFFECT_EXPLOSION,
    EFFECT_DAMAGE = _require2.EFFECT_DAMAGE,
    LOOT_COIN = _require2.LOOT_COIN,
    LOOT_LIFE = _require2.LOOT_LIFE;

var _require3 = require('keyboard'),
    isKeyDown = _require3.isKeyDown,
    KEY_SHIFT = _require3.KEY_SHIFT;

var _require4 = require('animations'),
    getFrame = _require4.getFrame,
    getHitBox = _require4.getHitBox,
    flyAnimation = _require4.flyAnimation,
    flyDeathAnimation = _require4.flyDeathAnimation,
    hornetAnimation = _require4.hornetAnimation,
    hornetDeathAnimation = _require4.hornetDeathAnimation,
    flyingAntAnimation = _require4.flyingAntAnimation,
    flyingAntDeathAnimation = _require4.flyingAntDeathAnimation,
    flyingAntSoldierAnimation = _require4.flyingAntSoldierAnimation,
    flyingAntSoldierDeathAnimation = _require4.flyingAntSoldierDeathAnimation,
    bulletAnimation = _require4.bulletAnimation;

var _require5 = require('sprites'),
    getNewSpriteState = _require5.getNewSpriteState;

var _require6 = require('effects'),
    createEffect = _require6.createEffect;

var _require7 = require('loot'),
    createLoot = _require7.createLoot;

var enemyData = (_enemyData = {}, _defineProperty(_enemyData, ENEMY_FLY, {
    animation: flyAnimation,
    deathAnimation: flyDeathAnimation,
    deathSound: 'sfx/flydeath.mp3',
    props: {
        life: 1,
        score: 20
    }
}), _defineProperty(_enemyData, ENEMY_HORNET, {
    animation: hornetAnimation,
    deathAnimation: hornetDeathAnimation,
    deathSound: 'sfx/flydeath.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            seed = enemy.seed,
            targetX = enemy.targetX,
            targetY = enemy.targetY,
            mode = enemy.mode,
            modeTime = enemy.modeTime;

        var theta = Math.PI / 2 + Math.PI * 4 * modeTime / 2000;
        var radius = seed * 2 + 2;
        switch (mode) {
            case 'enter':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vx < 0) vx *= 2;
                if (vx > 0) vx *= .5;
                if (modeTime > 2000) {
                    mode = 'circle';
                    modeTime = 0;
                }
                break;
            case 'circle':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vy > 0 && enemy.top < 50) vy *= 1 + (50 - enemy.top) / 100;
                if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 50) {
                    vy *= 1 + (enemy.top + enemy.height - (GAME_HEIGHT - 50)) / 100;
                }
                if (modeTime > 2000) {
                    mode = 'attack';
                    modeTime = 0;
                }
                break;
            case 'attack':
                if (modeTime === FRAME_LENGTH) {
                    var target = state.players[0].sprite;
                    targetX = target.left + target.width / 2;
                    targetY = target.top + target.height / 2;

                    var _getTargetVector = getTargetVector(enemy, target),
                        dx = _getTargetVector.dx,
                        dy = _getTargetVector.dy;

                    var _theta = Math.atan2(dy, dx);
                    vx = enemy.speed * Math.cos(_theta);
                    vy = enemy.speed * Math.sin(_theta);
                } else {
                    var _getTargetVector2 = getTargetVector(enemy, { left: targetX, top: targetY }),
                        _dx = _getTargetVector2.dx,
                        _dy = _getTargetVector2.dy;

                    if (_dx * vx < 0) {
                        mode = 'retreat';
                        modeTime = 0;
                    }
                }
                break;
            case 'retreat':
                if (modeTime === FRAME_LENGTH) {
                    vx = 0;
                    vy = 0; //-vy;
                } else if (modeTime === 200) {
                    vx = enemy.speed * 1.5;
                } else if (enemy.left + enemy.width / 2 > WIDTH - 100) {
                    mode = 'circle';
                    modeTime = 0;
                }
        }
        modeTime += FRAME_LENGTH;
        return _extends({}, enemy, { targetX: targetX, targetY: targetY, vx: vx, vy: vy, mode: mode, modeTime: modeTime });
    },
    props: {
        life: 30,
        score: 500,
        speed: 10,
        mode: 'enter',
        modeTime: 0,
        permanent: true
    }
}), _defineProperty(_enemyData, ENEMY_FLYING_ANT, {
    animation: flyingAntAnimation,
    deathAnimation: flyingAntDeathAnimation,
    deathSound: 'sfx/flydeath.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            seed = enemy.seed;

        var target = state.players[0].sprite;
        var speed = enemy.speed;
        var dx = target.left + target.width / 2 - (enemy.left + enemy.width / 2);
        var dy = target.top + target.height / 2 - (enemy.top + enemy.height / 2);
        var theta = Math.atan2(dy, dx);
        if (enemy.animationTime === 0) {
            vx = speed * Math.cos(theta);
            vy = speed * Math.sin(theta);
        } else if (enemy.animationTime < 3000) {
            vx = (vx * 20 + speed * Math.cos(theta)) / 21;
            vy = (vy * 20 + speed * Math.sin(theta)) / 21;
        }
        return _extends({}, enemy, { vx: vx, vy: vy });
    },
    props: {
        life: 1,
        score: 30,
        speed: 6
    }
}), _defineProperty(_enemyData, ENEMY_FLYING_ANT_SOLDIER, {
    animation: flyingAntSoldierAnimation,
    deathAnimation: flyingAntSoldierDeathAnimation,
    deathSound: 'sfx/flydeath.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            seed = enemy.seed;

        var speed = enemy.speed;

        var _getTargetVector3 = getTargetVector(enemy, state.players[0].sprite),
            dx = _getTargetVector3.dx,
            dy = _getTargetVector3.dy;

        var theta = Math.atan2(dy, dx);
        if (enemy.animationTime === 0) {
            vx = speed * Math.cos(theta);
            vy = speed * Math.sin(theta);
        } else if (enemy.animationTime < 3000) {
            vx = (vx * 20 + speed * Math.cos(theta)) / 21;
            vy = (vy * 20 + speed * Math.sin(theta)) / 21;
        }
        return _extends({}, enemy, { vx: vx, vy: vy });
    },
    shoot: function shoot(state, enemyIndex) {
        var enemies = [].concat(_toConsumableArray(state.enemies));
        var enemy = enemies[enemyIndex];
        if (enemy.shotCooldown === undefined) {
            enemy.shotCooldown = 20 + Math.floor(100 * Math.random());
        }
        if (enemy.shotCooldown > 0) {
            enemies[enemyIndex] = _extends({}, enemy, { shotCooldown: enemy.shotCooldown - 1 });
            return _extends({}, state, { enemies: enemies });
        } else {
            enemies[enemyIndex] = _extends({}, enemy, { shotCooldown: enemy.shotCooldownFrames });
        }
        var bulletFrame = bulletAnimation.frames[0];
        var attack = getNewSpriteState(_extends({}, bulletFrame, {
            left: enemy.left - enemy.vx,
            top: enemy.top + enemy.vy + Math.round((enemy.height - bulletAnimation.frames[0].height) / 2),
            vx: enemy.vx * 1.3,
            vy: enemy.vy * 1.3
        }));
        return _extends({}, state, { enemies: enemies, newEnemyAttacks: [].concat(_toConsumableArray(state.newEnemyAttacks), [attack]) });
    },
    onDeathEffect: function onDeathEffect(state, enemy) {
        var flyingAnt = createEnemy(ENEMY_FLYING_ANT, {
            left: enemy.left,
            top: enemy.top,
            speed: 9,
            vx: 10,
            vy: Math.random() < .5 ? -5 : 5,
            animationTime: 20
        });
        return addEnemyToState(state, flyingAnt);
    },

    props: {
        life: 2,
        score: 20,
        speed: 5,
        shotCooldownFrames: 200
    }
}), _enemyData);

var createEnemy = function createEnemy(type, props) {
    var frame = enemyData[type].animation.frames[0];
    return getNewSpriteState(_extends({}, frame, enemyData[type].props, {
        type: type,
        seed: Math.random()
    }, props));
};

// Return the value with the smallest absolute value.
var absMin = function absMin(A, B) {
    if (A < 0 && B < 0) return Math.max(A, B);
    if (A > 0 && B > 0) return Math.min(A, B);
    return Math.abs(A) < Math.abs(B) ? A : B;
};

var getTargetVector = function getTargetVector(agent, target) {
    return {
        dx: target.left + (target.width || 0) / 2 - (agent.left + (agent.width || 0) / 2),
        dy: target.top + (target.height || 0) / 2 - (agent.top + (agent.height || 0) / 2)
    };
};

var addEnemyToState = function addEnemyToState(state, enemy) {
    return _extends({}, state, { newEnemies: [].concat(_toConsumableArray(state.newEnemies), [enemy]) });
};

var getEnemyHitBox = function getEnemyHitBox(_ref) {
    var type = _ref.type,
        animationTime = _ref.animationTime,
        left = _ref.left,
        top = _ref.top;

    return new Rectangle(getHitBox(enemyData[type].animation, animationTime)).translate(left, top);
};

var damageEnemy = function damageEnemy(state, enemyIndex, attack) {
    var updatedState = _extends({}, state);
    updatedState.enemies = [].concat(_toConsumableArray(updatedState.enemies));
    updatedState.players = [].concat(_toConsumableArray(updatedState.players));
    updatedState.newEffects = [].concat(_toConsumableArray(updatedState.newEffects));
    var enemy = updatedState.enemies[enemyIndex];
    updatedState.enemies[enemyIndex] = _extends({}, enemy, {
        life: enemy.life - 1,
        dead: enemy.life <= 1,
        animationTime: enemy.life <= 1 ? 0 : enemy.animationTime
    });
    if (updatedState.enemies[enemyIndex].dead) {
        updatedState.players[attack.playerIndex] = _extends({}, updatedState.players[attack.playerIndex], {
            score: updatedState.players[attack.playerIndex].score + enemy.score
        });

        updatedState.spawnDuration = Math.min(2500, updatedState.spawnDuration + 100);
        var explosion = createEffect(EFFECT_EXPLOSION);
        if (enemyData[enemy.type].onDeathEffect) {
            updatedState = enemyData[enemy.type].onDeathEffect(updatedState, enemy);
        }
        updatedState.newEffects.push(getNewSpriteState(_extends({}, explosion, {
            left: enemy.left + (enemy.width - explosion.width) / 2,
            top: enemy.top + (enemy.height - explosion.height) / 2,
            sfx: enemyData[enemy.type].deathSound
        })));
        if (Math.random() < enemy.score / 200) {
            var coin = createLoot(Math.random() < .03 ? LOOT_LIFE : LOOT_COIN);
            updatedState.newLoot.push(getNewSpriteState(_extends({}, coin, {
                left: enemy.left + (enemy.width - coin.width) / 2,
                top: enemy.top + (enemy.height - coin.height) / 2
            })));
        }
    } else {
        var damage = createEffect(EFFECT_DAMAGE);
        updatedState.newEffects.push(getNewSpriteState(_extends({}, damage, {
            left: attack.left + attack.vx + (attack.width - damage.width) / 2,
            top: attack.top + attack.vy + (attack.height - damage.height) / 2,
            sfx: 'sfx/hit.mp3'
        })));
    }
    return updatedState;
};

var renderEnemy = function renderEnemy(context, enemy) {
    var animation = enemyData[enemy.type].animation;
    if (enemy.dead && enemyData[enemy.type].deathAnimation) {
        animation = enemyData[enemy.type].deathAnimation;
    }
    var frame = getFrame(animation, enemy.animationTime);
    context.save();
    if (enemy.dead) {
        context.globalAlpha = .6;
    }
    drawImage(context, frame.image, frame, enemy);
    if (isKeyDown(KEY_SHIFT)) {
        var hitBox = getEnemyHitBox(enemy);
        context.globalAlpha = .6;
        context.fillStyle = 'red';
        context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
    }
    context.restore();
};

var advanceEnemy = function advanceEnemy(state, enemy) {
    var _enemy = enemy,
        left = _enemy.left,
        top = _enemy.top,
        width = _enemy.width,
        height = _enemy.height,
        delay = _enemy.delay,
        animationTime = _enemy.animationTime;

    left += enemy.vx;
    top += enemy.vy;
    animationTime += FRAME_LENGTH;
    if (enemy.dead) {
        enemy = _extends({}, enemy, { vy: enemy.vy + 1 });
    } else if (enemyData[enemy.type].accelerate) {
        enemy = enemyData[enemy.type].accelerate(state, enemy);
    }
    // cleanup dead enemies or non permanent enemies when they go off the edge of the screen.
    var done = (enemy.dead || !enemy.permanent) && (left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING || top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING);
    return _extends({}, enemy, { left: left, top: top, animationTime: animationTime, done: done });
};

module.exports = {
    enemyData: enemyData,
    createEnemy: createEnemy,
    addEnemyToState: addEnemyToState,
    damageEnemy: damageEnemy,
    advanceEnemy: advanceEnemy,
    renderEnemy: renderEnemy,
    getEnemyHitBox: getEnemyHitBox
};

},{"Rectangle":1,"animations":2,"draw":4,"effects":5,"gameConstants":7,"keyboard":9,"loot":10,"sprites":13}],7:[function(require,module,exports){
'use strict';

module.exports = {
    WIDTH: 800, HEIGHT: 600, GAME_HEIGHT: 564,
    FRAME_LENGTH: 20, OFFSCREEN_PADDING: 40,
    ACCELERATION: 1, MAX_SPEED: 10, SHOT_COOLDOWN: 8,
    ENEMY_COOLDOWN: 10, DEATH_COOLDOWN: 1000, SPAWN_COOLDOWN: 1000, SPAWN_INV_TIME: 2000,

    ENEMY_FLY: 'fly',
    ENEMY_HORNET: 'hornet',
    ENEMY_FLYING_ANT: 'flyingAnt',
    ENEMY_FLYING_ANT_SOLDIER: 'flyingAntSoldier',

    EFFECT_DAMAGE: 'damage', EFFECT_EXPLOSION: 'explosion',
    LOOT_COIN: 'coin', LOOT_LIFE: 'life'
};

},{}],8:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    FRAME_LENGTH = _require.FRAME_LENGTH,
    DEATH_COOLDOWN = _require.DEATH_COOLDOWN,
    SHOT_COOLDOWN = _require.SHOT_COOLDOWN,
    SPAWN_COOLDOWN = _require.SPAWN_COOLDOWN,
    SPAWN_INV_TIME = _require.SPAWN_INV_TIME,
    ACCELERATION = _require.ACCELERATION,
    MAX_SPEED = _require.MAX_SPEED,
    EFFECT_EXPLOSION = _require.EFFECT_EXPLOSION;

var _require2 = require('keyboard'),
    isKeyDown = _require2.isKeyDown,
    KEY_SHIFT = _require2.KEY_SHIFT;

var Rectangle = require('Rectangle');

var _require3 = require('draw'),
    drawImage = _require3.drawImage;

var _require4 = require('sprites'),
    getNewSpriteState = _require4.getNewSpriteState;

var _require5 = require('effects'),
    createEffect = _require5.createEffect;

var _require6 = require('animations'),
    heroAnimation = _require6.heroAnimation,
    getHitBox = _require6.getHitBox,
    getFrame = _require6.getFrame;

var advanceHero = function advanceHero(state, player) {
    var shotCooldown = player.shotCooldown,
        spawnCooldown = player.spawnCooldown,
        invulnerableFor = player.invulnerableFor;
    // Might be nicer to have this closer to the code that generates the shot somehow...

    if (shotCooldown > 0) {
        shotCooldown--;
    } else if (player.actions.shoot) {
        shotCooldown = SHOT_COOLDOWN;
    }
    var _player$sprite = player.sprite,
        top = _player$sprite.top,
        left = _player$sprite.left,
        vx = _player$sprite.vx,
        vy = _player$sprite.vy,
        width = _player$sprite.width,
        height = _player$sprite.height,
        animationTime = _player$sprite.animationTime;

    animationTime += FRAME_LENGTH;
    if (invulnerableFor > 0) {
        invulnerableFor -= FRAME_LENGTH;
    }
    if (spawnCooldown > 0) {
        spawnCooldown -= FRAME_LENGTH;
        left += 4;
        return _extends({}, player, { spawnCooldown: spawnCooldown, invulnerableFor: invulnerableFor, shotCooldown: 1, sprite: _extends({}, player.sprite, { left: left, animationTime: animationTime }) });
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
    var hitBox = getHeroHitBox({ animationTime: animationTime, left: 0, top: 0 });
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
    if (left + hitBox.left + hitBox.width > WIDTH) {
        left = WIDTH - (hitBox.left + hitBox.width);
        vx = 0;
    }

    return _extends({}, player, { shotCooldown: shotCooldown, spawnCooldown: spawnCooldown, invulnerableFor: invulnerableFor, sprite: _extends({}, player.sprite, { left: left, top: top, vx: vx, vy: vy, animationTime: animationTime }) });
};

var damageHero = function damageHero(updatedState, playerIndex) {
    var deathCooldown = updatedState.deathCooldown;
    var players = [].concat(_toConsumableArray(updatedState.players));
    var player = players[playerIndex];
    var sprite = player.sprite;
    players[playerIndex] = _extends({}, player, {
        sprite: _extends({}, sprite, { left: -150, top: 100 }),
        lives: Math.max(0, player.lives - 1),
        done: player.lives <= 0,
        spawnCooldown: SPAWN_COOLDOWN,
        invulnerableFor: SPAWN_INV_TIME
    });
    var explosion = createEffect(EFFECT_EXPLOSION);
    var newEffects = [].concat(_toConsumableArray(updatedState.newEffects), [getNewSpriteState(_extends({}, explosion, {
        left: sprite.left + (sprite.width - explosion.width) / 2,
        top: sprite.top + (sprite.height - explosion.height) / 2
    }))]);
    var sfx = [].concat(_toConsumableArray(updatedState.sfx));
    if (players[playerIndex].done) {
        deathCooldown = DEATH_COOLDOWN;
        sfx.push('sfx/death.mp3');
    } else {
        sfx.push('sfx/exclamation.mp3');
    }
    return _extends({}, updatedState, { deathCooldown: deathCooldown, players: players, sfx: sfx, newEffects: newEffects });
};

var getHeroHitBox = function getHeroHitBox(_ref) {
    var animationTime = _ref.animationTime,
        left = _ref.left,
        top = _ref.top;

    return new Rectangle(getHitBox(heroAnimation, animationTime)).translate(left, top);
};

var renderHero = function renderHero(context, _ref2) {
    var sprite = _ref2.sprite,
        invulnerableFor = _ref2.invulnerableFor,
        done = _ref2.done;

    if (done) return;
    var animation = heroAnimation;
    context.save();
    if (invulnerableFor > 1000) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 40) * .2;
    } else if (invulnerableFor > 400) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 20) * .2;
    } else if (invulnerableFor > 0) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 10) * .2;
    }
    var frame = getFrame(animation, sprite.animationTime);
    drawImage(context, frame.image, frame, sprite);
    context.restore();
    if (isKeyDown(KEY_SHIFT)) {
        var hitBox = getHeroHitBox(sprite);
        context.save();
        context.globalAlpha = .6;
        context.fillStyle = 'green';
        context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
        context.restore();
    }
};

module.exports = {
    advanceHero: advanceHero,
    getHeroHitBox: getHeroHitBox,
    damageHero: damageHero,
    renderHero: renderHero
};

},{"Rectangle":1,"animations":2,"draw":4,"effects":5,"gameConstants":7,"keyboard":9,"sprites":13}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _KEY_MAPPINGS, _GAME_PAD_MAPPINGS;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var KEY_LEFT = exports.KEY_LEFT = 37;
var KEY_RIGHT = exports.KEY_RIGHT = 39;
var KEY_UP = exports.KEY_UP = 38;
var KEY_DOWN = exports.KEY_DOWN = 40;
var KEY_SPACE = exports.KEY_SPACE = 32;
var KEY_SHIFT = exports.KEY_SHIFT = 16;
var KEY_ENTER = exports.KEY_ENTER = 13;
var KEY_BACK_SPACE = exports.KEY_BACK_SPACE = 8;
var KEY_E = exports.KEY_E = 'E'.charCodeAt(0);
var KEY_G = exports.KEY_G = 'G'.charCodeAt(0);
var KEY_R = exports.KEY_R = 'R'.charCodeAt(0);

var KEY_MAPPINGS = (_KEY_MAPPINGS = {}, _defineProperty(_KEY_MAPPINGS, 'A'.charCodeAt(0), KEY_LEFT), _defineProperty(_KEY_MAPPINGS, 'D'.charCodeAt(0), KEY_RIGHT), _defineProperty(_KEY_MAPPINGS, 'W'.charCodeAt(0), KEY_UP), _defineProperty(_KEY_MAPPINGS, 'S'.charCodeAt(0), KEY_DOWN), _KEY_MAPPINGS);

// This mapping assumes a canonical gamepad setup as seen in:
// https://w3c.github.io/gamepad/#remapping
// Which seems to work well with my xbox 360 controller.
// I based this code on examples from:
// https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
// Easy to find mappings at: http://html5gamepad.com/
var GAME_PAD_MAPPINGS = (_GAME_PAD_MAPPINGS = {}, _defineProperty(_GAME_PAD_MAPPINGS, KEY_SPACE, 2), _defineProperty(_GAME_PAD_MAPPINGS, KEY_ENTER, 9), _defineProperty(_GAME_PAD_MAPPINGS, KEY_UP, 12), _defineProperty(_GAME_PAD_MAPPINGS, KEY_DOWN, 13), _defineProperty(_GAME_PAD_MAPPINGS, KEY_LEFT, 14), _defineProperty(_GAME_PAD_MAPPINGS, KEY_RIGHT, 15), _defineProperty(_GAME_PAD_MAPPINGS, KEY_R, 4), _defineProperty(_GAME_PAD_MAPPINGS, KEY_SHIFT, 5), _GAME_PAD_MAPPINGS);

var physicalKeysDown = {};
var keysDown = {};

// Apparently, depending on the button type, either button.pressed or button == 1.0 indicates the button is pressed.
function buttonIsPressed(button) {
    if ((typeof button === 'undefined' ? 'undefined' : _typeof(button)) == "object") return button.pressed;
    return button == 1.0;
}

window.document.onkeydown = function (event) {
    //console.log(event);
    // Don't process this if the key is already down.
    if (physicalKeysDown[event.which]) return;
    physicalKeysDown[event.which] = true;
    var mappedKeyCode = KEY_MAPPINGS[event.which] || event.which;
    keysDown[mappedKeyCode] = (keysDown[mappedKeyCode] || 0) + 1;
    //console.log(keysDown[mappedKeyCode]);
};

window.document.onkeyup = function (event) {
    physicalKeysDown[event.which] = false;
    var mappedKeyCode = KEY_MAPPINGS[event.which] || event.which;
    keysDown[mappedKeyCode] = Math.max(0, (keysDown[mappedKeyCode] || 0) - 1);
    //console.log(keysDown[mappedKeyCode]);
};

var lastButtonsPressed = {};
// Release can be set to true to pretend the key is released after reading it.
// This only works for keyboard keys.
var isKeyDown = exports.isKeyDown = function isKeyDown(keyCode) {
    var release = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (keysDown[keyCode]) {
        if (release) {
            keysDown[keyCode] = 0;
        }
        return true;
    }
    // If a mapping exists for the current key code to a gamepad button,
    // check if that gamepad button is pressed.
    var buttonIndex = GAME_PAD_MAPPINGS[keyCode];
    if (typeof buttonIndex !== 'undefined') {
        // There can be multiple game pads connected. For now, let's just check all of them for the button.
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads : [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = gamepads[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var gamepad = _step.value;

                if (!gamepad) continue;
                if (buttonIsPressed(gamepad.buttons[buttonIndex])) {
                    var wasPressed = lastButtonsPressed[buttonIndex];
                    lastButtonsPressed[buttonIndex] = true;
                    if (!release || !wasPressed) return true;
                } else {
                    lastButtonsPressed[buttonIndex] = false;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }
    return false;
};

},{}],10:[function(require,module,exports){
'use strict';

var _lootData;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('draw'),
    drawImage = _require.drawImage,
    drawTintedImage = _require.drawTintedImage;

var Rectangle = require('Rectangle');

var _require2 = require('gameConstants'),
    FRAME_LENGTH = _require2.FRAME_LENGTH,
    WIDTH = _require2.WIDTH,
    GAME_HEIGHT = _require2.GAME_HEIGHT,
    OFFSCREEN_PADDING = _require2.OFFSCREEN_PADDING,
    LOOT_COIN = _require2.LOOT_COIN,
    LOOT_LIFE = _require2.LOOT_LIFE;

var _require3 = require('animations'),
    getFrame = _require3.getFrame,
    coinAnimation = _require3.coinAnimation,
    lifeAnimation = _require3.lifeAnimation;

var _require4 = require('sounds'),
    playSound = _require4.playSound;

var lootData = (_lootData = {}, _defineProperty(_lootData, LOOT_COIN, {
    animation: coinAnimation,
    collect: function collect(player, loot) {
        return _extends({}, player, { score: player.score + 50 });
    },

    sfx: 'sfx/coin.mp3',
    scale: 2
}), _defineProperty(_lootData, LOOT_LIFE, {
    animation: lifeAnimation,
    accelerate: function accelerate(state, loot) {
        var vx = loot.vx,
            vy = loot.vy,
            seed = loot.seed;

        var theta = loot.animationTime / 300;
        var radius = 2;
        vx = radius * Math.cos(theta);
        vy = radius * Math.sin(theta);
        return _extends({}, loot, { vx: vx, vy: vy });
    },
    collect: function collect(player, loot) {
        return _extends({}, player, { lives: player.lives + 1 });
    },
    draw: function draw(context, loot) {
        var frame = getFrame(lootData[loot.type].animation, loot.animationTime);
        drawTintedImage(context, frame.image, 'white', .5 + .5 * Math.cos(loot.animationTime / 50), frame, loot);
    },

    sfx: 'sfx/heal.mp3',
    scale: 1
}), _lootData);

var createLoot = function createLoot(type) {
    var frame = lootData[type].animation.frames[0];
    return _extends({}, new Rectangle(frame).scale(lootData[type].scale || 1), {
        type: type
    });
};

var renderLoot = function renderLoot(context, loot) {
    if (lootData[loot.type].draw) {
        lootData[loot.type].draw(context, loot);
    } else {
        var frame = getFrame(lootData[loot.type].animation, loot.animationTime);
        drawImage(context, frame.image, frame, loot);
    }
    if (loot.sfx) {
        playSound(loot.sfx);
        loot.sfx = false;
    }
};

var advanceLoot = function advanceLoot(state, loot) {
    var _loot = loot,
        left = _loot.left,
        top = _loot.top,
        width = _loot.width,
        height = _loot.height,
        vx = _loot.vx,
        vy = _loot.vy,
        delay = _loot.delay,
        duration = _loot.duration,
        animationTime = _loot.animationTime,
        type = _loot.type;

    var data = lootData[type];
    var animation = data.animation;
    left += vx - state.world.vx;
    top += vy + state.world.vy;
    animationTime += FRAME_LENGTH;
    if (data.accelerate) {
        loot = data.accelerate(state, loot);
    }

    var done = left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING || top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;

    return _extends({}, loot, { left: left, top: top, animationTime: animationTime, done: done });
};

module.exports = {
    lootData: lootData,
    createLoot: createLoot,
    advanceLoot: advanceLoot,
    renderLoot: renderLoot
};

},{"Rectangle":1,"animations":2,"draw":4,"gameConstants":7,"sounds":12}],11:[function(require,module,exports){
'use strict';

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    HEIGHT = _require.HEIGHT,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    FRAME_LENGTH = _require.FRAME_LENGTH,
    DEATH_COOLDOWN = _require.DEATH_COOLDOWN;

var Rectangle = require('Rectangle');

var _require2 = require('draw'),
    drawImage = _require2.drawImage,
    drawTintedImage = _require2.drawTintedImage,
    embossText = _require2.embossText;

var _require3 = require('sounds'),
    playSound = _require3.playSound,
    playTrack = _require3.playTrack,
    stopTrack = _require3.stopTrack;

var _require4 = require('keyboard'),
    isKeyDown = _require4.isKeyDown,
    KEY_R = _require4.KEY_R;

var _require5 = require('animations'),
    backgroundSky = _require5.backgroundSky,
    plainsBackground = _require5.plainsBackground,
    plainsMidground = _require5.plainsMidground,
    plainsForeground = _require5.plainsForeground,
    blastStartAnimation = _require5.blastStartAnimation,
    blastLoopAnimation = _require5.blastLoopAnimation,
    bulletAnimation = _require5.bulletAnimation,
    explosionAnimation = _require5.explosionAnimation,
    selectNeedleImage = _require5.selectNeedleImage,
    startGameImage = _require5.startGameImage,
    optionsImage = _require5.optionsImage,
    startImage = _require5.startImage,
    portraitImage = _require5.portraitImage,
    gameOverImage = _require5.gameOverImage,
    hudImage = _require5.hudImage,
    getHitBox = _require5.getHitBox,
    getFrame = _require5.getFrame;

var _require6 = require('heroes'),
    renderHero = _require6.renderHero;

var _require7 = require('loot'),
    renderLoot = _require7.renderLoot;

var _require8 = require('enemies'),
    renderEnemy = _require8.renderEnemy;

var _require9 = require('effects'),
    renderEffect = _require9.renderEffect;

var canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
var context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
document.body.appendChild(canvas);

var HUD_PADDING = 9;

var rewindAlpha = 1;
var render = function render(state) {
    if (state.world.bgm) {
        playTrack(state.world.bgm, state.world.time);
        state.world.bgm = false;
    }
    if (state.title) {
        renderTitle(context, state);
        return;
    }
    if (state.gameover) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, WIDTH, HEIGHT);
        drawImage(context, gameOverImage.image, gameOverImage, new Rectangle(gameOverImage).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2));
        return;
    }
    context.save();
    if (isKeyDown(KEY_R)) {
        rewindAlpha = Math.max(0.05, rewindAlpha - .06);
    } else {
        rewindAlpha = Math.min(1, rewindAlpha + .02);
    }
    context.globalAlpha = rewindAlpha;
    renderBackground(state.world);
    context.globalAlpha = 1;

    context.save();
    context.translate(0, hudImage.height);
    state.playerAttacks.map(renderPlayerAttack);
    state.enemies.map(function (enemy) {
        return renderEnemy(context, enemy);
    });
    state.loot.map(function (loot) {
        return renderLoot(context, loot);
    });
    state.effects.map(function (effect) {
        return renderEffect(context, effect);
    });
    // Thinking an attack shuold display on top of other effects so it can be avoided.
    state.enemyAttacks.map(renderEnemyAttack);
    state.players.map(function (hero) {
        return renderHero(context, hero);
    });
    context.restore();

    renderForeground(state.world);
    context.restore();

    drawImage(context, hudImage.image, hudImage, hudImage);
    drawImage(context, portraitImage.image, portraitImage, new Rectangle(portraitImage).moveTo(HUD_PADDING, HUD_PADDING));
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.font = "20px sans-serif";
    embossText(context, {
        text: 'x ' + state.players[0].lives,
        left: HUD_PADDING + portraitImage.width + HUD_PADDING,
        top: HUD_PADDING + portraitImage.height / 2 + 1,
        backgroundColor: '#AAA'
    });

    context.textAlign = 'right';
    embossText(context, {
        text: 'SCORE: ' + state.players[0].score,
        left: WIDTH - HUD_PADDING - 2,
        top: HUD_PADDING + portraitImage.height / 2 + 1,
        backgroundColor: '#AAA'
    });

    if (state.deathCooldown > 0) stopTrack();
    if (state.deathCooldown > 0 && state.deathCooldown < 500) {
        context.save();
        context.globalAlpha = Math.cos(Math.PI / 2 * state.deathCooldown / 500);
        context.fillStyle = 'black';
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.restore();
    }
    if (state.paused) {
        stopTrack();
        context.save();
        context.globalAlpha = .3;
        context.fillStyle = 'black';
        context.fillRect(0, hudImage.height, WIDTH, GAME_HEIGHT);
        context.restore();
    }
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = state.sfx[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var sfx = _step.value;

            playSound(sfx);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    state.sfx = [];
};

var renderTitle = function renderTitle(context, state) {
    renderBackground(state.world);

    var options = [startGameImage, optionsImage];
    var targets = [new Rectangle(options[0]).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2)];
    for (var i = 1; i < options.length; i++) {
        targets.push(new Rectangle(options[i]).scale(3).moveCenterTo(WIDTH / 2, targets[i - 1].top + targets[i - 1].height + 20 + 3 * options[i].height / 2));
    }
    for (var _i = 0; _i < options.length; _i++) {
        drawImage(context, options[_i].image, options[_i], targets[_i]);
    }
    var target = targets[state.titleIndex];
    drawImage(context, selectNeedleImage.image, selectNeedleImage, new Rectangle(selectNeedleImage).scale(2).moveCenterTo(WIDTH / 2 - (3 * selectNeedleImage.width + target.width) / 2 + 5 * Math.sin(Date.now() / 150) + 10, target.top + target.height / 2));
    /*drawTintedImage(context, startGameImage.image, '#f0a400', 1, startGameImage,
        new Rectangle(startGameImage).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2)
    );*/
    //drawTintedImage(context, frame.image, 'gold', .5 + .5 * Math.cos(loot.animationTime / 50), frame, loot);
    //drawImage(context, optionsImage.image, optionsImage,
    //    new Rectangle(optionsImage).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2 + startGameImage.height * 3 + 10)
    //);
    renderForeground(state.world);
};

var renderPlayerAttack = function renderPlayerAttack(attack) {
    var animationTime = attack.animationTime;

    var frameIndex = animationTime / FRAME_LENGTH;
    var startFrames = blastStartAnimation.frames.length * blastStartAnimation.frameDuration;
    var animation = blastStartAnimation;
    if (frameIndex >= startFrames) {
        animation = blastLoopAnimation;
        frameIndex -= startFrames;
    }
    frameIndex = Math.floor(frameIndex / animation.frameDuration);
    var frame = animation.frames[frameIndex % animation.frames.length];
    drawImage(context, frame.image, frame, attack);
    if (attack.sfx) {
        playSound(attack.sfx);
        attack.sfx = false;
    }
};

var renderEnemyAttack = function renderEnemyAttack(attack) {
    var frame = getFrame(bulletAnimation, attack.animationTime);
    drawImage(context, frame.image, frame, attack);
};

//   plainsBackground,
//   plainsMidground,
//   plainsForeground,

var renderBackgroundLayer = function renderBackgroundLayer(context, _ref) {
    var image = _ref.image,
        x = _ref.x,
        y = _ref.y;

    var left = x % image.width;
    var right = (x + WIDTH) % image.width;
    if (right < left) {
        var leftWidth = image.width - left;
        context.drawImage(image.image, left, 0, leftWidth, image.height, 0, y, leftWidth, image.height);
        context.drawImage(image.image, 0, 0, right, image.height, leftWidth, y, right, image.height);
    } else {
        context.drawImage(image.image, left, 0, image.width, image.height, 0, y, image.width, image.height);
    }
};

var renderBackground = function renderBackground(world) {
    // context.fillStyle = 'black';
    // context.fillRect(0, 0, WIDTH, HEIGHT);
    var x = world.x,
        y = world.y,
        backgroundYFactor = world.backgroundYFactor,
        backgroundXFactor = world.backgroundXFactor,
        backgroundXOffset = world.backgroundXOffset,
        backgroundYOffset = world.backgroundYOffset,
        midgroundYFactor = world.midgroundYFactor,
        midgroundXFactor = world.midgroundXFactor,
        midgroundXOffset = world.midgroundXOffset,
        midgroundYOffset = world.midgroundYOffset;

    renderBackgroundLayer(context, { image: plainsBackground,
        x: x * backgroundXFactor + (backgroundXOffset || 0),
        y: y * backgroundYFactor + (backgroundYOffset || 0)
    });
    renderBackgroundLayer(context, { image: plainsMidground,
        x: x * midgroundXFactor + (midgroundXOffset || 0),
        y: y * midgroundYFactor + (midgroundYOffset || 0)
    });
};

var renderForeground = function renderForeground(_ref2) {
    var x = _ref2.x,
        y = _ref2.y,
        foregroundXFactor = _ref2.foregroundXFactor,
        foregroundYFactor = _ref2.foregroundYFactor,
        foregroundXOffset = _ref2.foregroundXOffset,
        foregroundYOffset = _ref2.foregroundYOffset;

    renderBackgroundLayer(context, { image: plainsForeground,
        x: x * foregroundXFactor + (foregroundXOffset || 0),
        y: y * foregroundYFactor + (foregroundYOffset || 0)
    });
};

module.exports = render;

},{"Rectangle":1,"animations":2,"draw":4,"effects":5,"enemies":6,"gameConstants":7,"heroes":8,"keyboard":9,"loot":10,"sounds":12}],12:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var sounds = new Map();
var numberOfSoundsLeftToLoad = 0,
    soundsMuted = false;

function ifdefor(value, defaultValue) {
    if (value !== undefined && !(typeof value === 'number' && isNaN(value))) {
        return value;
    }
    if (defaultValue !== undefined) {
        return defaultValue;
    }
    return null;
}

var requireSound = function requireSound(source) {
    var offset, volume, customDuration;

    var _source$split = source.split('+');

    var _source$split2 = _slicedToArray(_source$split, 3);

    source = _source$split2[0];
    offset = _source$split2[1];
    volume = _source$split2[2];

    if (offset) {
        ;

        var _offset$split = offset.split(':');

        var _offset$split2 = _slicedToArray(_offset$split, 2);

        offset = _offset$split2[0];
        customDuration = _offset$split2[1];
    }if (sounds.has(source)) return sounds.get(source);
    var newSound = new Audio(source);
    newSound.instances = new Set();
    newSound.offset = offset || 0;
    newSound.customDuration = customDuration || 0;
    newSound.defaultVolume = volume || 1;
    sounds.set(source, newSound);
    return newSound;
};

var playingSounds = new Set();
var playSound = function playSound(source, area) {
    if (soundsMuted) return;
    var offset, volume, customDuration;

    var _source$split3 = source.split('+');

    var _source$split4 = _slicedToArray(_source$split3, 3);

    source = _source$split4[0];
    offset = _source$split4[1];
    volume = _source$split4[2];

    if (offset) {
        ;

        var _offset$split3 = offset.split(':');

        var _offset$split4 = _slicedToArray(_offset$split3, 2);

        offset = _offset$split4[0];
        customDuration = _offset$split4[1];
    }var sound = requireSound(source);
    // Custom sound objects just have a play and forget method on them.
    if (!(sound instanceof Audio)) {
        sound.play();
        return;
    }
    if (sound.instances.size >= 5) return;
    var newInstance = sound.cloneNode(false);
    newInstance.currentTime = (ifdefor(offset || sound.offset) || 0) / 1000;
    newInstance.volume = Math.min(1, (ifdefor(volume, sound.defaultVolume) || 1) / 50);
    newInstance.play().then(function () {
        var timeoutId;
        if (customDuration || sound.customDuration) {
            stimeoutId = setTimeout(function () {
                sound.instances.delete(newInstance);
                playingSounds.delete(newInstance);
                newInstance.onended = null;
                newInstance.pause();
            }, parseInt(customDuration || sound.customDuration));
        }
        playingSounds.add(newInstance);
        sound.instances.add(newInstance);
        newInstance.onended = function () {
            sound.instances.delete(newInstance);
            playingSounds.delete(newInstance);
            newInstance.onended = null;
            clearTimeout(timeoutId);
        };
    });
};

var previousTrack = null;
var playTrack = function playTrack(source, timeOffset) {
    var offset = void 0,
        volume = void 0;

    var _source$split5 = source.split('+');

    var _source$split6 = _slicedToArray(_source$split5, 3);

    source = _source$split6[0];
    offset = _source$split6[1];
    volume = _source$split6[2];

    if (previousTrack) {
        previousTrack.pause();
    }
    var sound = requireSound(source);
    sound.currentTime = (ifdefor(offset, sound.offset) || 0) / 1000 + timeOffset / 1000;
    sound.volume = Math.min(1, (ifdefor(volume, sound.defaultVolume) || 1) / 50);
    if (soundsMuted) {
        sound.volume = 0;
    }
    sound.play();
    previousTrack = sound;
};

var stopTrack = function stopTrack() {
    if (previousTrack) {
        previousTrack.pause();
    }
};

// This hasn't been tested yet, not sure if it works.
var muteSounds = function muteSounds() {
    soundsMuted = true;
    if (previousTrack) {
        previousTrack.volume = 0;
    }
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = playingSounds[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var sound = _step.value;

            sound.volume = 0;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
};

['sfx/shoot.mp3+0+2', 'sfx/hit.mp3+200+1', 'sfx/flydeath.mp3+0+5', 'sfx/coin.mp3', 'sfx/startgame.mp3', 'sfx/exclamation.mp3+0+3', 'sfx/heal.mp3+200+5', 'sfx/death.mp3+0+1',
// See credits.html for: mobbrobb.
'bgm/river.mp3+0+1', 'bgm/area.mp3+0+2'].forEach(requireSound);

var audioContext = new (window.AudioContext || window.webkitAudioContext)();

function makeDistortionCurve(amount) {
    var k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180,
        i = 0,
        x;
    for (; i < n_samples; ++i) {
        x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
};
var distortionCurve = makeDistortionCurve(100);

function playBeeps(frequencies, volume, duration, _ref) {
    var _ref$smooth = _ref.smooth,
        smooth = _ref$smooth === undefined ? false : _ref$smooth,
        _ref$swell = _ref.swell,
        swell = _ref$swell === undefined ? false : _ref$swell,
        _ref$taper = _ref.taper,
        taper = _ref$taper === undefined ? false : _ref$taper,
        _ref$distortion = _ref.distortion,
        distortion = _ref$distortion === undefined ? false : _ref$distortion;

    var oscillator = audioContext.createOscillator();
    oscillator.type = 'square';
    if (smooth) oscillator.frequency.setValueCurveAtTime(frequencies, audioContext.currentTime, duration);else {
        for (var i = 0; i < frequencies.length; i++) {
            oscillator.frequency.setValueAtTime(frequencies[i], audioContext.currentTime + duration * i / frequencies.length);
        }
    }
    var lastNode = oscillator;
    if (distortion) {
        distortion = audioContext.createWaveShaper();
        distortion.curve = distortionCurve;
        distortion.oversample = '4x';
        lastNode.connect(distortion);
        lastNode = distortion;
    }

    gainNode = audioContext.createGain();
    if (swell) {
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + duration * .1);
    } else {
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    }
    if (taper) {
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime + duration * .9);
        // gainNode.gain.setTargetAtTime(0, audioContext.currentTime, duration / 10);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    }
    lastNode.connect(gainNode);
    lastNode = gainNode;

    lastNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

sounds.set('reflect', {
    play: function play() {
        playBeeps([2000, 8000, 4000], .01, .1, {});
    }
});
sounds.set('wand', {
    play: function play() {
        playBeeps([1200, 400], 0.01, .1, { smooth: true, taper: true, swell: true, distortion: true });
    }
});

module.exports = {
    playSound: playSound,
    playTrack: playTrack,
    stopTrack: stopTrack
};

},{}],13:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var getNewSpriteState = function getNewSpriteState(base) {
    return _extends({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        vx: 0,
        vy: 0,
        animation: 'default',
        animationTime: 0
    }, base);
};

module.exports = {
    getNewSpriteState: getNewSpriteState
};

},{}],14:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    FRAME_LENGTH = _require.FRAME_LENGTH,
    OFFSCREEN_PADDING = _require.OFFSCREEN_PADDING,
    ENEMY_COOLDOWN = _require.ENEMY_COOLDOWN,
    DEATH_COOLDOWN = _require.DEATH_COOLDOWN,
    SPAWN_COOLDOWN = _require.SPAWN_COOLDOWN,
    SPAWN_INV_TIME = _require.SPAWN_INV_TIME,
    ENEMY_FLY = _require.ENEMY_FLY,
    ENEMY_HORNET = _require.ENEMY_HORNET,
    ENEMY_FLYING_ANT = _require.ENEMY_FLYING_ANT,
    ENEMY_FLYING_ANT_SOLDIER = _require.ENEMY_FLYING_ANT_SOLDIER;

var _require2 = require('animations'),
    blastRectangle = _require2.blastRectangle,
    heroRectangle = _require2.heroRectangle;

var Rectangle = require('Rectangle');

var _require3 = require('sprites'),
    getNewSpriteState = _require3.getNewSpriteState;

var _require4 = require('heroes'),
    advanceHero = _require4.advanceHero,
    getHeroHitBox = _require4.getHeroHitBox,
    damageHero = _require4.damageHero;

var _require5 = require('enemies'),
    enemyData = _require5.enemyData,
    createEnemy = _require5.createEnemy,
    addEnemyToState = _require5.addEnemyToState,
    damageEnemy = _require5.damageEnemy,
    advanceEnemy = _require5.advanceEnemy,
    getEnemyHitBox = _require5.getEnemyHitBox;

var _require6 = require('loot'),
    lootData = _require6.lootData,
    createLoot = _require6.createLoot,
    advanceLoot = _require6.advanceLoot;

var _require7 = require('effects'),
    createEffect = _require7.createEffect,
    advanceEffect = _require7.advanceEffect;

var ATTACK_OFFSET = -4;

var getNewPlayerState = function getNewPlayerState() {
    return {
        score: 0,
        lives: 3,
        sprite: getNewSpriteState(_extends({}, heroRectangle, { left: -100, top: 100 })),
        spawnCooldown: SPAWN_COOLDOWN,
        invulnerableFor: SPAWN_INV_TIME,
        shotCooldown: 0,
        actions: {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,
            start: false
        }
    };
};

var getNewState = function getNewState() {
    return {
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
            bgm: 'bgm/area.mp3'
        }
    };
};

var TEST_ENEMY = false;

var advanceState = function advanceState(state) {
    var updatedState = _extends({}, state);
    if (updatedState.title) {
        var titleIndex = updatedState.titleIndex;
        if (updatedState.players[0].actions.start && titleIndex === 0) {
            return _extends({}, updatedState, { title: false, world: _extends({}, updatedState.world, { bgm: 'bgm/river.mp3' }) });
        }
        if (updatedState.players[0].actions.up) {
            titleIndex = (titleIndex + 2 - 1) % 2;
        }
        if (updatedState.players[0].actions.down) {
            titleIndex = (titleIndex + 1) % 2;
        }
        return _extends({}, updatedState, { titleIndex: titleIndex });
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
            return _extends({}, updatedState, { gameover: true });
        }
    }
    var paused = state.paused,
        world = state.world;

    if (state.players[0].actions.start) {
        paused = !paused;
        if (!paused) {
            world.bgm = 'bgm/river.mp3';
        }
    }
    if (paused) {
        return _extends({}, state, { paused: paused });
    }
    updatedState.newPlayerAttacks = [];
    updatedState.players = state.players.map(function (player, index) {
        if (!player.shotCooldown && player.actions.shoot) {
            updatedState.newPlayerAttacks.push(getNewSpriteState(_extends({}, blastRectangle, {
                left: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET,
                top: player.sprite.top + player.sprite.vy + Math.round((player.sprite.height - blastRectangle.height) / 2),
                vx: 20,
                delay: 2,
                playerIndex: index,
                sfx: 'sfx/shoot.mp3'
            })));
        }
        return advanceHero(state, player);
    });
    world = advanceWorld(state, world);

    var currentPlayerAttacks = state.playerAttacks.map(function (attack) {
        return advanceAttack(state, attack);
    }).filter(function (attack) {
        return !attack.done;
    });
    updatedState.enemies = state.enemies.map(function (enemy) {
        return advanceEnemy(state, enemy);
    }).filter(function (enemy) {
        return !enemy.done;
    });
    updatedState.newEnemyAttacks = [];
    for (var enemyIndex = 0; enemyIndex < updatedState.enemies.length; enemyIndex++) {
        var enemy = updatedState.enemies[enemyIndex];
        if (enemyData[enemy.type].shoot) {
            updatedState = enemyData[enemy.type].shoot(updatedState, enemyIndex);
        }
    }
    updatedState.newEnemies = [];
    var enemyCooldown = state.enemyCooldown;

    var numHornets = updatedState.enemies.filter(function (enemy) {
        return enemy.type === ENEMY_HORNET;
    }).length;
    if (TEST_ENEMY) {
        if (!updatedState.enemies.length) {
            var newEnemy = createEnemy(TEST_ENEMY, {
                left: WIDTH + 10,
                top: 40 + (GAME_HEIGHT - 80) * (0.5 + 0.5 * Math.sin(world.time / (1000 - updatedState.spawnDuration / 5))),
                vx: -6 + 3 * (world.time % 5000) / updatedState.spawnDuration
            });
            newEnemy.top -= newEnemy.height / 2;
            updatedState = addEnemyToState(updatedState, newEnemy);
        }
    } else if (enemyCooldown > 0) {
        enemyCooldown--;
    } else if (world.time % 5000 < updatedState.spawnDuration - 800 * numHornets) {
        var newEnemyType = ENEMY_FLY;
        if (world.time > 15000 && Math.random() < 1 / 3) {
            newEnemyType = ENEMY_FLYING_ANT_SOLDIER;
        } else if (world.time > 10000 && Math.random() < 1 / 3) {
            newEnemyType = ENEMY_FLYING_ANT;
        } else if (world.time > 20000 && Math.random() > Math.max(.9, 1 - .1 * updatedState.players[0].score / 3000)) {
            newEnemyType = ENEMY_HORNET;
        }
        var _newEnemy = createEnemy(newEnemyType, {
            left: WIDTH + 10,
            top: 40 + (GAME_HEIGHT - 80) * (0.5 + 0.5 * Math.sin(world.time / (1000 - updatedState.spawnDuration / 5))),
            vx: -6 + 3 * (world.time % 5000) / updatedState.spawnDuration
        });
        _newEnemy.top -= _newEnemy.height / 2;
        updatedState = addEnemyToState(updatedState, _newEnemy);
        switch (_newEnemy.type) {
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
    updatedState.sfx = [].concat(_toConsumableArray(updatedState.sfx));
    // Check for enemies hit by attacks.
    for (var i = 0; i < updatedState.enemies.length; i++) {
        var _enemy = updatedState.enemies[i];
        if (_enemy.done || _enemy.dead) continue;
        var enemyHitBox = getEnemyHitBox(_enemy);
        for (var j = 0; j < currentPlayerAttacks.length; j++) {
            var attack = currentPlayerAttacks[j];
            if (Rectangle.collision(enemyHitBox, attack)) {

                currentPlayerAttacks[j] = _extends({}, attack, { done: true });
                updatedState = damageEnemy(updatedState, i, attack);
            }
        }
        for (var _j = 0; _j < updatedState.players.length; _j++) {
            var sprite = updatedState.players[_j].sprite;
            if (!updatedState.players[_j].invulnerableFor && !updatedState.players[_j].done && !_enemy.done && !_enemy.dead && Rectangle.collision(enemyHitBox, getHeroHitBox(sprite))) {
                updatedState = damageHero(updatedState, _j);
            }
        }
    }
    currentPlayerAttacks = currentPlayerAttacks.filter(function (attack) {
        return !attack.done;
    });
    updatedState.enemies = updatedState.enemies.filter(function (enemy) {
        return !enemy.done;
    });

    // Advance enemy attacks and check for hitting the player.
    var currentEnemyAttacks = state.enemyAttacks.map(function (attack) {
        return advanceAttack(state, attack);
    }).filter(function (attack) {
        return !attack.done;
    });
    for (var _i = 0; _i < updatedState.players.length; _i++) {
        if (updatedState.players[_i].invulnerableFor) continue;
        var _sprite = updatedState.players[_i].sprite;
        var playerHitBox = getHeroHitBox(_sprite);
        for (var _j2 = 0; _j2 < currentEnemyAttacks.length && !updatedState.players[_i].done; _j2++) {
            var _attack = currentEnemyAttacks[_j2];
            if (Rectangle.collision(playerHitBox, _attack)) {
                updatedState = damageHero(updatedState, _i);
                currentEnemyAttacks[_j2] = _extends({}, _attack, { done: true });
            }
        }
    }
    currentEnemyAttacks = currentEnemyAttacks.filter(function (attack) {
        return !attack.done;
    });

    updatedState.loot = updatedState.loot.map(function (loot) {
        return advanceLoot(state, loot);
    }).filter(function (loot) {
        return !loot.done;
    });
    for (var _i2 = 0; _i2 < updatedState.loot.length; _i2++) {
        var lootDrop = updatedState.loot[_i2];
        if (lootDrop.done) continue;
        for (var _j3 = 0; _j3 < updatedState.players.length; _j3++) {
            if (updatedState.players[_j3].done) continue;
            var _sprite2 = updatedState.players[_j3].sprite;
            if (Rectangle.collision(lootDrop, getHeroHitBox(_sprite2))) {
                updatedState.players[_j3] = lootData[lootDrop.type].collect(updatedState.players[_j3], lootDrop);
                updatedState.loot[_i2] = _extends({}, lootDrop, { done: true });
                updatedState.sfx.push(lootData[lootDrop.type].sfx);
            }
        }
    }
    updatedState.loot = updatedState.loot.filter(function (lootDrop) {
        return !lootDrop.done;
    });

    // Add new enemies/attacks.
    updatedState.enemies = [].concat(_toConsumableArray(updatedState.enemies), _toConsumableArray(updatedState.newEnemies));
    var playerAttacks = [].concat(_toConsumableArray(currentPlayerAttacks), _toConsumableArray(updatedState.newPlayerAttacks));
    var enemyAttacks = [].concat(_toConsumableArray(currentEnemyAttacks), _toConsumableArray(updatedState.newEnemyAttacks));
    updatedState.effects = updatedState.effects.map(function (effect) {
        return advanceEffect(state, effect);
    }).filter(function (effect) {
        return !effect.done;
    });
    updatedState.effects = [].concat(_toConsumableArray(updatedState.effects), _toConsumableArray(updatedState.newEffects));
    updatedState.loot = [].concat(_toConsumableArray(updatedState.loot), _toConsumableArray(updatedState.newLoot));

    return _extends({}, updatedState, { enemyCooldown: enemyCooldown,
        playerAttacks: playerAttacks, enemyAttacks: enemyAttacks,
        world: world, paused: false
    });
};

var advanceAttack = function advanceAttack(state, attack) {
    var left = attack.left,
        top = attack.top,
        width = attack.width,
        height = attack.height,
        vx = attack.vx,
        vy = attack.vy,
        delay = attack.delay,
        animationTime = attack.animationTime,
        playerIndex = attack.playerIndex;

    if (delay > 0) {
        delay--;
        var source = state.players[playerIndex].sprite;
        left = source.left + source.vx + source.width + ATTACK_OFFSET;
        top = source.top + source.vy + Math.round((source.height - blastRectangle.height) / 2);
    }
    if (!(delay > 0)) {
        left += vx;
        top += vy;
    }
    animationTime += FRAME_LENGTH;

    var done = left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING || top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;

    return _extends({}, attack, { delay: delay, left: left, top: top, animationTime: animationTime, done: done });
};

var advanceWorld = function advanceWorld(state, world) {
    var x = world.x,
        y = world.y,
        vx = world.vx,
        vy = world.vy,
        targetX = world.targetX,
        targetY = world.targetY,
        targetFrames = world.targetFrames,
        time = world.time;

    x += vx;
    y += vy;
    targetFrames--;
    var targetVx = (targetX - x) / targetFrames;
    vx = (targetVx + vx) / 2;
    var targetVy = (targetY - y) / targetFrames;
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
    return _extends({}, world, { x: x, y: y, vx: vx, vy: vy, targetX: targetX, targetY: targetY, targetFrames: targetFrames, time: time });
};

var applyPlayerActions = function applyPlayerActions(state, playerIndex, actions) {
    var players = [].concat(_toConsumableArray(state.players));
    players[playerIndex] = _extends({}, players[playerIndex], { actions: actions });
    return _extends({}, state, { players: players });
};

module.exports = {
    getNewState: getNewState,
    advanceState: advanceState,
    applyPlayerActions: applyPlayerActions
};

},{"Rectangle":1,"animations":2,"effects":5,"enemies":6,"gameConstants":7,"heroes":8,"loot":10,"sprites":13}]},{},[3]);
