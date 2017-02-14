
// jump
joon("@jump")
    .at(0, .3, easeOutSine, "scaleTo", 2, 1, 1)
    .at(0, .3, easeOutSine, "change", "height", "-20")
    .at(0, .3, easeOutSine, "moveTo", "+20", 0)
    .at(.3, .3, easeInSine, "scaleTo", 1, 1, 1)
    .at(.3, .3, easeInSine, "change", "height", "+40")
    .at(.3, .3, easeInSine, "moveTo", "-40", 0)
    .at(.6, .3, easeOutSine, "moveTo", "-40", 0)
    .at(.9, .3, easeInSine, "moveTo", 140, 0)
    .at(1.2, .3, easeOutSine, "scaleTo", 2, 1, 1)
    .at(1.2, .3, easeOutSine, "change", "height", 30)
    .at(1.2, .3, easeOutSine, "moveTo", 180, 0)
    .at(1.5, .3, easeInSine, "scaleTo", 1, 1, 1)
    .at(1.6, .3, easeOutSine, "change", "height", 50)
    .at(1.6, .3, easeOutSine, "moveTo", 160, 0);

joon("@jump-shadow")
    .at(0, .3, easeOutSine, "scaleTo", 2, 1, 1)
    .at(.3, .3, easeInSine, "scaleTo", 1, 1, 1)
    .at(.6, .3, easeOutSine, "scaleTo", .7, 1, 1)
    .at(.6, .3, easeOutSine, "fadeTo", .5)
    .at(.9, .3, easeInSine, "scaleTo", 1, 1, 1)
    .at(.9, .3, easeInSine, "fadeTo", 1)
    .at(1.2, .3, easeOutSine, "scaleTo", 2, 1, 1)
    .at(1.5, .3, easeInSine, "scaleTo", 1, 1, 1);


// fast-move
joon("@fast-move-left")
    .at(0, .3, easeInSine, "moveTo", "+0", 330)
    .at(0, .2, easeInSine, "skew", 0, 20)
    .at(0, .2, easeInSine, "scaleTo", 2, 1)
    .at(.3, .2, easeOutSine, "skew", 0, -10)
    .at(.45, .15, easeOutSine, "skew", 0, 0)
    .at(.2, .2, easeOutSine, "scaleTo", 1, 1);

joon("@fast-move-right")
    .at(0, .3, easeInSine, "moveTo", "+0", 10)
    .at(0, .2, easeInSine, "skew", 0, -20)
    .at(0, .2, easeInSine, "scaleTo", 2, 1)
    .at(.3, .2, easeOutSine, "skew", 0, 10)
    .at(.45, .15, easeOutSine, "skew", 0, 0)
    .at(.2, .2, easeOutSine, "scaleTo", 1, 1);

// curve-move
joon("@curve-move-left")
    .at(0, 1.5, [easeOutSine, easeInSine], "moveTo", "-165", "+165")
    .at(1.5, .5, [easeInSine, easeOutSine], "moveTo", "+165", "+165")
    .at(1.9, .4, [easeOutSine, easeInSine], "moveTo", "+165", "-165")
    .at(2.1, .4, [easeInSine, easeOutSine], "moveTo", "-165", "-165");

// jump-closer
joon("@jump-closer")
    .at(0, .3, easeOutSine, "moveTo", "+60", "+0")
    .at(.32, .6, easeOutCubic, "moveTo", "-60", "+0")
    .at(.92, .3, easeOutSine, "moveTo", "+70", "+0")
    .at(1.24, .6, easeOutCubic, "moveTo", "-40", "+0")
    .at(1.84, .3, easeOutSine, "moveTo", "+50", "+0")
    .at(2.16, .6, easeOutCubic, "moveTo", "-20", "+0")
    .at(2.76, .3, easeOutSine, "moveTo", "+40", "+0")
    .at(.32, .9, easeInSine, "scaleTo", 1.3, 1.3, 1)
    .at(1.24, .9, easeInSine, "scaleTo", 1.9, 1.9, 1)
    .at(2.16, .9, easeInSine, "scaleTo", 2.7, 2.7, 1);

joon("@jump-closer-shadow")
    .at(0, .3, easeOutSine, "scaleTo", 1, 1, 1)
    .at(.32, .6, easeOutSine, "scaleTo", .7, 1, 1)
    .at(.92, .3, easeOutSine, "scaleTo", 1.2, 1, 1)
    .at(1.24, .6, easeOutSine, "scaleTo", 1, 1, 1)
    .at(1.84, .3, easeOutSine, "scaleTo", 1.5, 1, 1)
    .at(2.16, .6, easeOutSine, "scaleTo", 1.3, 1, 1)
    .at(2.76, .3, easeOutSine, "scaleTo", 1.7, 1, 1)
    .at(0, .3, easeOutSine, "fadeTo", 1)
    .at(.32, .6, easeOutSine, "fadeTo", .4)
    .at(.92, .3, easeOutSine, "fadeTo", 1)
    .at(1.24, .6, easeOutSine, "fadeTo", .4)
    .at(1.84, .3, easeOutSine, "fadeTo", 1)
    .at(2.16, .6, easeOutSine, "fadeTo", .4)
    .at(2.76, .3, easeOutSine, "fadeTo", 1)
    .at(.32, .9, easeOutSine, "moveTo", 224, "+0")
    .at(1.24, .9, easeOutSine, "moveTo", 249, "+0")
    .at(2.16, .9, easeOutSine, "moveTo", 289, "+0");
