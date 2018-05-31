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

/* globals Image */
var _require = require('gameConstants'),
    FRAME_LENGTH = _require.FRAME_LENGTH;

var Rectangle = require('Rectangle');

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

var i = function i(width, height, source) {
    return { left: 0, top: 0, width: width, height: height, image: requireImage(source) };
};
var r = function r(width, height, props) {
    return _extends({ left: 0, top: 0, width: width, height: height }, props);
};

var createAnimation = function createAnimation(source, rectangle) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref$x = _ref.x,
        x = _ref$x === undefined ? 0 : _ref$x,
        _ref$y = _ref.y,
        y = _ref$y === undefined ? 0 : _ref$y,
        _ref$rows = _ref.rows,
        rows = _ref$rows === undefined ? 1 : _ref$rows,
        _ref$cols = _ref.cols,
        cols = _ref$cols === undefined ? 1 : _ref$cols,
        _ref$top = _ref.top,
        top = _ref$top === undefined ? 0 : _ref$top,
        _ref$left = _ref.left,
        left = _ref$left === undefined ? 0 : _ref$left,
        _ref$duration = _ref.duration,
        duration = _ref$duration === undefined ? 8 : _ref$duration,
        frameMap = _ref.frameMap;

    var props = arguments[3];

    var frames = [];
    var image = requireImage(source);
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            frames[row * cols + col] = _extends({}, rectangle, {
                left: left + rectangle.width * (x + col),
                top: top + rectangle.height * (y + row),
                image: image
            });
        }
    }
    // Say an animation has 3 frames, but you want to order them 0, 1, 2, 1, then pass frameMap = [0, 1, 2, 1],
    // to remap the order of the frames accordingly.
    if (frameMap) {
        frames = frameMap.map(function (originalIndex) {
            return frames[originalIndex];
        });
    }
    return _extends({ frames: frames, frameDuration: duration }, props);
};
var createFrames = function createFrames(rect, count, source) {
    var offset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

    var frames = [];
    var image = requireImage(source);
    for (var _i = 0; _i < count; _i++) {
        frames[_i] = _extends({}, rect, { left: rect.width * (offset + _i), image: image });
    }
    return frames;
};

var createVerticalFrames = function createVerticalFrames(rect, count, source) {
    var offset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

    var frames = [];
    var image = requireImage(source);
    for (var _i2 = 0; _i2 < count; _i2++) {
        frames[_i2] = _extends({}, rect, { top: rect.height * (offset + _i2), image: image });
    }
    return frames;
};

var allAnimations = {};

var needleFlipRectangle = r(88, 56);
var needleFlipAnimation = {
    frames: [_extends({}, needleFlipRectangle, { image: requireImage('gfx/effects/needleflip1.png') }), _extends({}, needleFlipRectangle, { image: requireImage('gfx/effects/needleflip2.png') }), _extends({}, needleFlipRectangle, { image: requireImage('gfx/effects/needleflip3.png') }), _extends({}, needleFlipRectangle, { image: requireImage('gfx/effects/needleflip4.png') })],
    frameDuration: 6
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

var slashRectangle = r(30, 50);
var slashAnimation = {
    frames: [_extends({}, slashRectangle, { image: requireImage('gfx/attacks/slash1.png') }), _extends({}, slashRectangle, { image: requireImage('gfx/attacks/slash2.png') }), _extends({}, slashRectangle, { image: requireImage('gfx/attacks/slash3.png') }), _extends({}, slashRectangle, { image: requireImage('gfx/attacks/slash4.png') })],
    frameDuration: 3
};

var stabRectangle = r(45, 45);
var stabAnimation = {
    frames: [_extends({}, stabRectangle, { image: requireImage('gfx/attacks/stab1.png') }), _extends({}, stabRectangle, { image: requireImage('gfx/attacks/stab2.png') }), _extends({}, stabRectangle, { image: requireImage('gfx/attacks/stab3.png') }), _extends({}, stabRectangle, { image: requireImage('gfx/attacks/stab4.png') })],
    frameDuration: 3
};

var bulletRectangle = r(14, 15);
var bulletAnimation = {
    frames: [_extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb1.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb2.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb3.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb4.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb5.png') })],
    frameDuration: 2
};
var deflectAnimation = {
    frames: [_extends({}, bulletRectangle, { image: requireImage('gfx/attacks/deflect1.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/deflect2.png') })],
    frameDuration: 4
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
var hornetSoldierAnimation = {
    frames: [_extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet1.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet2.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet3.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet4.png') })],
    frameDuration: 3
};
var fallingHornetSoldierHitBox = { left: 46, top: 48, width: 40, height: 40 };
var hornetSoldierDeathAnimation = {
    frames: [_extends({}, hornetRectangle, { hitBox: fallingHornetSoldierHitBox, image: requireImage('gfx/enemies/mhornetded.png') })],
    frameDuration: 3
};

var locustRectangle = r(100, 100, { hitBox: { left: 0, top: 40, width: 100, height: 60 } });
var locustAnimation = {
    frames: createFrames(locustRectangle, 3, 'gfx/enemies/locust.png', 1), frameDuration: 3
};
var locustDeathAnimation = {
    frames: createFrames(locustRectangle, 1, 'gfx/enemies/locust.png', 0), frameDuration: 3
};
var locustSoldierRectangle = _extends({}, locustRectangle, { hitBox: { left: 0, top: 18, width: 100, height: 82 } });
var locustSoldierAnimation = {
    frames: createFrames(locustSoldierRectangle, 3, 'gfx/enemies/locust.png', 4), frameDuration: 3
};
var locustSoldierDeathAnimation = {
    frames: createFrames(locustSoldierRectangle, 1, 'gfx/enemies/locust.png', 7), frameDuration: 3
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

var monkHitBox = { left: 0, top: 8, width: 42, height: 42 };
var monkRectangle = r(42, 50, { hitBox: monkHitBox });
var monkAnimation = {
    frames: [_extends({}, monkRectangle, { image: requireImage('gfx/enemies/robe1.png') }), _extends({}, monkRectangle, { image: requireImage('gfx/enemies/robe2.png') }), _extends({}, monkRectangle, { image: requireImage('gfx/enemies/robe3.png') }), _extends({}, monkRectangle, { image: requireImage('gfx/enemies/robe4.png') })],
    frameDuration: 6
};
var monkAttackAnimation = {
    frames: [_extends({}, monkRectangle, { image: requireImage('gfx/enemies/robeAttack.png') })],
    frameDuration: 5
};
var monkDeathAnimation = {
    frames: [_extends({}, r(46, 41), { image: requireImage('gfx/enemies/robeded.png') })],
    frameDuration: 5
};

var cargoBeetleHitBox = { left: 0, top: 16, width: 100, height: 84 };
var cargoBeetleRectangle = r(100, 100, { hitBox: cargoBeetleHitBox });
var cargoBeetleAnimation = {
    frames: [_extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/bfly1.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/bfly2.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/bfly3.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/bfly4.png') })],
    frameDuration: 6
};
var cargoBeetleDeathAnimation = {
    frames: [_extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/bflyded.png') })],
    frameDuration: 5
};
var explosiveBeetleAnimation = {
    frames: [_extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/expbfly1.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/expbfly2.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/expbfly3.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/expbfly4.png') })],
    frameDuration: 6
};
var explosiveBeetleDeathAnimation = {
    frames: [_extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/expbflyded.png') })],
    frameDuration: 5
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

var hugeExplosionRectangle = r(67, 67);
var hugeExplosionAnimation = {
    frames: [_extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode1.png') }), _extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode2.png') }), _extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode3.png') }), _extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode4.png') }), _extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode5.png') }), _extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode6.png') })],
    frameDuration: 6
};

var dustRectangle = r(20, 20);
var dustAnimation = {
    frames: [_extends({}, dustRectangle, { image: requireImage('gfx/effects/dust1.png') }), _extends({}, dustRectangle, { image: requireImage('gfx/effects/dust2.png') }), _extends({}, dustRectangle, { image: requireImage('gfx/effects/dust3.png') }), _extends({}, dustRectangle, { image: requireImage('gfx/effects/dust4.png') })],
    frameDuration: 4
};

var coinRectangle = r(9, 9);
var coinAnimation = {
    frames: [_extends({}, coinRectangle, { image: requireImage('gfx/items/coin1.png') }), _extends({}, coinRectangle, { image: requireImage('gfx/items/coin2.png') }), _extends({}, coinRectangle, { image: requireImage('gfx/items/coin3.png') }), _extends({}, coinRectangle, { image: requireImage('gfx/items/coin4.png') })],
    frameDuration: 5
};

var frameDuration = 12;
var powerupRectangle = r(20, 20);
var powerupDiamondAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/diamond1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/diamond2.png') })],
    frameDuration: frameDuration
};
var powerupSquareAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/square1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/square2.png') })],
    frameDuration: frameDuration
};
var powerupTriangleAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/triangle1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/triangle2.png') })],
    frameDuration: frameDuration
};
var powerupTripleDiamondAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/tripdiamond1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/tripdiamond2.png') })],
    frameDuration: frameDuration
};
var powerupTripleSquareAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/tripsquare1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/tripsquare2.png') })],
    frameDuration: frameDuration
};
var powerupTripleTriangleAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/triptriangle1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/triptriangle2.png') })],
    frameDuration: frameDuration
};
var powerupComboAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/tripcombo1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/tripcombo2.png') })],
    frameDuration: frameDuration
};
var powerupTripleComboAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/ultcombo1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/ultcombo2.png') })],
    frameDuration: frameDuration
};
var sizeTextRectangle = r(44, 20);
var sizeTextAnimation = {
    frames: [_extends({}, sizeTextRectangle, { image: requireImage('gfx/items/size1.png') }), _extends({}, sizeTextRectangle, { image: requireImage('gfx/items/size2.png') })],
    frameDuration: frameDuration
};
var speedTextAnimation = {
    frames: [_extends({}, sizeTextRectangle, { image: requireImage('gfx/items/speed1.png') }), _extends({}, sizeTextRectangle, { image: requireImage('gfx/items/speed2.png') })],
    frameDuration: frameDuration
};
var rateTextAnimation = {
    frames: [_extends({}, sizeTextRectangle, { image: requireImage('gfx/items/rate1.png') }), _extends({}, sizeTextRectangle, { image: requireImage('gfx/items/rate2.png') })],
    frameDuration: frameDuration
};

var getFrame = function getFrame(animation, animationTime) {
    var frameIndex = Math.floor(animationTime / (FRAME_LENGTH * (animation.frameDuration || 1)));
    if (animation.loop === false) {
        // You can set this to prevent an animation from looping.
        frameIndex = Math.min(frameIndex, animation.frames.length - 1);
    }
    if (animation.loopFrame && frameIndex >= animation.frames.length) {
        frameIndex -= animation.loopFrame;
        frameIndex %= animation.frames.length - animation.loopFrame;
        frameIndex += animation.loopFrame;
    }
    return animation.frames[frameIndex % animation.frames.length];
};
var getAnimationLength = function getAnimationLength(animation) {
    return animation.frames.length * animation.frameDuration;
};
var getHitBox = function getHitBox(animation, animationTime) {
    var frame = getFrame(animation, animationTime);
    return new Rectangle(frame.hitBox || frame);
};

var selectNeedleImage = r(58, 7, { image: requireImage('gfx/needle.png') });
var startGameImage = r(58, 13, { image: requireImage('gfx/startgame.png') });
var optionsImage = r(43, 13, { image: requireImage('gfx/options.png') });

var startImage = r(58, 30, { image: requireImage('gfx/start.png') });

module.exports = {
    requireImage: requireImage,
    r: r, i: i,
    allAnimations: allAnimations,
    getFrame: getFrame,
    getAnimationLength: getAnimationLength,
    createAnimation: createAnimation,
    createFrames: createFrames,
    createVerticalFrames: createVerticalFrames,
    getHitBox: getHitBox,
    needleFlipAnimation: needleFlipAnimation,
    blastStartAnimation: blastStartAnimation,
    blastLoopAnimation: blastLoopAnimation,
    slashAnimation: slashAnimation,
    stabAnimation: stabAnimation,
    bulletAnimation: bulletAnimation,
    deflectAnimation: deflectAnimation,
    damageAnimation: damageAnimation,
    explosionAnimation: explosionAnimation,
    hugeExplosionAnimation: hugeExplosionAnimation,
    dustAnimation: dustAnimation,
    coinAnimation: coinAnimation,
    powerupDiamondAnimation: powerupDiamondAnimation,
    powerupTriangleAnimation: powerupTriangleAnimation,
    powerupSquareAnimation: powerupSquareAnimation,
    powerupTripleDiamondAnimation: powerupTripleDiamondAnimation,
    powerupTripleSquareAnimation: powerupTripleSquareAnimation,
    powerupTripleTriangleAnimation: powerupTripleTriangleAnimation,
    powerupComboAnimation: powerupComboAnimation,
    powerupTripleComboAnimation: powerupTripleComboAnimation,
    rateTextAnimation: rateTextAnimation,
    sizeTextAnimation: sizeTextAnimation,
    speedTextAnimation: speedTextAnimation,
    flyAnimation: flyAnimation, flyDeathAnimation: flyDeathAnimation,
    hornetAnimation: hornetAnimation, hornetDeathAnimation: hornetDeathAnimation,
    hornetSoldierAnimation: hornetSoldierAnimation, hornetSoldierDeathAnimation: hornetSoldierDeathAnimation,
    locustAnimation: locustAnimation, locustDeathAnimation: locustDeathAnimation,
    locustSoldierAnimation: locustSoldierAnimation, locustSoldierDeathAnimation: locustSoldierDeathAnimation,
    flyingAntAnimation: flyingAntAnimation, flyingAntDeathAnimation: flyingAntDeathAnimation,
    flyingAntSoldierAnimation: flyingAntSoldierAnimation, flyingAntSoldierDeathAnimation: flyingAntSoldierDeathAnimation,
    monkAnimation: monkAnimation, monkDeathAnimation: monkDeathAnimation, monkAttackAnimation: monkAttackAnimation,
    cargoBeetleAnimation: cargoBeetleAnimation, cargoBeetleDeathAnimation: cargoBeetleDeathAnimation,
    explosiveBeetleAnimation: explosiveBeetleAnimation, explosiveBeetleDeathAnimation: explosiveBeetleDeathAnimation,
    selectNeedleImage: selectNeedleImage,
    startGameImage: startGameImage,
    optionsImage: optionsImage,
    startImage: startImage
};

},{"Rectangle":1,"gameConstants":11}],3:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('gameConstants'),
    TEST_ENEMY = _require.TEST_ENEMY,
    FRAME_LENGTH = _require.FRAME_LENGTH,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    WIDTH = _require.WIDTH,
    ENEMY_FLY = _require.ENEMY_FLY,
    ENEMY_MONK = _require.ENEMY_MONK,
    ENEMY_HORNET = _require.ENEMY_HORNET,
    ENEMY_HORNET_SOLDIER = _require.ENEMY_HORNET_SOLDIER,
    ENEMY_FLYING_ANT = _require.ENEMY_FLYING_ANT,
    ENEMY_LOCUST = _require.ENEMY_LOCUST,
    ENEMY_LOCUST_SOLDIER = _require.ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE = _require.ENEMY_CARGO_BEETLE,
    ENEMY_EXPLOSIVE_BEETLE = _require.ENEMY_EXPLOSIVE_BEETLE,
    ATTACK_BULLET = _require.ATTACK_BULLET;

var random = require('random');

var _require2 = require('animations'),
    requireImage = _require2.requireImage,
    createAnimation = _require2.createAnimation,
    r = _require2.r;

var _require3 = require('sprites'),
    getNewSpriteState = _require3.getNewSpriteState,
    getTargetVector = _require3.getTargetVector;

var _require4 = require('world'),
    getGroundHeight = _require4.getGroundHeight,
    getNewLayer = _require4.getNewLayer,
    allWorlds = _require4.allWorlds,
    checkpoints = _require4.checkpoints,
    setCheckpoint = _require4.setCheckpoint,
    updateLayerSprite = _require4.updateLayerSprite;

var plainsBg = createAnimation('gfx/scene/field/plainsbg.png', r(800, 800));
var groundAnimation = createAnimation('gfx/scene/field/groundloop.png', r(200, 60));
var townAnimation = createAnimation('gfx/scene/field/town.png', r(300, 300));
var dandyHitBox = r(36, 36, { left: 7 });
var dandyRectangle = r(80, 98, { hitBox: dandyHitBox });
var dandyAAnimation = createAnimation('gfx/scene/field/dandyidleabc.png', dandyRectangle, { cols: 2, duration: 30 });
var dandyAPoofAnimation = createAnimation('gfx/scene/field/dandya.png', dandyRectangle, { cols: 6, duration: 8 }, { loop: false });
var dandyBAnimation = createAnimation('gfx/scene/field/dandyidleabc.png', dandyRectangle, { x: 2, cols: 2, duration: 30 });
var dandyBPoofAnimation = createAnimation('gfx/scene/field/dandyb.png', dandyRectangle, { cols: 6, duration: 8 }, { loop: false });
var dandyCAnimation = createAnimation('gfx/scene/field/dandyidleabc.png', dandyRectangle, { x: 4, cols: 2, duration: 30 });
var dandyCPoofAnimation = createAnimation('gfx/scene/field/dandyc.png', dandyRectangle, { cols: 6, duration: 8 }, { loop: false });
var grassTuft = createAnimation('gfx/scene/field/tuft.png', r(92, 64), { cols: 3, duration: 30, frameMap: [0, 2, 1, 2] });
var grassAnimation = createAnimation('gfx/scene/field/plainsfg1.png', r(200, 100));
var grass2Animation = createAnimation('gfx/scene/field/plainsfg4.png', r(110, 51));
var grass3Animation = createAnimation('gfx/scene/field/plainsfg5.png', r(122, 52));
var smallCloverAnimation = createAnimation('gfx/scene/field/plainsfg6.png', r(69, 38));
var leavesAnimation = createAnimation('gfx/scene/field/plainsfg2.png', r(200, 100));
var berriesAnimation = createAnimation('gfx/scene/field/plainsfg3.png', r(200, 100));
var wheatAnimation = createAnimation('gfx/scene/field/plainsmg1.png', r(200, 100));
var thickGrass = createAnimation('gfx/scene/field/plainsmg.png', r(300, 300));
var darkGrass = createAnimation('gfx/scene/field/plainsmg2.png', r(300, 300));
// const lightGrass = createAnimation('gfx/scene/field/plainsmg3.png', r(300, 300));


var WORLD_FIELD = 'field';
var WORLD_FIELD_BOSS = 'fieldBoss';

var spawnEnemy = function spawnEnemy(state, enemyType, props) {
    var newEnemy = createEnemy(enemyType, props);
    newEnemy.left = Math.max(newEnemy.left, WIDTH);
    newEnemy.top = newEnemy.grounded ? getGroundHeight(state) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
    newEnemy.vx = newEnemy.vx || -5;
    return addEnemyToState(state, newEnemy);
};

var formidableEnemies = [ENEMY_HORNET, ENEMY_LOCUST, ENEMY_HORNET_SOLDIER, ENEMY_LOCUST_SOLDIER, ENEMY_EXPLOSIVE_BEETLE];

var setEvent = function setEvent(state, event) {
    // FRAME_LENGTH will be added to eventTime before the event is processed next, so we
    // set it to -FRAME_LENGTH so it will be 0 on the first frame.
    return _extends({}, state, { world: _extends({}, state.world, { eventTime: -FRAME_LENGTH, event: event }) });
};
var FIELD_DURATION = 120000;
var FIELD_EASY_DURATION = 30000;

// Add check points for:
var CHECK_POINT_FIELD_START = 'fieldStart';
var CHECK_POINT_FIELD_MIDDLE = 'fieldMiddle';
var CHECK_POINT_FIELD_END = 'fieldEnd';
checkpoints[CHECK_POINT_FIELD_START] = function (state) {
    var world = getFieldWorldStart();
    return _extends({}, state, { world: world });
};
checkpoints[CHECK_POINT_FIELD_MIDDLE] = function (state) {
    var world = getFieldWorld();
    // Start the midpoint in the sky so it is visually distinct from other check points.
    world.time = 40000;
    world.y = 390;
    return _extends({}, state, { world: world });
};
checkpoints[CHECK_POINT_FIELD_END] = function (state) {
    var world = getFieldWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 100000;
    return _extends({}, state, { world: world });
};
// start of level 'nothing' getFieldWorldStart
// sky 40 seconds 'nothing' getFieldWorld
// groud before boss ~100 seconds 'nothing' getFieldWorld
allWorlds[WORLD_FIELD] = {
    initialEvent: 'nothing',
    events: {
        nothing: function nothing(state, eventTime) {
            if (eventTime === 1000) {
                if (state.players[0].powerups.length) {
                    return setEvent(state, 'flies');
                }
                return setEvent(state, 'easyFlies');
            }
        },
        easyFlies: function easyFlies(state, eventTime) {
            if (eventTime === 0) {
                var top = random.element([1, 2, 3]) * GAME_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, { left: WIDTH, top: top });
            }
            eventTime -= 2000;
            if (eventTime === 0) {
                var _top = random.element([1, 2, 3]) * GAME_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, { left: WIDTH, top: _top });
            }
            eventTime -= 2000;
            if (eventTime === 0) {
                var _top2 = random.element([1, 2, 3]) * GAME_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, { left: WIDTH, top: _top2 });
            }
            eventTime -= 2000;
            if (eventTime >= 0) {
                return setEvent(state, 'powerup');
            }
        },
        powerup: function powerup(state, eventTime) {
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_CARGO_BEETLE, { left: WIDTH, top: GAME_HEIGHT / 2 });
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, 'flies');
            }
        },
        flies: function flies(state, eventTime) {
            var numFormidable = state.enemies.filter(function (enemy) {
                return formidableEnemies.includes(enemy.type);
            }).length;
            var baseNumber = 4 - numFormidable;
            var spacing = state.world.time < FIELD_EASY_DURATION ? 2000 : 1000;
            if (eventTime === 0) {
                var top = random.element([1, 2, 3]) * GAME_HEIGHT / 4;
                for (var i = 0; i < baseNumber; i++) {
                    state = spawnEnemy(state, ENEMY_FLY, { left: WIDTH + i * 80, top: top });
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime === 0) {
                var _top3 = random.element([1, 2, 3]) * GAME_HEIGHT / 4;
                for (var _i = 0; _i < baseNumber; _i++) {
                    state = spawnEnemy(state, ENEMY_FLY, { left: WIDTH + _i * 80, top: _top3 });
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime === 0) {
                var mode = random.range(0, 1);
                for (var _i2 = 0; _i2 < 2 * baseNumber; _i2++) {
                    var _top4 = [GAME_HEIGHT / 6 + _i2 * 30, 5 * GAME_HEIGHT / 6 - _i2 * 30][mode];
                    state = spawnEnemy(state, ENEMY_FLY, { left: WIDTH + _i2 * 80, top: _top4 });
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['flyingAnts', 'monks']));
            }
        },
        monks: function monks(state, eventTime) {
            var spacing = state.world.time < FIELD_EASY_DURATION ? 3000 : 1000;
            if (eventTime === 0) {
                var left = WIDTH;
                for (var i = 0; i < random.range(1, 2); i++) {
                    state = spawnEnemy(state, ENEMY_MONK, { left: left, top: GAME_HEIGHT });
                    left += random.range(100, 200);
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['flyingAnts']));
            }
        },
        flyingAnts: function flyingAnts(state, eventTime) {
            var numFormidable = state.enemies.filter(function (enemy) {
                return formidableEnemies.includes(enemy.type);
            }).length;
            var baseNumber = 2 - numFormidable;
            var spacing = state.world.time < FIELD_EASY_DURATION ? 3000 : 1000;
            if (eventTime === 0) {
                for (var i = 0; i < baseNumber - 1; i++) {
                    state = spawnEnemy(state, ENEMY_FLYING_ANT, { left: WIDTH + 10 + Math.random() * 30, top: GAME_HEIGHT / 4 + i * GAME_HEIGHT / 2 });
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime === 0) {
                for (var _i3 = 0; _i3 < baseNumber; _i3++) {
                    var enemyType = random.element([ENEMY_FLYING_ANT]);
                    state = spawnEnemy(state, enemyType, { left: WIDTH + 10 + Math.random() * 30, top: GAME_HEIGHT / 4 + _i3 * GAME_HEIGHT / 2 });
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['hornet', 'locust']));
            }
        },
        hornet: function hornet(state, eventTime) {
            var numFormidable = state.enemies.filter(function (enemy) {
                return formidableEnemies.includes(enemy.type);
            }).length;
            if (eventTime === 0 && numFormidable === 0) {
                var enemyType = state.world.time >= 0.5 * FIELD_DURATION ? ENEMY_HORNET_SOLDIER : ENEMY_HORNET;
                state = spawnEnemy(state, enemyType, { left: WIDTH + 10, top: random.element([GAME_HEIGHT / 3, 2 * GAME_HEIGHT / 3]) });
                numFormidable++;
                return state;
            }
            var spacing = state.world.time < FIELD_EASY_DURATION ? 4000 : 2000;
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['flies', 'monks']));
            }
        },
        locust: function locust(state, eventTime) {
            var numFormidable = state.enemies.filter(function (enemy) {
                return formidableEnemies.includes(enemy.type);
            }).length;
            if (eventTime === 0 && numFormidable <= 1) {
                var enemyType = state.world.time >= 0.5 * FIELD_DURATION ? ENEMY_LOCUST_SOLDIER : ENEMY_LOCUST;
                state = spawnEnemy(state, enemyType, { left: WIDTH + 10, top: GAME_HEIGHT / 3 + Math.random() * GAME_HEIGHT / 3 });
                numFormidable += 2;
                return state;
            }
            var spacing = state.world.time < FIELD_EASY_DURATION ? 2000 : 1000;
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['locust', 'flies', 'monks']));
            }
        },
        bossPrep: function bossPrep(state) {
            if (state.enemies.length === 0) {
                state = setCheckpoint(state, CHECK_POINT_FIELD_END);
                return transitionToFieldBoss(state);
            }
        }
    },
    advanceWorld: function advanceWorld(state) {
        // return transitionToFieldBoss(state);
        var world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        var targetFrames = 50 * 5;
        var targetX = world.x + 1000;
        var targetY = world.y;
        // 30-45s raise into the sky, stay until 60s, then lower back to the ground.
        if (world.time > 30000 && world.time < 45000) targetY = 400;else if (world.time > 60000 && world.time < 80000) targetY = -100;
        var time = world.time + FRAME_LENGTH;
        world = _extends({}, world, { targetX: targetX, targetY: targetY, targetFrames: targetFrames, time: time });
        state = _extends({}, state, { world: world });

        // After 120 seconds, stop spawning enemies, and transition to the boss once all enemies are
        // defeated.
        if (world.type === WORLD_FIELD && world.time >= FIELD_DURATION && world.event !== 'bossPrep') {
            return setEvent(state, 'bossPrep');
        }
        if (world.time === 40000) state = setCheckpoint(state, CHECK_POINT_FIELD_MIDDLE);
        if (TEST_ENEMY) {
            if (!state.enemies.length) {
                state = spawnEnemy(state, TEST_ENEMY, { left: WIDTH, top: random.range(100, 700) });
            }
            return state;
        }
        if (!world.event) world = _extends({}, world, { event: allWorlds[world.type].initialEvent, eventTime: 0 });else world = _extends({}, world, { eventTime: world.eventTime + FRAME_LENGTH });
        state = _extends({}, state, { world: world });
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;

        // This was the original random enemy spawning code for the game.
        /*
        let {enemyCooldown} = state;
        const spawnDuration = Math.min(2500, 100 + time / 20 + state.players[0].score / 10);
        if (enemyCooldown > 0) {
            enemyCooldown--;
        } else if (time % 5000 < spawnDuration - 800 * numFormidable) {
            let newEnemyType = ENEMY_FLY;
            if (time > 15000 && Math.random() < 1 / 6) {
                newEnemyType = ENEMY_FLYING_ANT_SOLDIER;
            } else if (time > 10000 && Math.random() < 1 / 3) {
                newEnemyType = ENEMY_FLYING_ANT;
            } else if (time > 20000 && Math.random() > Math.max(.9, 1 - .1 * state.players[0].score / 3000)) {
                newEnemyType = random.element(formidableEnemies);
            } else if (getGroundHeight(state) < GAME_HEIGHT && Math.random() < 1 / 10) {
                newEnemyType = ENEMY_MONK;
            }
            const newEnemy = createEnemy(newEnemyType, {
                left: WIDTH + 10,
                top: 40 + (GAME_HEIGHT - 80) * (0.5 + 0.5 * Math.sin(time / (1000 - spawnDuration / 5))),
            });
            newEnemy.vx = newEnemy.vx || -6 + 3 * (time % 5000) / spawnDuration;
            newEnemy.top = newEnemy.grounded ? getGroundHeight(state) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
            state = addEnemyToState(state, newEnemy);
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
        return {...state, enemyCooldown};
        */
    }
};
var layerNamesToClear = ['wheat', 'darkGrass', 'thickGrass', 'nearground', 'foreground'];
var treeFortAnimation = createAnimation('gfx/enemies/plainsboss/plainsbossbase.png', r(800, 600));
var forestEdgeAnimation = createAnimation('gfx/enemies/plainsboss/forestbeginbase.png', r(800, 600));

