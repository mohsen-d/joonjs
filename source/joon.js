window.$ = window.joon = (function(){

  function joon(selector) {
    var self = this;
    if(selector.startsWith("@")){
      self.templateName = selector.substring(1);
      self.isTemplate = true;
    }else{
      self.selector = selector;
      self.elements = getElements(selector);
      self.animationLength = 0;
      self.shallLoop = false;
      self.totalLaps = -1;
      self.completedLaps = 0;
    }

    self.actions = [];
    self.name = "this is joon.js";
  }

  joon.prototype.save = function(){
    var self = this;
    var templateActionsName = self.templateName + "_actions";
    joon.prototype[templateActionsName] = self.actions;
    joon.prototype[self.templateName] = function(){
      this.actions = joon.prototype[templateActionsName];
      this.run();
      return this;
    };
  }

  joon.prototype.printElements = function(){
    for (elm of this.elements) {
      console.log(elm);
    }
    return this;
  }

  joon.prototype.on = function(selector, eventName){
    var self = this;
    var triggerElements = getElements(selector);

    if(triggerElements.length > 0){
      for (elm of triggerElements) {
        if (elm.addEventListener){
             elm.addEventListener(eventName, function(){
                self.run();
             }, false);
          }
          else {
            elm.attachEvent('on' + eventName, function(){
                self.run();
            });
          }
      }
    }

    return self;
  }

  joon.prototype.at = function(start, duration, func, ...funcArgs){
    var self = this;

    if(joon.prototype[func + "_actions"] != undefined){
      duration = calcAnimationLength(joon.prototype[func + "_actions"]);
    }

    self.actions.push({name: func, args: funcArgs, start: start, duration: duration});
    return self;
  }

  joon.prototype.run = function(){
    var self = this;
    for (action of self.actions) {
      (function(action){
        setTimeout(function(){
          self[action.name](action.duration, action.args);
        }, action.start*1000);
      })(action);
    }

    return this;
  }

  joon.prototype.loop = function(laps){
    var self = this;
    self.shallLoop = true;
    self.totalLaps = laps || -1;
    self.animationLength = calcAnimationLength(self.actions);

    for (var i = 0; i <= laps; i++) {
      setTimeout(self.run.bind(self), (i*self.animationLength) * 1000);
    }
  }

  joon.prototype.moveTo = function(duration, [x, y, ease]){

    for (elm of this.elements) {
      elm.style.top = x;
      elm.style.left = y;
      if(elm.style.transition.trim() !== ""){
        elm.style.transition += ", top " + duration + "s " + ease + ", left " + duration + "s " + ease;
      }
      else{
          elm.style.transition = "top " + duration + "s " + ease + ", left " + duration + "s " + ease;
      }
    }

    return this;
  }

  joon.prototype.fadeTo = function(duration, [fadeLevel, ease]){
    for (elm of this.elements) {
      elm.style.opacity = fadeLevel;
      if(elm.style.transition.trim() !== ""){
        elm.style.transition += ", opacity " + duration + "s " + ease;
      }
      else{
        elm.style.transition = "opacity " + duration + "s " + ease;
      }
    }

    return this;
  }

  joon.prototype.scaleTo = function(duration, [x, y, ease]){
    for (elm of this.elements) {
      elm.style.transform = "scale(" + x + ", " + y + ")";
      if(elm.style.transition.trim() !== ""){
        elm.style.transition += ", transform " + duration + "s " + ease;
      }
      else{
        elm.style.transition = "transform " + duration + "s " + ease;
      }
    }

    return this;
  }

  joon.prototype.rotate = function(duration, [degree, ease]){
    for (elm of this.elements) {
      elm.style.transform = "rotate(" + degree + "deg)";
      if(elm.style.transition.trim() !== ""){
        elm.style.transition += ", transform " + duration + "s " + ease;
      }
      else{
        elm.style.transition = "transform " + duration + "s " + ease;
      }
    }

    return this;
  }

  joon.prototype.skew = function(duration, [x, y, ease]){
    for (elm of this.elements) {
      elm.style.transform = "skew(" + x + "deg, " + y + "deg)";
      if(elm.style.transition.trim() !== ""){
        elm.style.transition += ", transform " + duration + "s " + ease;
      }
      else{
        elm.style.transition = "transform " + duration + "s " + ease;
      }
    }

    return this;
  }

  function getElements(selector){

    if(isEmpty(selector)){
      return [];
    }

    return document.querySelectorAll(selector);
  }

  function isEmpty(val){
    return val === undefined || val === null || val.trim() === "";
  }

  function calcAnimationLength(actions){
    sortedActions = actions.slice().sort(function(a, b) {
		    return (b.start + b.duration) - (a.start + a.duration);
		});

    return (sortedActions[0].start + sortedActions[0].duration);
  }

  return function(selector){
    return new joon(selector);
  };

  //return joon;

})();
