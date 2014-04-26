var terrain, water, fish;
var Game = function () {
    this.setup = function () {
        scaleSetup(2);
        water = jaws.Sprite({
            color: 'blue',
            x:0,
            y: jaws.height - 120,
            width: 320,
            height: 120,
        });
        terrain = jaws.PixelMap({ image: 'images/map2.png' })
        fish = jaws.Sprite({
            color: 'green',
            x: 10,
            y: jaws.height - 80,
            width: 8,
            height: 8
        });
        fish.gravity = 0.5;
        fish.jumpv = 4;
        fish.swimv = 1;
        fish.vy = 0;
        fish.max_vy = 7;
        fish.min_vy = -10;
        fish.vx = 0;
        fish.inWater = function () {
            return jaws.collide(fish, water);
        };
        fish.depth = function () {
            var d = fish.y - water.y;
            return d > 0 ? d : 0;
        };
        fish.vdamp = function () {
            // var damp = 0.02 * fish.depth();
            // return damp <= 0.8 ? 1 - damp : 0.2;
            // return fish.depth() ? 0.4 : 1;
            return fish.depth() ? 0.4 : 1;
        };
    };

    this.update = function () {
        if (jaws.pressed("up") && !fish.jumping && !fish.depth()) {
            fish.vy -= fish.jumpv;
            fish.jumping = true;
        }
        if (jaws.pressed("up") && fish.depth()) {
            fish.jumping = false;
            fish.vy -= 1;
            if (fish.vy < fish.min_vy * fish.vdamp()) fish.vy = fish.min_vy * fish.vdamp();
        }
        // if (fish.vy <= fish.max_vy * fish.vdamp()) {
        //     fish.vy += fish.gravity;
        // } else {
        //     fish.vy -= 0.5;
        // }
        fish.vy += fish.gravity;
        if (fish.vy > fish.max_vy * fish.vdamp()) fish.vy = fish.max_vy * fish.vdamp();

        if (jaws.pressed("left") && (fish.jumping || fish.inWater())) {
            fish.vx -= fish.swimv;
        }
        if (jaws.pressed("right") && (fish.jumping || fish.inWater())) {
            fish.vx += fish.swimv;
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
        fish.vx = 0;
    };

    this.draw = function () {
        jaws.clear();
        water.draw();
        terrain.draw();
        fish.draw();
    };
};

jaws.onload = function () {
    jaws.assets.add([
        'images/map1.png',
        'images/map2.png',
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