allWorlds[WORLD_FIELD_BOSS] = {
    advanceWorld: function advanceWorld(state) {
        var world = state.world;
        if (world.time < 500 && (['nearground', 'foreground'].some(function (layerName) {
            return world[layerName].sprites.length;
        }) || world.y > 0)) {
            world = _extends({}, world, {
                targetFrames: 50 * 5 / 2,
                targetX: world.x + 1000,
                time: 0
            });
        }
        var time = world.time + FRAME_LENGTH;
        if (time === 500) {
            world.nearground.sprites = [getNewSpriteState(_extends({}, forestEdgeAnimation.frames[0], {
                top: -36,
                left: 2 * WIDTH,
                animation: forestEdgeAnimation
            })), getNewSpriteState(_extends({}, treeFortAnimation.frames[0], {
                top: -36,
                left: 2 * WIDTH,
                animation: treeFortAnimation
            }))];
            /*world.thickGrass.sprites = [
                getNewSpriteState({
                    ...forestEdgeAnimation.frames[0],
                    top: -36,
                    left: 2 * WIDTH,
                    animation: forestEdgeAnimation,
                })
            ];*/
            world.targetFrames = 400 / 2;
            world.targetX = world.x + 2 * WIDTH;
            world.bgm = 'bgm/boss.mp3';
            state = _extends({}, state, { bgm: world.bgm });
        }
        if (world.targetFrames < 50) {
            world.targetFrames += .6;
        }
        if (time === 2500) {
            var treeSprite = world.nearground.sprites[0];
            var newEnemy = createEnemy(ENEMY_DOOR, {
                left: treeSprite.left + 638,
                top: treeSprite.top + 270
            });
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(ENEMY_LARGE_TURRET, {
                left: treeSprite.left + treeSprite.width - 90,
                top: treeSprite.top + 70
            });
            newEnemy.left -= newEnemy.width / 2;
            newEnemy.top -= newEnemy.height / 2;
            state = addEnemyToState(state, newEnemy);
            var smallTurrets = [[-125, 110], [-35, 130], [-130, 160], [-40, 200], [-125, 240], [-35, 245]];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = smallTurrets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var coords = _step.value;

                    newEnemy = createEnemy(ENEMY_SMALL_TURRET, {
                        left: treeSprite.left + treeSprite.width + coords[0],
                        top: treeSprite.top + coords[1]
                    });
                    newEnemy.left -= newEnemy.width / 2;
                    newEnemy.top -= newEnemy.height / 2;
                    state = addEnemyToState(state, newEnemy);
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
        var turrets = state.enemies.filter(function (enemy) {
            return !enemy.dead && enemy.type === ENEMY_SMALL_TURRET;
        });
        if (time > 2500) {
            if (state.enemies.filter(function (enemy) {
                return !enemy.dead && enemy.type === ENEMY_LARGE_TURRET;
            }).length === 0) {
                return enterStarWorldEnd(state);
            }
            if (state.enemies.filter(function (enemy) {
                return enemy.type === ENEMY_DOOR;
            }).length === 0) {
                return enterStarWorldEnd(state);
            }
            var minMonkTime = 4000 + 1000 * turrets.length;
            if (turrets.length <= 4 && time - (world.lastMonkTime || 0) >= minMonkTime && Math.random() > 0.9) {
                var _treeSprite = world.nearground.sprites[0];
                var _newEnemy = createEnemy(ENEMY_GROUND_MONK, {
                    left: _treeSprite.left + _treeSprite.width - 270,
                    top: _treeSprite.top + _treeSprite.height - 36,
                    // Normally monks walk slowly left to right to keep up with scrolling,
                    // but when the screen is still, the need to walk right to left to
                    // approach the player.
                    speed: -1.5
                });
                _newEnemy.left -= _newEnemy.width / 2;
                _newEnemy.top -= _newEnemy.height / 2;
                state = addEnemyToState(state, _newEnemy);
                world = _extends({}, world, { lastMonkTime: time });
            }
            var minStickTime = 3000 + 1000 * turrets.length;
            if (time - (world.lastStickTime || 0) >= minStickTime && Math.random() > 0.9) {
                var _treeSprite2 = world.nearground.sprites[0];
                var spawnX = Math.random() * 400 + _treeSprite2.left + 50;

                // Add a dust cloud to signify something happened when the enemy hit the ground.
                var leaf = createEffect(EFFECT_LEAF, { top: Math.random() * -30, left: spawnX - 20 - Math.random() * 40, vy: -2 + Math.random() * 4 });
                leaf.left -= leaf.width / 2;
                state = addEffectToState(state, leaf);
                leaf = createEffect(EFFECT_LEAF, { top: Math.random() * -30, left: spawnX - 20 + Math.random() * 40, animationTime: 500, vy: -2 + Math.random() * 4 });
                leaf.left -= leaf.width / 2;
                state = addEffectToState(state, leaf);

                var stick = createEnemy(random.element([ENEMY_STICK_1, ENEMY_STICK_2, ENEMY_STICK_3]), {
                    left: spawnX,
                    top: -100,
                    vy: 0,
                    delay: 15
                });
                stick.left -= stick.width / 2;
                state = addEnemyToState(state, stick);
                world = _extends({}, world, { lastStickTime: time });
            }
        }
        world = _extends({}, world, { time: time });
        state = _extends({}, state, { world: world });
        return state;
    }
};

var getFieldWorld = function getFieldWorld() {
    return _extends({
        type: WORLD_FIELD,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 1000,
        targetY: 0,
        targetFrames: 50 * 10,
        time: 0,
        bgm: 'bgm/river.mp3',
        groundHeight: 30
    }, getFieldLayers());
};

var getFieldLayers = function getFieldLayers() {
    return {
        background: getNewLayer({
            xFactor: 0, yFactor: 0.2, yOffset: -100, maxY: 0,
            animation: plainsBg
        }),
        wheat: getNewLayer({
            xFactor: 0.5, yFactor: 0.5, yOffset: -50,
            spriteData: {
                wheatBunch: { animation: wheatAnimation, scale: 4, next: ['wheatCouple'], offset: [-140, -120] },
                wheatCouple: { animation: wheatAnimation, scale: 5, next: ['wheat'], offset: [-100, -80] },
                wheat: { animation: wheatAnimation, scale: 4, next: ['wheatBunch'], offset: [-40, 400] }
            }
        }),
        darkGrass: getNewLayer({
            xFactor: 0.5, yFactor: 0.5, yOffset: -50,
            spriteData: {
                darkGrass: { animation: darkGrass, scale: 1.75, next: ['darkGrass'], offset: [-40, -20] }
            }
        }),
        thickGrass: getNewLayer({
            xFactor: 0.5, yFactor: 0.5, yOffset: -30,
            spriteData: {
                thickGrass: { animation: thickGrass, scale: 1.75, next: ['thickGrass'], offset: [-40, -20] }
            }
        }),
        ground: getNewLayer({
            xFactor: 1, yFactor: 0.5, yOffset: 0,
            spriteData: {
                ground: { animation: groundAnimation, scale: 1, next: ['ground'], offset: 0 }
            }
        }),
        nearground: _extends({}, getNewLayer({
            xFactor: 1, yFactor: 0.5, yOffset: -40,
            spriteData: {
                dandyBunch: { animation: dandyAAnimation, onHit: onHitDandy, scale: 2, next: ['dandyB', 'dandyC', 'dandyPair'], offset: [-40, -35], yOffset: [-8, -5] },
                dandyPair: { animation: dandyBAnimation, onHit: onHitDandy, scale: 2, next: ['dandyC'], offset: [-50, -45], yOffset: [0, 2] },
                dandyA: { animation: dandyAAnimation, onHit: onHitDandy, scale: 2, next: ['dandyB', 'dandyC', 'leaves', 'grassOrBerries'], offset: 80 },
                dandyB: { animation: dandyBAnimation, onHit: onHitDandy, scale: 2, next: ['leaves'], offset: -20, yOffset: [-3, 1] },
                dandyC: { animation: dandyCAnimation, onHit: onHitDandy, scale: 2, next: ['dandyA', 'leaves', 'grassOrBerries'], offset: 100, yOffset: [3, 5] },
                leaves: { animation: [leavesAnimation, smallCloverAnimation], scale: 2, next: ['dandyA', 'dandyBunch', 'leaves', 'grassOrBerries'], offset: -20 },
                grassOrBerries: { animation: [grassAnimation, grass2Animation, grass3Animation, berriesAnimation], scale: 2, next: ['grassOrBerries', 'dandyB', 'dandyPair', 'leaves'], offset: 0 }
            }
        })),
        foreground: getNewLayer({
            xFactor: 1, yFactor: 0.5, yOffset: -5,
            spriteData: {
                grass: { animation: grassTuft, onContact: speedupAnimation, scale: 1.5, next: ['grass'], offset: [-10, 400, 550, 610] }
            }
        }),
        // Background layers start at the top left corner of the screen.
        bgLayerNames: ['background'],
        // Midground layers use the bottom of the HUD as the top of the screen,
        // which is consistent with all non background sprites, making hit detection simple.
        mgLayerNames: ['wheat', 'darkGrass', 'thickGrass', 'ground', 'nearground'],
        // Foreground works the same as Midground but is drawn on top of game sprites.
        fgLayerNames: ['foreground']
    };
};

var getFieldWorldStart = function getFieldWorldStart() {
    var world = getFieldWorld();
    world.nearground.sprites = [getNewSpriteState(_extends({}, townAnimation.frames[0], {
        top: 263,
        left: 0,
        offset: 50,
        animation: townAnimation,
        next: ['grassOrBerries']
    }))];
    return world;
};

var transitionToFieldBoss = function transitionToFieldBoss(state) {
    var updatedWorld = _extends({}, state.world, {
        type: WORLD_FIELD_BOSS,
        time: 0,
        targetFrames: 50 * 5,
        targetY: -100
    });
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = layerNamesToClear[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var layerName = _step2.value;

            var sprites = updatedWorld[layerName].sprites.filter(function (sprite) {
                return sprite.left < WIDTH;
            });
            updatedWorld[layerName] = _extends({}, updatedWorld[layerName], { spriteData: false, sprites: sprites });
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    return _extends({}, state, { world: updatedWorld });
};

var onHitDandy = function onHitDandy(state, layerName, spriteIndex) {
    var world = state.world;
    var layer = world[layerName];
    var sprites = [].concat(_toConsumableArray(layer.sprites));
    var sprite = sprites[spriteIndex];
    var newAnimation = dandyAPoofAnimation;
    if (sprite.animation === dandyBAnimation) {
        newAnimation = dandyBPoofAnimation;
    } else if (sprite.animation === dandyCAnimation) {
        newAnimation = dandyCPoofAnimation;
    }
    sprites[spriteIndex] = _extends({}, sprite, { animation: newAnimation, onHit: null, animationTime: FRAME_LENGTH * newAnimation.frameDuration });
    layer = _extends({}, layer, { sprites: sprites });
    world = _extends({}, world, _defineProperty({}, layerName, layer));
    return _extends({}, state, { world: world });
};

function speedupAnimation(state, layerName, spriteIndex) {
    var sprite = state.world[layerName].sprites[spriteIndex];
    return updateLayerSprite(state, layerName, spriteIndex, { animationTime: sprite.animationTime + 2 * FRAME_LENGTH });
}

module.exports = {
    getFieldWorld: getFieldWorld, getFieldWorldStart: getFieldWorldStart,
    CHECK_POINT_FIELD_START: CHECK_POINT_FIELD_START, CHECK_POINT_FIELD_MIDDLE: CHECK_POINT_FIELD_MIDDLE, CHECK_POINT_FIELD_END: CHECK_POINT_FIELD_END
};

var _require5 = require('enemies'),
    enemyData = _require5.enemyData,
    createEnemy = _require5.createEnemy,
    addEnemyToState = _require5.addEnemyToState,
    updateEnemy = _require5.updateEnemy;

var smallTurretRectangle = r(41, 41);
var ENEMY_SMALL_TURRET = 'smallTurret';
enemyData[ENEMY_SMALL_TURRET] = {
    animation: createAnimation('gfx/enemies/plainsboss/sweetspot.png', smallTurretRectangle),
    deathAnimation: createAnimation('gfx/enemies/plainsboss/sweetspot4.png', smallTurretRectangle),
    attackAnimation: {
        frames: [_extends({}, smallTurretRectangle, { image: requireImage('gfx/enemies/plainsboss/sweetspot2.png') }), _extends({}, smallTurretRectangle, { image: requireImage('gfx/enemies/plainsboss/sweetspot3.png') }), _extends({}, smallTurretRectangle, { image: requireImage('gfx/enemies/plainsboss/sweetspot2.png') })],
        frameDuration: 12
    },
    deathSound: 'sfx/robedeath1.mp3',
    isInvulnerable: function isInvulnerable(state, enemy) {
        return !(enemy.attackCooldownFramesLeft > 0);
    },
    shoot: function shoot(state, enemy) {
        if (enemy.left > WIDTH + 10) return state;
        // This is pretty ad hoc, but this code delays creating the bullet until the second
        // frame of the attack animation, since the first frame is a preparation frame.
        if (enemy.attackCooldownFramesLeft === Math.floor(enemy.attackCooldownFrames / 2)) {
            var target = state.players[0].sprite;
            target = _extends({}, target, { left: target.left + state.world.vx * 40 });

            var _getTargetVector = getTargetVector(enemy, target),
                dx = _getTargetVector.dx,
                dy = _getTargetVector.dy;

            if (!dx && !dy) dx = -1;
            var mag = Math.sqrt(dx * dx + dy * dy);
            var bullet = createAttack(ATTACK_BULLET, {
                left: enemy.left,
                top: enemy.top + enemy.height / 2,
                vx: enemy.bulletSpeed * dx / mag,
                vy: enemy.bulletSpeed * dy / mag
            });
            bullet.left -= bullet.width / 2;
            bullet.top -= bullet.height / 2;
            state = addEnemyAttackToState(state, bullet);
        }
        var shotCooldown = enemy.shotCooldown;
        if (shotCooldown === undefined) {
            shotCooldown = random.element(enemy.shotCooldownFrames);
        }
        if (shotCooldown > 0) {
            return updateEnemy(state, enemy, { shotCooldown: shotCooldown - 1 });
        }
        shotCooldown = random.element(enemy.shotCooldownFrames);
        return updateEnemy(state, enemy, { shotCooldown: shotCooldown, animationTime: 0, attackCooldownFramesLeft: enemy.attackCooldownFrames });
    },

    props: {
        life: 6,
        score: 200,
        stationary: true,
        bulletSpeed: 5,
        attackCooldownFrames: 36,
        shotCooldownFrames: [80, 120],
        persist: true
    }
};

var largeTurretRectangle = r(41, 41);
var ENEMY_LARGE_TURRET = 'largeTurret';
enemyData[ENEMY_LARGE_TURRET] = {
    animation: createAnimation('gfx/enemies/plainsboss/sweetspotlarge1.png', largeTurretRectangle),
    deathAnimation: createAnimation('gfx/enemies/plainsboss/sweetspotlarge4.png', largeTurretRectangle),
    attackAnimation: {
        frames: [_extends({}, largeTurretRectangle, { image: requireImage('gfx/enemies/plainsboss/sweetspotlarge2.png') }), _extends({}, largeTurretRectangle, { image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png') }), _extends({}, largeTurretRectangle, { image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png') }), _extends({}, largeTurretRectangle, { image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png') }), _extends({}, largeTurretRectangle, { image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png') }), _extends({}, largeTurretRectangle, { image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png') }), _extends({}, largeTurretRectangle, { image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png') }), _extends({}, largeTurretRectangle, { image: requireImage('gfx/enemies/plainsboss/sweetspotlarge2.png') })],
        frameDuration: 12
    },
    deathSound: 'sfx/robedeath1.mp3',
    isInvulnerable: function isInvulnerable(state, enemy) {
        return !(enemy.attackCooldownFramesLeft > 0);
    },
    shoot: function shoot(state, enemy) {
        // Don't open up until 2 or fewer turrets are left.
        if (state.enemies.filter(function (enemy) {
            return !enemy.dead && enemy.type === ENEMY_SMALL_TURRET;
        }).length > 2) return state;
        // This turret shoots four different times during its attack animation.
        if (enemy.attackCooldownFramesLeft === 54 || enemy.attackCooldownFramesLeft === 36) {
            var target = state.players[0].sprite;
            // First shot is slower and potentially off target.
            target = _extends({}, target, { left: target.left + 40 - Math.random() * 80 });

            var _getTargetVector2 = getTargetVector(enemy, target),
                dx = _getTargetVector2.dx,
                dy = _getTargetVector2.dy;

            if (!dx && !dy) dx = -1;
            var mag = Math.sqrt(dx * dx + dy * dy);
            var bullet = createAttack(ATTACK_BULLET, {
                left: enemy.left + 10,
                top: enemy.top + enemy.height,
                vx: enemy.bulletSpeed * dx / mag,
                vy: enemy.bulletSpeed * dy / mag
            });
            bullet.left -= bullet.width / 2;
            bullet.top -= bullet.height / 2;
            state = addEnemyAttackToState(state, bullet);
        } else if (enemy.attackCooldownFramesLeft === 18 || enemy.attackCooldownFramesLeft === 72) {
            var _target = state.players[0].sprite;

            var _getTargetVector3 = getTargetVector(enemy, _target),
                _dx = _getTargetVector3.dx,
                _dy = _getTargetVector3.dy;

            if (!_dx && !_dy) _dx = -1;
            var _mag = Math.sqrt(_dx * _dx + _dy * _dy);
            var _bullet = createAttack(ATTACK_BULLET, {
                left: enemy.left + 10,
                top: enemy.top + enemy.height,
                vx: 1.5 * enemy.bulletSpeed * _dx / _mag,
                vy: 1.5 * enemy.bulletSpeed * _dy / _mag
            });
            _bullet.left -= _bullet.width / 2;
            _bullet.top -= _bullet.height / 2;
            state = addEnemyAttackToState(state, _bullet);
        }
        var shotCooldown = enemy.shotCooldown;
        if (shotCooldown === undefined) {
            shotCooldown = random.element(enemy.shotCooldownFrames);
        }
        if (shotCooldown > 0) {
            return updateEnemy(state, enemy, { shotCooldown: shotCooldown - 1 });
        }
        shotCooldown = random.element(enemy.shotCooldownFrames);
        return updateEnemy(state, enemy, { shotCooldown: shotCooldown, animationTime: 0, attackCooldownFramesLeft: enemy.attackCooldownFrames });
    },

    props: {
        life: 30,
        score: 1000,
        stationary: true,
        bulletSpeed: 6,
        attackCooldownFrames: 96,
        shotCooldownFrames: [120, 160],
        persist: true
    }
};
var ENEMY_GROUND_MONK = 'groundMonk';
enemyData[ENEMY_GROUND_MONK] = _extends({}, enemyData[ENEMY_MONK], {
    spawnAnimation: createAnimation('gfx/enemies/robesclimb.png', r(49, 31), { duration: 500 }),
    props: _extends({}, enemyData[ENEMY_MONK].props, {
        life: 2
    })
});
var ENEMY_DOOR = 'door';
var doorRectangle = r(129, 275, { hitBox: { left: 22, top: 23, width: 96, height: 243 } });
enemyData[ENEMY_DOOR] = {
    animation: {
        frames: [_extends({}, doorRectangle, { image: requireImage('gfx/enemies/plainsboss/door1.png') }), _extends({}, doorRectangle, { image: requireImage('gfx/enemies/plainsboss/door2.png') }), _extends({}, doorRectangle, { image: requireImage('gfx/enemies/plainsboss/door3.png') })],
        frameDuration: 12
    },
    deathAnimation: createAnimation('gfx/enemies/plainsboss/door3.png', doorRectangle),
    accelerate: function accelerate(state, enemy) {
        if (enemy.life > 2 * enemy.maxLife / 3) return _extends({}, enemy, { animationTime: 0 });
        if (enemy.life > enemy.maxLife / 3) return _extends({}, enemy, { animationTime: FRAME_LENGTH * 12 });
        return _extends({}, enemy, { animationTime: 2 * FRAME_LENGTH * 12 });
    },
    onDeathEffect: function onDeathEffect(state, enemy) {
        return updateEnemy(state, enemy, { stationary: false });
    },
    onDamageEffect: function onDamageEffect(state, enemy) {
        if (enemy.life % 3) return state;
        for (var i = 0; i < 2; i++) {
            var effect = createEffect(EFFECT_DOOR_DAMAGE, {
                top: enemy.top + 20 + 120 * i + Math.random() * 40,
                left: enemy.left + 20 + Math.random() * 90
            });
            effect.top -= effect.height / 2;
            effect.left -= effect.width / 2;
            state = addEffectToState(state, effect);
        }
        return state;
    },

    props: {
        maxLife: 300,
        life: 300,
        score: 500,
        stationary: true
    }
};
var ENEMY_STICK_1 = 'stick1';
var ENEMY_STICK_2 = 'stick2';
var ENEMY_STICK_3 = 'stick3';
enemyData[ENEMY_STICK_1] = {
    animation: createAnimation('gfx/enemies/plainsboss/branch1.png', r(80, 40)),
    deathAnimation: createAnimation('gfx/enemies/plainsboss/branch4.png', r(80, 40)),
    accelerate: function accelerate(state, enemy) {
        if (enemy.top + enemy.height >= getGroundHeight(state)) {
            return _extends({}, enemy, { dead: true, vx: 3 + Math.random() * 3, vy: -4 });
        }
        return _extends({}, enemy, { vy: enemy.vy + .3 });
    },
    props: {
        life: 1,
        score: 0
    }
};
enemyData[ENEMY_STICK_2] = _extends({}, enemyData[ENEMY_STICK_1], {
    animation: createAnimation('gfx/enemies/plainsboss/branch2.png', r(80, 40))
});
enemyData[ENEMY_STICK_3] = _extends({}, enemyData[ENEMY_STICK_1], {
    animation: createAnimation('gfx/enemies/plainsboss/branch3.png', r(113, 24))
});

var _require6 = require('areas/stars'),
    enterStarWorldEnd = _require6.enterStarWorldEnd;

var _require7 = require('attacks'),
    createAttack = _require7.createAttack,
    addEnemyAttackToState = _require7.addEnemyAttackToState;

var _require8 = require('effects'),
    createEffect = _require8.createEffect,
    effects = _require8.effects,
    addEffectToState = _require8.addEffectToState,
    updateEffect = _require8.updateEffect;

var EFFECT_LEAF = 'leaf';
effects[EFFECT_LEAF] = {
    animation: createAnimation('gfx/enemies/plainsboss/leaf.png', _extends({}, r(40, 37), { hitBox: r(30, 37) })),
    advanceEffect: function advanceEffect(state, effectIndex) {
        var effect = state.effects[effectIndex];
        /*if (effect.vy > 20) {
            return updateEffect(state, effectIndex, {xScale: -(effect.xScale || 1), vx: -effect.vx, vy: -2});
        }*/
        var xFactor = Math.cos(effect.animationTime / 100);
        var yFactor = Math.sin(effect.animationTime / 100);
        return updateEffect(state, effectIndex, {
            vy: effect.vy + 1.5 - 2 * yFactor * yFactor,
            vx: 5 * xFactor * Math.abs(xFactor),
            xScale: xFactor > 0 ? 1 : -1
        });
    },
    props: {
        relativeToGround: true,
        loops: 20,
        vy: 1,
        vx: 0
    }
};
var EFFECT_DOOR_DAMAGE = 'doorDamage';
effects[EFFECT_DOOR_DAMAGE] = {
    animation: createAnimation('gfx/enemies/plainsboss/doorhurt.png', r(103, 153), { duration: 20 }),
    advanceEffect: function advanceEffect(state, effectIndex) {
        var effect = state.effects[effectIndex];
        return updateEffect(state, effectIndex, {
            vy: effect.vy + 0.5,
            xScale: (effect.xScale * 4 + 1) / 5,
            yScale: (effect.yScale * 4 + 1) / 5
        });
    },
    props: {
        relativeToGround: true,
        xScale: .1,
        yScale: .1
    }
};

},{"animations":2,"areas/stars":4,"attacks":5,"effects":8,"enemies":10,"gameConstants":11,"random":18,"sprites":21,"world":23}],4:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var random = require('random');

var _require = require('gameConstants'),
    FRAME_LENGTH = _require.FRAME_LENGTH,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    WIDTH = _require.WIDTH,
    LOOT_COIN = _require.LOOT_COIN,
    LOOT_HELMET = _require.LOOT_HELMET,
    LOOT_COMBO = _require.LOOT_COMBO;

var _require2 = require('animations'),
    createAnimation = _require2.createAnimation,
    r = _require2.r;

var _require3 = require('world'),
    getNewLayer = _require3.getNewLayer,
    allWorlds = _require3.allWorlds;

var WORLD_STARS = 'stars';

var stars1 = createAnimation('gfx/scene/portal/portal1.png', r(200, 200));
// TODO: Ask Jon to fix black in this image and add it back.
// const stars2 = createAnimation('gfx/scene/portal/portal2.png', r(200, 200));
var stars3 = createAnimation('gfx/scene/portal/portal3.png', r(200, 200));

var advanceStarWorld = function advanceStarWorld(state) {
    var world = state.world;
    var multiplier = getComboMultiplier(state, 0);
    var targetFrames = 170 - 30 * (multiplier - 1);
    var targetX = world.x + 1000;
    var time = world.time + FRAME_LENGTH;
    world = _extends({}, world, { targetX: targetX, time: time, targetFrames: targetFrames });
    state = _extends({}, state, { world: world });

    var addBonusCoin = function addBonusCoin(left, top) {
        var loot = createLoot(LOOT_COIN, { left: left, top: top, points: 0, comboPoints: 10, scale: 3 });
        loot.top -= loot.height / 2;
        return addLootToState(state, loot);
    };
    time -= 2000;
    if (!time) {
        for (var left = WIDTH; left < WIDTH + 200; left += 100) {
            state = addBonusCoin(left, GAME_HEIGHT / 2);
        }
    }
    time -= 2000;
    if (!time) {
        for (var _left = WIDTH; _left < WIDTH + 400; _left += 100) {
            state = addBonusCoin(_left, GAME_HEIGHT / 4);
        }
    }
    time -= 2000;
    if (!time) {
        for (var _left2 = WIDTH; _left2 < WIDTH + 600; _left2 += 100) {
            state = addBonusCoin(_left2, GAME_HEIGHT / 2);
        }
    }
    time -= 2000;
    if (!time) {
        for (var _left3 = WIDTH; _left3 < WIDTH + 800; _left3 += 100) {
            state = addBonusCoin(_left3, 3 * GAME_HEIGHT / 4);
        }
    }

    time -= 5000;
    if (!time) {
        for (var _left4 = WIDTH; _left4 < WIDTH + 1000; _left4 += 100) {
            state = addBonusCoin(_left4, GAME_HEIGHT / 2);
        }
    }
    time -= 3000;
    if (!time) {
        for (var _left5 = WIDTH; _left5 < WIDTH + 1000; _left5 += 100) {
            state = addBonusCoin(_left5, GAME_HEIGHT / 6);
        }
    }
    time -= 3000;
    if (!time) {
        for (var _left6 = WIDTH; _left6 < WIDTH + 1000; _left6 += 100) {
            state = addBonusCoin(_left6, GAME_HEIGHT / 2);
        }
    }
    time -= 3000;
    if (!time) {
        for (var _left7 = WIDTH; _left7 < WIDTH + 1000; _left7 += 100) {
            state = addBonusCoin(_left7, 5 * GAME_HEIGHT / 6);
        }
    }
    time -= 3000;
    if (!time) {
        for (var _left8 = WIDTH; _left8 < WIDTH + 1000; _left8 += 100) {
            var top = GAME_HEIGHT * (.5 + .4 * Math.cos((_left8 - WIDTH) / 1000 * 2 * Math.PI / 3));
            state = addBonusCoin(_left8, top);
        }
    }
    time -= 4000;
    if (!time) {
        for (var _left9 = WIDTH; _left9 < WIDTH + 2000; _left9 += 100) {
            var _top = GAME_HEIGHT * (.5 - .4 * Math.cos((_left9 - WIDTH) / 1000 * 2 * Math.PI / 2));
            state = addBonusCoin(_left9, _top);
        }
    }
    time -= 4000;
    if (!time) {
        for (var _left10 = WIDTH; _left10 < WIDTH + 1000; _left10 += 100) {
            state = addBonusCoin(_left10, GAME_HEIGHT / 6);
        }
    }
    time -= 2500;
    if (!time && multiplier >= 5) {
        var helmet = createLoot(LOOT_HELMET, { left: WIDTH * 2, top: GAME_HEIGHT - 100 });
        helmet.top -= helmet.height / 2;
        state = addLootToState(state, helmet);
    }
    time -= 3000;
    if (!time) {
        var type = multiplier >= 3 ? LOOT_COMBO : random.element(ladybugTypes);
        var loot = createLoot(type, { left: WIDTH, top: GAME_HEIGHT / 2, scale: 2 });
        loot.top -= loot.height / 2;
        state = addLootToState(state, loot);
    }
    time -= 3000;
    if (!time) {
        state = starWorldTransition(applyCheckpointToState(state, state.world.returnPoint));
    }
    return state;
};

allWorlds[WORLD_STARS] = {
    advanceWorld: advanceStarWorld
};

var getStarWorld = function getStarWorld() {
    return {
        type: WORLD_STARS,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 1000,
        targetY: 0,
        targetFrames: 50 * 10,
        time: 0,
        bgm: 'bgm/space.mp3',
        groundHeight: 30,
        background: getNewLayer({
            xFactor: 0, yFactor: 0.2, yOffset: -100, maxY: 0,
            backgroundColor: '#000'
        }),
        midgroundTop: getNewLayer({
            xFactor: 0.5, yFactor: 0.5, yOffset: 0,
            spriteData: {
                stars: { animation: [stars1, stars3], scale: 2, next: ['stars'], offset: [0] }
            }
        }),
        midgroundBottom: getNewLayer({
            xFactor: 0.5, yFactor: 0.5, yOffset: -400,
            spriteData: {
                stars: { animation: [stars1, stars3], scale: 2, next: ['stars'], offset: [20] }
            }
        }),
        bgLayerNames: ['background'],
        mgLayerNames: ['midgroundTop', 'midgroundBottom'],
        fgLayerNames: []
    };
};

var enterStarWorld = function enterStarWorld(state) {
    return starWorldTransition(applyCheckpointToState(state, CHECK_POINT_FIELD_STARS_START));
};

var enterStarWorldEnd = function enterStarWorldEnd(state) {
    return starWorldTransition(applyCheckpointToState(state, CHECK_POINT_FIELD_STARS_END));
};

var starWorldTransition = function starWorldTransition(state) {
    return _extends({}, state, { world: _extends({}, state.world, { transitionFrames: 100 }) });
};

var CHECK_POINT_FIELD_STARS_START = 'fieldStarsStart';
var CHECK_POINT_FIELD_STARS_END = 'fieldStarsEnd';

module.exports = {
    enterStarWorld: enterStarWorld, enterStarWorldEnd: enterStarWorldEnd, starWorldTransition: starWorldTransition,
    CHECK_POINT_FIELD_STARS_START: CHECK_POINT_FIELD_STARS_START, CHECK_POINT_FIELD_STARS_END: CHECK_POINT_FIELD_STARS_END
};

var _require4 = require('world'),
    applyCheckpointToState = _require4.applyCheckpointToState,
    checkpoints = _require4.checkpoints;

checkpoints[CHECK_POINT_FIELD_STARS_START] = function (state) {
    var world = getStarWorld();
    world.returnPoint = CHECK_POINT_FIELD_END;
    return updatePlayer(_extends({}, state, { world: world }), 0, { comboScore: 0 });
};
checkpoints[CHECK_POINT_FIELD_STARS_END] = function (state) {
    var world = getStarWorld();
    world.time = 25000;
    world.returnPoint = CHECK_POINT_FIELD_START;
    return updatePlayer(_extends({}, state, { world: world }), 0, { comboScore: 700 });
};

var _require5 = require('areas/field'),
    CHECK_POINT_FIELD_START = _require5.CHECK_POINT_FIELD_START,
    CHECK_POINT_FIELD_END = _require5.CHECK_POINT_FIELD_END;

var _require6 = require('loot'),
    createLoot = _require6.createLoot,
    addLootToState = _require6.addLootToState,
    getComboMultiplier = _require6.getComboMultiplier,
    ladybugTypes = _require6.ladybugTypes;

