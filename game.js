var Game = function () {
    this.setup = function () {
    };

    this.update = function () {
    };

    this.draw = function () {
        jaws.clear();
    };
};

jaws.onload = function () {
    jaws.assets.add([
    ]);

    scaleSetup(4);

    var font = new Font();
    font.onload = function () {
        jaws.Text.prototype.default_options.fontFace = 'font04b03';
        jaws.Text.prototype.default_options.fontSize = 8;
        jaws.start(Game, { fps: 30 });
    };
    font.fontFamily = 'font04b03';
    font.src = '04B_03__.TTF';
};
