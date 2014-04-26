var Game = function () {
    var terrain, water;

    this.setup = function () {
        scaleSetup(2);
        water = jaws.Sprite({
            color: 'blue',
            x:0,
            y: jaws.height,
            anchor: 'bottom_left',
            width: 320,
            height: 45
        });
        terrain = jaws.PixelMap({ image: 'images/map1.png' })
        fish = jaws.Sprite({
            color: 'green',
            x: 10,
            y: jaws.height - 60,
            width: 8,
            height: 8
        });
        fish.gravity = 1;
        fish.jumpv = 10;
        fish.vy = 0;
        fish.vx = 1;
    };

    this.update = function () {
        if (jaws.pressed("up") && !fish.jumping) {
            fish.vy -= fish.jumpv;
            fish.jumping = true;
        }
        fish.vy += fish.gravity;
        fish.y += fish.vy;
        if (terrain.solidAtRect(fish.rect())) {
            fish.y -= fish.vy;
            fish.vy = 0;
            fish.jumping = false;
        }

        oldx = fish.x;
        if (jaws.pressed("left") && fish.jumping) {
            fish.x -= fish.vx;
        }
        if (jaws.pressed("right") && fish.jumping) {
            fish.x += fish.vx;
        }
        if (terrain.solidAtRect(fish.rect())) {
            fish.x = oldx;
        }

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