var _require7 = require('heroes'),
    updatePlayer = _require7.updatePlayer;

},{"animations":2,"areas/field":3,"gameConstants":11,"heroes":12,"loot":17,"random":18,"world":23}],5:[function(require,module,exports){
'use strict';

var _attacks;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('draw'),
    drawImage = _require.drawImage,
    drawTintedImage = _require.drawTintedImage;

var _require2 = require('gameConstants'),
    FRAME_LENGTH = _require2.FRAME_LENGTH,
    WIDTH = _require2.WIDTH,
    GAME_HEIGHT = _require2.GAME_HEIGHT,
    OFFSCREEN_PADDING = _require2.OFFSCREEN_PADDING,
    ATTACK_BLAST = _require2.ATTACK_BLAST,
    ATTACK_SLASH = _require2.ATTACK_SLASH,
    ATTACK_STAB = _require2.ATTACK_STAB,
    ATTACK_BULLET = _require2.ATTACK_BULLET,
    ATTACK_DEFEATED_ENEMY = _require2.ATTACK_DEFEATED_ENEMY,
    ATTACK_SPRAY_UP = _require2.ATTACK_SPRAY_UP,
    ATTACK_SPRAY_RIGHT = _require2.ATTACK_SPRAY_RIGHT,
    ATTACK_SPRAY_DOWN = _require2.ATTACK_SPRAY_DOWN,
    ATTACK_ORB = _require2.ATTACK_ORB,
    ATTACK_LASER = _require2.ATTACK_LASER,
    ATTACK_EXPLOSION = _require2.ATTACK_EXPLOSION;

var _require3 = require('animations'),
    requireImage = _require3.requireImage,
    r = _require3.r,
    createAnimation = _require3.createAnimation,
    getFrame = _require3.getFrame,
    blastStartAnimation = _require3.blastStartAnimation,
    blastLoopAnimation = _require3.blastLoopAnimation,
    slashAnimation = _require3.slashAnimation,
    stabAnimation = _require3.stabAnimation,
    bulletAnimation = _require3.bulletAnimation,
    hugeExplosionAnimation = _require3.hugeExplosionAnimation;

var _require4 = require('sprites'),
    getNewSpriteState = _require4.getNewSpriteState;

var orbRectangle = r(10, 10);
var orbAnimation = {
    frames: [_extends({}, orbRectangle, { image: requireImage('gfx/attacks/lbshot1.png') }), _extends({}, orbRectangle, { image: requireImage('gfx/attacks/lbshot2.png') }), _extends({}, orbRectangle, { image: requireImage('gfx/attacks/lbshot3.png') }), _extends({}, orbRectangle, { image: requireImage('gfx/attacks/lbshot4.png') })],
    frameDuration: 2
};

var laserRectangle = r(20, 7);
var laserStartAnimation = {
    frames: [_extends({}, laserRectangle, { image: requireImage('gfx/attacks/r1.png') }), _extends({}, laserRectangle, { image: requireImage('gfx/attacks/r2.png') })],
    frameDuration: 3
};
var laserAnimation = createAnimation('gfx/attacks/r3.png', laserRectangle);

var sprayStartAnimation = createAnimation('gfx/attacks/s1.png', r(9, 9));
var sprayAnimationUp = createAnimation('gfx/attacks/s3.png', r(9, 9));
var sprayAnimationRight = createAnimation('gfx/attacks/s2.png', r(9, 9));
var sprayAnimationDown = createAnimation('gfx/attacks/s4.png', r(9, 9));

var attacks = (_attacks = {}, _defineProperty(_attacks, ATTACK_SPRAY_UP, {
    startAnimation: sprayStartAnimation,
    animation: sprayAnimationUp,
    props: {
        sfx: 'sfx/shoot.mp3'
    }
}), _defineProperty(_attacks, ATTACK_SPRAY_RIGHT, {
    startAnimation: sprayStartAnimation,
    animation: sprayAnimationRight,
    props: {
        sfx: 'sfx/shoot.mp3'
    }
}), _defineProperty(_attacks, ATTACK_SPRAY_DOWN, {
    startAnimation: sprayStartAnimation,
    animation: sprayAnimationDown,
    props: {
        sfx: 'sfx/shoot.mp3'
    }
}), _defineProperty(_attacks, ATTACK_BLAST, {
    startAnimation: blastStartAnimation,
    animation: blastLoopAnimation,
    props: {
        sfx: 'sfx/shoot.mp3'
    }
}), _defineProperty(_attacks, ATTACK_SLASH, {
    animation: slashAnimation,
    hitSfx: 'sfx/meleehit.mp3',
    props: {
        melee: true,
        piercing: true,
        sfx: 'sfx/dodge.mp3'
    }
}), _defineProperty(_attacks, ATTACK_STAB, {
    animation: stabAnimation,
    hitSfx: 'sfx/meleehit.mp3',
    props: {
        melee: true,
        piercing: true,
        sfx: 'sfx/dodge.mp3'
    }
}), _defineProperty(_attacks, ATTACK_BULLET, {
    animation: bulletAnimation
}), _defineProperty(_attacks, ATTACK_ORB, {
    animation: orbAnimation
}), _defineProperty(_attacks, ATTACK_LASER, {
    startAnimation: laserStartAnimation,
    animation: laserAnimation,
    props: {
        damage: 2,
        piercing: true
    }
}), _defineProperty(_attacks, ATTACK_DEFEATED_ENEMY, {
    // The animation will be the enemy death animation.
    hitSfx: 'sfx/throwhit.mp3',
    props: {
        piercing: true
    }
}), _defineProperty(_attacks, ATTACK_EXPLOSION, {
    animation: hugeExplosionAnimation,
    props: {
        damage: 20, piercing: true,
        sfx: 'sfx/explosion.mp3',
        explosion: true
    }
}), _attacks);

var createAttack = function createAttack(type, props) {
    var frame = (props.animation || attacks[type].animation).frames[0];
    return getNewSpriteState(_extends({}, frame, attacks[type].props, {
        type: type,
        hitIds: {}
    }, props));
};

var addPlayerAttackToState = function addPlayerAttackToState(state, attack) {
    var sfx = state.sfx;
    if (attack.sfx) sfx = _extends({}, sfx, _defineProperty({}, attack.sfx, true));
    return _extends({}, state, { newPlayerAttacks: [].concat(_toConsumableArray(state.newPlayerAttacks), [attack]), sfx: sfx });
};

var addEnemyAttackToState = function addEnemyAttackToState(state, attack) {
    var sfx = state.sfx;
    if (attack.sfx) sfx = _extends({}, sfx, _defineProperty({}, attack.sfx, true));
    return _extends({}, state, { newEnemyAttacks: [].concat(_toConsumableArray(state.newEnemyAttacks), [attack]), sfx: sfx });
};

var addNeutralAttackToState = function addNeutralAttackToState(state, attack) {
    var sfx = state.sfx;
    if (attack.sfx) sfx = _extends({}, sfx, _defineProperty({}, attack.sfx, true));
    return _extends({}, state, { newNeutralAttacks: [].concat(_toConsumableArray(state.newNeutralAttacks), [attack]), sfx: sfx });
};

var renderAttack = function renderAttack(context, attack) {
    var animationTime = attack.animationTime;

    var attackData = attacks[attack.type];
    var animation = attack.animation || attackData.animation;
    if (attackData.startAnimation) {
        var startAnimationLength = attackData.startAnimation.frames.length * attackData.startAnimation.frameDuration * FRAME_LENGTH;
        if (animationTime >= startAnimationLength) {
            animationTime -= startAnimationLength;
        } else {
            animation = attackData.startAnimation;
        }
    }
    var frame = getFrame(animation, animationTime);
    if (attack.explosion && attack.delay) return;
    // These should only apply to player attacks since any damage defeats a player.

    var _getAttackTint = getAttackTint(attack),
        color = _getAttackTint.color,
        amount = _getAttackTint.amount;

    if (!amount) drawImage(context, frame.image, frame, attack);else drawTintedImage(context, frame.image, color, amount, frame, attack);
};

function getAttackTint(attack) {
    var damage = attack.damage;
    if (attack.explosion || !damage || damage <= 1) return {};
    if (damage >= 6) return { color: 'white', amount: 0.9 };
    if (damage >= 5) return { color: 'black', amount: 0.9 };
    if (damage >= 4) return { color: 'blue', amount: 0.5 };
    if (damage >= 3) return { color: 'green', amount: 0.4 };
    if (damage >= 2) return { color: 'orange', amount: 0.5 };
    return {};
}

var advanceAttack = function advanceAttack(state, attack) {
    var left = attack.left,
        top = attack.top,
        width = attack.width,
        height = attack.height,
        vx = attack.vx,
        vy = attack.vy,
        delay = attack.delay,
        animationTime = attack.animationTime,
        playerIndex = attack.playerIndex,
        melee = attack.melee,
        explosion = attack.explosion,
        ttl = attack.ttl;

    if (delay > 0 || melee) {
        delay--;
        if (!explosion && playerIndex >= 0) {
            var source = state.players[playerIndex].sprite;
            left = source.left + source.vx + source.width + (attack.xOffset || 0);
            top = source.top + source.vy + Math.round((source.height - height) / 2) + (attack.yOffset || 0);
        }
    }
    if (!(delay > 0)) {
        left += vx;
        top += vy;
    }
    animationTime += FRAME_LENGTH;
    var done = false;
    if (ttl > 0) {
        ttl--;
        done = ttl <= 0;
    } else if (melee || explosion) {
        var animation = attacks[attack.type].animation;
        done = animationTime >= animation.frames.length * animation.frameDuration * FRAME_LENGTH;
    } else {
        done = left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING || top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;
    }
    return _extends({}, attack, { delay: delay, left: left, top: top, animationTime: animationTime, done: done, ttl: ttl });
};

module.exports = {
    attacks: attacks,
    createAttack: createAttack,
    addPlayerAttackToState: addPlayerAttackToState,
    addNeutralAttackToState: addNeutralAttackToState,
    addEnemyAttackToState: addEnemyAttackToState,
    advanceAttack: advanceAttack,
    renderAttack: renderAttack,
    getAttackTint: getAttackTint
};

},{"animations":2,"draw":7,"gameConstants":11,"sprites":21}],6:[function(require,module,exports){
'use strict';

var _require = require('gameConstants'),
    FRAME_LENGTH = _require.FRAME_LENGTH;

var _require2 = require('sounds'),
    preloadSounds = _require2.preloadSounds;

var _require3 = require('state'),
    getNewState = _require3.getNewState,
    advanceState = _require3.advanceState,
    applyPlayerActions = _require3.applyPlayerActions;

var render = require('render');

var _require4 = require('keyboard'),
    isKeyDown = _require4.isKeyDown,
    KEY_UP = _require4.KEY_UP,
    KEY_DOWN = _require4.KEY_DOWN,
    KEY_LEFT = _require4.KEY_LEFT,
    KEY_RIGHT = _require4.KEY_RIGHT,
    KEY_SPACE = _require4.KEY_SPACE,
    KEY_ENTER = _require4.KEY_ENTER,
    KEY_R = _require4.KEY_R,
    KEY_X = _require4.KEY_X,
    KEY_C = _require4.KEY_C,
    KEY_V = _require4.KEY_V,
    KEY_SHIFT = _require4.KEY_SHIFT;

// Currently we only support a single player.


var playerIndex = 0;

preloadSounds();
var preloadedSounds = true;
var stateQueue = [];
var state = getNewState();

var update = function update() {
    state = applyPlayerActions(state, playerIndex, {
        // Make sure up/down only trigger once per press during the title sequence.
        up: isKeyDown(KEY_UP, state.title || state.gameover), down: isKeyDown(KEY_DOWN, state.title || state.gameover),
        left: isKeyDown(KEY_LEFT), right: isKeyDown(KEY_RIGHT),
        shoot: isKeyDown(KEY_SPACE),
        melee: isKeyDown(KEY_C),
        special: isKeyDown(KEY_V),
        switch: isKeyDown(KEY_X),
        toggleRight: isKeyDown(KEY_SHIFT),
        start: isKeyDown(KEY_ENTER, true)
    });

    if (!preloadedSounds && state.interacted) {
        preloadSounds();
        preloadedSounds = true;
    }

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

},{"gameConstants":11,"keyboard":16,"render":19,"sounds":20,"state":22}],7:[function(require,module,exports){
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

},{"gameConstants":11}],8:[function(require,module,exports){
'use strict';

var _effects;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
    EFFECT_DAMAGE = _require2.EFFECT_DAMAGE,
    EFFECT_EXPLOSION = _require2.EFFECT_EXPLOSION,
    EFFECT_DUST = _require2.EFFECT_DUST,
    EFFECT_DEAD_BEE = _require2.EFFECT_DEAD_BEE,
    EFFECT_SWITCH_BEE = _require2.EFFECT_SWITCH_BEE,
    EFFECT_DEAD_DRAGONFLY = _require2.EFFECT_DEAD_DRAGONFLY,
    EFFECT_SWITCH_DRAGONFLY = _require2.EFFECT_SWITCH_DRAGONFLY,
    EFFECT_DEAD_MOTH = _require2.EFFECT_DEAD_MOTH,
    EFFECT_SWITCH_MOTH = _require2.EFFECT_SWITCH_MOTH,
    EFFECT_NEEDLE_FLIP = _require2.EFFECT_NEEDLE_FLIP,
    EFFECT_RATE_UP = _require2.EFFECT_RATE_UP,
    EFFECT_SIZE_UP = _require2.EFFECT_SIZE_UP,
    EFFECT_SPEED_UP = _require2.EFFECT_SPEED_UP,
    EFFECT_DEFLECT_BULLET = _require2.EFFECT_DEFLECT_BULLET;

var _require3 = require('animations'),
    requireImage = _require3.requireImage,
    getFrame = _require3.getFrame,
    getHitBox = _require3.getHitBox,
    damageAnimation = _require3.damageAnimation,
    dustAnimation = _require3.dustAnimation,
    explosionAnimation = _require3.explosionAnimation,
    needleFlipAnimation = _require3.needleFlipAnimation,
    rateTextAnimation = _require3.rateTextAnimation,
    sizeTextAnimation = _require3.sizeTextAnimation,
    speedTextAnimation = _require3.speedTextAnimation,
    deflectAnimation = _require3.deflectAnimation,
    r = _require3.r;

var _require4 = require('sprites'),
    getNewSpriteState = _require4.getNewSpriteState;

var beeRectangle = r(88, 56);
var beeSwitchAnimation = {
    frames: [_extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beeswitch1.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beeswitch2.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beeswitch3.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beeswitch4.png') })],
    frameDuration: 6
};
var beeDeathAnimation = {
    frames: [_extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beedie1.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beedie2.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beedie3.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beedie4.png') })],
    frameDuration: 6
};
var dragonflyRectangle = r(88, 56);
var dragonflySwitchAnimation = {
    frames: [_extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflyswitch1.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflyswitch2.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflyswitch3.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflyswitch4.png') })],
    frameDuration: 6
};
var dragonflyDeathAnimation = {
    frames: [_extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflydie1.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflydie2.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflydie3.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflydie4.png') })],
    frameDuration: 6
};
var mothRectangle = r(88, 56);
var mothSwitchAnimation = {
    frames: [_extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothswitch1.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothswitch2.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothswitch3.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothswitch4.png') })],
    frameDuration: 6
};
var mothDeathAnimation = {
    frames: [_extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothdie1.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothdie2.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothdie3.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothdie4.png') })],
    frameDuration: 6
};

var effects = (_effects = {}, _defineProperty(_effects, EFFECT_DAMAGE, {
    animation: damageAnimation
}), _defineProperty(_effects, EFFECT_EXPLOSION, {
    animation: explosionAnimation
}), _defineProperty(_effects, EFFECT_DUST, {
    animation: dustAnimation,
    props: {
        relativeToGround: true
    }
}), _defineProperty(_effects, EFFECT_NEEDLE_FLIP, {
    animation: needleFlipAnimation
}), _defineProperty(_effects, EFFECT_DEAD_BEE, {
    animation: beeDeathAnimation
}), _defineProperty(_effects, EFFECT_SWITCH_BEE, {
    animation: beeSwitchAnimation
}), _defineProperty(_effects, EFFECT_DEAD_DRAGONFLY, {
    animation: dragonflyDeathAnimation
}), _defineProperty(_effects, EFFECT_SWITCH_DRAGONFLY, {
    animation: dragonflySwitchAnimation
}), _defineProperty(_effects, EFFECT_DEAD_MOTH, {
    animation: mothDeathAnimation
}), _defineProperty(_effects, EFFECT_SWITCH_MOTH, {
    animation: mothSwitchAnimation
}), _defineProperty(_effects, EFFECT_RATE_UP, {
    animation: rateTextAnimation,
    props: {
        vy: -0.5,
        loops: 3
    }
}), _defineProperty(_effects, EFFECT_SIZE_UP, {
    animation: sizeTextAnimation,
    props: {
        vy: -0.5,
        loops: 3
    }
}), _defineProperty(_effects, EFFECT_SPEED_UP, {
    animation: speedTextAnimation,
    props: {
        vy: -0.5,
        loops: 3
    }
}), _defineProperty(_effects, EFFECT_DEFLECT_BULLET, {
    animation: deflectAnimation
}), _effects);

var createEffect = function createEffect(type, props) {
    var frame = effects[type].animation.frames[0];
    return getNewSpriteState(_extends({}, frame, effects[type].props, {
        type: type
    }, props));
};

var addEffectToState = function addEffectToState(state, effect) {
    var sfx = state.sfx;
    if (effect.sfx) sfx = _extends({}, sfx, _defineProperty({}, effect.sfx, true));
    return _extends({}, state, { newEffects: [].concat(_toConsumableArray(state.newEffects), [effect]), sfx: sfx });
};

var updateEffect = function updateEffect(state, effectIndex, props) {
    var effects = [].concat(_toConsumableArray(state.effects));
    effects[effectIndex] = _extends({}, effects[effectIndex], props);
    return _extends({}, state, { effects: effects });
};

function renderEffectFrame(context, frame, target, effect) {
    if (!effect.tint || !effect.tint.amount) return drawImage(context, frame.image, frame, target);
    drawTintedImage(context, frame.image, effect.tint.color, effect.tint.amount, frame, target);
}

var renderEffect = function renderEffect(context, effect) {
    var frame = getFrame(effects[effect.type].animation, effect.animationTime);
    if ((effect.xScale || 1) === 1 && (effect.yScale || 1) === 1 && (effect.rotation || 0) === 0) {
        renderEffectFrame(context, frame, effect, effect);
    } else {
        var hitBox = getHitBox(effects[effect.type].animation, effect.animationTime);
        // This moves the origin to where we want the center of the enemies hitBox to be.
        context.save();
        context.translate(effect.left + hitBox.left + hitBox.width / 2, effect.top + hitBox.top + hitBox.height / 2);
        context.scale(effect.xScale || 1, effect.yScale || 1);
        if (effect.rotation) context.rotate(effect.rotation);
        // This draws the image frame so that the center is exactly at the origin.
        var target = new Rectangle(frame).moveTo(-(hitBox.left + hitBox.width / 2), -(hitBox.top + hitBox.height / 2));
        renderEffectFrame(context, frame, target, effect);
        context.restore();
    }
};

var advanceEffect = function advanceEffect(state, effectIndex) {
    var effectInfo = effects[state.effects[effectIndex].type];
    if (effectInfo.advanceEffect) {
        state = effectInfo.advanceEffect(state, effectIndex);
    }
    var _state$effects$effect = state.effects[effectIndex],
        done = _state$effects$effect.done,
        left = _state$effects$effect.left,
        top = _state$effects$effect.top,
        width = _state$effects$effect.width,
        height = _state$effects$effect.height,
        vx = _state$effects$effect.vx,
        vy = _state$effects$effect.vy,
        animationTime = _state$effects$effect.animationTime,
        relativeToGround = _state$effects$effect.relativeToGround,
        loops = _state$effects$effect.loops;

    var animation = effectInfo.animation;
    left += vx;
    top += vy;
    if (relativeToGround) {
        left -= state.world.nearground.xFactor * state.world.vx;
        top += state.world.nearground.yFactor * state.world.vy;
    }
    animationTime += FRAME_LENGTH;

    done = done || animationTime >= FRAME_LENGTH * animation.frames.length * animation.frameDuration * (loops || 1) || left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING || top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;

    return updateEffect(state, effectIndex, { left: left, top: top, animationTime: animationTime, done: done });
};

var advanceAllEffects = function advanceAllEffects(state) {
    for (var i = 0; i < state.effects.length; i++) {
        state = advanceEffect(state, i);
    }
    state.effects = state.effects.filter(function (effect) {
        return !effect.done;
    });
    return state;
};

module.exports = {
    effects: effects,
    createEffect: createEffect,
    addEffectToState: addEffectToState,
    advanceAllEffects: advanceAllEffects,
    renderEffect: renderEffect,
    updateEffect: updateEffect
};

},{"Rectangle":1,"animations":2,"draw":7,"gameConstants":11,"sprites":21}],9:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('gameConstants'),
    FRAME_LENGTH = _require.FRAME_LENGTH;

var _require2 = require('animations'),
    requireImage = _require2.requireImage,
    r = _require2.r;

var EFFECT_LIGHTNING = 'lightning';
var EFFECT_FAST_LIGHTNING = 'fastLightning';
var EFFECT_ARC_LIGHTNING = 'arcLightning';

var lightningFrames = [_extends({}, r(50, 10), { image: requireImage('gfx/attacks/chain1.png') }), _extends({}, r(50, 10), { image: requireImage('gfx/attacks/chain2.png') }), _extends({}, r(50, 10), { image: requireImage('gfx/attacks/chain3.png') }), _extends({}, r(50, 10), { image: requireImage('gfx/attacks/chain4.png') })];
function advanceLightning(state, effectIndex) {
    var effect = state.effects[effectIndex];
    if (effect.charges > 0 && effect.animationTime === FRAME_LENGTH) {
        var center = [effect.left + effect.width / 2, effect.top + effect.height / 2];
        var left = center[0] + Math.cos(effect.rotation) * effect.width / 2;
        var top = center[1] + Math.sin(effect.rotation) * effect.width / 2;
        state = checkToAddLightning(state, _extends({}, effect, { left: left, top: top }));
    }
    return state;
}
var checkToAddLightning = function checkToAddLightning(state, _ref) {
    var left = _ref.left,
        top = _ref.top,
        _ref$charges = _ref.charges,
        charges = _ref$charges === undefined ? 8 : _ref$charges,
        _ref$damage = _ref.damage,
        damage = _ref$damage === undefined ? 5 : _ref$damage,
        _ref$branchChance = _ref.branchChance,
        branchChance = _ref$branchChance === undefined ? 0 : _ref$branchChance,
        _ref$rotation = _ref.rotation,
        rotation = _ref$rotation === undefined ? 0 : _ref$rotation,
        _ref$scale = _ref.scale,
        scale = _ref$scale === undefined ? 2 : _ref$scale,
        _ref$vx = _ref.vx,
        vx = _ref$vx === undefined ? 0 : _ref$vx,
        _ref$vy = _ref.vy,
        vy = _ref$vy === undefined ? 0 : _ref$vy,
        _ref$type = _ref.type,
        type = _ref$type === undefined ? EFFECT_LIGHTNING : _ref$type;

    var addLightning = function addLightning(rotation, branchChance) {
        var lightning = createEffect(type, {
            left: left, top: top,
            charges: charges - 1,
            rotation: rotation,
            branchChance: branchChance,
            xScale: scale, yScale: scale,
            vx: vx, vy: vy
        });
        lightning.width *= scale;
        lightning.height *= scale;
        lightning.left -= lightning.width / 2;
        lightning.left += Math.cos(rotation) * lightning.width / 2;
        lightning.top -= lightning.height / 2;
        lightning.top += Math.sin(rotation) * lightning.width / 2;
        state = addEffectToState(state, lightning);
    };
    var targetRotations = [];
    for (var i = 0; i < state.enemies.length; i++) {
        var enemy = state.idMap[state.enemies[i].id];
        if (!enemy || enemy.dead) continue;
        // The large lightning attack can only hit enemies in front of each bolt.
        if (type === EFFECT_LIGHTNING && enemy.left + enemy.width / 2 <= left) continue;
        var hitBox = getEnemyHitBox(enemy);
        var dx = hitBox.left + hitBox.width / 2 - left,
            dy = hitBox.top + hitBox.height / 2 - top;
        var radius = Math.sqrt(hitBox.width * hitBox.width + hitBox.height * hitBox.height) / 2;
        if (Math.sqrt(dx * dx + dy * dy) <= 50 * scale + radius) {
            targetRotations.push(Math.atan2(dy, dx));
            state = damageEnemy(state, enemy.id, { playerIndex: 0, damage: damage });
            state = _extends({}, state, { sfx: _extends({}, state.sfx, { 'sfx/hit.mp3': true }) });
        }
    }
    if (targetRotations.length) {
        var _branchChance = targetRotations.length > 1 ? 0 : _branchChance + 0.2;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = targetRotations[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var enemyRotation = _step.value;

                addLightning(enemyRotation, _branchChance);
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
    } else if (Math.random() < branchChance) {
        addLightning(rotation - Math.PI / 12, 0);
        addLightning(rotation + Math.PI / 13, 0);
    } else {
        addLightning(rotation, branchChance + 0.2);
    }
    return state;
};

module.exports = {
    EFFECT_LIGHTNING: EFFECT_LIGHTNING,
    EFFECT_FAST_LIGHTNING: EFFECT_FAST_LIGHTNING,
    EFFECT_ARC_LIGHTNING: EFFECT_ARC_LIGHTNING,
    checkToAddLightning: checkToAddLightning,
    lightningFrames: lightningFrames
};

var _require3 = require('effects'),
    effects = _require3.effects,
    createEffect = _require3.createEffect,
    addEffectToState = _require3.addEffectToState,
    updateEffect = _require3.updateEffect;

var _require4 = require('enemies'),
    getEnemyHitBox = _require4.getEnemyHitBox,
    damageEnemy = _require4.damageEnemy;

effects[EFFECT_LIGHTNING] = {
    animation: {
        frames: lightningFrames,
        frameDuration: 4
    },
    advanceEffect: advanceLightning,
    props: {
        loops: 1,
        damage: 5,
        charges: 8,
        branchChance: .9,
        rotation: 0,
        sfx: 'sfx/fastlightning.mp3'
    }
};
effects[EFFECT_FAST_LIGHTNING] = {
    animation: {
        frames: lightningFrames,
        frameDuration: 1
    },
    advanceEffect: advanceLightning,
    props: {
        loops: 1,
        damage: 1,
        charges: 0,
        branchChance: 0,
        rotation: 0
    }
};
effects[EFFECT_ARC_LIGHTNING] = {
    animation: {
        frames: lightningFrames,
        frameDuration: 3
    },
    advanceEffect: function advanceEffect(state, effectIndex) {
        var effect = state.effects[effectIndex];
        var p = effect.animationTime / effect.duration;
        var target = state.idMap[effect.enemyId];
        var done = effect.done || p >= 1 || effect.enemyId && !target;
        if (done) {
            if (target && !target.dead) {
                var attack = { playerIndex: effect.playerIndex, damage: effect.damage };
                state = damageEnemy(state, effect.enemyId, attack);
                state = _extends({}, state, { sfx: _extends({}, state.sfx, { 'sfx/hit.mp3': true }) });
            }
        } else {
            var tx = effect.tx,
                ty = effect.ty;
            if (target) {
                var hitBox = getEnemyHitBox(target);
                tx = hitBox.left + hitBox.width / 2;
                ty = hitBox.top + hitBox.height / 2;
            }
            var p1 = {
                x: (1 - p) * effect.sx + p * tx + effect.dx * p * (1 - p),
                y: (1 - p) * effect.sy + p * ty + effect.dy * p * (1 - p)
            };
            p = Math.min(1, p + 0.02);
            var p2 = {
                x: (1 - p) * effect.sx + p * tx + effect.dx * p * (1 - p),
                y: (1 - p) * effect.sy + p * ty + effect.dy * p * (1 - p)
            };
            var dx = p2.x - p1.x,
                dy = p2.y - p1.y;
            var left = (p2.x + p1.x) / 2 - effect.width / 2;
            var top = (p2.y + p1.y) / 2 - effect.height / 2;
            var rotation = Math.atan2(dy, dx);
            return updateEffect(state, effectIndex, { done: done, left: left, top: top, rotation: rotation });
        }
        return updateEffect(state, effectIndex, { done: done });
    },

    props: {
        loops: 1,
        damage: 5,
        charges: 8,
        branchChance: .9,
        rotation: 0,
        sfx: 'arclightning'
    }
};

},{"animations":2,"effects":8,"enemies":10,"gameConstants":11}],10:[function(require,module,exports){
'use strict';

var _enemyData;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Rectangle = require('Rectangle');

var _require = require('draw'),
    drawImage = _require.drawImage;

var _require2 = require('gameConstants'),
    WIDTH = _require2.WIDTH,
    GAME_HEIGHT = _require2.GAME_HEIGHT,
    FRAME_LENGTH = _require2.FRAME_LENGTH,
    OFFSCREEN_PADDING = _require2.OFFSCREEN_PADDING,
    ENEMY_FLY = _require2.ENEMY_FLY,
    ENEMY_MONK = _require2.ENEMY_MONK,
    ENEMY_FLYING_ANT = _require2.ENEMY_FLYING_ANT,
    ENEMY_FLYING_ANT_SOLDIER = _require2.ENEMY_FLYING_ANT_SOLDIER,
    ENEMY_HORNET = _require2.ENEMY_HORNET,
    ENEMY_HORNET_SOLDIER = _require2.ENEMY_HORNET_SOLDIER,
    ENEMY_LOCUST = _require2.ENEMY_LOCUST,
    ENEMY_LOCUST_SOLDIER = _require2.ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE = _require2.ENEMY_CARGO_BEETLE,
    ENEMY_EXPLOSIVE_BEETLE = _require2.ENEMY_EXPLOSIVE_BEETLE,
    ATTACK_BULLET = _require2.ATTACK_BULLET,
    ATTACK_DEFEATED_ENEMY = _require2.ATTACK_DEFEATED_ENEMY,
    ATTACK_EXPLOSION = _require2.ATTACK_EXPLOSION,
    EFFECT_EXPLOSION = _require2.EFFECT_EXPLOSION,
    EFFECT_DAMAGE = _require2.EFFECT_DAMAGE,
    EFFECT_DUST = _require2.EFFECT_DUST,
    LOOT_COIN = _require2.LOOT_COIN;

var _require3 = require('keyboard'),
    isKeyDown = _require3.isKeyDown,
    KEY_SHIFT = _require3.KEY_SHIFT;

var _require4 = require('animations'),
    getFrame = _require4.getFrame,
    getAnimationLength = _require4.getAnimationLength,
    getHitBox = _require4.getHitBox,
    flyAnimation = _require4.flyAnimation,
    flyDeathAnimation = _require4.flyDeathAnimation,
    hornetAnimation = _require4.hornetAnimation,
    hornetDeathAnimation = _require4.hornetDeathAnimation,
    hornetSoldierAnimation = _require4.hornetSoldierAnimation,
    hornetSoldierDeathAnimation = _require4.hornetSoldierDeathAnimation,
    locustAnimation = _require4.locustAnimation,
    locustDeathAnimation = _require4.locustDeathAnimation,
    locustSoldierAnimation = _require4.locustSoldierAnimation,
    locustSoldierDeathAnimation = _require4.locustSoldierDeathAnimation,
    flyingAntAnimation = _require4.flyingAntAnimation,
    flyingAntDeathAnimation = _require4.flyingAntDeathAnimation,
    flyingAntSoldierAnimation = _require4.flyingAntSoldierAnimation,
    flyingAntSoldierDeathAnimation = _require4.flyingAntSoldierDeathAnimation,
    monkAnimation = _require4.monkAnimation,
    monkDeathAnimation = _require4.monkDeathAnimation,
    monkAttackAnimation = _require4.monkAttackAnimation,
    cargoBeetleAnimation = _require4.cargoBeetleAnimation,
    cargoBeetleDeathAnimation = _require4.cargoBeetleDeathAnimation,
    explosiveBeetleAnimation = _require4.explosiveBeetleAnimation,
    explosiveBeetleDeathAnimation = _require4.explosiveBeetleDeathAnimation;

var uniqueIdCounter = 0;

var spawnMonkOnGround = function spawnMonkOnGround(state, enemy) {
    var fallDamage = Math.floor(enemy.vy / 13);
    var monk = createEnemy(ENEMY_MONK, {
        left: enemy.left,
        top: getGroundHeight(state),
        animationTime: 20,
        pendingDamage: fallDamage
    });
    monk.top -= monk.height;
    // Add the new enemy to the state.
    state = addEnemyToState(state, monk);
    // Remove the current enemy from the state.
    return removeEnemy(state, enemy);
};

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
    deathSound: 'sfx/hornetdeath.mp3',
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
                        _dx = _getTargetVector2.dx;

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
        permanent: true,
        doNotFlip: true
    }
}), _defineProperty(_enemyData, ENEMY_HORNET_SOLDIER, {
    animation: hornetSoldierAnimation,
    deathAnimation: hornetSoldierDeathAnimation,
    deathSound: 'sfx/hit.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            targetX = enemy.targetX,
            targetY = enemy.targetY,
            mode = enemy.mode,
            modeTime = enemy.modeTime;

        var theta = Math.PI / 2 + Math.PI * 4 * modeTime / 8000;
        var radius = 1;
        switch (mode) {
            case 'enter':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vx < 0) vx *= 2;
                if (vx > 0) vx *= .5;
                if (modeTime > 4000) {
                    mode = 'circle';
                    modeTime = 0;
                }
                break;
            case 'circle':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vy > 0 && enemy.top < 100) vy *= 1 + (100 - enemy.top) / 100;
                if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 100) {
                    vy *= 1 + (enemy.top + enemy.height - (GAME_HEIGHT - 100)) / 100;
                }
                if (modeTime > 4000) {
                    mode = 'attack';
                    modeTime = 0;
                }
                break;
            case 'attack':
                if (modeTime === FRAME_LENGTH) {
                    var target = state.players[0].sprite;
                    targetX = target.left + target.width / 2;
                    targetY = target.top + target.height / 2;

                    var _getTargetVector3 = getTargetVector(enemy, target),
                        dx = _getTargetVector3.dx,
                        dy = _getTargetVector3.dy;

                    var _theta2 = Math.atan2(dy, dx);
                    vx = enemy.speed * Math.cos(_theta2);
                    vy = enemy.speed * Math.sin(_theta2);
                } else {
                    var _getTargetVector4 = getTargetVector(enemy, { left: targetX, top: targetY }),
                        _dx2 = _getTargetVector4.dx;

                    if (_dx2 * vx < 0) {
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
    shoot: function shoot(state, enemy) {
        if (enemy.mode !== 'circle' && enemy.mode !== 'retreat') return state;
        if (enemy.shotCooldown > 0) {
            return updateEnemy(state, enemy, { shotCooldown: enemy.shotCooldown - 1 });
        }
        state = updateEnemy(state, enemy, { shotCooldown: enemy.shotCooldownFrames });

        var _getTargetVector5 = getTargetVector(enemy, state.players[0].sprite),
            dx = _getTargetVector5.dx,
            dy = _getTargetVector5.dy;

        var theta = Math.atan2(dy, dx);
        var bullet = createAttack(ATTACK_BULLET, {
            vx: enemy.bulletSpeed * Math.cos(theta),
            vy: enemy.bulletSpeed * Math.sin(theta),
            top: enemy.top + enemy.vy + enemy.height / 2,
            left: enemy.left + enemy.vx
        });
        bullet.top -= bullet.height / 2;
        return addEnemyAttackToState(state, bullet);
    },
    onDeathEffect: function onDeathEffect(state, enemy) {
        var hornet = createEnemy(ENEMY_HORNET, {
            life: 20,
            score: enemyData[ENEMY_HORNET].props.score / 2,
            left: enemy.left,
            top: enemy.top,
            vx: 0,
            vy: 0,
            mode: 'retreat'
        });
        // Delete the current enemy from the state so it can be
        // added on top of the mount enemy.
        state = removeEnemy(state, enemy);
        state = addEnemyToState(state, hornet);
        return addEnemyToState(state, enemy);
    },

    onHitGroundEffect: spawnMonkOnGround,
    props: {
        life: 40,
        score: 500,
        speed: 10,
        bulletSpeed: 10,
        mode: 'enter',
        modeTime: 0,
        permanent: true,
        doNotFlip: true,
        shotCooldownFrames: 50
    }
}), _defineProperty(_enemyData, ENEMY_LOCUST, {
    animation: locustAnimation,
    deathAnimation: locustDeathAnimation,
    deathSound: 'sfx/hornetdeath.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            targetX = enemy.targetX,
            targetY = enemy.targetY,
            animationTime = enemy.animationTime;

        var theta = Math.PI / 2 + Math.PI * 2 * animationTime / 2000;
        vy = 2 * enemy.speed * Math.sin(theta);
        vx = -enemy.speed;
        if (vy > 0 && enemy.top < 50) vy *= 1 + (50 - enemy.top) / 100;
        if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 50) {
            vy *= 1 + (enemy.top + enemy.height - (GAME_HEIGHT - 50)) / 100;
        }
        return _extends({}, enemy, { targetX: targetX, targetY: targetY, vx: vx, vy: vy });
    },
    props: {
        life: 8,
        score: 100,
        speed: 3,
        doNotFlip: true
    }
}), _defineProperty(_enemyData, ENEMY_LOCUST_SOLDIER, {
    animation: locustSoldierAnimation,
    deathAnimation: locustSoldierDeathAnimation,
    deathSound: 'sfx/hit.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            targetX = enemy.targetX,
            targetY = enemy.targetY,
            animationTime = enemy.animationTime;

        var theta = Math.PI / 2 + Math.PI * 2 * animationTime / 2000;
        vy = 2 * enemy.speed * Math.sin(theta);
        vx = -enemy.speed;
        if (vy > 0 && enemy.top < 100) vy *= 1 + (100 - enemy.top) / 100;
        if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 100) {
            vy *= 1 + (enemy.top + enemy.height - (GAME_HEIGHT - 100)) / 100;
        }
        return _extends({}, enemy, { targetX: targetX, targetY: targetY, vx: vx, vy: vy });
    },
    shoot: function shoot(state, enemy) {
        if (enemy.shotCooldown > 0) {
            return updateEnemy(state, enemy, { shotCooldown: enemy.shotCooldown - 1 });
        }
        state = updateEnemy(state, enemy, { shotCooldown: enemy.shotCooldownFrames });

        var _getTargetVector6 = getTargetVector(enemy, state.players[0].sprite),
            dx = _getTargetVector6.dx,
            dy = _getTargetVector6.dy;

        var theta = Math.atan2(dy, dx);
        var bullet = createAttack(ATTACK_BULLET, {
            vx: enemy.bulletSpeed * Math.cos(theta),
            vy: enemy.bulletSpeed * Math.sin(theta),
            top: enemy.top + enemy.vy + enemy.height / 2,
            left: enemy.left + enemy.vx
        });
        bullet.top -= bullet.height / 2;
        return addEnemyAttackToState(state, bullet);
    },
    onDeathEffect: function onDeathEffect(state, enemy) {
        var locust = createEnemy(ENEMY_LOCUST, {
            life: 6,
            score: enemyData[ENEMY_LOCUST].props.score / 2,
            left: enemy.left,
            top: enemy.top,
            vx: enemy.vx,
            vy: enemy.vy,
            animationTime: enemy.animationTime, // This helps keep acceleration in sync.
            speed: 3,
            mode: 'retreat'
        });
        // Delete the current enemy from the state so it can be
        // added on top of the mount enemy.
        state = removeEnemy(state, enemy);
        state = addEnemyToState(state, locust);
        return addEnemyToState(state, enemy);
    },

    onHitGroundEffect: spawnMonkOnGround,
    props: {
        life: 12,
        score: 500,
        speed: 1,
        bulletSpeed: 10,
        doNotFlip: true,
        shotCooldownFrames: 80
    }
}), _defineProperty(_enemyData, ENEMY_FLYING_ANT, {
    animation: flyingAntAnimation,
    deathAnimation: flyingAntDeathAnimation,
    deathSound: 'sfx/flydeath.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy;

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
        } else {
            var tvx = 6 * Math.abs(vx) / vx;
            vx = (vx * 20 + tvx) / 21;
            vy = (vy * 20 + 0) / 21;
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
    deathSound: 'sfx/hit.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy;

        var speed = enemy.speed;

        var _getTargetVector7 = getTargetVector(enemy, state.players[0].sprite),
            dx = _getTargetVector7.dx,
            dy = _getTargetVector7.dy;

        var theta = Math.atan2(dy, dx);
        if (enemy.animationTime === 0) {
            vx = speed * Math.cos(theta);
            vy = speed * Math.sin(theta);
        } else if (enemy.animationTime < 5000) {
            vx = (vx * 20 + speed * Math.cos(theta)) / 21;
            vy = (vy * 20 + speed * Math.sin(theta)) / 21;
        } else {
            var tvx = 6 * Math.abs(vx) / vx;
            vx = (vx * 20 + tvx) / 21;
            vy = (vy * 20 + 0) / 21;
        }
        return _extends({}, enemy, { vx: vx, vy: vy });
    },
    shoot: function shoot(state, enemy) {
        if (enemy.shotCooldown === undefined) {
            state = updateEnemy(state, enemy, { shotCooldown: 20 + Math.floor(50 * Math.random()) });
            enemy = state.idMap[enemy.id];
        }
        if (enemy.shotCooldown > 0) {
            return updateEnemy(state, enemy, { shotCooldown: enemy.shotCooldown - 1 });
        }
        state = updateEnemy(state, enemy, { shotCooldown: enemy.shotCooldownFrames });
        var theta = Math.atan2(enemy.vy, enemy.vx);
        var bullet = createAttack(ATTACK_BULLET, {
            left: enemy.left - enemy.vx,
            vx: enemy.bulletSpeed * Math.cos(theta),
            vy: enemy.bulletSpeed * Math.sin(theta)
        });
        bullet.top = enemy.top + enemy.vy + Math.round((enemy.height - bullet.height) / 2);
        return addEnemyAttackToState(state, bullet);
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
        // Delete the current enemy from the state so it can be
        // added on top of the mount enemy.
        state = removeEnemy(state, enemy);
        state = addEnemyToState(state, flyingAnt);
        return addEnemyToState(state, enemy);
    },

    onHitGroundEffect: spawnMonkOnGround,
    props: {
        bulletSpeed: 8,
        life: 2,
        score: 20,
        speed: 5,
        shotCooldownFrames: 100
    }
}), _defineProperty(_enemyData, ENEMY_MONK, {
    animation: monkAnimation,
    deathAnimation: monkDeathAnimation,
    attackAnimation: monkAttackAnimation,
    deathSound: 'sfx/robedeath1.mp3',
    accelerate: function accelerate(state, enemy) {
        // Stop moving while attacking.
        var vx = enemy.attackCooldownFramesLeft > 0 ? 0.001 : enemy.speed;
        return _extends({}, enemy, { vx: vx });
    },
    shoot: function shoot(state, enemy) {
        if (enemy.shotCooldown === undefined) {
            state = updateEnemy(state, enemy, { shotCooldown: 20 + Math.floor(enemy.shotCooldownFrames * Math.random()) });
            enemy = state.idMap[enemy.id];
        }
        if (enemy.shotCooldown > 0) {
            return updateEnemy(state, enemy, { shotCooldown: enemy.shotCooldown - 1 });
        }
        var target = state.players[0].sprite;
        target = _extends({}, target, { left: target.left + state.world.vx * 40 });

        var _getTargetVector8 = getTargetVector(enemy, target),
            dx = _getTargetVector8.dx,
            dy = _getTargetVector8.dy;

        var mag = Math.sqrt(dx * dx + dy * dy);
        if (!mag) {
            return state;
        }
        state = updateEnemy(state, enemy, { shotCooldown: enemy.shotCooldownFrames, attackCooldownFramesLeft: enemy.attackCooldownFrames });

        var bullet = createAttack(ATTACK_BULLET, {
            left: enemy.left - enemy.vx + enemy.width / 2,
            top: enemy.top + enemy.vy,
            vx: enemy.bulletSpeed * dx / mag - state.world.vx,
            vy: enemy.bulletSpeed * dy / mag
        });
        bullet.left -= bullet.width / 2;
        bullet.top -= bullet.height;
        return addEnemyAttackToState(state, bullet);
    },
    onDeathEffect: function onDeathEffect(state, enemy) {
        return updateEnemy(state, enemy, { ttl: 600 });
    },

    props: {
        life: 2,
        score: 30,
        speed: 2,
        grounded: true,
        bulletSpeed: 5,
        attackCooldownFrames: 15,
        shotCooldownFrames: 80
    }
}), _defineProperty(_enemyData, ENEMY_CARGO_BEETLE, {
    animation: cargoBeetleAnimation,
    deathAnimation: cargoBeetleDeathAnimation,
    accelerate: function accelerate(state, enemy) {
        // Move up and down in a sin wave.
        var theta = Math.PI / 2 + Math.PI * 4 * enemy.animationTime / 2000;
        var vy = 2 * Math.sin(theta);
        return _extends({}, enemy, { vy: vy });
    },

    deathSound: 'sfx/flydeath.mp3',
    onDeathEffect: function onDeathEffect(state, enemy) {
        var loot = createLoot(enemy.lootType || getAdaptivePowerupType(state));
        // These offsets are chosen to match the position of the bucket.
        loot.left = enemy.left + 50 - loot.width / 2;
        loot.top = enemy.top + 85 - loot.height / 2;
        return addLootToState(state, loot);
    },

    props: {
        life: 3,
        score: 0,
        speed: 1,
        vx: -3
    }
}), _defineProperty(_enemyData, ENEMY_EXPLOSIVE_BEETLE, {
    animation: explosiveBeetleAnimation,
    deathAnimation: explosiveBeetleDeathAnimation,
    accelerate: function accelerate(state, enemy) {
        // Move up and down in a sin wave.
        var theta = Math.PI / 2 + Math.PI * 4 * enemy.animationTime / 2000;
        var vy = 2 * Math.sin(theta);
        return _extends({}, enemy, { vy: vy });
    },

    // deathSound: 'sfx/flydeath.mp3',
    onDeathEffect: function onDeathEffect(state, enemy) {
        var playerIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        // The bucket explodes on death.
        var explosion = createAttack(ATTACK_EXPLOSION, {
            // These offsets are chosen to match the position of the bucket.
            left: enemy.left + 30 + enemy.vx,
            top: enemy.top + 90 + enemy.vy,
            playerIndex: playerIndex,
            delay: 10,
            vx: enemy.vx, vy: enemy.vy
        });
        explosion.width *= 4;
        explosion.height *= 4;
        explosion.left -= explosion.width / 2;
        explosion.top -= explosion.height / 2;
        return addNeutralAttackToState(state, explosion);
    },

    props: {
        life: 3,
        score: 0,
        speed: 1,
        vx: -3
    }
}), _enemyData);

