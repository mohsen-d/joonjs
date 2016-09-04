window.$ = window.joon = (function(){
  'use strict'

  function joon(selector) {
    var self = this;

    if(selector.startsWith("@")){
      self.templateName = selector.substring(1);
      self.isTemplate = true;
    }else{
      self.selector = selector;
      self.elements = getElements(selector);
      self.animationLength = 0;
      self.totalLaps = 0;
    }

    self.actions = [];
    self.name = "this is joon.js";
  }

  joon.templates = {};

  joon.prototype.initFunctions = {
    moveTo: function(elm){
      var initialTranslate = getTransformFunc(elm, "translate") || [0, 0, 0];
      var initialTop = window.getComputedStyle(elm, null).getPropertyValue("top");
      var initialLeft = window.getComputedStyle(elm, null).getPropertyValue("left");

      elm.initialX = parseFloat(initialTranslate[2]) + parseFloat(initialTop);
      elm.initialY = parseFloat(initialTranslate[1]) + parseFloat(initialLeft);
    },

    fadeTo: function(elm){
      elm.initialOpacity = elm.style.opacity || 1;
    },

    scaleTo: function(elm){
      var initialScale = getTransformFunc(elm, "scale") || [0, 1, 1];
      elm.initialScaleX = parseFloat(initialScale[2]);
      elm.initialScaleY = parseFloat(initialScale[1]);
    },

    rotate: function(elm){
      var initialRotateDegree = getTransformFunc(elm, "rotate") || [0, "0deg"];
      elm.initialRotateDegree =parseFloat(initialRotateDegree[1].replace("deg", ""));
    },

    skew: function(elm){
      var initialSkew = getTransformFunc(elm, "skew") || [0, "0deg", "0deg"];
      elm.initialSkewX = parseFloat(initialSkew[2]);
      elm.initialSkewY = parseFloat(initialSkew[1]);
    }
  }

  joon.prototype._init = function(){
    var self = this;
    if(self.isTemplate) return self;

    for(var elm of self.elements){
      for(var func in self.initFunctions)
      {
        self.initFunctions[func](elm);
      }
    }
    return self;
  }

  joon.prototype.on = function(selector, eventName){
    var self = this;

    document.addEventListener(eventName, function(e) {
        var target = e.target;
        while (target && target !== this) {
            if (target.matches(selector)) {
                self.run();
            }
            target = target.parentNode;
        }
    }, false);

    return self;
  }

  joon.prototype.at = function(...args){
    var self = this;
    if(arguments.length > 2){
      return self._atAction(args);
    }
    else{
      return self._atTemplate(args);
    }
  }

  joon.prototype._atAction = function([start, duration, func, ...funcArgs]){
    var self = this;

    var action = {name: func, completed: false, args: funcArgs, start: start, duration: duration};

    if(self.isTemplate){
      if(joon.templates[self.templateName]){
        joon.templates[self.templateName].push(action);
      }
      else{
        joon.templates[self.templateName] = [action];
      }
    }
    else{
      self.actions.push(action);
    }

    return self;
  }

  joon.prototype._atTemplate = function([start, templateName]){
    var self = this;
    if(joon.templates[templateName]){
      var templateActions = joon.templates[templateName];
      for(var action of templateActions) {
        self.actions.push({name: action.name, completed: false, args: action.args, start: start + action.start, duration: action.duration});
      }
    }
    return self;
  }

  joon.prototype.then = function(func){
    this.callback = func;
  }


  joon.prototype.run = function(){
    var self = this;
    self.actions.forEach(a => a.completed = false);
    self.actions.forEach(a => a.startTime = Date.now() + a.start * 1000);
    self.runActions();
  }

  joon.prototype.runActions = function(){
    var self = this;
    var actionsToRun = self.actions.filter(a => !a.completed);

    if(actionsToRun.length <= 0){
      if(self.callback) self.callback(self.elements);
      return;
    }

    for(var action of actionsToRun) {
        self[action.name](action, action.startTime, action.duration, action.args);
    }

    requestAnimationFrame(self.runActions.bind(self));
  }

  joon.prototype.loop = function(laps){
    var self = this;

    self.animationLength = calcAnimationLength(self.actions);
    var mainActions = deepCopy(self.actions);
    if(laps > 0){
      for(var i = 1; i <= laps; i++) {
        for(var action of mainActions){
          self.actions.push({name: action.name, completed: false, args: action.args, start: action.start + self.animationLength, duration: action.duration});
        }
        self.animationLength = calcAnimationLength(self.actions);
      };
    }

    return self;
  }

  joon.prototype.moveTo = function(action, startTime, duration, [x, y, tweenFunc, callback]){
    var self = this;
    var t = Date.now() - startTime;

    if(t < 0){
      return this;
    }

    if (t <= duration*1000) {
      for(var elm of self.elements) {
        var changeInX = typeof x == "string" ? parseFloat(x) : x - elm.initialX;
        var changeInY = typeof y == "string" ? parseFloat(y) : y - elm.initialY;
        elm.finalX = elm.initialX + changeInX;
        elm.finalY = elm.initialY + changeInY;
        var newX = changeInX != 0 ? tweenFunc(t, elm.initialX, changeInX, duration * 1000) : elm.initialX;
        var newY = changeInY != 0 ? tweenFunc(t, elm.initialY, changeInY, duration * 1000) : elm.initialY;

        elm.style.top = newX;
        elm.style.left = newY;
        elm.currentX = newX;
        elm.currentY = newY;
      }
    }
    else{
      action.completed = true;
      for(var elm of self.elements) {
        elm.style.top = elm.initialX = elm.currentX = elm.finalX;
        elm.style.left = elm.initialY = elm.currentY = elm.finalY;
      }
      if(callback) callback(self.elements);
    }

    return self;
  }

  joon.prototype.addContent = function(action, startTime, duration,[content, callback]){
    var self = this;
    var t = Date.now() - startTime;

    if(t < 0 || action.completed){
      return self;
    }

    for(var elm of self.elements) {
      elm.innerText = elm.innerText + content;
      action.completed = true;
      if(callback) callback(self.elements);
    }

    return self;
  }

  joon.prototype.fadeTo = function(action, startTime, duration, [fadeLevel, tweenFunc, callback]){
    var self = this;
    var t = Date.now() - startTime;

    if(t < 0){
      return this;
    }

    if (t <= duration*1000) {
      for(var elm of this.elements) {
        var changeInOpacity =  fadeLevel - elm.initialOpacity;
        var newOpacity = tweenFunc(t, elm.initialOpacity, changeInOpacity, duration * 1000);
        elm.style.opacity = newOpacity;
        elm.currentOpacity = newOpacity;
      }
    }
    else{
      action.completed = true;
      for(var elm of self.elements) {
        elm.style.opacity = elm.initialOpacity = elm.currentOpacity = fadeLevel;
      }
      if(callback) callback(self.elements);
    }

    return this;
  }

  joon.prototype.scaleTo = function(action, startTime, duration, [x, y, tweenFunc, callback]){
    var self = this;
    var t = Date.now() - startTime;
    if(t < 0){
      return this;
    }

    if (t <= duration*1000) {
      for(var elm of self.elements) {
        var changeInX = typeof x == "string" ? parseFloat(x) : x - elm.initialScaleX;
        var changeInY = typeof y == "string" ? parseFloat(y) : y - elm.initialScaleY;

        var newX = changeInX != 0 ? tweenFunc(t, elm.initialScaleX, changeInX, duration * 1000) : elm.initialScaleX;
        var newY = changeInY != 0 ? tweenFunc(t, elm.initialScaleY, changeInY, duration * 1000) : elm.initialScaleY;

        var scale = "scale(" + newY + ", " + newX + ")";
        setTransformFunc(elm, "scale", scale);
        elm.currentScaleX = newX;
        elm.currentScaleY = newY;
      }
    }
    else{
      action.completed = true;
      for(var elm of self.elements) {
        elm.initialScaleX = elm.currentScaleX = x;
        elm.initialScaleY = elm.currentScaleY = y;
        setTransformFunc(elm, "scale", "scale(" + y + ", " + x + ")");
      }
      if(callback) callback(self.elements);
    }

    return self;
  }

  joon.prototype.rotate = function(action, startTime, duration, [degree, tweenFunc, callback]){
    var self = this;
    var t = Date.now() - startTime;

    if(t < 0){
      return this;
    }

    if (t <= duration * 1000) {
      for(var elm of self.elements) {
        var changeInRotateDegree = typeof degree == "string" ? parseFloat(degree) : degree - elm.initialRotateDegree;

        var newRotateDegree = changeInRotateDegree != 0 ? tweenFunc(t, elm.initialRotateDegree, changeInRotateDegree, duration * 1000) : elm.initialRotateDegree;

        var rotate = "rotate(" + newRotateDegree + "deg)";
        setTransformFunc(elm, "rotate", rotate);
        elm.currentRotateDegree = newRotateDegree;
      }
    }
    else{
      action.completed = true;
      for(var elm of self.elements) {
        elm.initialRotateDegree = elm.currentRotateDegree = degree;
        setTransformFunc(elm, "rotate", "rotate(" + degree + "deg)");
      }
      if(callback) callback(self.elements);
    }

    return self;
  }

  joon.prototype.skew = function(action, startTime, duration, [x, y, tweenFunc, callback]){
    var self = this;
    var t = Date.now() - startTime;

    if(t < 0){
      return this;
    }

    if (t <= duration*1000) {
      for(var elm of self.elements) {
        var changeInX = typeof x == "string" ? parseFloat(x) : x - elm.initialSkewX;
        var changeInY = typeof y == "string" ? parseFloat(y) : y - elm.initialSkewY;

        var newX = changeInX != 0 ? tweenFunc(t, elm.initialSkewX, changeInX, duration * 1000) : elm.initialSkewX;
        var newY = changeInY != 0 ? tweenFunc(t, elm.initialSkewY, changeInY, duration * 1000) : elm.initialSkewY;

        var skew = "skew(" + newY + "deg, " + newX + "deg)";
        setTransformFunc(elm, "skew", skew);
        elm.currentSkewX = newX;
        elm.currentSkewY = newY;
      }
    }
    else{
      action.completed = true;
      for(var elm of self.elements) {
        elm.initialSkewX = elm.currentSkewX = x;
        elm.initialSkewY = elm.currentSkewY = y;
        setTransformFunc(elm, "skew", "skew(" + y + "deg, " + x + "deg)");
      }
      if(callback) callback(self.elements);
    }

    return self;
  }

  joon.prototype.changeColor = function(action, startTime, duration, [property, value, tweenFunc, callback]){
    var self = this;
    var t = Date.now() - startTime;

    if(t < 0){
      return this;
    }

    if (t <= duration*1000) {
      for(var elm of this.elements) {
        if(!elm.initialRgbColor)
        {
          elm.initialRgbColor = extractRgb(window.getComputedStyle(elm, null).getPropertyValue(property));
        }

        var finalRgbColor = hexToRgb(value);

        var changeInRgbColor = calcRgbDistance(elm.initialRgbColor, finalRgbColor);

        var newRed = Math.round(tweenFunc(t, elm.initialRgbColor[0], changeInRgbColor[0], duration * 1000));
        var newGreen = Math.round(tweenFunc(t, elm.initialRgbColor[1], changeInRgbColor[1], duration * 1000));
        var newBlue = Math.round(tweenFunc(t, elm.initialRgbColor[2], changeInRgbColor[2], duration * 1000));

        var newRgbColor = [newRed, newGreen, newBlue];
        elm.style[property] = rgbToHex(newRgbColor);

        elm.currentRgbColor = newRgbColor;
      }
    }
    else{
      action.completed = true;
      for(var elm of self.elements) {
        elm.style[property] = value;
        elm.initialRgbColor = elm.currentRgbColor = hexToRgb(value);
      }
      if(callback) callback(self.elements);
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

  function setTransformFunc(elm, funcName, newValue){
    var checkRegex = new RegExp(funcName, "i");
    var replaceRegex = new RegExp(funcName + "(?:.*?)\\)", "i");

    if(checkRegex.test(elm.style.transform)){
      elm.style.transform = elm.style.transform.replace(replaceRegex, newValue);
    }
    else{
      elm.style.transform += " " + newValue;
    }
  }

  function getTransformFunc(elm, funcName){
    var checkRegex = new RegExp(funcName, "i");
    var matchRegex = new RegExp(funcName + "\\((.*?)(?:(?:\\,)(.*?))?\\)", "i");
    var style = funcName == "moveTo"
    if(checkRegex.test(elm.style.transform)){
      return elm.style.transform.match(matchRegex);
    }
    else{
      return undefined;
    }
  }

  function deepCopy(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
  }



  function formatHex(hexInt) {
    var hex = hexInt.toString(16);
    while (hex.length < 6) { hex = '0' + hex; }
    return "#" + hex.split(".")[0];
  }

  function extractRgb(rgb){
    rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
    return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
  }

  function calcRgbDistance(from, to){
    return [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  }

  function rgbToHex(rgb) {
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
  }

  function hexToRgb(hex) {
      var result = /^#?([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2})$/i.exec(hex);

      if(result){
        result[1] = result[1].length == 1 ? result[1] + result[1] : result[1];
        result[2] = result[2].length == 1 ? result[2] + result[2] : result[2];
        result[3] = result[3].length == 1 ? result[3] + result[3] : result[3];
        return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
      }

      return null;
  }

  return function(selector){
    return new joon(selector)._init();
  };

})();
