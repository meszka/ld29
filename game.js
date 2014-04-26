var terrain, water, fish, viewport;

function Fish(options) {
    options = options || {};
    options.image = 'images/fish.png';
    options.anchor = 'center';
    jaws.Sprite.call(this, options);
    this.gravity = 0.5;
    this.jumpv = 4;
    this.swimv = 1;
    this.vy = 0;
    this.max_vy = 7;
    this.min_vy = -10;
    this.vx = 0;
}
inherits(Fish, jaws.Sprite);
Fish.prototype.depth= function () {
    var d = fish.y - water.y;
    return d > 0 ? d : 0;
};
Fish.prototype.vdamp = function () {
    return fish.depth() ? 0.4 : 1;
};
Fish.prototype.rect = function () {
    return new jaws.Rect(fish.x - 7, fish.y - 4, 14, 8);
};
Fish.prototype.inWater = function () {
    return jaws.collide(fish, water);
};


var Game = function () {
    this.setup = function () {
        scaleSetup(2);
        water = jaws.Sprite({
            color: 'blue',
            x: 0,
            y: jaws.height - 120,
            width: 2000,
            height: 120,
        });
        terrain = jaws.PixelMap({ image: 'images/map3.png' })
        fish = new Fish({ x: 400, y: jaws.height - 80 });
        viewport = new jaws.Viewport({ max_x: terrain.width, max_y: terrain.height });
    };

    this.update = function () {
        fish.vx = 0;
        if (jaws.pressed("up") && !fish.jumping && !fish.depth()) {
            fish.vy -= fish.jumpv;
            fish.jumping = true;
        }
        if (jaws.pressed("up") && fish.depth()) {
            fish.jumping = false;
            fish.vy -= 1;
            if (fish.vy < fish.min_vy * fish.vdamp()) fish.vy = fish.min_vy * fish.vdamp();
        }
        fish.vy += fish.gravity;
        if (fish.vy > fish.max_vy * fish.vdamp()) fish.vy = fish.max_vy * fish.vdamp();

        if (jaws.pressed("left") && (fish.jumping || fish.inWater())) {
            fish.vx -= fish.swimv;
            fish.flipped = true;
        }
        if (jaws.pressed("right") && (fish.jumping || fish.inWater())) {
            fish.vx += fish.swimv;
            fish.flipped = false;
        }

        var collision = fish.stepWhile(fish.vx, fish.vy * fish.vdamp(), function (fish) {
           return !terrain.solidAtRect(fish.rect())
        });
        if (collision.y) {
            fish.vy = 0;
            fish.jumping = false;
        }
        if (collision.x) {
        }
    };

    this.draw = function () {
        jaws.clear();
        viewport.centerAround(fish);
        viewport.apply(function () {
            water.draw();
            terrain.draw();
            // var sign = fish.flipped ? -1 : 1;
            // fish.rotateTo(sign * 180/Math.PI * Math.atan2(fish.vy, fish.vx));
            fish.draw();
            // fish.rect().draw();
        });
    };
};

jaws.onload = function () {
    jaws.assets.add([
        'images/map1.png',
        'images/map2.png',
        'images/map3.png',
        'images/fish.png',
    ]);


    var font = new Font();
    font.onload = function () {
        jaws.Text.prototype.default_options.fontFace = 'font04b03';
        jaws.Text.prototype.default_options.fontSize = 8;
        jaws.start(Game, { fps: 30 });
    };
    font.fontFamily = 'font04b03';
    font.src = '04B_03__.TTF';
};
