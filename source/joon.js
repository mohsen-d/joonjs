window.$ = window.joon = (function(){

  function joon(selector) {
    var self = this;
    self.elements = getElements(selector);
    self.actions = [];
    self.animationLength = 0;
    self.shallLoop = false;
    self.totalLaps = -1;
    self.completedLaps = 0;
    self.name = "this is joon.js";
  }

  joon.prototype.printElements = function(){
    for (elm of this.elements) {
      console.log(elm);
    }
    return this;
  }

  joon.prototype.at = function(start, duration, func, ...funcArgs){
    var self = this;

    self.actions.push({name: func, args: funcArgs, start: start, duration: duration});

    setTimeout(function(){
      self[func](duration, funcArgs);
    }, start*1000);

    return self;
  }

  joon.prototype.loop = function(laps){
    var self = this;
    self.shallLoop = true;
    self.totalLaps = laps || -1;
    self.animationLength = calcAnimationLength(self.actions);
    self.loopTimeout = setTimeout(self.runLoop.bind(self), self.animationLength * 1000);

    return self;
  }

  joon.prototype.runLoop = function(){
    var self = this;

    if(!self.shallLoop){
      return;
    }

    if(self.totalLaps >= 0 && self.completedLaps >= self.totalLaps){
      return;
    }

    for (action of self.actions) {
      (function(action){
        setTimeout(function(){
          self[action.name](action.duration, action.args)
        },  action.start * 1000);
      })(action);
    }

    self.loopTimeout = setTimeout(self.runLoop.bind(self), self.animationLength * 1000);

    self.completedLaps++;
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

  joon.prototype.zoomTo = function(duration, [to, ease]){
    for (elm of this.elements) {
      elm.style.transform = "scale(" + to + ")";
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

    selector = selector.toLowerCase();

    if(isEmpty(selector)){
      return [];
    }

    if(/^\./.test(selector)){
      var className = selector.substring(1);
      return document.getElementsByClassName(className);
    }

    if(/^\#/.test(selector)){
      var elementId = selector.substring(1);
      return [document.getElementById(elementId)];
    }

    if(/^[a-z]/i.test(selector)){
      return document.getElementsByTagName(selector);
    }

    return [];
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

})();
