var fps = 30;
var terrain, water, fish, viewport, oxygen_label;

function Fish(options) {
    options = options || {};
    options.image = 'images/fish.png';
    options.anchor = 'center';
    jaws.Sprite.call(this, options);
    this.gravity = 0.5;
    this.jumpv = 4;
    this.swimv = 2;
    this.vy = 0;
    this.max_vy = 7;
    this.min_vy = -10;
    this.vx = 0;
    this.oxygen = 5000;
    this.max_oxygen = 5000;
    this.digs = 0;
    this.max_digs = 20;
    this.digs_delay = 0;
    this.digs_delay_s = 5000;
}
inherits(Fish, jaws.Sprite);
Fish.prototype.depth= function () {
    var d = fish.y - water.y;
    return d > 0 ? d : 0;
};
Fish.prototype.vdamp = function () {
    return fish.depth() ? 0.6 : 1;
};
Fish.prototype.rect = function () {
    return new jaws.Rect(fish.x - 7, fish.y - 4, 14, 8);
};
Fish.prototype.inWater = function () {
    return jaws.collide(fish, water);
};
Fish.prototype.dig = function () {
    var c = terrain.context;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.drawImage(jaws.assets.get('images/dig_mask.png'), this.x - 8 + this.vx, this.y - 8 + this.vy);
    c.restore();
    terrain.update()
};

function Human(options) {
    options = options || {};
    options.image = 'images/human.png'
    jaws.Sprite.call(this, options);
    this.vx = 1;
    this.vy = 0;
    this.gravity = 0.5;
    this.max_vy = 7;
    this.max_climb = 2;
}
inherits(Human, jaws.Sprite);
Human.prototype.update = function () {
    this.vy += this.gravity;

    var collision = this.stepWhile(this.vx, this.vy, function (obj) {
        return !terrain.solidAtRect(obj.rect())
    });
    if (collision.y) {
        this.vy = 0;
    }

    // try climbing
    if (collision.x && this.vx) {
        var oldx = this.x;
        var oldy = this.y;
        this.x += this.vx < 0 ? -1 : 1;

        var success = false;
        for (var i = 0; i < this.max_climb; i++) {
            this.y -= 1;
            if (!terrain.solidAtRect(this.rect())) {
                success = true;
                break;
            }
        }
        if (!success) {
            this.x = oldx;
            this.y = oldy;
            this.vx = -this.vx;
        }
    }

};

var Game = function () {

    function death() {
        fish.dead = true;
    };

    this.setup = function () {
        scaleSetup(2);
        water = new jaws.Sprite({
            color: 'blue',
            x: 0,
            y: jaws.height - 120,
            width: 2000,
            height: 120,
        });
        terrain = new jaws.PixelMap({ image: 'images/map4.png' })
        fish = new Fish({ x: 400, y: jaws.height - 110 });
        viewport = new jaws.Viewport({ max_x: terrain.width, max_y: terrain.height });
        oxygen_label = new jaws.Text({ x: 5, y: 5 })
        digs_label = new jaws.Text({ x: 300, y: 5 })

        humans = [
            new Human({ x: 500, y: 50 }),
            new Human({ x: 550, y: 50 }),
            new Human({ x: 600, y: 50 }),
        ];
    };

    this.update = function () {
        if (fish.dead) return;

        fish.vx /= 2;
        if (jaws.pressed('up') && !fish.jumping && !fish.depth()) {
            fish.vy -= fish.jumpv;
            fish.jumping = true;
        }
        if (jaws.pressed('up') && fish.depth()) {
            fish.jumping = false;
            fish.vy -= 1;
            if (fish.vy < fish.min_vy * fish.vdamp()) fish.vy = fish.min_vy * fish.vdamp();
        }

        fish.vy += fish.gravity;
        if (fish.vy > fish.max_vy * fish.vdamp()) fish.vy = fish.max_vy * fish.vdamp();

        if (jaws.pressed('left')) {
            if (fish.inWater()) {
                fish.vx -= fish.swimv;
            }
            if (fish.jumping) {
                fish.vx -= 1;
            }
            fish.flipped = true;
        }
        if (jaws.pressed('right')) {
            if (fish.inWater()) {
                fish.vx += fish.swimv;
            }
            if (fish.jumping) {
                fish.vx += 1;
            }
            fish.flipped = false;
        }

        if (fish.digs == 0) {
            if (fish.digs_delay > 0) {
                fish.digs_delay -= 1000/fps;
                if (fish.digs_delay < 0) fish.digs_delay = 0;
            } else {
                fish.digs = fish.max_digs;
            }
        }

        var collision = fish.stepWhile(fish.vx, fish.vy * fish.vdamp(), function (fish) {
           return !terrain.solidAtRect(fish.rect())
        });
        if (jaws.pressed('x') && fish.digs > 0) {
            if (collision.x || collision.y) {
                fish.dig();
                fish.digs--;
                if (fish.digs == 0) fish.digs_delay = fish.digs_delay_s;
            }
        } else {
            if (fish.digs > fish.max_digs) fish.digs = fish.max_digs;
            if (collision.y) {
                fish.vy = 0;
                fish.jumping = false;
            }
        }

        if (fish.inWater()) {
            fish.oxygen += 2000 / fps;
            if (fish.oxygen > fish.max_oxygen) fish.oxygen = fish.max_oxygen;
        } else {
            fish.oxygen -= 1000 / fps;
            if (fish.oxygen < 0) {
                fish.oxygen = 0;
                // death();
            }
        }

        oxygen_label.text = Math.ceil(fish.oxygen/1000).toString();
        digs_label.text = Math.ceil(fish.digs_delay/1000).toString();
        jaws.update(humans);
    };

    this.draw = function () {
        jaws.clear();
        viewport.centerAround(fish);
        viewport.apply(function () {
            water.draw();
            terrain.draw();
            jaws.draw(humans);
            var sign = fish.flipped ? -1 : 1;
            var x = fish.flipped ? 1 : 0;
            if (fish.vy != 0) {
                fish.rotateTo(x*180 + sign * 180/Math.PI * Math.atan2(sign * fish.vy, fish.vx));
            }
            fish.draw();
            // fish.rect().draw();
        });
        oxygen_label.draw();
        digs_label.draw();
    };
};

jaws.onload = function () {
    jaws.assets.add([
        'images/map1.png',
        'images/map2.png',
        'images/map3.png',
        'images/map4.png',
        'images/fish.png',
        'images/human.png',
        'images/dig_mask.png',
    ]);


    var font = new Font();
    font.onload = function () {
        jaws.Text.prototype.default_options.fontFace = 'font04b03';
        jaws.Text.prototype.default_options.fontSize = 16;
        jaws.Text.prototype.default_options.textBaseline = 'top';
        jaws.start(Game, { fps: fps });
    };
    font.fontFamily = 'font04b03';
    font.src = '04B_03__.TTF';
};