var createEnemy = function createEnemy(type, props) {
    var frame = enemyData[type].animation.frames[0];
    return getNewSpriteState(_extends({}, frame, enemyData[type].props, {
        type: type,
        seed: Math.random()
    }, props, {
        id: 'enemy' + uniqueIdCounter++
    }));
};

function updateEnemy(state, enemy, props) {
    var idMap = _extends({}, state.idMap);
    idMap[enemy.id] = _extends({}, enemy, props);
    return _extends({}, state, { idMap: idMap });
}

function addEnemyToState(state, enemy) {
    return _extends({}, state, { newEnemies: [].concat(_toConsumableArray(state.newEnemies || []), [enemy]) });
}

function removeEnemy(state, enemy) {
    var idMap = _extends({}, state.idMap);
    delete idMap[enemy.id];
    return _extends({}, state, { idMap: idMap });
}

var getEnemyAnimation = function getEnemyAnimation(enemy) {
    var animation = enemyData[enemy.type].animation;
    if (enemy.dead) return enemyData[enemy.type].deathAnimation || animation;
    if (enemy.attackCooldownFramesLeft > 0) return enemyData[enemy.type].attackAnimation || animation;
    if (!enemy.spawned) return enemyData[enemy.type].spawnAnimation || animation;
    return animation;
};

var getEnemyHitBox = function getEnemyHitBox(enemy) {
    var animation = getEnemyAnimation(enemy);
    return new Rectangle(getHitBox(animation, enemy.animationTime)).translate(enemy.left, enemy.top);
};

var damageEnemy = function damageEnemy(state, enemyId) {
    var attack = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var updatedState = _extends({}, state);
    updatedState.idMap = _extends({}, updatedState.idMap);
    var enemy = updatedState.idMap[enemyId];
    // Do nothing if the enemy is gone.
    if (!enemy || enemy.dead) return updatedState;
    var damage = attack.damage || 1;
    var enemyIsInvulnerable = enemyData[enemy.type].isInvulnerable && enemyData[enemy.type].isInvulnerable(state, enemy);
    if (!enemyIsInvulnerable) {
        updatedState.idMap[enemyId] = _extends({}, enemy, {
            life: enemy.life - damage,
            dead: enemy.life <= damage,
            animationTime: enemy.life <= damage ? 0 : enemy.animationTime
        });
        enemy = updatedState.idMap[enemyId];
    }
    if (updatedState.idMap[enemyId].dead) {
        if (attack.playerIndex >= 0) {
            var hits = attack.hitIds ? Object.keys(attack.hitIds).length : 0;
            var comboScore = Math.min(1000, updatedState.players[attack.playerIndex].comboScore + 5 + 10 * hits);
            updatedState = updatePlayer(updatedState, attack.playerIndex, { comboScore: comboScore });
        }
        updatedState = gainPoints(updatedState, attack.playerIndex, enemy.score);
        var explosion = createEffect(EFFECT_EXPLOSION, {
            sfx: enemyData[enemy.type].deathSound
        });
        explosion.left = enemy.left + (enemy.width - explosion.width) / 2;
        explosion.top = enemy.top + (enemy.height - explosion.height) / 2;
        updatedState = addEffectToState(updatedState, explosion);

        if (attack.melee) {
            var playerSprite = updatedState.players[attack.playerIndex].sprite;

            var _getTargetVector9 = getTargetVector(playerSprite, enemy),
                dx = _getTargetVector9.dx,
                dy = _getTargetVector9.dy;

            var theta = Math.atan2(dy, dx);
            var defeatedEnemyAttack = createAttack(ATTACK_DEFEATED_ENEMY, {
                animation: enemyData[enemy.type].deathAnimation || enemyData[enemy.type].animation,
                damage: 1,
                top: enemy.top,
                left: enemy.left,
                vx: 10 * Math.cos(theta),
                vy: 10 * Math.sin(theta),
                playerIndex: attack.playerIndex,
                hitIds: _defineProperty({}, enemy.id, true)
            });
            // Remove the enemy, it is replaced by the defeatedEnemyAttack.
            delete updatedState.idMap[enemyId];
            updatedState = addPlayerAttackToState(updatedState, defeatedEnemyAttack);
        }

        // Knock grounded enemies back when killed by an attack (but not if they died from other damage).
        if (updatedState.idMap[enemyId] && enemy.grounded && attack.type !== 'fall') {
            updatedState = updateEnemy(updatedState, enemy, { vx: 6, vy: -6 });
            enemy = updatedState.idMap[enemyId];
        }
        if (Math.random() < enemy.score / 200) {
            var loot = createLoot(LOOT_COIN);
            loot.left = enemy.left + (enemy.width - loot.width) / 2;
            loot.top = enemy.top + (enemy.height - loot.height) / 2;
            updatedState = addLootToState(updatedState, loot);
        }
        if (enemyData[enemy.type].onDeathEffect) {
            // This actuall changes the enemy index, so we do it last. In the long term it is probably
            // better to use the unique enemy id instead of the index.
            updatedState = enemyData[enemy.type].onDeathEffect(updatedState, enemy);
        }
    } else {
        if (enemyIsInvulnerable) {
            updatedState = _extends({}, updatedState, { sfx: _extends({}, updatedState.sfx, { 'reflect': true }) });
        } else {

            if (enemyData[enemy.type].onDamageEffect) {
                // This actuall changes the enemy index, so we do it last. In the long term it is probably
                // better to use the unique enemy id instead of the index.
                updatedState = enemyData[enemy.type].onDamageEffect(updatedState, enemy);
            }
            if (attack.left) {
                var _damage = createEffect(EFFECT_DAMAGE, {
                    sfx: 'sfx/hit.mp3'
                });
                _damage.left = attack.left + attack.vx + (attack.width - _damage.width) / 2;
                _damage.top = attack.top + attack.vy + (attack.height - _damage.height) / 2;
                updatedState = addEffectToState(updatedState, _damage);
            }
        }
    }
    if (attack.type && attacks[attack.type] && attacks[attack.type].hitSfx) {
        updatedState = _extends({}, updatedState, { sfx: _extends({}, updatedState.sfx, _defineProperty({}, attacks[attack.type].hitSfx, true)) });
    }
    return updatedState;
};

var renderEnemy = function renderEnemy(context, enemy) {
    var animation = getEnemyAnimation(enemy);
    var frame = getFrame(animation, enemy.animationTime);
    context.save();
    if (enemy.dead && !enemy.persist) {
        context.globalAlpha = .6;
    }
    if (enemy.vx > 0 && !enemy.doNotFlip) {
        var hitBox = getEnemyHitBox(enemy).moveTo(0, 0);
        // This moves the origin to where we want the center of the enemies hitBox to be.
        context.save();
        context.translate(enemy.left + hitBox.left + hitBox.width / 2, enemy.top + hitBox.top + hitBox.height / 2);
        context.scale(-1, 1);
        // This draws the image frame so that the center is exactly at the origin.
        var target = new Rectangle(frame).moveTo(-(hitBox.left + hitBox.width / 2), -(hitBox.top + hitBox.height / 2));
        drawImage(context, frame.image, frame, target);
        context.restore();
    } else {
        var _hitBox = getEnemyHitBox(enemy).moveTo(0, 0);
        context.save();
        context.translate(enemy.left + _hitBox.left + _hitBox.width / 2, enemy.top + _hitBox.top + _hitBox.height / 2);
        var _target = new Rectangle(frame).moveTo(-(_hitBox.left + _hitBox.width / 2), -(_hitBox.top + _hitBox.height / 2));
        drawImage(context, frame.image, frame, _target);
        context.restore();
    }
    // context.translate(x, y - hitBox.height * yScale / 2);
    // if (rotation) context.rotate(rotation * Math.PI/180);
    // if (xScale !== 1 || yScale !== 1) context.scale(xScale, yScale);

    if (isKeyDown(KEY_SHIFT)) {
        var _hitBox2 = getEnemyHitBox(enemy);
        context.globalAlpha = .6;
        context.fillStyle = 'red';
        context.fillRect(_hitBox2.left, _hitBox2.top, _hitBox2.width, _hitBox2.height);
    }
    context.restore();
};

var advanceEnemy = function advanceEnemy(state, enemy) {
    if (enemy.delay > 0) {
        return updateEnemy(state, enemy, { delay: enemy.delay - 1 });
    }
    // This is kind of a hack to support fall damage being applied to newly created enemies.
    if (enemy.pendingDamage) {
        state = damageEnemy(state, enemy.id, { playerIndex: 0, damage: enemy.pendingDamage, type: 'fall' });
        enemy = state.idMap[enemy.id];
    }

    if (enemy && enemy.stationary) {
        // Stationary enemies are fixed to the nearground (so they move with the nearground).
        state = updateEnemy(state, enemy, {
            top: enemy.top - state.world.nearground.yFactor * state.world.vy,
            left: enemy.left - state.world.nearground.xFactor * state.world.vx
        });
        enemy = state.idMap[enemy.id];
    } else if (enemy.grounded) {
        // Grounded enemies should move relative to the ground.
        state = updateEnemy(state, enemy, {
            left: enemy.left - state.world.nearground.xFactor * state.world.vx
        });
        enemy = state.idMap[enemy.id];
    }

    var _enemy = enemy,
        left = _enemy.left,
        top = _enemy.top,
        animationTime = _enemy.animationTime,
        spawned = _enemy.spawned;

    animationTime += FRAME_LENGTH;
    if (enemyData[enemy.type].spawnAnimation && !spawned && !enemy.dead) {
        if (enemy.animationTime >= getAnimationLength(enemyData[enemy.type].spawnAnimation)) {
            animationTime = 0;
            spawned = true;
        } else {
            // Only update the enemies animation time while spawning.
            return updateEnemy(state, enemy, { animationTime: animationTime });
        }
    }
    left += enemy.vx;
    top += enemy.vy;
    state = updateEnemy(state, enemy, { left: left, top: top, animationTime: animationTime, spawned: spawned });
    enemy = state.idMap[enemy.id];
    var hitBox = getEnemyHitBox(enemy).moveTo(0, 0);
    if (!enemy.dead) {
        top = Math.min(top, getGroundHeight(state) - (hitBox.top + hitBox.height));
    }
    state = updateEnemy(state, enemy, { left: left, top: top, animationTime: animationTime, spawned: spawned });
    enemy = state.idMap[enemy.id];

    if (enemy && (!enemy.stationary && enemy.dead || enemy.grounded)) {
        // Flying enemies fall when they are dead, grounded enemies always fall unless they are on the ground.
        var touchingGround = enemy.vy >= 0 && enemy.top + hitBox.top + hitBox.height >= getGroundHeight(state);
        state = updateEnemy(state, enemy, {
            vy: !touchingGround || !enemy.grounded ? enemy.vy + 1 : 0,
            // Dead bodies shouldn't slide along the ground
            vx: touchingGround && enemy.dead ? enemy.vx * .5 : enemy.vx
        });
        enemy = state.idMap[enemy.id];
        if (enemy && !enemy.grounded) {
            var onHitGroundEffect = enemyData[enemy.type].onHitGroundEffect;
            if (onHitGroundEffect) {
                if (enemy.top + hitBox.top + hitBox.height > getGroundHeight(state)) {
                    state = onHitGroundEffect(state, enemy);
                    enemy = state.idMap[enemy.id];
                    if (enemy) {
                        // Add a dust cloud to signify something happened when the enemy hit the ground.
                        var dust = createEffect(EFFECT_DUST, {
                            sfx: 'sfx/hit.mp3'
                        });
                        dust.left = enemy.left + (enemy.width - dust.width) / 2;
                        // Add dust at the bottom of the enemy frame.
                        dust.top = Math.min(enemy.top + hitBox.top + hitBox.height, getGroundHeight(state)) - dust.height;
                        state = addEffectToState(state, dust);
                        enemy = state.idMap[enemy.id];
                    }
                }
            }
        }
    }
    if (!enemy) return state;
    if (!enemy.dead && enemyData[enemy.type].accelerate) {
        state = updateEnemy(state, enemy, enemyData[enemy.type].accelerate(state, enemy));
        enemy = state.idMap[enemy.id];
    }
    var _enemy2 = enemy,
        ttl = _enemy2.ttl,
        attackCooldownFramesLeft = _enemy2.attackCooldownFramesLeft;

    if (attackCooldownFramesLeft) {
        attackCooldownFramesLeft--;
    }
    if (ttl) {
        // Enemies that we need to cleanup before they hit the edge of the screen can be marked
        // with a TTL in milliseconds.
        ttl -= FRAME_LENGTH;
        if (ttl <= 0) return removeEnemy(state, enemy);
    } else {
        // cleanup dead enemies or non permanent enemies when they go off the edge of the screen.
        var effectiveVx = enemy.vx;
        if (enemy.grounded) {
            effectiveVx -= state.world.nearground.xFactor * state.world.vx;
        }
        var enemyIsBelowScreen = enemy.top > GAME_HEIGHT;
        var done = (enemy.dead && !enemy.persist || !enemy.permanent) && (enemy.left + enemy.width < -OFFSCREEN_PADDING || effectiveVx > 0 && enemy.left > WIDTH + OFFSCREEN_PADDING || enemy.vy < 0 && enemy.top + enemy.height < -OFFSCREEN_PADDING || enemy.top > GAME_HEIGHT + OFFSCREEN_PADDING);
        // Don't penalize players for grounded enemies disappearing when they aren't visible on the screen.
        if (done && !enemy.dead && !(enemy.grounded && enemyIsBelowScreen)) {
            var comboScore = Math.max(0, state.players[0].comboScore - 50);
            state = updatePlayer(state, 0, { comboScore: comboScore });
            // console.log('lost points:', enemy.type);
        }
        if (done) return removeEnemy(state, enemy);
    }
    return updateEnemy(state, enemy, { ttl: ttl, attackCooldownFramesLeft: attackCooldownFramesLeft, pendingDamage: 0 });
};

module.exports = {
    enemyData: enemyData,
    createEnemy: createEnemy,
    addEnemyToState: addEnemyToState,
    damageEnemy: damageEnemy,
    advanceEnemy: advanceEnemy,
    renderEnemy: renderEnemy,
    getEnemyHitBox: getEnemyHitBox,
    updateEnemy: updateEnemy
};

// Move possible circular imports to after exports.

var _require5 = require('sprites'),
    getNewSpriteState = _require5.getNewSpriteState,
    getTargetVector = _require5.getTargetVector;

var _require6 = require('world'),
    getGroundHeight = _require6.getGroundHeight;

var _require7 = require('effects'),
    createEffect = _require7.createEffect,
    addEffectToState = _require7.addEffectToState;

var _require8 = require('attacks'),
    attacks = _require8.attacks,
    createAttack = _require8.createAttack,
    addEnemyAttackToState = _require8.addEnemyAttackToState,
    addPlayerAttackToState = _require8.addPlayerAttackToState,
    addNeutralAttackToState = _require8.addNeutralAttackToState;

var _require9 = require('loot'),
    createLoot = _require9.createLoot,
    addLootToState = _require9.addLootToState,
    getAdaptivePowerupType = _require9.getAdaptivePowerupType,
    gainPoints = _require9.gainPoints;

