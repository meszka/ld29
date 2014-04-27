var fps = 30;
var terrain, water, fish, viewport, oxygen_label, digs_label, blood_list, kills_label,
    drowns_label, drill_sound, tick_sound, death_sound, jump_sound, splash_sound,
    hit_sound, reload_sound, timer_sound, houses, msg_label, yum_sound, drown_sound,
    time_label, time, n_humans, left_label;

function removeDead(objects) {
    for (var i in objects) {
        if (objects[i].dead) {
            objects.splice(i, 1); // remove element
        }
    }
}

function Fish(options) {
    options = options || {};
    options.image = 'images/fish.png';
    options.anchor = 'center';
    jaws.Sprite.call(this, options);
    this.gravity = 0.5;
    this.jumpv = 4.5;
    this.swimv = 1.5;
    this.vy = 0;
    this.max_vy = 6;
    this.min_vy = -10;
    this.vx = 0;
    this.oxygen = 5000;
    this.max_oxygen = 5000;
    this.digs = 0;
    this.max_digs = 20;
    this.digs_delay = 0;
    this.digs_delay_s = 2000;
    this.kills = 0;
    this.drowns = 0;
    this.rest_anim = new jaws.Animation({
        sprite_sheet: 'images/fish.png',
        frame_size: [19,11],
    })
    this.dig_anim = new jaws.Animation({
        sprite_sheet: 'images/fish_drilling.png',
        frame_size: [19,11],
        frame_duration: 100,
        // on_end: function () {
        //     console.log('anim finished');
        //     fish.anim = fish.rest_anim;
        // },
    });
    this.anim = this.rest_anim;
    this.in_water = true;
}
inherits(Fish, jaws.Sprite);
Fish.prototype.depth= function () {
    var d = this.y - water.y;
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
Fish.prototype.move = function () {
    return fish.stepWhile(fish.vx, fish.vy * fish.vdamp(), function (fish) {
        return !terrain.solidAtRect(fish.rect())
    });
};
Fish.prototype.update = function () {
        fish.vy += fish.gravity;
        fish.vx /= 2;
        if (fish.dead) {
            fish.move();
            if (jaws.pressed('r')) {
                jaws.switchGameState(Game);
            }
            return;
        }

        var sign = fish.flipped ? -1 : 1;
        var x = fish.flipped ? 1 : 0;
        if (fish.vy != 0) {
            fish.rotateTo(x*180 + sign * 180/Math.PI * Math.atan2(sign * fish.vy, fish.vx));
        }

        if (jaws.pressed('up') && !fish.jumping && !fish.depth()) {
            fish.vy -= fish.jumpv;
            fish.jumping = true;
            jump_sound.play();
        }
        if (jaws.pressed('up') && fish.depth()) {
            fish.jumping = false;
            fish.vy -= 1;
            if (fish.vy < fish.min_vy * fish.vdamp()) fish.vy = fish.min_vy * fish.vdamp();
        }

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
                reload_sound.play();
            }
        }

        var collision = fish.move();
        if (jaws.pressed('x')) {
            if (fish.digs == 0)
                tick_sound.play();
            else {
                drill_sound.play();
                fish.anim = fish.dig_anim;
                fish.digs--;
                if (fish.digs == 0) fish.digs_delay = fish.digs_delay_s;
                if (collision.x || collision.y) {
                    fish.dig();
                }
            }
        } else {
            if (fish.digs > fish.max_digs) fish.digs = fish.max_digs;
            if (collision.y) {
                fish.vy = 0;
                fish.jumping = false;
            }
        }

        if (fish.inWater()) {
            // fish.oxygen += 3000 / fps;
            // if (fish.oxygen > fish.max_oxygen) fish.oxygen = fish.max_oxygen;
            fish.oxygen = fish.max_oxygen;
        } else {
            var old_oxygen = fish.oxygen;
            fish.oxygen -= 1000 / fps;
            if (fish.oxygen < 0) {
                fish.oxygen = 0;
                this.die();
                msg_label.text = "press R to restart"
            } else {
                if (Math.ceil(old_oxygen/1000) > Math.ceil(fish.oxygen/1000)) {
                    timer_sound.play();
                }
            }
        }

        if (!fish.in_water && fish.inWater()) {
            fish.in_water = true;
            splash_sound.play();
        }
        if (fish.in_water && !fish.inWater()) {
            fish.in_water = false;
        }

        var hit = false;
        jaws.collide(fish, humans, function (fish, human) {
            if (human.drowned) return;
            human.hit(); 
            hit_sound.play();
            hit = true;
        });
       if (hit) fish.vy -= 1;
};
Fish.prototype.die = function () {
    fish.dead = true;
    fish.rotateTo(180);
    death_sound.play();
};
Fish.prototype.win = function () {
    jaws.switchGameState(End, {fps: fps});
};

