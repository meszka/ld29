function scaleSetup(scale) {
    jaws.width = jaws.canvas.width / scale;
    jaws.height = jaws.canvas.height / scale;
    jaws.context.scale(scale, scale);
    jaws.useCrispScaling();
}