var _require10 = require('heroes'),
    updatePlayer = _require10.updatePlayer;

},{"Rectangle":1,"animations":2,"attacks":5,"draw":7,"effects":8,"gameConstants":11,"heroes":12,"keyboard":16,"loot":17,"sprites":21,"world":23}],11:[function(require,module,exports){
'use strict';

module.exports = {
    TEST_ITEMS: false,
    TEST_ENEMY: false,
    //TEST_ITEMS: ['tripleCombo', 'combo'],
    //TEST_ITEMS: ['normalLadybug','lightningLadybug','penetratingLadybug'],
    //TEST_ENEMY: 'cargoBeetle',

    WIDTH: 800, HEIGHT: 600, GAME_HEIGHT: 564, HUD_HEIGHT: 36,
    FRAME_LENGTH: 20, OFFSCREEN_PADDING: 40,
    ACCELERATION: 1, SHOT_COOLDOWN: 8, ATTACK_OFFSET: -4,
    ENEMY_COOLDOWN: 10, DEATH_COOLDOWN: 1000, SPAWN_COOLDOWN: 1000,

    HERO_BEE: 'bee', HERO_DRAGONFLY: 'dragonfly', HERO_MOTH: 'moth',
    MAX_ENERGY: 20,

    ENEMY_FLY: 'fly',
    ENEMY_HORNET: 'hornet',
    ENEMY_HORNET_SOLDIER: 'hornetSoldier',
    ENEMY_FLYING_ANT: 'flyingAnt',
    ENEMY_FLYING_ANT_SOLDIER: 'flyingAntSoldier',
    ENEMY_MONK: 'monk',
    ENEMY_CARGO_BEETLE: 'cargoBeetle',
    ENEMY_EXPLOSIVE_BEETLE: 'explosiveBeetle',
    ENEMY_LOCUST: 'locust',
    ENEMY_LOCUST_SOLDIER: 'locustSoldier',

    ATTACK_BLAST: 'blast', ATTACK_SLASH: 'slash', ATTACK_STAB: 'stab', ATTACK_BULLET: 'bullet',
    ATTACK_SPRAY_UP: 'sprayUp',
    ATTACK_SPRAY_RIGHT: 'sprayRight',
    ATTACK_SPRAY_DOWN: 'sprayDown',
    ATTACK_LASER: 'laser', ATTACK_ORB: 'orb',
    ATTACK_DEFEATED_ENEMY: 'defeatedEnemy', ATTACK_EXPLOSION: 'explosion',

    EFFECT_DAMAGE: 'damage', EFFECT_EXPLOSION: 'explosion', EFFECT_DUST: 'dust',
    EFFECT_DEAD_BEE: 'deadBee', EFFECT_SWITCH_BEE: 'switchBee',
    EFFECT_DEAD_DRAGONFLY: 'deadDragonfly', EFFECT_SWITCH_DRAGONFLY: 'switchDragonfly',
    EFFECT_DEAD_MOTH: 'deadMoth', EFFECT_SWITCH_MOTH: 'switchMoth',
    EFFECT_NEEDLE_FLIP: 'needleFlip',
    EFFECT_RATE_UP: 'rateUp', EFFECT_SIZE_UP: 'sizeUp', EFFECT_SPEED_UP: 'speedUp',
    EFFECT_DEFLECT_BULLET: 'deflect',
    LOOT_COIN: 'coin',
    LOOT_LIFE: 'life',
    LOOT_NORMAL_LADYBUG: 'normalLadybug',
    LOOT_LIGHTNING_LADYBUG: 'lightningLadybug',
    LOOT_PENETRATING_LADYBUG: 'penetratingLadybug',
    LOOT_SPEED: 'speed',
    LOOT_ATTACK_POWER: 'power',
    LOOT_ATTACK_SPEED: 'attackSpeed',
    LOOT_TRIPLE_SPEED: 'tripleSpeed',
    LOOT_TRIPLE_POWER: 'triplePower',
    LOOT_TRIPLE_RATE: 'tripleRate',
    LOOT_COMBO: 'combo',
    LOOT_TRIPLE_COMBO: 'tripleCombo',
    LOOT_PORTAL: 'portal',
    LOOT_HELMET: 'helmet'
};

},{}],12:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    FRAME_LENGTH = _require.FRAME_LENGTH,
    DEATH_COOLDOWN = _require.DEATH_COOLDOWN,
    SHOT_COOLDOWN = _require.SHOT_COOLDOWN,
    ATTACK_OFFSET = _require.ATTACK_OFFSET,
    ACCELERATION = _require.ACCELERATION,
    ATTACK_ORB = _require.ATTACK_ORB,
    ATTACK_LASER = _require.ATTACK_LASER,
    EFFECT_NEEDLE_FLIP = _require.EFFECT_NEEDLE_FLIP,
    HERO_BEE = _require.HERO_BEE,
    HERO_DRAGONFLY = _require.HERO_DRAGONFLY,
    HERO_MOTH = _require.HERO_MOTH,
    MAX_ENERGY = _require.MAX_ENERGY,
    LOOT_SPEED = _require.LOOT_SPEED,
    LOOT_ATTACK_POWER = _require.LOOT_ATTACK_POWER,
    LOOT_ATTACK_SPEED = _require.LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_SPEED = _require.LOOT_TRIPLE_SPEED,
    LOOT_TRIPLE_POWER = _require.LOOT_TRIPLE_POWER,
    LOOT_COMBO = _require.LOOT_COMBO,
    LOOT_TRIPLE_COMBO = _require.LOOT_TRIPLE_COMBO,
    LOOT_LIGHTNING_LADYBUG = _require.LOOT_LIGHTNING_LADYBUG,
    LOOT_PENETRATING_LADYBUG = _require.LOOT_PENETRATING_LADYBUG;

var _require2 = require('keyboard'),
    isKeyDown = _require2.isKeyDown,
    KEY_SHIFT = _require2.KEY_SHIFT;

var Rectangle = require('Rectangle');

var _require3 = require('draw'),
    drawImage = _require3.drawImage,
    drawTintedImage = _require3.drawTintedImage;

var _require4 = require('sprites'),
    getNewSpriteState = _require4.getNewSpriteState;

var _require5 = require('animations'),
    r = _require5.r,
    createAnimation = _require5.createAnimation,
    getHitBox = _require5.getHitBox,
    getFrame = _require5.getFrame;

var heroesData = {};

/*const testLightningBug = {
    color:"#4860A0",
    animationTime: 0,
    width:25, height:20,
    left: 0, top: 0,
    type:"lightningLadybug",
    vx:0, vy:0,
};*/

var getNewPlayerState = function getNewPlayerState() {
    var _ref;

    return _ref = {
        score: 0,
        powerupPoints: 0,
        powerupIndex: 0,
        comboScore: 0,
        sprite: getNewSpriteState(_extends({}, heroesData[HERO_DRAGONFLY].animation.frames[0], {
            left: 160, top: 377,
            targetLeft: 170, targetTop: 200,
            spawnSpeed: 7
        })),
        heroes: [HERO_DRAGONFLY, HERO_BEE, HERO_MOTH]
    }, _defineProperty(_ref, HERO_DRAGONFLY, { energy: 0, deaths: 0 }), _defineProperty(_ref, HERO_BEE, { energy: 0, deaths: 0, targets: [] }), _defineProperty(_ref, HERO_MOTH, { energy: 0, deaths: 0 }), _defineProperty(_ref, 'time', 0), _defineProperty(_ref, 'invulnerableFor', 0), _defineProperty(_ref, 'spawning', true), _defineProperty(_ref, 'shotCooldown', 0), _defineProperty(_ref, 'powerups', []), _defineProperty(_ref, 'relics', {}), _defineProperty(_ref, 'ladybugs', []), _defineProperty(_ref, 'actions', {
        up: false,
        down: false,
        left: false,
        right: false,
        shoot: false,
        start: false
    }), _ref;
};

var updatePlayer = function updatePlayer(state, playerIndex, props) {
    var spriteProps = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    var players = [].concat(_toConsumableArray(state.players));
    if (spriteProps) {
        props.sprite = _extends({}, players[playerIndex].sprite, spriteProps);
    }
    players[playerIndex] = _extends({}, players[playerIndex], props);
    return _extends({}, state, { players: players });
};

function updatePlayerOnContinue(state, playerIndex) {
    var _updatePlayer;

    return updatePlayer(state, playerIndex, (_updatePlayer = {
        score: 0,
        powerupPoints: 0,
        powerupIndex: 0,
        comboScore: 0,
        dead: false,
        done: false
    }, _defineProperty(_updatePlayer, HERO_DRAGONFLY, { energy: 0, deaths: 0 }), _defineProperty(_updatePlayer, HERO_BEE, { energy: 0, deaths: 0, targets: [] }), _defineProperty(_updatePlayer, HERO_MOTH, { energy: 0, deaths: 0 }), _defineProperty(_updatePlayer, 'time', 0), _defineProperty(_updatePlayer, 'invulnerableFor', 0), _defineProperty(_updatePlayer, 'spawning', true), _defineProperty(_updatePlayer, 'shotCooldown', 0), _defineProperty(_updatePlayer, 'powerups', []), _defineProperty(_updatePlayer, 'ladybugs', []), _updatePlayer), {
        left: -100, top: 300,
        targetLeft: 170, targetTop: 200,
        spawnSpeed: 7
    });
}

var isPlayerInvulnerable = function isPlayerInvulnerable(state, playerIndex) {
    var player = state.players[playerIndex];
    return player.invulnerableFor || player.usingSpecial;
};

var useMeleeAttack = function useMeleeAttack(state, playerIndex) {
    var player = state.players[playerIndex];
    var heroData = heroesData[player.heroes[0]];
    var meleeCooldown = 3 * SHOT_COOLDOWN - player.powerups.filter(function (powerup) {
        return powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO;
    }).length;
    var powers = player.powerups.filter(function (powerup) {
        return powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO;
    }).length;
    var triplePowers = player.powerups.filter(function (powerup) {
        return powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO;
    }).length;
    var scale = 1 + heroData.meleeScaling * (powers + triplePowers / 2);
    var meleeAttack = createAttack(heroData.meleeAttack, {
        damage: heroData.meleePower + triplePowers,
        top: player.sprite.top + player.sprite.vy + player.sprite.height / 2,
        left: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET,
        playerIndex: playerIndex
    });
    meleeAttack.width *= scale;
    meleeAttack.height *= scale;
    meleeAttack.top -= meleeAttack.height / 2;
    state = addPlayerAttackToState(state, meleeAttack);
    return updatePlayer(state, playerIndex, { meleeAttackTime: 0, meleeCooldown: meleeCooldown });
};

var hasAnotherHero = function hasAnotherHero(state, playerIndex) {
    var player = state.players[playerIndex];
    for (var i = 1; i < player.heroes.length; i++) {
        if (player[player.heroes[i]].energy >= 0) return true;
    }
    return null;
};

var advanceHero = function advanceHero(state, playerIndex) {
    if (state.players[playerIndex].done) {
        return state;
    }
    state = advanceLadybugs(state, playerIndex);
    state = updatePlayer(state, playerIndex, { time: state.players[playerIndex].time + FRAME_LENGTH });
    var player = state.players[playerIndex];
    // Restore energy for all heroes each frame.
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = player.heroes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _heroType = _step.value;

            if (player[_heroType].energy < MAX_ENERGY && (_heroType !== player.heroes[0] || !player.invulnerableFor && !player.usingSpecial)) {
                state = updatePlayer(state, playerIndex, _defineProperty({}, _heroType, _extends({}, player[_heroType], { energy: player[_heroType].energy + 0.02 })));
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

    var heroType = player.heroes[0];
    var heroData = heroesData[heroType];
    if (heroData.advanceHero) {
        state = heroData.advanceHero(state, playerIndex);
    }
    var _player = player,
        shotCooldown = _player.shotCooldown,
        invulnerableFor = _player.invulnerableFor,
        specialCooldownFrames = _player.specialCooldownFrames;

    if (player.usingSpecial) {
        state = updatePlayer(state, playerIndex, {}, { animationTime: player.sprite.animationTime + FRAME_LENGTH });
        return heroData.applySpecial(state, playerIndex);
    }
    // If the player runs out of energy from using a special move, they automatically switch out
    // after using it.
    if (player[player.heroes[0]].energy < 0 && !player.invulnerableFor) {
        return switchHeroes(state, playerIndex);
    }
    if (player.actions.special && heroData.applySpecial && !player.sprite.targetLeft && !player.invulnerableFor
    // You can use a special when you don't have enough energy *if* another hero is available.
    && (player[heroType].energy >= heroData.specialCost || hasAnotherHero(state, playerIndex))) {
        if (heroData.specialSfx) state = _extends({}, state, { sfx: _extends({}, state.sfx, _defineProperty({}, heroData.specialSfx, true)) });
        return updatePlayer(state, playerIndex, _defineProperty({
            usingSpecial: true, specialFrames: 0
        }, heroType, _extends({}, player[heroType], { energy: player[heroType].energy - heroData.specialCost })), { animationTime: 0 });
    }
    if (player.meleeCooldown > 0) {
        state = updatePlayer(state, playerIndex, { meleeCooldown: player.meleeCooldown - 1 });
        player = state.players[playerIndex];
    } else if (player.actions.melee) {
        state = useMeleeAttack(state, playerIndex);
        player = state.players[playerIndex];
    } else if (shotCooldown > 0) {
        state = updatePlayer(_extends({}, state, { sfx: sfx }), playerIndex, { shotCooldown: shotCooldown - 1 });
        player = state.players[playerIndex];
    } else if (player.actions.shoot) {
        state = heroData.shoot(state, playerIndex);
        player = state.players[playerIndex];
    }

    var _player$sprite = player.sprite,
        top = _player$sprite.top,
        left = _player$sprite.left,
        vx = _player$sprite.vx,
        vy = _player$sprite.vy,
        animationTime = _player$sprite.animationTime,
        targetLeft = _player$sprite.targetLeft,
        targetTop = _player$sprite.targetTop;

    animationTime += FRAME_LENGTH;
    if (invulnerableFor > 0) {
        invulnerableFor -= FRAME_LENGTH;
    }
    if (targetLeft != false) {
        var theta = Math.atan2(targetTop - top, targetLeft - left);
        left = Math.min(left + player.sprite.spawnSpeed * Math.cos(theta), targetLeft);
        top = Math.max(top + player.sprite.spawnSpeed * Math.sin(theta), targetTop);
        if (left === targetLeft && top === targetTop) {
            targetLeft = targetTop = false;
        }
        return updatePlayer(state, playerIndex, {
            invulnerableFor: invulnerableFor, spawning: true,
            shotCooldown: 1, meleeCooldown: 1, specialCooldownFrames: specialCooldownFrames
        }, { left: left, top: top, animationTime: animationTime, targetLeft: targetLeft, targetTop: targetTop });
    }
    if (player.actions.switch) {
        return switchHeroes(state, playerIndex);
    }
    if (player.actions.shoot) {
        if (!player.toggledFormation) {
            var formation = 4;
            if (player.actions.right) formation = 0;else if (player.actions.up) formation = 1;else if (player.actions.down) formation = 2;else if (player.actions.left) formation = 3;
            state = updatePlayer(state, playerIndex, _defineProperty({
                toggledFormation: true
            }, HERO_BEE, _extends({}, player[HERO_BEE], {
                formation: formation
                //formation: (player[HERO_BEE].formation + 1) % heroesData[HERO_BEE].formations.length
            })));
        }
    } else if (player.toggledFormation) {
        state = updatePlayer(state, playerIndex, { toggledFormation: false });
    }
    /*if (!player.actions.shoot) {
        let formation = 4;
        if (player.actions.right) formation = 0;
        else if (player.actions.up) formation = 1;
        else if (player.actions.down) formation = 2;
        else if (player.actions.left) formation = 3;
        state = updatePlayer(state, playerIndex, {
            toggledFormation: true,
            [HERO_BEE]: {...player[HERO_BEE],
                formation
            },
        });
    }*/
    var speedPowerups = player.powerups.filter(function (powerup) {
        return powerup === LOOT_SPEED || powerup === LOOT_COMBO;
    }).length;
    var tripleSpeedPowerups = player.powerups.filter(function (powerup) {
        return powerup === LOOT_TRIPLE_SPEED || powerup === LOOT_TRIPLE_COMBO;
    }).length;
    var maxSpeed = heroData.baseSpeed + tripleSpeedPowerups;
    var accleration = ACCELERATION + speedPowerups / 2 + tripleSpeedPowerups;
    // Accelerate player based on their input.
    if (player.actions.up) vy -= accleration;
    if (player.actions.down) vy += accleration;
    if (player.actions.left) vx -= accleration;
    if (player.actions.right) vx += accleration;
    vy *= .9 - tripleSpeedPowerups * .01;
    vy = Math.max(-maxSpeed, Math.min(maxSpeed, vy));
    vx *= .9 - tripleSpeedPowerups * .01;
    vx = Math.max(-maxSpeed, Math.min(maxSpeed, vx));

    // Update player position based on their
    left += vx;
    top += vy;
    var hitBox = new Rectangle(getHeroHitBox(player)).translate(-player.sprite.left, -player.sprite.top);
    if (top + hitBox.top < 0) {
        top = -hitBox.top;
        vy = 0;
    }
    var bottom = Math.min(getGroundHeight(state), GAME_HEIGHT);
    if (top + hitBox.top + hitBox.height > bottom) {
        top = bottom - (hitBox.top + hitBox.height);
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
    var sprite = _extends({}, player.sprite, { left: left, top: top, vx: vx, vy: vy, animationTime: animationTime });
    var sfx = _extends({}, state.sfx);
    var chasingNeedle = player.chasingNeedle,
        catchingNeedleFrames = player.catchingNeedleFrames;
    if (chasingNeedle) {
        chasingNeedle = false;
        catchingNeedleFrames = 6;
        sfx['sfx/needlegrab.mp3'] = true;
    } else if (catchingNeedleFrames > 0) {
        catchingNeedleFrames--;
    }
    var meleeAttackTime = player.meleeAttackTime;
    if (meleeAttackTime >= 0) {
        meleeAttackTime += FRAME_LENGTH;
        var animation = heroData.meleeAnimation;
        var attackLength = animation.frames.length * animation.frameDuration * FRAME_LENGTH;
        if (meleeAttackTime >= attackLength) {
            meleeAttackTime = undefined;
        }
    }
    if (invulnerableFor === 1000) {
        sfx['warnInvisibilityIsEnding'] = true;
    }
    var updatedProps = {
        meleeAttackTime: meleeAttackTime,
        specialCooldownFrames: specialCooldownFrames,
        invulnerableFor: invulnerableFor, sprite: sprite,
        chasingNeedle: chasingNeedle, catchingNeedleFrames: catchingNeedleFrames,
        spawning: false
    };
    return updatePlayer(_extends({}, state, { sfx: sfx }), playerIndex, updatedProps);
};

var advanceLadybugs = function advanceLadybugs(state, playerIndex) {
    var player = state.players[playerIndex];
    var sprite = player.sprite;
    var ladybugs = [].concat(_toConsumableArray(player.ladybugs));
    for (var i = 0; i < ladybugs.length; i++) {
        var ladybug = ladybugs[i];
        var delta = [[-5, -32], [-5, 32], [52, -16], [52, 16]][i % 4];
        var factor = 1;
        if (ladybug.type === LOOT_LIGHTNING_LADYBUG) factor = 2;
        var tx = sprite.left + sprite.width / 2 - ladybug.width / 2 + factor * delta[0];
        var ty = sprite.top + sprite.height / 2 - ladybug.height / 2 + factor * delta[1];
        var shotCooldown = ladybug.shotCooldown || 0;
        if (shotCooldown > 0) {
            shotCooldown--;
        } else if (player.actions.shoot && !player.spawning) {
            if (ladybug.type === LOOT_PENETRATING_LADYBUG) {
                shotCooldown = 2 * SHOT_COOLDOWN;
                var laser = createAttack(ATTACK_LASER, {
                    left: ladybug.left + player.sprite.vx + ladybug.width + ATTACK_OFFSET,
                    vx: 25,
                    playerIndex: playerIndex
                });
                laser.width *= 3;
                laser.top = ladybug.top + player.sprite.vy + Math.round((ladybug.height - laser.height) / 2) + 6;
                state = addPlayerAttackToState(state, laser);
            } else if (ladybug.type === LOOT_LIGHTNING_LADYBUG) {
                shotCooldown = 0.5 * SHOT_COOLDOWN;
                state = checkToAddLightning(state, {
                    type: EFFECT_FAST_LIGHTNING,
                    charges: 0, damage: 1,
                    left: ladybug.left + ladybug.width / 2 + player.sprite.vx,
                    top: ladybug.top + ladybug.height / 2 + player.sprite.vy,
                    rotation: Math.random() * 2 * Math.PI,
                    scale: 1,
                    vx: player.sprite.vx,
                    vy: player.sprite.vy
                });
            } else {
                shotCooldown = 1.5 * SHOT_COOLDOWN;
                var orb = createAttack(ATTACK_ORB, {
                    damage: 1,
                    left: ladybug.left + player.sprite.vx + ladybug.width + ATTACK_OFFSET,
                    vx: 15,
                    playerIndex: playerIndex
                });
                orb.top = ladybug.top + player.sprite.vy + Math.round((ladybug.height - orb.height) / 2) + 6;
                state = addPlayerAttackToState(state, orb);
            }
        }
        ladybugs[i] = _extends({}, ladybugs[i], {
            shotCooldown: shotCooldown,
            left: (ladybugs[i].left + tx) / 2,
            top: (ladybugs[i].top + ty) / 2,
            animationTime: ladybugs[i].animationTime + FRAME_LENGTH
        });
    }
    return updatePlayer(state, playerIndex, { ladybugs: ladybugs });
};

var switchHeroes = function switchHeroes(updatedState, playerIndex) {
    if (!hasAnotherHero(updatedState, playerIndex)) {
        return updatedState;
    }
    var player = updatedState.players[playerIndex];
    var sprite = player.sprite;

    // Display the dying character as a single animation effect.
    var switchEffect = createEffect(heroesData[player.heroes[0]].switchEffect);
    switchEffect.left = sprite.left + (sprite.width - switchEffect.width) / 2;
    switchEffect.top = sprite.top + (sprite.height - switchEffect.height) / 2;
    updatedState = addEffectToState(updatedState, switchEffect);
    var needleEffect = createEffect(EFFECT_NEEDLE_FLIP);
    needleEffect.left = sprite.left + (sprite.width - needleEffect.width) / 2;
    needleEffect.top = sprite.top + (sprite.height - needleEffect.height) / 2;
    updatedState = addEffectToState(updatedState, needleEffect);

    var heroes = [].concat(_toConsumableArray(player.heroes));
    heroes.push(heroes.shift());
    // If the first hero has no energy, switch to the next hero.
    if (player[heroes[0]].energy < 0) {
        heroes.push(heroes.shift());
    }
    var targetLeft = sprite.left,
        targetTop = sprite.top;
    var left = -100,
        top = GAME_HEIGHT - 100;
    var dx = left - targetLeft,
        dy = targetTop - top;
    var spawnSpeed = Math.sqrt(dx * dx + dy * dy) / 25;
    updatedState = updatePlayer(updatedState, playerIndex, {
        heroes: heroes,
        invulnerableFor: 25 * FRAME_LENGTH,
        spawning: true,
        chasingNeedle: true
    }, _extends({}, heroesData[player.heroes[0]].animation.frames[0], {
        left: left, top: top, targetLeft: targetLeft, targetTop: targetTop, spawnSpeed: spawnSpeed,
        vx: 0, vy: 0
    }));
    player = updatedState.players[playerIndex];

    var sfx = _extends({}, updatedState.sfx, { 'sfx/needledropflip.mp3': true });
    return _extends({}, updatedState, { sfx: sfx });
};

var damageHero = function damageHero(updatedState, playerIndex) {
    var deathCooldown = updatedState.deathCooldown;
    var player = updatedState.players[playerIndex];
    var sprite = player.sprite;
    var ladybugs = [].concat(_toConsumableArray(player.ladybugs));
    ladybugs.shift();

    // Display the dying character as a single animation effect.
    var deadHeroData = heroesData[player.heroes[0]];
    var deathEffect = createEffect(deadHeroData.deathEffect);
    deathEffect.left = sprite.left + (sprite.width - deathEffect.width) / 2;
    deathEffect.top = sprite.top + (sprite.height - deathEffect.height) / 2;
    updatedState = addEffectToState(updatedState, deathEffect);
    // Increment deaths for the current hero, and set energy negative based on
    // the total number of deaths (this is reset on continue or completing a level).
    var deaths = player[player.heroes[0]].deaths + 1;
    updatedState = updatePlayer(updatedState, playerIndex, _defineProperty({}, player.heroes[0], _extends({}, player[player.heroes[0]], { energy: -10 - 10 * (deaths - 1), deaths: deaths })));
    var needleEffect = createEffect(EFFECT_NEEDLE_FLIP);
    needleEffect.left = sprite.left + (sprite.width - needleEffect.width) / 2;
    needleEffect.top = sprite.top + (sprite.height - needleEffect.height) / 2;
    updatedState = addEffectToState(updatedState, needleEffect);

    var heroes = [].concat(_toConsumableArray(player.heroes));
    var done = false;
    heroes.push(heroes.shift());
    // If the first hero has no energy, switch to the next hero.
    if (player[heroes[0]].energy < 0) {
        heroes.push(heroes.shift());
    }
    // If the last hero still has no energy, it is game over.
    if (player[heroes[0]].energy < 0) {
        done = true;
    }
    var targetLeft = sprite.left,
        targetTop = sprite.top;
    var powerups = [].concat(_toConsumableArray(player.powerups));
    powerups.pop();
    var left = -100,
        top = GAME_HEIGHT - 100;
    var dx = left - targetLeft,
        dy = targetTop - top;
    var spawnSpeed = Math.sqrt(dx * dx + dy * dy) / 25;
    updatedState = updatePlayer(updatedState, playerIndex, {
        heroes: heroes,
        dead: true,
        usingSpecial: false,
        done: done,
        invulnerableFor: 2000,
        spawning: true,
        chasingNeedle: true,
        powerupIndex: 0,
        powerupPoints: 0,
        comboScore: 0,
        powerups: powerups,
        ladybugs: ladybugs
    }, _extends({}, heroesData[player.heroes[0]].animation.frames[0], {
        left: left, top: top, targetLeft: targetLeft, targetTop: targetTop, spawnSpeed: spawnSpeed,
        vx: 0, vy: 0
    }));
    player = updatedState.players[playerIndex];

    var sfx = _extends({}, updatedState.sfx, _defineProperty({}, deadHeroData.deathSfx, true));
    if (player.done) {
        deathCooldown = DEATH_COOLDOWN;
        sfx['sfx/death.mp3'] = true;
    } else {
        sfx['sfx/needledropflip.mp3'] = true;
    }
    return _extends({}, updatedState, { deathCooldown: deathCooldown, sfx: sfx });
};

var getHeroHitBox = function getHeroHitBox(player) {
    var _player$sprite2 = player.sprite,
        animationTime = _player$sprite2.animationTime,
        left = _player$sprite2.left,
        top = _player$sprite2.top;

    var animation = heroesData[player.heroes[0]].animation;
    return new Rectangle(getHitBox(animation, animationTime)).translate(left, top);
};

var renderHero = function renderHero(context, player) {
    var sprite = player.sprite,
        invulnerableFor = player.invulnerableFor,
        done = player.done,
        ladybugs = player.ladybugs;

    if (done) return;
    var heroData = heroesData[player.heroes[0]];
    var animation = heroData.animation,
        animationTime = sprite.animationTime;
    if (player.usingSpecial) {
        animation = heroData.specialAnimation;
    }
    if (player.chasingNeedle) {
        animation = heroData.enterAnimation;
    }
    if (player.catchingNeedleFrames > 0) {
        animation = heroData.catchAnimation;
    }
    if (player.meleeAttackTime >= 0) {
        animation = heroData.meleeAnimation;
        animationTime = player.meleeAttackTime;
    }
    context.save();
    if (invulnerableFor > 1000) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 40) * .2;
    } else if (invulnerableFor > 400) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 20) * .2;
    } else if (invulnerableFor > 0) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 10) * .2;
    }
    var frame = getFrame(animation, animationTime);
    drawImage(context, frame.image, frame, sprite);
    context.restore();
    if (isKeyDown(KEY_SHIFT)) {
        var hitBox = getHeroHitBox(player);
        context.save();
        context.globalAlpha = .6;
        context.fillStyle = 'green';
        context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
        context.restore();
    }
    if (heroData.render) {
        heroData.render(context, player);
    }
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = ladybugs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var ladybug = _step2.value;

            renderLadybug(context, ladybug);
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }
};

var ladybugAnimation = createAnimation('gfx/heroes/ladybug.png', r(25, 20), { top: 20, cols: 4, duration: 4 });
var ladybugAnimationTint = createAnimation('gfx/heroes/ladybug.png', r(25, 20), { top: 0, cols: 4, duration: 4 });
var renderLadybug = function renderLadybug(context, ladybug) {
    var frame = getFrame(ladybugAnimationTint, ladybug.animationTime);
    drawTintedImage(context, frame.image, ladybug.color, 1, frame, ladybug);
    frame = getFrame(ladybugAnimation, ladybug.animationTime);
    drawImage(context, frame.image, frame, ladybug);
};

module.exports = {
    getNewPlayerState: getNewPlayerState,
    advanceHero: advanceHero,
    getHeroHitBox: getHeroHitBox,
    damageHero: damageHero,
    renderHero: renderHero,
    heroesData: heroesData,
    updatePlayer: updatePlayer,
    updatePlayerOnContinue: updatePlayerOnContinue,
    isPlayerInvulnerable: isPlayerInvulnerable,
    ladybugAnimation: ladybugAnimation,
    useMeleeAttack: useMeleeAttack
};

var _require6 = require('world'),
    getGroundHeight = _require6.getGroundHeight;

var _require7 = require('attacks'),
    createAttack = _require7.createAttack,
    addPlayerAttackToState = _require7.addPlayerAttackToState;

var _require8 = require('effects'),
    createEffect = _require8.createEffect,
    addEffectToState = _require8.addEffectToState;

var _require9 = require('effects/lightning'),
    EFFECT_FAST_LIGHTNING = _require9.EFFECT_FAST_LIGHTNING,
    checkToAddLightning = _require9.checkToAddLightning;

require('heroes/bee');
require('heroes/dragonfly');
require('heroes/moth');

},{"Rectangle":1,"animations":2,"attacks":5,"draw":7,"effects":8,"effects/lightning":9,"gameConstants":11,"heroes/bee":13,"heroes/dragonfly":14,"heroes/moth":15,"keyboard":16,"sprites":21,"world":23}],13:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('gameConstants'),
    FRAME_LENGTH = _require.FRAME_LENGTH,
    SHOT_COOLDOWN = _require.SHOT_COOLDOWN,
    ATTACK_OFFSET = _require.ATTACK_OFFSET,
    ATTACK_STAB = _require.ATTACK_STAB,
    EFFECT_DEAD_BEE = _require.EFFECT_DEAD_BEE,
    EFFECT_SWITCH_BEE = _require.EFFECT_SWITCH_BEE,
    HERO_BEE = _require.HERO_BEE,
    LOOT_ATTACK_POWER = _require.LOOT_ATTACK_POWER,
    LOOT_ATTACK_SPEED = _require.LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_POWER = _require.LOOT_TRIPLE_POWER,
    LOOT_TRIPLE_RATE = _require.LOOT_TRIPLE_RATE,
    LOOT_COMBO = _require.LOOT_COMBO,
    LOOT_TRIPLE_COMBO = _require.LOOT_TRIPLE_COMBO;

var random = require('random');
var Rectangle = require('Rectangle');

var _require2 = require('animations'),
    requireImage = _require2.requireImage,
    r = _require2.r,
    createAnimation = _require2.createAnimation;

var _require3 = require('heroes'),
    heroesData = _require3.heroesData,
    updatePlayer = _require3.updatePlayer;

var beeHitBox = { left: 10, top: 12, width: 60, height: 40 };
var beeRectangle = r(88, 56, { hitBox: beeHitBox });

