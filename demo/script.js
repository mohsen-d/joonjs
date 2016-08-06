

$("#title")
  .at(0, "fadeTo", .3, .5, "linear")
  .at(.5, "fadeTo", .6, .3, "linear")
  .at(.8, "fadeTo", .2, .2, "linear")
  .at(1, "fadeTo", 1, .5, "linear");

$("#slogan")
  .at(1, "moveTo", 40, 0, .6, "linear")
  .at(1.7, "moveTo", 0, 0, .3, "linear")
  .at(2, "moveTo", 30, 0, .6, "linear")
  .at(2.6, "moveTo", 0, 0, .3, "linear");