function Human(options) {
    options = options || {};
    options.anchor = 'center';
    jaws.Sprite.call(this, options);
    this.vx = 1;
    this.vy = 0;
    this.gravity = 0.5;
    this.max_vy = 7;
    this.max_climb = 2;
    // this.hp = 10;
    this.hp = 5;
    this.sprite_sheet = new jaws.SpriteSheet({ image: 'images/human.png', frame_size: [8,16] })
}
inherits(Human, jaws.Sprite);
Human.prototype.depth = Fish.prototype.depth;
Human.prototype.die = function () {
    this.vx = 0;
    this.vy = 0;
    this.drowned = true;
    this.setAnchor('bottom_center')
    // var angle = this.flipped ? 270 : 90;
    this.rotateTo(90);
    this.house.human_limit++;
    this.house.humans_dead++;

    if (n_humans - fish.kills - fish.drowns == 0) {
        fish.win();
    }
};
// Human.prototype.rect = function () {
//     if (!this.drowned)
//         return jaws.Sprite.prototype.rect.call(this);
//     else
//         return new jaws.Rect(this.x, this.y - this.width, this.height, this.width) 
// };
Human.prototype.update = function () {
    this.vy += this.gravity;

    this.flipped = this.vx < 0;
    var collision = this.stepWhile(this.vx, this.vy, function (obj) {
        return !terrain.solidAtRect(obj.rect());
    });
    if (collision.y) {
        this.vy = 0;
    }

    if (this.drowned) return;
    if (this.depth() > 2) {
        this.die();
        fish.drowns += 1;
        drown_sound.play();
        return;
    }

    // try climbing
    if (collision.x && this.vx) {;
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
Human.prototype.hit = function () {
    var b = new Blood({ x: this.x, y: this.y })
    blood_list.push(b);
    this.hp -= 1;
    if (this.hp == 0) {
        var frames = this.sprite_sheet.frames;
        this.setImage(frames[frames.length - 1])
        this.die();
        fish.kills += 1;
        if (fish.kills % 3 == 0) {
            fish.max_oxygen += 1000;
            yum_sound.play();
        }
    }
};

function Blood(options) {
    options = options || {};
    options.anchor = 'center';
    jaws.Sprite.call(this, options);
    this.animation = new jaws.Animation({
        sprite_sheet: 'images/blood.png',
        frame_size: [8,8],
        frame_duration: 100,
    });
}
inherits(Blood, jaws.Sprite);
Blood.prototype.update = function () {
    if (this.animation.atLastFrame()) {
        this.dead = true;
    }
    this.setImage(this.animation.next())
};

function House(options) {
    options = options || {};
    options.image = 'images/house.png';
    options.anchor = 'center';
    jaws.Sprite.call(this, options);
    this.vy = 0;
    this.gravity = 0.5;
    this.max_vy = 7;
    this.time = 0;
    this.spawn_time = 1500;
    this.spawn_limit = 5;
    this.human_limit = 3;
    this.humans_dead = 0;
}
inherits(House, jaws.Sprite);
House.prototype.spawn = function () {
    var h = new Human({ x: this.x, y: this.y + 6 });
    h.house = this;
    h.vx = Math.round(Math.random()) > 0 ? 1 : -1;
    var r = Math.floor(Math.random() * (h.sprite_sheet.frames.length - 1));
    h.setImage(h.sprite_sheet.frames[r]);
    humans.push(h);
};
// House.prototype.draw = function () {
//     jaws.Sprite.prototype.draw.call(this);
//     this.rect().draw();
// };
House.prototype.update = function () {
    this.vy += this.gravity;

    var collision = this.stepWhile(0, this.vy, function (obj) {
        return !terrain.solidAtRect(obj.rect());
    });
    if (collision.y) {
        this.vy = 0;
    }

    if (this.dead) return;

    this.time += 1000 / fps;
    if (this.time >= this.spawn_time) {
        this.time = 0;
        if (this.human_limit && this.spawn_limit) {
            this.spawn();
            this.spawn_limit--;
            this.human_limit--;
        }
    }

    if (this.humans_dead >= 5) {
        this.dead = true;
        this.setAnchor('bottom_center');
        this.rotateTo(90);
    }
};

var Setup = function () {
    var screens = jaws.SpriteSheet({
        image: 'images/screens.png',
        frame_size: [160, 120],
        scale_image: 2,
    });
    var s = new jaws.Sprite({ x:0, y: 0 });
    var s_n = 0;
    this.setup = function () {
        scaleSetup(2);
        s.setImage(screens.frames[0]);
    };
    this.update = function () {
        if (jaws.pressedWithoutRepeat('x')) {
            s_n++;
            if (s_n == 3) {
                jaws.switchGameState(Game, {fps: fps});
            } else {
                s.setImage(screens.frames[s_n]);
            }
        }
    };
    this.draw = function () {
        jaws.clear();
        s.draw();
    };
};

var msg;
var End = function () {
    var screens = jaws.SpriteSheet({
        image: 'images/screens.png',
        frame_size: [160, 120],
        scale_image: 2,
    });
    var s = new jaws.Sprite({ x:0, y: 0 });
    this.setup = function () {
        msg = new jaws.Text({ x: 5, y: 160, width: 315, height: 160, wordWrap: true });
        msg.text = "That sure was a fun day, wasn't it Drill Fish? "
        if (fish.kills == n_humans) {
            msg.text += "You got to eat all the tasty snacks!";
        }
        else if (fish.kills) {
            msg.text += "You ate " + fish.kills + " tasty snacks. "
        }
        if (fish.drowns) {
            msg.text += "Though it's a shame " + fish.drowns + " snacks fell into the water..."
        }
        s.setImage(screens.frames[3]);
    };
    this.update = function () {
        if (jaws.pressedWithoutRepeat('x')) {
            jaws.switchGameState(Game, {fps: fps});
        }
    };
    this.draw = function () {
        jaws.clear();
        s.draw();
        msg.draw();
    };
    
};
var Game = function () {

    this.setup = function () {
        time = 0;

        water = new jaws.Sprite({
            color: 'blue',
            x: 0,
            y: jaws.height - 100,
            width: 2000,
            height: 100,
        });
        terrain = new jaws.PixelMap({ image: 'images/map5.png' })
        fish = new Fish({ x: 700, y: jaws.height - 100 });
        viewport = new jaws.Viewport({ max_x: terrain.width, max_y: terrain.height });

        oxygen_label = new jaws.Text({ x: 5, y: 5 });
        digs_label = new jaws.Text({ x: 300, y: 5 });
        kills_label = new jaws.Text({ x: 120, y: 5, color: 'DarkRed' });
        drowns_label = new jaws.Text({ x: 150, y: 5, color: 'blue' });
        left_label = new jaws.Text({ x: 180, y: 5 });
        msg_label = new jaws.Text({ x: 5, y: jaws.height - 20 });
        time_label = new jaws.Text({ x : 270, y: jaws.height - 20 })

        humans = [];
        houses = [
            new House({ x: 583, y: 100 }),
            new House({ x: 860, y: 100 }),
            new House({ x: 1180, y: 70 }),
            new House({ x: 180, y: 20 }),
            new House({ x: 224, y: 120 }),
            new House({ x: 1520, y: 100 }),
        ];
        n_humans = houses[0].spawn_limit * houses.length;
        blood_list = [];

        drill_sound = jaws.assets.get(afile('sounds/drill'));
        tick_sound = jaws.assets.get(afile('sounds/tick'));
        death_sound = jaws.assets.get(afile('sounds/death'));
        jump_sound = jaws.assets.get(afile('sounds/jump'));
        splash_sound = jaws.assets.get(afile('sounds/splash'));
        hit_sound = jaws.assets.get(afile('sounds/hit'));
        reload_sound = jaws.assets.get(afile('sounds/reload'));
        timer_sound = jaws.assets.get(afile('sounds/timer'));
        yum_sound = jaws.assets.get(afile('sounds/yum'));
        drown_sound = jaws.assets.get(afile('sounds/drown'));
    };

    this.update = function () {
        // if (!fish.dead) time += 1000 / fps;
        fish.update();
        jaws.update(houses);
        jaws.update(humans);
        jaws.update(blood_list);
        removeDead(blood_list);

        oxygen_label.text = Math.ceil(fish.oxygen/1000).toString() + "/" + Math.ceil(fish.max_oxygen/1000);
        digs_label.text = Math.ceil(fish.digs_delay/1000).toString();
        kills_label.text = fish.kills.toString();
        drowns_label.text = fish.drowns.toString();
        left_label.text = (n_humans - fish.drowns - fish.kills).toString();

        var minutes = Math.floor(time / 1000 / 60).toString()
        if (minutes.length < 2) minutes = "0" + minutes;
        var seconds = Math.floor(time / 1000 % 60).toString();
        if (seconds.length < 2) seconds = "0" + seconds;
        time_label.text = minutes + ":" + seconds;
    };

    this.draw = function () {
        jaws.clear();
        viewport.centerAround(fish);
        viewport.apply(function () {
            water.draw();
            terrain.draw();
            jaws.draw(houses);
            jaws.draw(humans);
            jaws.draw(blood_list);
            fish.setImage(fish.anim.next());
            fish.draw();
            if (fish.anim == fish.dig_anim && fish.anim.atLastFrame()) {
                fish.anim = fish.rest_anim;
            }
            // fish.rect().draw();
        });

        oxygen_label.draw();
        if (fish.digs_delay) digs_label.draw();
        kills_label.draw();
        drowns_label.draw();
        left_label.draw();
        msg_label.draw();
        // time_label.draw();
    };
};

jaws.onload = function () {
    jaws.assets.add([
        // 'images/map1.png',
        // 'images/map2.png',
        // 'images/map3.png',
        // 'images/map4.png',
        'images/map5.png',
        'images/fish.png',
        'images/fish_drilling.png',
        'images/human.png',
        'images/dig_mask.png',
        'images/blood.png',
        'images/house.png',
        'images/screens.png',
        afile('sounds/drill'),
        afile('sounds/tick'),
        afile('sounds/death'),
        afile('sounds/jump'),
        afile('sounds/splash'),
        afile('sounds/hit'),
        afile('sounds/reload'),
        afile('sounds/timer'),
        afile('sounds/yum'),
        afile('sounds/drown'),
    ]);


    var font = new Font();
    font.onload = function () {
        jaws.Text.prototype.default_options.fontFace = 'font04b03';
        jaws.Text.prototype.default_options.fontSize = 16;
        jaws.Text.prototype.default_options.textBaseline = 'top';
        jaws.start(Setup, { fps: fps });
    };
    font.fontFamily = 'font04b03';
    font.src = '04B_03__.TTF';
};