heroesData[HERO_BEE] = {
    animation: {
        frames: [_extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/bee1.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/bee2.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/bee3.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/bee4.png') })],
        frameDuration: 3
    },
    enterAnimation: createAnimation('gfx/heroes/bee/beeflyin1.png', beeRectangle),
    catchAnimation: createAnimation('gfx/heroes/bee/beeflyin2.png', beeRectangle),
    meleeAnimation: {
        frames: [_extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beem1.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beem2.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beem3.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beem4.png') })],
        frameDuration: 3
    },
    specialAnimation: {
        frames: [_extends({}, r(88, 56), { image: requireImage('gfx/heroes/bee/beespecial1.png') }), _extends({}, r(88, 56), { image: requireImage('gfx/heroes/bee/beespecial2.png') }), _extends({}, r(88, 56), { image: requireImage('gfx/heroes/bee/beespecial3.png') })],
        frameDuration: 6
    },
    meleeAttack: ATTACK_STAB,
    deathEffect: EFFECT_DEAD_BEE,
    deathSfx: 'sfx/exclamation.mp3',
    specialSfx: 'sfx/special.mp3',
    switchEffect: EFFECT_SWITCH_BEE,
    portraitAnimation: createAnimation('gfx/heroes/bee/beeportrait.png', r(17, 18)),
    defeatedPortraitAnimation: createAnimation('gfx/heroes/bee/beeportraitdead.png', r(17, 18)),
    baseSpeed: 7,
    meleePower: 2,
    meleeScaling: 0.25,
    hudColor: '#603820',
    // hudColor: '#E85038'
    specialCost: 12,
    applySpecial: function applySpecial(state, playerIndex) {
        // TODO: Brighten screen during lightning.
        var player = state.players[playerIndex];
        if (player.specialFrames < 6 * 3) {
            return updatePlayer(state, playerIndex, { specialFrames: player.specialFrames + 1 });
        }
        state = checkToAddLightning(state, {
            left: player.sprite.left + player.sprite.width - 10,
            top: player.sprite.top + player.sprite.height / 2
        });
        return updatePlayer(state, playerIndex, { usingSpecial: false, invulnerableFor: 500 });
    },

    formations: [function (player, numTargets) {
        var points = [];
        var minAngle = -(numTargets - 1) * Math.PI / 18;
        var angleBetween = 2 * -minAngle / Math.max(1, numTargets - 1);
        for (var i = 0; i < numTargets; i++) {
            var theta = minAngle + i * angleBetween;
            points.push({ x: 160 * Math.cos(theta), y: 160 * Math.sin(theta) });
        }
        return points;
    }, function (player, numTargets) {
        var points = [];
        var minAngle = -(numTargets - 1) * Math.PI / 18;
        var angleBetween = 2 * -minAngle / Math.max(1, numTargets - 1);
        for (var i = 0; i < numTargets; i++) {
            var theta = minAngle + i * angleBetween - Math.PI / 2;
            points.push({ x: 140 * Math.cos(theta), y: 140 * Math.sin(theta) });
        }
        return points;
    }, function (player, numTargets) {
        var points = [];
        var minAngle = -(numTargets - 1) * Math.PI / 18;
        var angleBetween = 2 * -minAngle / Math.max(1, numTargets - 1);
        for (var i = 0; i < numTargets; i++) {
            var theta = minAngle + i * angleBetween + Math.PI / 2;
            points.push({ x: 140 * Math.cos(theta), y: 140 * Math.sin(theta) });
        }
        return points;
    }, function (player, numTargets) {
        var points = [];
        var minAngle = -(numTargets - 1) * Math.PI / 18;
        var angleBetween = 2 * -minAngle / Math.max(1, numTargets - 1);
        for (var i = 0; i < numTargets; i++) {
            var theta = minAngle + i * angleBetween + Math.PI;
            points.push({ x: 140 * Math.cos(theta), y: 140 * Math.sin(theta) });
        }
        return points;
    }, function (player, numTargets) {
        var points = [];
        var minAngle = 0; // - player.time / (500 - numTargets * 20);
        var angleBetween = 2 * Math.PI / numTargets;
        for (var i = 0; i < numTargets; i++) {
            var theta = minAngle + i * angleBetween;
            points.push({ x: 140 * Math.cos(theta), y: 140 * Math.sin(theta) });
        }
        return points;
    }],
    advanceHero: function advanceHero(state, playerIndex) {
        var player = state.players[playerIndex];
        var sprite = player.sprite;
        var powers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO;
        }).length;
        var tripleRates = player.powerups.filter(function (powerup) {
            return powerup === LOOT_TRIPLE_RATE || powerup === LOOT_TRIPLE_COMBO;
        }).length;
        var triplePowers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO;
        }).length;
        var numTargets = 3 + tripleRates;
        var size = 50 + powers * 10 + triplePowers * 5;
        var targets = [].concat(_toConsumableArray(player[HERO_BEE].targets)).slice(0, numTargets);
        var middle = { x: sprite.left + sprite.width / 2, y: sprite.top + sprite.height / 2 };
        for (var i = 0; i < numTargets; i++) {
            if (!targets[i]) {
                targets[i] = {
                    left: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET - 2,
                    top: player.sprite.top + player.sprite.vy + player.sprite.height / 2 - 2,
                    vx: player.sprite.vx,
                    vy: player.sprite.vy,
                    width: 4, height: 4
                };
                break;
            }
            // Follow the enemy
            if (player.actions.shoot && targets[i].enemyId && state.idMap[targets[i].enemyId] && !state.idMap[targets[i].enemyId].dead) {
                var hitBox = getEnemyHitBox(state.idMap[targets[i].enemyId]);
                targets[i] = {
                    left: (targets[i].left + hitBox.left + hitBox.width / 2 - targets[i].width / 2) / 2,
                    top: (targets[i].top + hitBox.top + hitBox.height / 2 - targets[i].height / 2) / 2,
                    vx: 0, vy: 0,
                    width: (targets[i].width * 10 + size) / 11,
                    height: (targets[i].height * 10 + size) / 11,
                    enemyId: targets[i].enemyId
                };
                continue;
            }
            var x = targets[i].left + targets[i].width / 2,
                y = targets[i].top + targets[i].height / 2;
            var vx = targets[i].vx * 0.8,
                vy = targets[i].vy * 0.8;
            var factor = i % 2 ? -0.8 : 1.5;
            if (player.actions.right) vx += factor * 3;
            if (player.actions.left) vx -= factor * 2;
            if (player.actions.down) vy += factor * 2;
            if (player.actions.up) vy -= factor * 2;
            for (var j = 0; j < player[HERO_BEE].targets.length; j++) {
                if (j === i) continue;
                var otherTarget = player[HERO_BEE].targets[j];
                if (otherTarget.enemyId) continue;
                var _dx = targets[i].left - otherTarget.left,
                    _dy = targets[i].top - otherTarget.top;
                var _distance = Math.sqrt(_dx * _dx + _dy * _dy);
                if (_distance === 0) {
                    vx += 10 * Math.random() - 5;
                    vy += 10 * Math.random() - 5;
                } else {
                    vx += 20 * _dx / (_distance * _distance);
                    vy += 20 * _dy / (_distance * _distance);
                }
            }
            var dx = x - middle.x,
                dy = y - middle.y;
            var distance = Math.min(180, Math.sqrt(dx * dx + dy * dy));
            //if (distance < 140) {
            vx += 20 * dx / Math.max(0.5, distance * distance);
            vy += 20 * dy / Math.max(0.5, distance * distance);
            //} else if (distance > 160) {
            vx -= dx / Math.max(0.5, (180 - distance) * (180 - distance)) / 200;
            vy -= dy / Math.max(0.5, (180 - distance) * (180 - distance)) / 200;
            //}
            vx = Math.max(-20, Math.min(20, vx));
            vy = Math.max(-20, Math.min(20, vy));
            targets[i] = {
                left: targets[i].left + targets[i].vx, // + sprite.vx,
                top: targets[i].top + targets[i].vy, // + sprite.vy,
                vx: vx, vy: vy,
                width: (targets[i].width * 10 + size) / 11,
                height: (targets[i].height * 10 + size) / 11
            };
        }
        return updatePlayer(state, playerIndex, _defineProperty({}, HERO_BEE, _extends({}, player[HERO_BEE], { targets: targets })));
    },
    getFormationRectangles: function getFormationRectangles(player) {
        return player[HERO_BEE].targets;
        /*const formation = this.formations[player[HERO_BEE].formation];
        const rectangles = [];
        const sprite = player.sprite;
        const middle = {x: sprite.left + sprite.width / 2, y: sprite.top + sprite.height / 2};
        for (const data of formation(player, numTargets)) {
            rectangles.push(
                new Rectangle(0, 0, size, size).moveCenterTo(middle.x + data.x, middle.y + data.y)
            );
        }
        return rectangles;*/
    },
    render: function render(context, player) {
        context.save();
        context.globalAlpha = 0.5;
        context.fillStyle = 'orange';
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = this.getFormationRectangles(player)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var formation = _step.value;

                context.fillRect(formation.left, formation.top, formation.width, formation.height);
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

        context.restore();
    },
    shoot: function shoot(state, playerIndex) {
        var player = state.players[playerIndex];
        var attackSpeedPowers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO;
        }).length;
        var shotCooldown = (this.shotCooldown || SHOT_COOLDOWN) - attackSpeedPowers;
        state = updatePlayer(state, playerIndex, { shotCooldown: shotCooldown });
        var triplePowers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO;
        }).length;
        var damage = 1 + triplePowers;
        var tint = getAttackTint({ damage: damage });
        var hit = false;
        var targets = [].concat(_toConsumableArray(player[HERO_BEE].targets));
        //const targetHitBoxes = this.getFormationRectangles(player);
        for (var i = 0; i < targets.length; i++) {
            var targetHitBox = targets[i];
            for (var j = 0; j < state.enemies.length; j++) {
                var enemy = state.idMap[state.enemies[j].id];
                if (!enemy || enemy.dead) continue;
                if (targetHitBox.enemyId && targetHitBox.enemyId != enemy.id) continue;
                var hitBox = getEnemyHitBox(enemy);
                if (Rectangle.collision(targetHitBox, hitBox)) {
                    state = addEffectToState(state, createEffect(EFFECT_ARC_LIGHTNING, {
                        playerIndex: playerIndex, enemyId: enemy.id,
                        sx: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET,
                        sy: player.sprite.top + player.sprite.vy + player.sprite.height / 2,
                        dx: Math.random() * 20 + 2 * (targetHitBox.left + targetHitBox.width / 2 - (hitBox.left + hitBox.width / 2)),
                        dy: Math.random() * 20 + 2 * (targetHitBox.top + targetHitBox.height / 2 - (hitBox.top + hitBox.height / 2)),
                        duration: 6 * FRAME_LENGTH,
                        // This will be rendered before it is positioned correctly,
                        // so just stick it off screen.
                        left: -200,
                        tint: tint,
                        damage: damage
                    }));
                    hit = true;
                    targets[i] = _extends({}, targets[i], { enemyId: enemy.id });
                    break;
                }
            }
        }
        // If no enemies are in range, just fire a random shot, otherwise the player may not
        // realize they are attacking.
        if (!hit) {
            var _targetHitBox = random.element(targets);
            return addEffectToState(state, createEffect(EFFECT_ARC_LIGHTNING, {
                playerIndex: playerIndex,
                tx: _targetHitBox.left + _targetHitBox.width / 2,
                ty: _targetHitBox.top + _targetHitBox.height / 2,
                sx: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET,
                sy: player.sprite.top + player.sprite.vy + player.sprite.height / 2,
                dx: Math.random() * 40,
                dy: Math.random() * 40,
                duration: 6 * FRAME_LENGTH,
                // This will be rendered before it is positioned correctly,
                // so just stick it off screen.
                left: -200,
                tint: tint,
                damage: damage
            }));
        }
        return updatePlayer(state, playerIndex, _defineProperty({}, HERO_BEE, _extends({}, player[HERO_BEE], { targets: targets })));
    }
};

var _require4 = require('attacks'),
    getAttackTint = _require4.getAttackTint;

var _require5 = require('effects'),
    addEffectToState = _require5.addEffectToState,
    createEffect = _require5.createEffect;

var _require6 = require('enemies'),
    getEnemyHitBox = _require6.getEnemyHitBox;

var _require7 = require('effects/lightning'),
    checkToAddLightning = _require7.checkToAddLightning,
    EFFECT_ARC_LIGHTNING = _require7.EFFECT_ARC_LIGHTNING;

},{"Rectangle":1,"animations":2,"attacks":5,"effects":8,"effects/lightning":9,"enemies":10,"gameConstants":11,"heroes":12,"random":18}],14:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('gameConstants'),
    ATTACK_OFFSET = _require.ATTACK_OFFSET,
    SHOT_COOLDOWN = _require.SHOT_COOLDOWN,
    ATTACK_BLAST = _require.ATTACK_BLAST,
    ATTACK_SLASH = _require.ATTACK_SLASH,
    EFFECT_DEAD_DRAGONFLY = _require.EFFECT_DEAD_DRAGONFLY,
    EFFECT_SWITCH_DRAGONFLY = _require.EFFECT_SWITCH_DRAGONFLY,
    HERO_DRAGONFLY = _require.HERO_DRAGONFLY,
    LOOT_ATTACK_POWER = _require.LOOT_ATTACK_POWER,
    LOOT_ATTACK_SPEED = _require.LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_POWER = _require.LOOT_TRIPLE_POWER,
    LOOT_TRIPLE_RATE = _require.LOOT_TRIPLE_RATE,
    LOOT_COMBO = _require.LOOT_COMBO,
    LOOT_TRIPLE_COMBO = _require.LOOT_TRIPLE_COMBO;

var Rectangle = require('Rectangle');

var _require2 = require('animations'),
    requireImage = _require2.requireImage,
    r = _require2.r,
    createAnimation = _require2.createAnimation;

var _require3 = require('heroes'),
    heroesData = _require3.heroesData,
    updatePlayer = _require3.updatePlayer,
    useMeleeAttack = _require3.useMeleeAttack,
    getHeroHitBox = _require3.getHeroHitBox;

var dragonflyHitBox = { left: 10, top: 15, width: 70, height: 30 };
var dragonflyRectangle = r(88, 56, { hitBox: dragonflyHitBox });
var dragonflyAnimation = {
    frames: [_extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonfly1.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonfly2.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonfly3.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonfly4.png') })],
    frameDuration: 3
};
var dragonflyEnterAnimation = createAnimation('gfx/heroes/dragonfly/dragonflyflyin1.png', dragonflyRectangle);

var dragonflyCatchAnimation = createAnimation('gfx/heroes/dragonfly/dragonflyflyin2.png', dragonflyRectangle);

var dragonflyMeleeAnimation = {
    frames: [_extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflym1.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflym2.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflym3.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflym4.png') })],
    frameDuration: 3
};

heroesData[HERO_DRAGONFLY] = {
    animation: dragonflyAnimation,
    enterAnimation: dragonflyEnterAnimation,
    catchAnimation: dragonflyCatchAnimation,
    meleeAnimation: dragonflyMeleeAnimation,
    specialAnimation: {
        frames: [_extends({}, r(88, 56), { image: requireImage('gfx/heroes/dragonfly/knightspecial1.png') }), _extends({}, r(88, 56), { image: requireImage('gfx/heroes/dragonfly/knightspecial2.png') })],
        frameDuration: 8
    },
    meleeAttack: ATTACK_SLASH,
    deathEffect: EFFECT_DEAD_DRAGONFLY,
    deathSfx: 'sfx/exclamation3.mp3',
    specialSfx: 'sfx/dash.mp3',
    switchEffect: EFFECT_SWITCH_DRAGONFLY,
    portraitAnimation: createAnimation('gfx/heroes/dragonfly/dragonflyportrait.png', r(17, 18)),
    defeatedPortraitAnimation: createAnimation('gfx/heroes/dragonfly/dragonflyportraitdead.png', r(17, 18)),
    baseSpeed: 8,
    meleePower: 1,
    meleeScaling: 0.25,
    hudColor: '#F03010',
    specialCost: 8,
    applySpecial: function applySpecial(state, playerIndex) {
        // TODO: support multiple directions, add ghost trail behind her.
        var player = state.players[playerIndex];
        for (var i = 0; i < state.enemies.length; i++) {
            var enemy = state.enemies[i];
            var enemyHitBox = getEnemyHitBox(enemy);
            if (enemy && state.idMap[enemy.id] && !enemy.dead && Rectangle.collision(enemyHitBox, getHeroHitBox(player))) {
                state = damageEnemy(state, enemy.id, { playerIndex: playerIndex });
            }
        }
        if (player.specialFrames <= 20) {
            return updatePlayer(state, playerIndex, { specialFrames: player.specialFrames + 1 }, { left: player.sprite.left + 15 });
        }
        state = useMeleeAttack(state, playerIndex);
        return updatePlayer(state, playerIndex, { usingSpecial: false, invulnerableFor: 500 });
    },
    shoot: function shoot(state, playerIndex) {
        var player = state.players[playerIndex];
        var attackSpeedPowers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO;
        }).length;
        var shotCooldown = (this.shotCooldown || SHOT_COOLDOWN) - attackSpeedPowers;
        state = updatePlayer(state, playerIndex, { shotCooldown: shotCooldown });
        player = state.players[playerIndex];

        var powers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO;
        }).length;
        var triplePowers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO;
        }).length;
        var tripleRates = player.powerups.filter(function (powerup) {
            return powerup === LOOT_TRIPLE_RATE || powerup === LOOT_TRIPLE_COMBO;
        }).length;
        var middleShot = { x: ATTACK_OFFSET, y: 0, vx: 20, vy: 0 };
        var upperA = { x: ATTACK_OFFSET, y: -5, vx: 19, vy: -1 },
            lowerA = { x: ATTACK_OFFSET, y: 5, vx: 19, vy: 1 };
        var upperB = { x: ATTACK_OFFSET - 4, y: -10, vx: 18.5, vy: -2 },
            lowerB = { x: ATTACK_OFFSET - 4, y: 10, vx: 18.5, vy: 2 };
        var upperC = { x: ATTACK_OFFSET - 4, y: -15, vx: 17, vy: -4 },
            lowerC = { x: ATTACK_OFFSET - 4, y: 15, vx: 18, vy: 4 };
        var upperD = { x: ATTACK_OFFSET - 10, y: -20, vx: 15, vy: -6 },
            lowerD = { x: ATTACK_OFFSET - 10, y: 20, vx: 15, vy: 6 };
        var upperE = { x: ATTACK_OFFSET - 10, y: -25, vx: 15, vy: -6 },
            lowerE = { x: ATTACK_OFFSET - 10, y: 25, vx: 15, vy: 6 };
        var blastPattern = [[middleShot], [upperA, lowerA], [upperB, middleShot, lowerB], [upperC, upperA, lowerA, lowerC], [upperD, upperB, middleShot, lowerB, lowerD], [upperE, upperC, upperA, lowerA, lowerC, lowerE]][tripleRates];
        var scale = 1 + powers + triplePowers / 2;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = blastPattern[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var blastOffsets = _step.value;

                var blast = createAttack(ATTACK_BLAST, {
                    damage: 1 + triplePowers,
                    left: player.sprite.left + player.sprite.vx + player.sprite.width,
                    xOffset: ATTACK_OFFSET,
                    yOffset: 0,
                    vx: blastOffsets.vx,
                    vy: blastOffsets.vy,
                    delay: 2,
                    playerIndex: playerIndex
                });
                blast.width *= scale;
                blast.height *= scale;
                blast.top = player.sprite.top + player.sprite.vy + Math.round((player.sprite.height - blast.height) / 2);
                state = addPlayerAttackToState(state, blast);
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

        return state;
    }
};

var _require4 = require('attacks'),
    createAttack = _require4.createAttack,
    addPlayerAttackToState = _require4.addPlayerAttackToState;

var _require5 = require('enemies'),
    getEnemyHitBox = _require5.getEnemyHitBox,
    damageEnemy = _require5.damageEnemy;

},{"Rectangle":1,"animations":2,"attacks":5,"enemies":10,"gameConstants":11,"heroes":12}],15:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _require = require('gameConstants'),
    ATTACK_OFFSET = _require.ATTACK_OFFSET,
    SHOT_COOLDOWN = _require.SHOT_COOLDOWN,
    ATTACK_SPRAY_UP = _require.ATTACK_SPRAY_UP,
    ATTACK_SPRAY_RIGHT = _require.ATTACK_SPRAY_RIGHT,
    ATTACK_SPRAY_DOWN = _require.ATTACK_SPRAY_DOWN,
    ATTACK_SLASH = _require.ATTACK_SLASH,
    EFFECT_DEAD_MOTH = _require.EFFECT_DEAD_MOTH,
    EFFECT_SWITCH_MOTH = _require.EFFECT_SWITCH_MOTH,
    HERO_MOTH = _require.HERO_MOTH,
    LOOT_ATTACK_POWER = _require.LOOT_ATTACK_POWER,
    LOOT_ATTACK_SPEED = _require.LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_POWER = _require.LOOT_TRIPLE_POWER,
    LOOT_TRIPLE_RATE = _require.LOOT_TRIPLE_RATE,
    LOOT_COMBO = _require.LOOT_COMBO,
    LOOT_TRIPLE_COMBO = _require.LOOT_TRIPLE_COMBO;

var _require2 = require('animations'),
    requireImage = _require2.requireImage,
    r = _require2.r,
    createAnimation = _require2.createAnimation;

var _require3 = require('heroes'),
    heroesData = _require3.heroesData,
    updatePlayer = _require3.updatePlayer;

var mothHitBox = { left: 27, top: 10, width: 48, height: 40 };
var mothRectangle = r(88, 56, { hitBox: mothHitBox });
var mothAnimation = {
    frames: [_extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/moth1.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/moth2.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/moth3.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/moth4.png') })],
    frameDuration: 3
};
var mothEnterAnimation = createAnimation('gfx/heroes/moth/mothflyin1.png', mothRectangle);
var mothCatchAnimation = createAnimation('gfx/heroes/moth/mothflyin2.png', mothRectangle);
var mothMeleeAnimation = {
    frames: [_extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothm1.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothm2.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothm3.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothm4.png') })],
    frameDuration: 3
};

heroesData[HERO_MOTH] = {
    animation: mothAnimation,
    enterAnimation: mothEnterAnimation,
    catchAnimation: mothCatchAnimation,
    meleeAnimation: mothMeleeAnimation,
    specialAnimation: {
        frames: [_extends({}, r(88, 56), { image: requireImage('gfx/heroes/moth/mothspecial1.png') }), _extends({}, r(88, 56), { image: requireImage('gfx/heroes/moth/mothspecial2.png') }), _extends({}, r(88, 56), { image: requireImage('gfx/heroes/moth/mothspecial3.png') }), _extends({}, r(88, 56), { image: requireImage('gfx/heroes/moth/mothspecial4.png') })],
        frameDuration: 6
    },
    meleeAttack: ATTACK_SLASH,
    deathEffect: EFFECT_DEAD_MOTH,
    deathSfx: 'sfx/exclamation2.mp3',
    specialSfx: 'activateInvisibility',
    switchEffect: EFFECT_SWITCH_MOTH,
    portraitAnimation: createAnimation('gfx/heroes/moth/mothportrait.png', r(17, 18)),
    defeatedPortraitAnimation: createAnimation('gfx/heroes/moth/mothportraitdead.png', r(17, 18)),
    baseSpeed: 6,
    meleePower: 1,
    meleeScaling: 0.5,
    hudColor: '#B0B0B0',
    specialCost: 10,
    applySpecial: function applySpecial(state, playerIndex) {
        var player = state.players[playerIndex];
        if (player.specialFrames < 6 * 4) {
            return updatePlayer(state, playerIndex, { specialFrames: player.specialFrames + 1 });
        }
        return updatePlayer(state, playerIndex, { usingSpecial: false, invulnerableFor: 4000 });
    },

    shotCooldown: 16,
    shoot: function shoot(state, playerIndex) {
        var player = state.players[playerIndex];
        var attackSpeedPowers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO;
        }).length;
        var shotCooldown = (this.shotCooldown || SHOT_COOLDOWN) - attackSpeedPowers;
        state = updatePlayer(state, playerIndex, { shotCooldown: shotCooldown });
        player = state.players[playerIndex];
        var powers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO;
        }).length;
        var triplePowers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO;
        }).length;
        var tripleRates = player.powerups.filter(function (powerup) {
            return powerup === LOOT_TRIPLE_RATE || powerup === LOOT_TRIPLE_COMBO;
        }).length;
        var scale = 1.5 + triplePowers / 2;
        // This maxes out at 13 bullets.
        var numBullets = 3 + 2 * powers;
        // This is between ~PI/4 and PI/2
        var minAngle = -Math.PI / 6 - numBullets * Math.PI / 96;
        var angleBetween = 2 * -minAngle / 3;
        for (var i = 0; i < numBullets; i++) {
            var theta = minAngle + angleBetween * (i % 3 + Math.random());
            var vx = (3 * tripleRates + 7 + 2 * Math.floor(i / 3)) * Math.cos(theta);
            var vy = (3 * tripleRates + 7 + 2 * Math.floor(i / 3)) * Math.sin(theta);
            var type = ATTACK_SPRAY_RIGHT;
            if (theta > Math.PI / 12) type = ATTACK_SPRAY_DOWN;else if (theta < -Math.PI / 12) type = ATTACK_SPRAY_UP;
            var blast = createAttack(type, {
                damage: 1 + triplePowers,
                left: player.sprite.left + player.sprite.vx + player.sprite.width,
                xOffset: ATTACK_OFFSET,
                yOffset: 0,
                vx: vx,
                vy: vy,
                delay: 2,
                playerIndex: playerIndex,
                ttl: 20,
                piercing: true
            });
            blast.width *= scale;
            blast.height *= scale;
            blast.top = player.sprite.top + player.sprite.vy + Math.round((player.sprite.height - blast.height) / 2);
            state = addPlayerAttackToState(state, blast);
        }
        return state;
    }
};

var _require4 = require('attacks'),
    createAttack = _require4.createAttack,
    addPlayerAttackToState = _require4.addPlayerAttackToState;

},{"animations":2,"attacks":5,"gameConstants":11,"heroes":12}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _KEY_MAPPINGS, _GAME_PAD_MAPPINGS;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* global navigator */
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
var KEY_X = exports.KEY_X = 'X'.charCodeAt(0);
var KEY_C = exports.KEY_C = 'C'.charCodeAt(0);
var KEY_V = exports.KEY_V = 'V'.charCodeAt(0);

var KEY_MAPPINGS = (_KEY_MAPPINGS = {}, _defineProperty(_KEY_MAPPINGS, 'A'.charCodeAt(0), KEY_LEFT), _defineProperty(_KEY_MAPPINGS, 'D'.charCodeAt(0), KEY_RIGHT), _defineProperty(_KEY_MAPPINGS, 'W'.charCodeAt(0), KEY_UP), _defineProperty(_KEY_MAPPINGS, 'S'.charCodeAt(0), KEY_DOWN), _KEY_MAPPINGS);

// This mapping assumes a canonical gamepad setup as seen in:
// https://w3c.github.io/gamepad/#remapping
// Which seems to work well with my xbox 360 controller.
// I based this code on examples from:
// https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
// Easy to find mappings at: http://html5gamepad.com/
var GAME_PAD_MAPPINGS = (_GAME_PAD_MAPPINGS = {}, _defineProperty(_GAME_PAD_MAPPINGS, KEY_C, 0), _defineProperty(_GAME_PAD_MAPPINGS, KEY_V, 1), _defineProperty(_GAME_PAD_MAPPINGS, KEY_SPACE, 2), _defineProperty(_GAME_PAD_MAPPINGS, KEY_X, 3), _defineProperty(_GAME_PAD_MAPPINGS, KEY_ENTER, 9), _defineProperty(_GAME_PAD_MAPPINGS, KEY_UP, 12), _defineProperty(_GAME_PAD_MAPPINGS, KEY_DOWN, 13), _defineProperty(_GAME_PAD_MAPPINGS, KEY_LEFT, 14), _defineProperty(_GAME_PAD_MAPPINGS, KEY_RIGHT, 15), _defineProperty(_GAME_PAD_MAPPINGS, KEY_R, 4), _defineProperty(_GAME_PAD_MAPPINGS, KEY_SHIFT, 5), _GAME_PAD_MAPPINGS);

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

},{}],17:[function(require,module,exports){
'use strict';

var _lootData;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('draw'),
    drawImage = _require.drawImage,
    drawTintedImage = _require.drawTintedImage;

var random = require('random');
var Rectangle = require('Rectangle');

var _require2 = require('gameConstants'),
    TEST_ITEMS = _require2.TEST_ITEMS,
    FRAME_LENGTH = _require2.FRAME_LENGTH,
    WIDTH = _require2.WIDTH,
    GAME_HEIGHT = _require2.GAME_HEIGHT,
    MAX_ENERGY = _require2.MAX_ENERGY,
    HERO_BEE = _require2.HERO_BEE,
    HERO_DRAGONFLY = _require2.HERO_DRAGONFLY,
    HERO_MOTH = _require2.HERO_MOTH,
    LOOT_COIN = _require2.LOOT_COIN,
    LOOT_LIFE = _require2.LOOT_LIFE,
    LOOT_NORMAL_LADYBUG = _require2.LOOT_NORMAL_LADYBUG,
    LOOT_LIGHTNING_LADYBUG = _require2.LOOT_LIGHTNING_LADYBUG,
    LOOT_PENETRATING_LADYBUG = _require2.LOOT_PENETRATING_LADYBUG,
    LOOT_SPEED = _require2.LOOT_SPEED,
    LOOT_ATTACK_POWER = _require2.LOOT_ATTACK_POWER,
    LOOT_ATTACK_SPEED = _require2.LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_SPEED = _require2.LOOT_TRIPLE_SPEED,
    LOOT_TRIPLE_POWER = _require2.LOOT_TRIPLE_POWER,
    LOOT_TRIPLE_RATE = _require2.LOOT_TRIPLE_RATE,
    LOOT_COMBO = _require2.LOOT_COMBO,
    LOOT_TRIPLE_COMBO = _require2.LOOT_TRIPLE_COMBO,
    LOOT_PORTAL = _require2.LOOT_PORTAL,
    LOOT_HELMET = _require2.LOOT_HELMET,
    EFFECT_RATE_UP = _require2.EFFECT_RATE_UP,
    EFFECT_SIZE_UP = _require2.EFFECT_SIZE_UP,
    EFFECT_SPEED_UP = _require2.EFFECT_SPEED_UP,
    ENEMY_CARGO_BEETLE = _require2.ENEMY_CARGO_BEETLE;

var _require3 = require('animations'),
    getFrame = _require3.getFrame,
    createAnimation = _require3.createAnimation,
    r = _require3.r,
    coinAnimation = _require3.coinAnimation,
    powerupDiamondAnimation = _require3.powerupDiamondAnimation,
    powerupTriangleAnimation = _require3.powerupTriangleAnimation,
    powerupSquareAnimation = _require3.powerupSquareAnimation,
    powerupTripleDiamondAnimation = _require3.powerupTripleDiamondAnimation,
    powerupTripleSquareAnimation = _require3.powerupTripleSquareAnimation,
    powerupTripleTriangleAnimation = _require3.powerupTripleTriangleAnimation,
    powerupComboAnimation = _require3.powerupComboAnimation,
    powerupTripleComboAnimation = _require3.powerupTripleComboAnimation;

var _require4 = require('sprites'),
    getNewSpriteState = _require4.getNewSpriteState,
    getTargetVector = _require4.getTargetVector;

var helmetAnimation = createAnimation('gfx/items/helmet.png', r(17, 18));

var circleAcceleration = function circleAcceleration(state, lootIndex) {
    var _state$loot$lootIndex = state.loot[lootIndex],
        vx = _state$loot$lootIndex.vx,
        vy = _state$loot$lootIndex.vy,
        animationTime = _state$loot$lootIndex.animationTime,
        radius = _state$loot$lootIndex.radius;

    var theta = animationTime / 300;
    radius = radius || 2;
    vx = radius * Math.cos(theta);
    vy = radius * Math.sin(theta);
    return updateLoot(state, lootIndex, { vx: vx, vy: vy });
};

var drawNormal = function drawNormal(context, state, loot) {
    var frame = getFrame(lootData[loot.type].animation, loot.animationTime);
    drawImage(context, frame.image, frame, loot);
};
var drawGlowing = function drawGlowing(context, state, loot) {
    var frame = getFrame(lootData[loot.type].animation, loot.animationTime);
    drawTintedImage(context, frame.image, 'white', .5 + .5 * Math.cos(loot.animationTime / 50), frame, loot);
};
var getCombinedType = function getCombinedType(powerups) {
    if (powerups.length < 3) return null;
    var typeA = powerups[powerups.length - 1],
        typeB = powerups[powerups.length - 2],
        typeC = powerups[powerups.length - 3];
    if (typeA === LOOT_ATTACK_POWER && typeB === LOOT_ATTACK_POWER && typeC === LOOT_ATTACK_POWER) {
        return LOOT_TRIPLE_POWER;
    }
    if (typeA === LOOT_ATTACK_SPEED && typeB === LOOT_ATTACK_SPEED && typeC === LOOT_ATTACK_SPEED) {
        return LOOT_TRIPLE_RATE;
    }
    if (typeA === LOOT_SPEED && typeB === LOOT_SPEED && typeC === LOOT_SPEED) {
        return LOOT_TRIPLE_SPEED;
    }
    if (typeA === LOOT_COMBO && typeB === LOOT_COMBO && typeC === LOOT_COMBO) {
        return LOOT_TRIPLE_COMBO;
    }
    var comboArray = [typeA, typeB, typeC];
    if (comboArray.includes(LOOT_ATTACK_SPEED) && comboArray.includes(LOOT_ATTACK_POWER) && comboArray.includes(LOOT_SPEED)) {
        return LOOT_COMBO;
    }
    if (comboArray.includes(LOOT_TRIPLE_RATE) && comboArray.includes(LOOT_TRIPLE_POWER) && comboArray.includes(LOOT_TRIPLE_SPEED)) {
        return LOOT_TRIPLE_COMBO;
    }
    return null;
};

var powerupLoot = function powerupLoot(type, animation, effectType) {
    return {
        animation: animation,
        // accelerate: circleAcceleration,
        collect: function collect(state, playerIndex, loot) {
            var powerups = [].concat(_toConsumableArray(state.players[playerIndex].powerups), [type]);
            if (powerups.length > 5) powerups.shift();
            var comboType = getCombinedType(powerups);
            if (comboType) {
                powerups.pop();
                powerups.pop();
                powerups.pop();
                powerups.push(comboType);
                // The combo can combine again for the triple combo powerup.
                comboType = getCombinedType(powerups);
                if (comboType) {
                    powerups.pop();
                    powerups.pop();
                    powerups.pop();
                    powerups.push(comboType);
                }
            }
            if (effectType) {
                var powerupText = createEffect(effectType);
                powerupText.left = loot.left + (loot.width - powerupText.width) / 2;
                powerupText.top = loot.top + (loot.height - powerupText.height) / 2;
                state = addEffectToState(state, powerupText);
            }
            return updatePlayer(state, playerIndex, { powerups: powerups });
        },
        draw: function draw(context, state, loot) {
            if (getCombinedType([].concat(_toConsumableArray(state.players[0].powerups), [type]))) {
                drawGlowing(context, state, loot);
            } else {
                drawNormal(context, state, loot);
            }
        },

        // draw: drawGlowing,
        collectSfx: 'sfx/powerup.mp3',
        props: {
            scale: 1
        }
    };
};

var triplePowerupLoot = function triplePowerupLoot(type, animation) {
    return {
        animation: animation,
        // accelerate: circleAcceleration,
        collect: function collect(state, playerIndex) {
            var powerups = [].concat(_toConsumableArray(state.players[playerIndex].powerups), [type]);
            if (powerups.length > 5) powerups.shift();
            return updatePlayer(state, playerIndex, { powerups: powerups });
        },

        collectSfx: 'sfx/powerup.mp3',
        props: {
            scale: 1
        }
    };
};

function ladybugPowerup(animation, color) {
    return {
        animation: animation,
        accelerate: circleAcceleration,
        collect: collectLadybug,
        draw: drawGlowing,
        collectSfx: 'sfx/powerup.mp3',
        props: {
            scale: 1,
            color: color
        }
    };
}
function collectLadybug(state, playerIndex, loot) {
    var ladybugs = [].concat(_toConsumableArray(state.players[playerIndex].ladybugs), [getNewSpriteState(_extends({}, ladybugAnimation.frames[0], {
        type: loot.type,
        color: loot.color,
        left: loot.left + loot.width / 2 - ladybugAnimation.frames[0].width / 2,
        top: loot.top + loot.height / 2 - ladybugAnimation.frames[0].height / 2
    }))]);
    if (ladybugs.length > 3) ladybugs.shift();
    return updatePlayer(state, playerIndex, { ladybugs: ladybugs });
}

var portalAnimation = createAnimation('gfx/scene/portal/portal.png', r(50, 80), { rows: 6, duration: 8 }, { loopFrame: 3 });

var lootData = (_lootData = {}, _defineProperty(_lootData, LOOT_COIN, {
    animation: coinAnimation,
    accelerate: function accelerate(state, lootIndex) {
        if (!state.players[0].relics[LOOT_HELMET]) {
            return state;
        }

        var _getTargetVector = getTargetVector(state.loot[lootIndex], state.players[0].sprite),
            dx = _getTargetVector.dx,
            dy = _getTargetVector.dy;

        var mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > 200) return state;
        return updateLoot(state, lootIndex, { vx: 20 * dx / mag, vy: 20 * dy / mag });
    },
    collect: function collect(state, playerIndex, loot) {
        var comboScore = Math.min(1000, state.players[playerIndex].comboScore + loot.comboPoints);
        state = updatePlayer(state, playerIndex, { comboScore: comboScore });
        return gainPoints(state, playerIndex, loot.points);
    },

    collectSfx: 'sfx/coin.mp3',
    props: {
        scale: 2,
        comboPoints: 20,
        points: 50
    }
}), _defineProperty(_lootData, LOOT_LIFE, {
    animation: createAnimation('gfx/items/goldenheart.png', r(17, 18)),
    accelerate: circleAcceleration,
    collect: function collect(state, playerIndex) {
        var _updatePlayer;

        var player = state.players[playerIndex];
        // Set all heroes to max energy. This revives them if they were defeated.
        return updatePlayer(state, playerIndex, (_updatePlayer = {}, _defineProperty(_updatePlayer, HERO_BEE, _extends({}, player[HERO_BEE], { energy: MAX_ENERGY })), _defineProperty(_updatePlayer, HERO_DRAGONFLY, _extends({}, player[HERO_DRAGONFLY], { energy: MAX_ENERGY })), _defineProperty(_updatePlayer, HERO_MOTH, _extends({}, player[HERO_MOTH], { energy: MAX_ENERGY })), _updatePlayer));
    },

    draw: drawGlowing,
    collectSfx: 'sfx/heal.mp3',
    props: {
        scale: 1
    }
}), _defineProperty(_lootData, LOOT_NORMAL_LADYBUG, ladybugPowerup(createAnimation('gfx/items/ladybugicon.png', r(30, 15)), 'red')), _defineProperty(_lootData, LOOT_LIGHTNING_LADYBUG, ladybugPowerup(createAnimation('gfx/items/ladybugblue.png', r(30, 15)), '#4860A0')), _defineProperty(_lootData, LOOT_PENETRATING_LADYBUG, ladybugPowerup(createAnimation('gfx/items/ladybugorange.png', r(30, 15)), '#FFB008')), _defineProperty(_lootData, LOOT_HELMET, {
    animation: helmetAnimation,
    accelerate: circleAcceleration,
    collect: function collect(state, playerIndex, loot) {
        var props = {
            relics: _extends({}, state.players[playerIndex].relics, _defineProperty({}, loot.type, true))
        };
        return updatePlayer(state, playerIndex, props);
    },

    draw: drawGlowing,
    collectSfx: 'sfx/powerup.mp3',
    props: {
        scale: 2
    }
}), _defineProperty(_lootData, LOOT_ATTACK_POWER, powerupLoot(LOOT_ATTACK_POWER, powerupSquareAnimation, EFFECT_SIZE_UP)), _defineProperty(_lootData, LOOT_ATTACK_SPEED, powerupLoot(LOOT_ATTACK_SPEED, powerupDiamondAnimation, EFFECT_RATE_UP)), _defineProperty(_lootData, LOOT_SPEED, powerupLoot(LOOT_SPEED, powerupTriangleAnimation, EFFECT_SPEED_UP)), _defineProperty(_lootData, LOOT_TRIPLE_SPEED, triplePowerupLoot(LOOT_TRIPLE_SPEED, powerupTripleTriangleAnimation, EFFECT_SPEED_UP)), _defineProperty(_lootData, LOOT_TRIPLE_POWER, triplePowerupLoot(LOOT_TRIPLE_POWER, powerupTripleSquareAnimation, EFFECT_SIZE_UP)), _defineProperty(_lootData, LOOT_TRIPLE_RATE, triplePowerupLoot(LOOT_TRIPLE_RATE, powerupTripleDiamondAnimation, EFFECT_RATE_UP)), _defineProperty(_lootData, LOOT_COMBO, triplePowerupLoot(LOOT_COMBO, powerupComboAnimation)), _defineProperty(_lootData, LOOT_TRIPLE_COMBO, triplePowerupLoot(LOOT_TRIPLE_COMBO, powerupTripleComboAnimation)), _defineProperty(_lootData, LOOT_PORTAL, {
    animation: portalAnimation,
    accelerate: function accelerate(state, lootIndex) {
        // play the portal sfx periodically while it is on the screen.
        if (state.loot[lootIndex].animationTime % 2000 === 0) {
            return _extends({}, state, { sfx: _extends({}, state.sfx, { 'sfx/portal.mp3+0+5': true }) });
        }
        return state;
    },
    collect: function collect(state) {
        return enterStarWorld(state);
    },

    collectSfx: 'sfx/portaltravel.mp3',
    props: {
        scale: 1,
        sfx: 'sfx/portal.mp3'
    }
}), _lootData);
var createLoot = function createLoot(type, props) {
    var lootInfo = lootData[type];
    var frame = lootInfo.animation.frames[0];
    return getNewSpriteState(_extends({}, new Rectangle(frame).scale(props && props.scale || lootInfo.props && lootInfo.props.scale || 1), {
        type: type
    }, lootInfo.props, props));
};

var addLootToState = function addLootToState(state, loot) {
    var sfx = state.sfx;
    if (loot.sfx) sfx = _extends({}, sfx, _defineProperty({}, loot.sfx, true));
    return _extends({}, state, { newLoot: [].concat(_toConsumableArray(state.newLoot), [loot]), sfx: sfx });
};

var renderLoot = function renderLoot(context, state, loot) {
    if (lootData[loot.type].draw) lootData[loot.type].draw(context, state, loot);else drawNormal(context, state, loot);
};

var updateLoot = function updateLoot(state, lootIndex, props) {
    var loot = [].concat(_toConsumableArray(state.loot));
    loot[lootIndex] = _extends({}, loot[lootIndex], props);
    return _extends({}, state, { loot: loot });
};

var advanceLoot = function advanceLoot(state, lootIndex) {
    var _state$loot$lootIndex2 = state.loot[lootIndex],
        left = _state$loot$lootIndex2.left,
        top = _state$loot$lootIndex2.top,
        width = _state$loot$lootIndex2.width,
        vx = _state$loot$lootIndex2.vx,
        vy = _state$loot$lootIndex2.vy,
        animationTime = _state$loot$lootIndex2.animationTime,
        type = _state$loot$lootIndex2.type;

    var data = lootData[type];
    left += vx - state.world.vx;
    top += vy + state.world.vy;
    animationTime += FRAME_LENGTH;
    var done = left + width < 0;
    state = updateLoot(state, lootIndex, { left: left, top: top, animationTime: animationTime, done: done });
    if (data.accelerate) {
        state = data.accelerate(state, lootIndex);
    }
    return state;
};

var advanceAllLoot = function advanceAllLoot(state) {
    for (var i = 0; i < state.loot.length; i++) {
        state = advanceLoot(state, i);
        var loot = state.loot[i];
        if (loot.done) continue;
        for (var j = 0; j < state.players.length; j++) {
            if (state.players[j].done || state.players[j].spawning) continue;
            if (Rectangle.collision(loot, getHeroHitBox(state.players[j]))) {
                state = collectLoot(state, j, i);
            }
        }
    }
    state.loot = state.loot.filter(function (loot) {
        return !loot.done;
    });
    return state;
};

var powerupTypes = [LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED, LOOT_SPEED];
var ladybugTypes = [LOOT_NORMAL_LADYBUG, LOOT_LIGHTNING_LADYBUG, LOOT_PENETRATING_LADYBUG];

/*
1: If they are missing a character, it always drops an extra character. Otherwise...
2: If they have no(or maybe only 1) powerups, drop a random of the 3 main powerups. Otherwise...
3: If they have 0 ladybugs, it drops a ladybug. Otherwise...
4: If they don't have a full powerup bar, it drops a random of the main 3 powerups. Otherwise...
5: If they only have 1 ladybug, it drops a ladybug. Otherwise...
6: Drops a random of the main 3 powerups.*/
var getAdaptivePowerupType = function getAdaptivePowerupType(state) {
    if (TEST_ITEMS) return random.element(TEST_ITEMS);
    //if (!state.players[0].relics[LOOT_HELMET]) return LOOT_HELMET;
    if (getComboMultiplier(state, 0) === 5 && !state.players[0].relics[LOOT_HELMET]) return LOOT_PORTAL;
    // return Math.random() < .5 ? LOOT_COMBO : LOOT_TRIPLE_COMBO;
    if (state.players[0].powerups.length < 1) return random.element(powerupTypes);
    if (state.players[0].ladybugs.length < 1) return LOOT_NORMAL_LADYBUG;
    if (state.players[0].powerups.length < 3) return random.element(powerupTypes);
    if (state.players[0].ladybugs.length < 2) return random.element(ladybugTypes);
    if (state.players[0].powerups.length < 5) return random.element(powerupTypes);
    if (state.players[0].ladybugs.length < 3) return random.element(ladybugTypes);
    if (Math.random() < 1 / 10) return LOOT_LIFE;
    if (Math.random() < 1 / 5) return random.element(ladybugTypes);
    return random.element(powerupTypes);
};

var getComboMultiplier = function getComboMultiplier(state, playerIndex) {
    var comboScore = state.players[playerIndex].comboScore;
    if (comboScore >= 1000) return 5;
    if (comboScore >= 600) return 4;
    if (comboScore >= 300) return 3;
    if (comboScore >= 150) return 2;
    if (comboScore >= 50) return 1.5;
    return 1;
};

var powerupGoals = [500, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 10000];

var gainPoints = function gainPoints(state, playerIndex, points) {
    points *= getComboMultiplier(state, playerIndex);
    var score = state.players[playerIndex].score + points;
    var powerupPoints = state.players[playerIndex].powerupPoints + points;
    var powerupIndex = state.players[playerIndex].powerupIndex;
    if (powerupPoints >= powerupGoals[powerupIndex]) {
        powerupPoints -= powerupGoals[powerupIndex];
        powerupIndex = Math.min(powerupIndex + 1, powerupGoals.length - 1);
        var cargoBeetle = createEnemy(ENEMY_CARGO_BEETLE, {
            left: WIDTH + 10,
            top: GAME_HEIGHT / 6 + Math.floor(Math.random() * 2 * GAME_HEIGHT / 3)
        });
        cargoBeetle.top -= cargoBeetle.height / 2;
        state = addEnemyToState(state, cargoBeetle);
    }
    state = updatePlayer(state, playerIndex, { score: score, powerupPoints: powerupPoints, powerupIndex: powerupIndex });
    return state;
};

var collectLoot = function collectLoot(state, playerIndex, lootIndex) {
    var loot = state.loot[lootIndex];
    var lootInfo = lootData[loot.type];
    state = lootInfo.collect(state, playerIndex, loot);
    state = _extends({}, state, { loot: [].concat(_toConsumableArray(state.loot)) });
    state.loot[lootIndex] = _extends({}, loot, { done: true });
    if (lootInfo.collectSfx) {
        state = _extends({}, state, { sfx: _extends({}, state.sfx, _defineProperty({}, lootInfo.collectSfx, true)) });
    }
    return state;
};

module.exports = {
    lootData: lootData,
    createLoot: createLoot,
    addLootToState: addLootToState,
    advanceAllLoot: advanceAllLoot,
    renderLoot: renderLoot,
    gainPoints: gainPoints,
    getAdaptivePowerupType: getAdaptivePowerupType,
    getComboMultiplier: getComboMultiplier,
    collectLoot: collectLoot,
    powerupGoals: powerupGoals,
    helmetAnimation: helmetAnimation,
    ladybugTypes: ladybugTypes
};

// Move possible circular imports to after exports.

var _require5 = require('enemies'),
    addEnemyToState = _require5.addEnemyToState,
    createEnemy = _require5.createEnemy;

var _require6 = require('heroes'),
    updatePlayer = _require6.updatePlayer,
    getHeroHitBox = _require6.getHeroHitBox,
    ladybugAnimation = _require6.ladybugAnimation;

var _require7 = require('effects'),
    createEffect = _require7.createEffect,
    addEffectToState = _require7.addEffectToState;

var _require8 = require('areas/stars'),
    enterStarWorld = _require8.enterStarWorld;

},{"Rectangle":1,"animations":2,"areas/stars":4,"draw":7,"effects":8,"enemies":10,"gameConstants":11,"heroes":12,"random":18,"sprites":21}],18:[function(require,module,exports){
"use strict";

module.exports = {
    /**
     * @param {Number} min  The smallest returned value
     * @param {Number} max  The largest returned value
     */
    range: function range(A, B) {
        var min = Math.min(A, B);
        var max = Math.max(A, B);
        return Math.floor(Math.random() * (max + 1 - min)) + min;
    },


    /**
     * @param {Array} array  The array of elements to return random element from
     */
    element: function element(collection) {
        if (collection.constructor == Object) {
            var keys = Object.keys(collection);
            return collection[this.element(keys)];
        }
        if (collection.constructor == Array) {
            return collection[this.range(0, collection.length - 1)];
        }
        console.log("Warning @ Random.element: " + collection + " is neither Array or Object");
        return null;
    },


    /**
     * @param {Array} array  The array of elements to return random element from
     */
    removeElement: function removeElement(collection) {
        if (collection.constructor == Object) {
            var keys = Object.keys(collection);
            var key = this.element(keys);
            var value = collection[key];
            delete collection[key];
            return value;
        }
        if (collection.constructor == Array) {
            var spliced = collection.splice(this.range(0, collection.length - 1), 1);
            return spliced[0];
        }
        console.log("Warning @ Random.removeElement: " + collection + " is neither Array or Object");
        return null;
    },


    /**
     * Shuffles an array.
     *
     * Knuth algorithm found at:
     * http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
     *
     * @param {Array} array  The array of elements to shuffle
     */
    shuffle: function shuffle(array) {
        array = array.slice();
        var currentIndex = array.length,
            temporaryValue,
            randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }
};

},{}],19:[function(require,module,exports){
'use strict';

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    HEIGHT = _require.HEIGHT,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    LOOT_HELMET = _require.LOOT_HELMET,
    MAX_ENERGY = _require.MAX_ENERGY;

var Rectangle = require('Rectangle');

var _require2 = require('draw'),
    drawImage = _require2.drawImage,
    embossText = _require2.embossText;

var _require3 = require('sounds'),
    playSound = _require3.playSound,
    playTrack = _require3.playTrack,
    stopTrack = _require3.stopTrack;

var _require4 = require('keyboard'),
    isKeyDown = _require4.isKeyDown,
    KEY_SHIFT = _require4.KEY_SHIFT,
    KEY_R = _require4.KEY_R;

var _require5 = require('animations'),
    requireImage = _require5.requireImage,
    r = _require5.r,
    createAnimation = _require5.createAnimation,
    selectNeedleImage = _require5.selectNeedleImage,
    startGameImage = _require5.startGameImage,
    optionsImage = _require5.optionsImage,
    getFrame = _require5.getFrame;

var canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
var context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
document.body.appendChild(canvas);

var HUD_PADDING = 9;

var dragonflyIdleAnimation = createAnimation('gfx/heroes/dragonfly/dragonflyidle.png', r(88, 56));

var rewindAlpha = 1;
var render = function render(state) {
    if (state.interacted && state.bgm) {
        playTrack(state.bgm, state.world.time);
        state.bgm = false;
    }
    if (state.title) return renderTitle(context, state);
    if (state.gameover) return renderGameOver(context, state);
    context.save();
    if (state.world.transitionFrames > 0) {
        var p = state.world.transitionFrames / 100;
        context.globalAlpha = 1 - p;
        context.translate(WIDTH * p * p * p, 0);
        renderBackground(context, state);
    } else {
        if (isKeyDown(KEY_R)) {
            rewindAlpha = Math.max(0.05, rewindAlpha - .06);
        } else {
            rewindAlpha = Math.min(1, rewindAlpha + .02);
        }
        context.globalAlpha = rewindAlpha;
        renderBackground(context, state);
        context.globalAlpha = 1;
    }

    context.save();
    context.translate(0, hudImage.height);
    state.enemies.map(function (enemy) {
        return renderEnemy(context, enemy);
    });
    state.playerAttacks.map(function (attack) {
        return renderAttack(context, attack);
    });
    state.loot.map(function (loot) {
        return renderLoot(context, state, loot);
    });
    state.effects.map(function (effect) {
        return renderEffect(context, effect);
    });
    state.neutralAttacks.map(function (attack) {
        return renderAttack(context, attack);
    });
    // Thinking an attack shuold display on top of other effects so it can be avoided.
    state.enemyAttacks.map(function (attack) {
        return renderAttack(context, attack);
    });
    state.players.map(function (hero) {
        return renderHero(context, hero);
    });
    context.restore();

    renderForeground(context, state);

    context.restore();

    if (state.deathCooldown > 0) stopTrack();
    if (state.deathCooldown > 0 && state.deathCooldown < 500) {
        context.save();
        context.globalAlpha = Math.cos(Math.PI / 2 * state.deathCooldown / 500);
        context.fillStyle = 'black';
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.restore();
    }
    // Render HUD on top of the screen fading to black.
    renderHUD(context, state);
    if (state.paused) {
        stopTrack();
        context.save();
        context.globalAlpha = .3;
        context.fillStyle = 'black';
        context.fillRect(0, hudImage.height, WIDTH, GAME_HEIGHT);
        context.restore();
    }
    if (state.interacted) {
        for (var sfx in state.sfx) {
            playSound(sfx);
        }
    }
    state.sfx = {};
};

var hudImage = r(800, 36, { image: requireImage('gfx/hud/newhud.png') });
var powerupBarAnimation = createAnimation('gfx/hud/powerup0.png', r(100, 19));
var comboBarAnimation = createAnimation('gfx/hud/combo0.png', r(100, 19));
var renderHUD = function renderHUD(context, state) {
    drawImage(context, hudImage.image, hudImage, hudImage);
    for (var i = 0; i < state.players[0].heroes.length; i++) {
        var heroType = state.players[0].heroes[i];
        var energy = state.players[0][heroType].energy;
        var left = HUD_PADDING + 1 + i * 20,
            top = HUD_PADDING;
        if (energy <= 0) {
            var _frame = getFrame(heroesData[heroType].defeatedPortraitAnimation, state.world.time);
            drawImage(context, _frame.image, _frame, new Rectangle(_frame).moveTo(left, top));
            var grayBlock = new Rectangle(_frame).stretch(1, Math.min(20, -energy) / 20);
            context.save();
            context.globalAlpha = 0.6;
            context.fillStyle = 'black';
            context.fillRect(left, top + _frame.height - grayBlock.height, grayBlock.width, grayBlock.height);
            context.fillStyle = 'grey';
            context.fillRect(left, top, grayBlock.width, _frame.height - grayBlock.height);
            context.restore();
        } else {
            var _frame2 = getFrame(heroesData[heroType].portraitAnimation, state.world.time);
            drawImage(context, _frame2.image, _frame2, new Rectangle(_frame2).moveTo(HUD_PADDING + 1 + i * 20, HUD_PADDING));
            /*const grayBlock = new Rectangle(frame).stretch(1, Math.max(0, MAX_ENERGY - energy) / MAX_ENERGY);
            context.save();
            context.globalAlpha = 0.6;
            context.fillStyle = 'grey';
            context.fillRect(left, top + frame.height - grayBlock.height, grayBlock.width, grayBlock.height);
            context.restore();*/
        }
        if (energy >= 0) {
            context.fillStyle = heroesData[heroType].hudColor;
            context.fillRect(90, 8 + i * 7, Math.floor(50 * energy / MAX_ENERGY), 6);
            if (energy >= heroesData[heroType].specialCost) {
                context.save();
                context.fillStyle = 'white';
                context.globalAlpha = 0.3 + 0.2 * Math.sin(state.world.time / 150);
                context.fillRect(90, 8 + i * 7, Math.floor(50 * energy / MAX_ENERGY), 6);
                context.restore();
            }
        }
    }

    context.textBaseline = 'middle';
    context.textAlign = 'left';
    context.font = "20px sans-serif";
    embossText(context, {
        text: '' + state.players[0].score,
        left: 680,
        top: HUD_PADDING + 10,
        backgroundColor: '#AAA'
    });

    var _state$players$ = state.players[0],
        powerupPoints = _state$players$.powerupPoints,
        powerupIndex = _state$players$.powerupIndex;

    var powerupBarWidth = Math.floor(98 * powerupPoints / powerupGoals[powerupIndex]);
    context.fillStyle = '#0070A0';
    var frame = getFrame(powerupBarAnimation, state.world.time);
    context.fillRect(150 + 1, 8, powerupBarWidth, frame.height);
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(150, 8));

    var comboScore = state.players[0].comboScore;
    var nextCombo = 100;
    if (comboScore < 100) {
        nextCombo = 100;
    } else if (comboScore < 200) {
        comboScore -= 100;
        nextCombo = 100;
    } else if (comboScore < 400) {
        comboScore -= 200;
        nextCombo = 200;
    } else if (comboScore < 600) {
        comboScore -= 400;
        nextCombo = 200;
    } else {
        comboScore -= 600;
        nextCombo = 400;
    }
    context.fillStyle = nextCombo === comboScore ? '#FD0' : '#AA0';
    var comboBarWidth = Math.floor(98 * comboScore / nextCombo);
    frame = getFrame(comboBarAnimation, state.world.time);
    context.fillRect(535 + 1, 8, comboBarWidth, frame.height);
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(535, 8));

    context.textBaseline = 'middle';
    context.textAlign = 'right';
    context.font = "20px sans-serif";
    embossText(context, {
        text: (isKeyDown(KEY_SHIFT) ? state.players[0].comboScore + ' ' : '') + (getComboMultiplier(state, 0) + 'x'),
        left: 530,
        top: HUD_PADDING + 10,
        backgroundColor: '#AAA'
    });

    for (var _i = 0; _i < state.players[0].powerups.length; _i++) {
        var powerupType = state.players[0].powerups[_i];
        frame = getFrame(lootData[powerupType].animation, state.players[0].sprite.animationTime);
        drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(252 + 22 * _i, 8));
    }
    if (state.players[0].relics[LOOT_HELMET]) {
        frame = getFrame(helmetAnimation, state.players[0].sprite.animationTime);
        drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(255 + 22 * 5, 8));
    }
};

var renderTitle = function renderTitle(context, state) {
    renderBackground(context, state);
    renderForeground(context, state);
    var frame = dragonflyIdleAnimation.frames[0];
    var sprite = state.players[0].sprite;
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(sprite.left, hudImage.height + sprite.top));

    var options = [startGameImage, optionsImage];
    var targets = [new Rectangle(options[0]).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2)];
    for (var i = 1; i < options.length; i++) {
        targets.push(new Rectangle(options[i]).scale(3).moveCenterTo(WIDTH / 2, targets[i - 1].top + targets[i - 1].height + 20 + 3 * options[i].height / 2));
    }
    for (var _i2 = 0; _i2 < options.length; _i2++) {
        drawImage(context, options[_i2].image, options[_i2], targets[_i2]);
    }
    var target = targets[state.titleIndex];
    drawImage(context, selectNeedleImage.image, selectNeedleImage, new Rectangle(selectNeedleImage).scale(2).moveCenterTo(WIDTH / 2 - (2 * selectNeedleImage.width + target.width) / 2 + 5 * Math.sin(Date.now() / 150) - 15, target.top + target.height / 2));
    /*drawTintedImage(context, startGameImage.image, '#f0a400', 1, startGameImage,
        new Rectangle(startGameImage).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2)
    );*/
    //drawTintedImage(context, frame.image, 'gold', .5 + .5 * Math.cos(loot.animationTime / 50), frame, loot);
    //drawImage(context, optionsImage.image, optionsImage,
    //    new Rectangle(optionsImage).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2 + startGameImage.height * 3 + 10)
    //);
    // renderForeground(state.world);
};

var gameOverImage = r(82, 30, { image: requireImage('gfx/gameover.png') });
var continueImage = r(82, 30, { image: requireImage('gfx/continue.png') });
var yesImage = r(20, 20, { image: requireImage('gfx/yes.png') });
var noImage = r(20, 20, { image: requireImage('gfx/no.png') });
function renderGameOver(context, state) {
    context.fillStyle = 'black';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    drawImage(context, gameOverImage.image, gameOverImage, new Rectangle(gameOverImage).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 5));
    drawImage(context, continueImage.image, continueImage, new Rectangle(continueImage).scale(3).moveCenterTo(WIDTH / 2, 2 * HEIGHT / 5));
    var targets = [new Rectangle(yesImage).scale(3).moveCenterTo(WIDTH / 2, 3 * HEIGHT / 5), new Rectangle(noImage).scale(3).moveCenterTo(WIDTH / 2, 4 * HEIGHT / 5)];
    drawImage(context, yesImage.image, yesImage, targets[0]);
    drawImage(context, noImage.image, noImage, targets[1]);

    var target = targets[state.continueIndex];
    drawImage(context, selectNeedleImage.image, selectNeedleImage, new Rectangle(selectNeedleImage).scale(2).moveCenterTo(WIDTH / 2 - (2 * selectNeedleImage.width + target.width) / 2 + 5 * Math.sin(Date.now() / 150) - 15, target.top + target.height / 2));

    renderHUD(context, state);
}

module.exports = render;

var _require6 = require('world'),
    renderBackground = _require6.renderBackground,
    renderForeground = _require6.renderForeground;

var _require7 = require('heroes'),
    heroesData = _require7.heroesData,
    renderHero = _require7.renderHero;

var _require8 = require('loot'),
    lootData = _require8.lootData,
    renderLoot = _require8.renderLoot,
    getComboMultiplier = _require8.getComboMultiplier,
    powerupGoals = _require8.powerupGoals,
    helmetAnimation = _require8.helmetAnimation;

var _require9 = require('enemies'),
    renderEnemy = _require9.renderEnemy;

var _require10 = require('effects'),
    renderEffect = _require10.renderEffect;

var _require11 = require('attacks'),
    renderAttack = _require11.renderAttack;

},{"Rectangle":1,"animations":2,"attacks":5,"draw":7,"effects":8,"enemies":10,"gameConstants":11,"heroes":12,"keyboard":16,"loot":17,"sounds":20,"world":23}],20:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/* globals Float32Array, clearTimeout, setTimeout, Audio, Set, Map */
var sounds = new Map();
var soundsMuted = false;

function ifdefor(value, defaultValue) {
    if (value !== undefined && !(typeof value === 'number' && isNaN(value))) {
        return value;
    }
    if (defaultValue !== undefined) {
        return defaultValue;
    }
    return null;
}

var requireSound = function requireSound(key) {
    var source = void 0,
        offset = void 0,
        volume = void 0,
        duration = void 0,
        limit = void 0;
    if (typeof key === 'string') {
        var _key$split = key.split('+');

        var _key$split2 = _slicedToArray(_key$split, 3);

        source = _key$split2[0];
        offset = _key$split2[1];
        volume = _key$split2[2];

        key = source;
    } else {
        offset = key.offset;
        volume = key.volume;
        limit = key.limit;
        source = key.source;
        key = key.key || source;
    }
    if (sounds.has(key)) return sounds.get(key);
    if (offset) {
        ;

        var _String$split$map = String(offset).split(':').map(Number);

        var _String$split$map2 = _slicedToArray(_String$split$map, 2);

        offset = _String$split$map2[0];
        duration = _String$split$map2[1];
    }var newSound = new Audio(source);
    newSound.instances = new Set();
    newSound.offset = offset || 0;
    newSound.customDuration = duration || 0;
    newSound.defaultVolume = volume || 1;
    newSound.instanceLimit = limit || 5;
    sounds.set(key, newSound);
    return newSound;
};

var playingSounds = new Set();
var playSound = function playSound(key) {
    if (soundsMuted) return;
    var source = void 0,
        offset = void 0,
        volume = void 0,
        duration = void 0;

    var _key$split3 = key.split('+');

    var _key$split4 = _slicedToArray(_key$split3, 3);

    source = _key$split4[0];
    offset = _key$split4[1];
    volume = _key$split4[2];

    key = source;
    if (offset) {
        ;

        var _offset$split = offset.split(':');

        var _offset$split2 = _slicedToArray(_offset$split, 2);

        offset = _offset$split2[0];
        duration = _offset$split2[1];
    }var sound = requireSound(key);
    // Custom sound objects just have a play and forget method on them.
    if (!(sound instanceof Audio)) {
        sound.play();
        return;
    }
    if (sound.instances.size >= sound.instanceLimit) return;
    var newInstance = sound.cloneNode(false);
    newInstance.currentTime = (ifdefor(offset || sound.offset) || 0) / 1000;
    newInstance.volume = Math.min(1, (ifdefor(volume, sound.defaultVolume) || 1) / 50);
    newInstance.play().then(function () {
        var timeoutId = void 0;
        if (duration || sound.customDuration) {
            timeoutId = setTimeout(function () {
                sound.instances.delete(newInstance);
                playingSounds.delete(newInstance);
                newInstance.onended = null;
                newInstance.pause();
            }, parseInt(duration || sound.customDuration));
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

    var _source$split = source.split('+');

    var _source$split2 = _slicedToArray(_source$split, 3);

    source = _source$split2[0];
    offset = _source$split2[1];
    volume = _source$split2[2];

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

var preloadSounds = function preloadSounds() {
    [{ source: 'sfx/shoot.mp3', volume: 2 }, 'sfx/hit.mp3+200+1', 'sfx/flydeath.mp3+0+5', 'sfx/robedeath1.mp3+0+2', 'sfx/hornetdeath.mp3+0+8', 'sfx/coin.mp3', 'sfx/powerup.mp3', 'sfx/startgame.mp3', 'sfx/exclamation.mp3+0+3', 'sfx/exclamation2.mp3+0+3', 'sfx/exclamation3.mp3+0+3', 'sfx/heal.mp3+200+5', 'sfx/death.mp3+0+1', 'sfx/dodge.mp3+200+2', 'sfx/meleehit.mp3+50+6', 'sfx/throwhit.mp3+200+5', 'sfx/needledropflip.mp3+0+3', 'sfx/needlegrab.mp3+0+3', 'sfx/portal.mp3+0+10', 'sfx/portaltravel.mp3+0+4', 'sfx/explosion.mp3+0+1', 'sfx/dash.mp3+0+1', { key: 'arclightning', source: 'sfx/fastlightning.mp3', volume: 0.3, limit: 8 }, { source: 'sfx/fastlightning.mp3', volume: 3, limit: 1 }, { source: 'sfx/dash.mp3', volume: 10, limit: 1 }, { source: 'sfx/special.mp3', volume: 3, limit: 1 }, { key: 'activateInvisibility', source: 'sfx/invisibility.mp3', volume: 1, limit: 1 }, { key: 'warnInvisibilityIsEnding', source: 'sfx/warninginvisibile.mp3', volume: 0.3, limit: 1 },
    // See credits.html for: mobbrobb.
    'bgm/river.mp3+0+1', 'bgm/area.mp3+0+2', 'bgm/space.mp3+0+2', 'bgm/boss.mp3+0+2'].forEach(requireSound);
};

var audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function makeDistortionCurve(amount) {
    var k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180,
        i = 0,
        x = void 0;
    for (; i < n_samples; ++i) {
        x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
}
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

    var audioContext = getAudioContext();
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

    var gainNode = audioContext.createGain();
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

window.playSound = playSound;

module.exports = {
    muteSounds: muteSounds,
    playSound: playSound,
    playTrack: playTrack,
    stopTrack: stopTrack,
    preloadSounds: preloadSounds
};

},{}],21:[function(require,module,exports){
"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var getNewSpriteState = function getNewSpriteState(base) {
    return _extends({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        vx: 0,
        vy: 0,
        animation: false,
        animationTime: 0
    }, base);
};

var getTargetVector = function getTargetVector(agent, target) {
    return {
        dx: target.left + (target.width || 0) / 2 - (agent.left + (agent.width || 0) / 2),
        dy: target.top + (target.height || 0) / 2 - (agent.top + (agent.height || 0) / 2)
    };
};

module.exports = {
    getNewSpriteState: getNewSpriteState,
    getTargetVector: getTargetVector
};

},{}],22:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Rectangle = require('Rectangle');

var _require = require('gameConstants'),
    FRAME_LENGTH = _require.FRAME_LENGTH,
    EFFECT_DEFLECT_BULLET = _require.EFFECT_DEFLECT_BULLET;

var _require2 = require('world'),
    applyCheckpointToState = _require2.applyCheckpointToState,
    getNewWorld = _require2.getNewWorld,
    advanceWorld = _require2.advanceWorld,
    clearSprites = _require2.clearSprites;

var getNewState = function getNewState() {
    return advanceWorld({
        idMap: {},
        players: [getNewPlayerState()],
        deathCooldown: 0,
        enemies: [],
        loot: [],
        effects: [],
        enemyCooldown: 0,
        playerAttacks: [],
        neutralAttacks: [],
        enemyAttacks: [],
        sfx: {},
        title: true,
        titleIndex: 0,
        paused: false,
        gameover: false,
        continueIndex: 0,
        world: getNewWorld(),
        bgm: 'bgm/area.mp3',
        interacted: false,
        checkpoint: null
    });
};

var TEST_TIME = 0;

var advanceState = function advanceState(state) {
    var updatedState = _extends({}, state);
    if (state.world.time < TEST_TIME) {
        state.world.time = TEST_TIME;
    }
    if (updatedState.title) {
        var titleIndex = updatedState.titleIndex;
        if (updatedState.players[0].actions.start && titleIndex === 0) {
            var world = updatedState.world;
            return _extends({}, updatedState, { title: false, world: world, bgm: world.bgm });
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
        var continueIndex = updatedState.continueIndex;
        if (updatedState.players[0].actions.start) {
            if (continueIndex === 0) {
                // Continue
                updatedState = updatePlayerOnContinue(_extends({}, updatedState, { gameover: false }), 0);
                return applyCheckpointToState(updatedState);
            } else {
                // Do not continue, back to title
                return _extends({}, getNewState(), { interacted: true });
            }
        }
        if (updatedState.players[0].actions.up) {
            continueIndex = (continueIndex + 2 - 1) % 2;
        }
        if (updatedState.players[0].actions.down) {
            continueIndex = (continueIndex + 1) % 2;
        }
        return _extends({}, updatedState, { continueIndex: continueIndex });
    }
    if (updatedState.deathCooldown > 0) {
        updatedState.deathCooldown -= FRAME_LENGTH;
        if (updatedState.deathCooldown <= 0) {
            return _extends({}, updatedState, { gameover: true, continueIndex: 0 });
        }
    }
    var _updatedState = updatedState,
        paused = _updatedState.paused;

    if (updatedState.players[0].actions.start) {
        paused = !paused;
        if (!paused) {
            var _world = updatedState.world;
            updatedState = _extends({}, updatedState, { world: _world, bgm: _world.bgm });
        }
    }
    if (paused) {
        return _extends({}, updatedState, { paused: paused });
    }
    updatedState.newEffects = [];
    updatedState.newLoot = [];
    updatedState.newEnemies = [];
    updatedState.newPlayerAttacks = [];
    updatedState.newEnemyAttacks = [];
    updatedState.newNeutralAttacks = [];
    for (var playerIndex = 0; playerIndex < updatedState.players.length; playerIndex++) {
        updatedState = advanceHero(updatedState, playerIndex);
    }
    updatedState = advanceWorld(updatedState);
    var currentPlayerAttacks = updatedState.playerAttacks.map(function (attack) {
        return advanceAttack(updatedState, attack);
    }).filter(function (attack) {
        return !attack.done;
    });
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = updatedState.enemies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var enemy = _step.value;

            enemy = updatedState.idMap[enemy.id];
            if (enemy) updatedState = advanceEnemy(updatedState, enemy);
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

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = updatedState.enemies[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _enemy = _step2.value;

            _enemy = updatedState.idMap[_enemy.id];
            if (_enemy && !_enemy.dead && enemyData[_enemy.type].shoot && _enemy.left > 0) {
                // Don't shoot while spawning.
                if (!enemyData[_enemy.type].spawnAnimation || _enemy.spawned) {
                    updatedState = enemyData[_enemy.type].shoot(updatedState, _enemy);
                }
            }
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    updatedState.sfx = _extends({}, updatedState.sfx);
    // Check for enemies hit by attacks.
    for (var i = 0; i < updatedState.enemies.length; i++) {
        var _enemy2 = updatedState.idMap[updatedState.enemies[i].id];
        if (!_enemy2) continue;
        var enemyHitBox = getEnemyHitBox(_enemy2);
        for (var j = 0; j < currentPlayerAttacks.length && _enemy2 && !_enemy2.dead && updatedState.idMap[_enemy2.id]; j++) {
            var attack = currentPlayerAttacks[j];
            if (!attack.done && !attack.hitIds[_enemy2.id] && Rectangle.collision(enemyHitBox, attack)) {
                if (enemyData[_enemy2.type].isInvulnerable && enemyData[_enemy2.type].isInvulnerable(updatedState, _enemy2)) {
                    currentPlayerAttacks[j] = _extends({}, attack, { done: !attack.piercing, hitIds: _extends({}, attack.hitIds, _defineProperty({}, _enemy2.id, true)) });
                } else {
                    currentPlayerAttacks[j] = _extends({}, attack, {
                        damage: attack.piercing ? attack.damage : attack.damage - _enemy2.life,
                        done: !attack.piercing && attack.damage - _enemy2.life <= 0,
                        hitIds: _extends({}, attack.hitIds, _defineProperty({}, _enemy2.id, true))
                    });
                }
                updatedState = damageEnemy(updatedState, _enemy2.id, attack);
                _enemy2 = updatedState.idMap[updatedState.enemies[i].id];
            }
        }
        for (var _j = 0; _j < updatedState.players.length; _j++) {
            if (!isPlayerInvulnerable(updatedState, _j) && !updatedState.players[_j].done && _enemy2 && updatedState.idMap[_enemy2.id] && !_enemy2.dead && Rectangle.collision(enemyHitBox, getHeroHitBox(updatedState.players[_j]))) {
                updatedState = damageHero(updatedState, _j);
            }
        }
    }
    currentPlayerAttacks = currentPlayerAttacks.filter(function (attack) {
        return !attack.done;
    });
    updatedState.enemies = updatedState.enemies.filter(function (enemy) {
        return updatedState.idMap[enemy.id];
    });

    // Advance enemy attacks and check for hitting the player.
    var currentEnemyAttacks = updatedState.enemyAttacks.map(function (attack) {
        return advanceAttack(updatedState, attack);
    }).filter(function (attack) {
        return !attack.done;
    });
    for (var _i = 0; _i < updatedState.players.length; _i++) {
        if (isPlayerInvulnerable(updatedState, _i)) continue;
        var playerHitBox = getHeroHitBox(updatedState.players[_i]);
        for (var _j2 = 0; _j2 < currentEnemyAttacks.length && !updatedState.players[_i].done; _j2++) {
            var _attack = currentEnemyAttacks[_j2];
            if (Rectangle.collision(playerHitBox, _attack)) {
                updatedState = damageHero(updatedState, _i);
                currentEnemyAttacks[_j2] = _extends({}, _attack, { done: true });
            }
        }
    }
    // Player melee attacks can destroy enemy projectiles.
    for (var _i2 = 0; _i2 < currentPlayerAttacks.length; _i2++) {
        var _attack2 = currentPlayerAttacks[_i2];
        if (!_attack2.melee || _attack2.done) continue;
        for (var _j3 = 0; _j3 < currentEnemyAttacks.length; _j3++) {
            var enemyAttack = currentEnemyAttacks[_j3];
            if (Rectangle.collision(_attack2, enemyAttack)) {
                currentEnemyAttacks[_j3] = _extends({}, enemyAttack, { done: true });
                var deflectEffect = createEffect(EFFECT_DEFLECT_BULLET);
                deflectEffect.left = enemyAttack.left + (enemyAttack.width - deflectEffect.width) / 2;
                deflectEffect.top = enemyAttack.top + (enemyAttack.height - deflectEffect.height) / 2;
                updatedState = addEffectToState(updatedState, deflectEffect);
            }
        }
    }
    currentEnemyAttacks = currentEnemyAttacks.filter(function (attack) {
        return !attack.done;
    });

    var currentNeutralAttacks = updatedState.neutralAttacks.map(function (attack) {
        return advanceAttack(updatedState, attack);
    }).filter(function (attack) {
        return !attack.done;
    });
    for (var _i3 = 0; _i3 < currentNeutralAttacks.length; _i3++) {
        var _attack3 = currentNeutralAttacks[_i3];
        for (var _j4 = 0; _j4 < updatedState.players.length; _j4++) {
            var player = updatedState.players[_j4];
            var playerKey = 'player' + _j4;
            if (isPlayerInvulnerable(updatedState, _j4) || _attack3.hitIds[playerKey]) continue;
            var _playerHitBox = getHeroHitBox(player);
            if (Rectangle.collision(_playerHitBox, _attack3)) {
                updatedState = damageHero(updatedState, _j4);
                currentNeutralAttacks[_i3] = _extends({}, _attack3, {
                    damage: _attack3.piercing ? _attack3.damage : _attack3.damage - 1,
                    done: !_attack3.piercing && _attack3.damage - 1 <= 0,
                    hitIds: _extends({}, _attack3.hitIds, _defineProperty({}, playerKey, true))
                });
            }
        }
        for (var _j5 = 0; _j5 < updatedState.enemies.length; _j5++) {
            var _enemy3 = updatedState.idMap[updatedState.enemies[_j5].id];
            if (!_enemy3 || _enemy3.dead || _attack3.hitIds[_enemy3.id]) continue;
            var _enemyHitBox = getEnemyHitBox(_enemy3);
            if (Rectangle.collision(_enemyHitBox, _attack3)) {
                currentNeutralAttacks[_i3] = _extends({}, _attack3, {
                    damage: _attack3.piercing ? _attack3.damage : _attack3.damage - _enemy3.life,
                    done: !_attack3.piercing && _attack3.damage - _enemy3.life <= 0,
                    hitIds: _extends({}, _attack3.hitIds, _defineProperty({}, _enemy3.id, true))
                });
                updatedState = damageEnemy(updatedState, _enemy3.id, _attack3);
            }
        }
    }
    updatedState = advanceAllLoot(updatedState);
    updatedState = advanceAllEffects(updatedState);
    // Make sure enemies array is up to date, and filter out removed enemies.
    updatedState.enemies = updatedState.enemies.map(function (enemy) {
        return updatedState.idMap[enemy.id];
    }).filter(function (enemy) {
        return enemy;
    });

    // Add new enemies/attacks.
    updatedState.enemies = [].concat(_toConsumableArray(updatedState.enemies), _toConsumableArray(updatedState.newEnemies));
    var idMap = {};
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = updatedState.enemies[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _enemy4 = _step3.value;

            idMap[_enemy4.id] = _enemy4;
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    updatedState.playerAttacks = [].concat(_toConsumableArray(currentPlayerAttacks), _toConsumableArray(updatedState.newPlayerAttacks));
    updatedState.enemyAttacks = [].concat(_toConsumableArray(currentEnemyAttacks), _toConsumableArray(updatedState.newEnemyAttacks));
    updatedState.neutralAttacks = [].concat(_toConsumableArray(currentNeutralAttacks), _toConsumableArray(updatedState.newNeutralAttacks));
    updatedState.effects = [].concat(_toConsumableArray(updatedState.effects), _toConsumableArray(updatedState.newEffects));
    updatedState.loot = [].concat(_toConsumableArray(updatedState.loot), _toConsumableArray(updatedState.newLoot));

    return _extends({}, updatedState, { idMap: idMap, paused: false });
};

var applyPlayerActions = function applyPlayerActions(state, playerIndex, actions) {
    var players = [].concat(_toConsumableArray(state.players));
    players[playerIndex] = _extends({}, players[playerIndex], { actions: actions });
    if (!state.interacted) {
        for (var i in actions) {
            if (actions[i]) return _extends({}, state, { interacted: true, players: players });
        }
    }
    return _extends({}, state, { players: players });
};

module.exports = {
    getNewState: getNewState,
    advanceState: advanceState,
    applyPlayerActions: applyPlayerActions
};

var _require3 = require('attacks'),
    advanceAttack = _require3.advanceAttack;

var _require4 = require('heroes'),
    getNewPlayerState = _require4.getNewPlayerState,
    advanceHero = _require4.advanceHero,
    getHeroHitBox = _require4.getHeroHitBox,
    damageHero = _require4.damageHero,
    isPlayerInvulnerable = _require4.isPlayerInvulnerable,
    updatePlayerOnContinue = _require4.updatePlayerOnContinue;

var _require5 = require('enemies'),
    enemyData = _require5.enemyData,
    damageEnemy = _require5.damageEnemy,
    advanceEnemy = _require5.advanceEnemy,
    getEnemyHitBox = _require5.getEnemyHitBox;

var _require6 = require('loot'),
    advanceAllLoot = _require6.advanceAllLoot;

var _require7 = require('effects'),
    createEffect = _require7.createEffect,
    addEffectToState = _require7.addEffectToState,
    advanceAllEffects = _require7.advanceAllEffects;

},{"Rectangle":1,"attacks":5,"effects":8,"enemies":10,"gameConstants":11,"heroes":12,"loot":17,"world":23}],23:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('gameConstants'),
    FRAME_LENGTH = _require.FRAME_LENGTH,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    WIDTH = _require.WIDTH,
    HEIGHT = _require.HEIGHT,
    HUD_HEIGHT = _require.HUD_HEIGHT;

var Rectangle = require('Rectangle');
var random = require('random');

var _require2 = require('draw'),
    drawImage = _require2.drawImage;

var _require3 = require('animations'),
    getFrame = _require3.getFrame;

var _require4 = require('sprites'),
    getNewSpriteState = _require4.getNewSpriteState;

var allWorlds = {};
var checkpoints = {};
window.allWorlds = allWorlds;

var getNewLayer = function getNewLayer(props) {
    return _extends({
        sprites: []
    }, props);
};

var getNewWorld = function getNewWorld() {
    return getFieldWorldStart();
};

var clearSprites = function clearSprites(state) {
    return _extends({}, state, {
        enemies: [], loot: [], effects: [], playerAttacks: [], neutralAttacks: [], enemyAttacks: [],
        newEnemies: [], newLoot: [], newEffects: [], newPlayerAttacks: [], newNeutralAttacks: [], newEnemyAttacks: []
    });
};

var addElementToLayer = function addElementToLayer(state, layerName) {
    var world = state.world;
    var layer = _extends({}, world[layerName]);
    if (!layer.spriteData) {
        return state;
    }
    var elementsData = layer.spriteData;
    var newSprite = null,
        lastSprite = layer.sprites[layer.sprites.length - 1];
    var safety = 0;
    while ((!lastSprite || lastSprite.left < WIDTH && lastSprite.next) && safety++ < 20) {
        var spriteData = lastSprite ? elementsData[random.element(lastSprite.next)] : random.element(elementsData);
        if (!spriteData) {
            // This will often happen when transitioning between area types.
            break;
        }
        var animation = spriteData.animation,
            scale = spriteData.scale;

        if (Array.isArray(animation)) {
            animation = random.element(animation);
        }
        var offset = lastSprite ? lastSprite.offset : 0;
        if (Array.isArray(offset)) {
            offset = random.element(offset);
        }
        if (lastSprite) {
            offset *= lastSprite.scale || 1;
            offset += lastSprite.left + lastSprite.width;
        }
        var yOffset = spriteData.yOffset || 0;
        if (Array.isArray(yOffset)) {
            yOffset = random.element(yOffset);
        }
        yOffset *= spriteData.scale || 1;
        newSprite = getNewSpriteState(_extends({}, animation.frames[0], {
            top: getBaseHeight(state) + layer.yOffset + yOffset,
            left: offset
        }, spriteData, {
            animation: animation
        }));
        newSprite.height *= scale;
        newSprite.width *= scale;
        newSprite.top -= newSprite.height;
        if (!lastSprite) newSprite.left -= newSprite.width / 2; // Start with the first sprite half off of the screen.
        layer.sprites = [].concat(_toConsumableArray(layer.sprites), [newSprite]);
        lastSprite = newSprite;
    }
    world = _extends({}, world, _defineProperty({}, layerName, layer));
    return _extends({}, state, { world: world });
};

function updateLayerSprite(state, layerName, spriteIndex, newProperties) {
    var sprites = [].concat(_toConsumableArray(state.world[layerName].sprites));
    sprites[spriteIndex] = _extends({}, sprites[spriteIndex], newProperties);
    var layer = _extends({}, state.world[layerName], { sprites: sprites });
    var world = _extends({}, state.world, _defineProperty({}, layerName, layer));
    return _extends({}, state, { world: world });
}

var advanceLayer = function advanceLayer(state, layerName) {
    // Check to add a new element to scroll onto the screen.
    state = addElementToLayer(state, layerName);
    var layer = _extends({}, state.world[layerName]);
    if (!layer) return state;
    if (!layer.sprites) console.log(layerName, layer);

    for (var i = 0; i < state.world[layerName].sprites.length; i++) {
        var sprite = state.world[layerName].sprites[i];
        state = updateLayerSprite(state, layerName, i, _extends({}, sprite, {
            left: sprite.left + sprite.vx - state.world.vx * layer.xFactor,
            top: sprite.top + sprite.vy + state.world.vy * layer.yFactor,
            animationTime: sprite.animationTime + FRAME_LENGTH
        }));
        sprite = state.world[layerName].sprites[i];
        if (sprite.onHit) {
            var frame = getFrame(sprite.animation, sprite.animationTime);
            var hitBox = new Rectangle(frame.hitBox || frame).scale(sprite.scale).moveTo(sprite.left, sprite.top);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = state.playerAttacks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var attack = _step.value;

                    if (Rectangle.collision(hitBox, attack)) {
                        state = sprite.onHit(state, layerName, i);
                        sprite = state.world[layerName].sprites[i];
                        break;
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
        if (sprite.onContact) {
            var _frame = getFrame(sprite.animation, sprite.animationTime);
            var _hitBox = new Rectangle(_frame.hitBox || _frame).scale(sprite.scale).moveTo(sprite.left, sprite.top);
            var player = state.players[0];
            var heroHitBox = new Rectangle(getHeroHitBox(player));
            if (Rectangle.collision(_hitBox, heroHitBox)) {
                state = sprite.onContact(state, layerName, i);
            } else {
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = state.enemies[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var enemy = _step2.value;

                        if (Rectangle.collision(_hitBox, getEnemyHitBox(enemy))) {
                            state = sprite.onContact(state, layerName, i);
                            break;
                        }
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }
        }
    }
    var sprites = state.world[layerName].sprites.filter(function (sprite) {
        return sprite.left + sprite.width > 0;
    });
    return _extends({}, state, { world: _extends({}, state.world, _defineProperty({}, layerName, _extends({}, state.world[layerName], { sprites: sprites }))) });
};

var advanceWorld = function advanceWorld(state) {
    var world = state.world;
    var _world = world,
        x = _world.x,
        y = _world.y,
        vx = _world.vx,
        vy = _world.vy,
        targetX = _world.targetX,
        targetY = _world.targetY,
        targetFrames = _world.targetFrames,
        transitionFrames = _world.transitionFrames;

    x += vx;
    y += vy;
    y = Math.max(0, y);
    if (transitionFrames > 0) {
        transitionFrames--;
    }
    targetFrames--;
    if (targetFrames >= 1) {
        var targetVx = (targetX - x) / Math.ceil(targetFrames);
        vx = (targetVx + vx) / 2;
        var targetVy = (targetY - y) / Math.ceil(targetFrames);
        vy = Math.max((targetVy + vy) / 2, -y);
    } else {
        vx = targetX - x;
        vy = Math.max(targetY - y, -y);
    }
    world = _extends({}, world, { x: x, y: y, vx: vx, vy: vy, transitionFrames: transitionFrames, targetFrames: targetFrames });
    state = _extends({}, state, { world: world });
    if (allWorlds[world.type].advanceWorld) {
        state = allWorlds[world.type].advanceWorld(state);
    }
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = state.world.bgLayerNames[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var layerName = _step3.value;
            state = advanceLayer(state, layerName);
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = state.world.mgLayerNames[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _layerName = _step4.value;
            state = advanceLayer(state, _layerName);
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }

    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
        for (var _iterator5 = state.world.fgLayerNames[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var _layerName2 = _step5.value;
            state = advanceLayer(state, _layerName2);
        }
    } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
            }
        } finally {
            if (_didIteratorError5) {
                throw _iteratorError5;
            }
        }
    }

    return state;
};

var getGroundHeight = function getGroundHeight(state) {
    // If the world has no ground layer, just return a very large number here.
    if (!state.world.ground) return 10000;
    return GAME_HEIGHT - state.world.groundHeight + state.world.y * state.world.ground.yFactor;
};

var getBaseHeight = function getBaseHeight(state) {
    return GAME_HEIGHT + state.world.y * (state.world.ground ? state.world.ground.yFactor : 1);
};

var renderBackgroundLayer = function renderBackgroundLayer(context, _ref) {
    var frame = _ref.frame,
        x = _ref.x,
        y = _ref.y,
        maxY = _ref.maxY;

    x = Math.round(x);
    y = Math.round(y);
    if (typeof maxY === 'number') {
        y = Math.min(maxY, y);
    }
    var left = x % frame.width;
    var right = (x + WIDTH) % frame.width;
    if (right <= left) {
        var leftWidth = frame.width - left;
        context.drawImage(frame.image, left, 0, leftWidth, frame.height, 0, y, leftWidth, frame.height);
        context.drawImage(frame.image, 0, 0, right, frame.height, leftWidth, y, right, frame.height);
    } else {
        context.drawImage(frame.image, left, 0, frame.width, frame.height, 0, y, frame.width, frame.height);
    }
};
// Render scenery that appear behind the main game sprites.
var renderBackground = function renderBackground(context, state) {
    // The background needs to be rendered behind the HUD so that it can cover the screen
    // even when the HUD is not rendered (for example on the title screen).
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = state.world.bgLayerNames[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var layerName = _step6.value;
            renderLayer(context, state, layerName);
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
        }
    }

    context.save();
    context.translate(0, HUD_HEIGHT);
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
        for (var _iterator7 = state.world.mgLayerNames[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var _layerName3 = _step7.value;
            renderLayer(context, state, _layerName3);
        }
    } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion7 && _iterator7.return) {
                _iterator7.return();
            }
        } finally {
            if (_didIteratorError7) {
                throw _iteratorError7;
            }
        }
    }

    context.restore();
};
// Render scenery that appears in front of the main game sprites.
var renderForeground = function renderForeground(context, state) {
    context.save();
    context.translate(0, HUD_HEIGHT);
    var _iteratorNormalCompletion8 = true;
    var _didIteratorError8 = false;
    var _iteratorError8 = undefined;

    try {
        for (var _iterator8 = state.world.fgLayerNames[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var layerName = _step8.value;
            renderLayer(context, state, layerName);
        }
    } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
                _iterator8.return();
            }
        } finally {
            if (_didIteratorError8) {
                throw _iteratorError8;
            }
        }
    }

    context.restore();
};

var renderLayer = function renderLayer(context, state, layerName) {
    var layer = state.world[layerName];
    var frame = void 0;
    if (layer.backgroundColor) {
        context.fillStyle = layer.backgroundColor;
        context.fillRect(0, 0, WIDTH, HEIGHT);
    }
    if (layer.animation) {
        frame = getFrame(layer.animation, state.world.time);
        renderBackgroundLayer(context, { frame: frame,
            x: state.world.x * layer.xFactor + (layer.xOffset || 0),
            y: state.world.y * layer.yFactor + (layer.yOffset || 0)
        });
    }
    var _iteratorNormalCompletion9 = true;
    var _didIteratorError9 = false;
    var _iteratorError9 = undefined;

    try {
        for (var _iterator9 = layer.sprites[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var sprite = _step9.value;

            frame = getFrame(sprite.animation, sprite.animationTime);
            drawImage(context, frame.image, frame, sprite);
        }
    } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion9 && _iterator9.return) {
                _iterator9.return();
            }
        } finally {
            if (_didIteratorError9) {
                throw _iteratorError9;
            }
        }
    }
};

function setCheckpoint(state, checkpoint) {
    return _extends({}, state, { checkpoint: checkpoint });
}

function applyCheckpointToState(state, checkpoint) {
    if (!checkpoint) checkpoint = state.checkpoint || CHECK_POINT_FIELD_START;
    state = checkpoints[checkpoint](state);
    return clearSprites(_extends({}, state, { bgm: state.world.bgm }));
}

module.exports = {
    allWorlds: allWorlds,
    checkpoints: checkpoints,
    getNewWorld: getNewWorld,
    getNewLayer: getNewLayer,
    advanceWorld: advanceWorld,
    getGroundHeight: getGroundHeight,
    renderBackground: renderBackground,
    renderForeground: renderForeground,
    clearSprites: clearSprites,
    updateLayerSprite: updateLayerSprite,
    setCheckpoint: setCheckpoint,
    applyCheckpointToState: applyCheckpointToState
};

var _require5 = require('areas/field'),
    getFieldWorldStart = _require5.getFieldWorldStart,
    CHECK_POINT_FIELD_START = _require5.CHECK_POINT_FIELD_START;

var _require6 = require('enemies'),
    getEnemyHitBox = _require6.getEnemyHitBox;

var _require7 = require('heroes'),
    getHeroHitBox = _require7.getHeroHitBox;

},{"Rectangle":1,"animations":2,"areas/field":3,"draw":7,"enemies":10,"gameConstants":11,"heroes":12,"random":18,"sprites":21}]},{},[6]);
