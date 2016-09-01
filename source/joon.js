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
      self.totalLaps = 0;
      self.completedLaps = 0;
    }

    self.actions = [];
    self.name = "this is joon.js";
  }

  joon.templates = {};

  joon.prototype.initFunctions = {
    moveTo: function(elm){
      var initialPosition = getTransformFunc(elm, "translate") || [0, elm.offsetLeft, elm.offsetTop];
      elm.initialX = parseFloat(initialPosition[2]);
      elm.initialY = parseFloat(initialPosition[1]);
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

    for(elm of self.elements){
      for(var func in self.initFunctions)
      {
        self.initFunctions[func](elm);
      }
    }
    return self;
  }

  joon.prototype.on = function(selector, eventName){
    var self = this;
    var triggerElements = selector == "document" ? [document] : getElements(selector);

    if(triggerElements.length > 0){
      for (elm of triggerElements) {
        if (elm.addEventListener){
             elm.addEventListener(eventName, function(){
               self.completedLaps = 0;
                self.run();
             }, false);
          }
          else {
            elm.attachEvent('on' + eventName, function(){
                self.completedLaps = 0;
                self.run();
            });
          }
      }
    }

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
      for (action of templateActions) {
        self.actions.push({name: action.name, completed: false, args: action.args, start: start + action.start, duration: action.duration});
      }
    }
    return self;
  }

  joon.prototype.run = function(){
    var self = this;
    self.actions.forEach(a => a.startTime = Date.now() + a.start * 1000);
    self.runActions();
  }

  joon.prototype.runActions = function(){
    var self = this;
    var actionsToRun = self.actions.filter(a => !a.completed);

    if(actionsToRun.length <= 0){
      return;
    }

    for (action of actionsToRun) {
        self[action.name](action, action.startTime, action.duration, action.args);
    }

    requestAnimationFrame(self.runActions.bind(self));
  }

  joon.prototype.loop = function(laps){
    var self = this;

    self.animationLength = calcAnimationLength(self.actions);
    var mainActions = deepCopy(self.actions);
    if(laps > 0){
      for (var i = 1; i <= laps; i++) {
        for(action of mainActions){
          self.actions.push({name: action.name, completed: false, args: action.args, start: action.start + self.animationLength, duration: action.duration});
        }
        self.animationLength = calcAnimationLength(self.actions);
      };
    }

    return self;
  }

  joon.prototype.moveTo = function(action, startTime, duration, [x, y, tweenFunc]){
    var self = this;
    var t = Date.now() - startTime;

    if(t < 0){
      return this;
    }

    if (t <= duration*1000) {
      for (elm of self.elements) {
        var changeInX = typeof x == "string" ? parseFloat(x) : x - elm.initialX;
        var changeInY = typeof y == "string" ? parseFloat(y) : y - elm.initialY;

        var newX = changeInX != 0 ? tweenFunc(t, elm.initialX, changeInX, duration * 1000) : 0;
        var newY = changeInY != 0 ? tweenFunc(t, elm.initialY, changeInY, duration * 1000) : 0;

        var translate = "translate(" + (newY - elm.initialY) + "px," + (newX - elm.initialX) + "px)";

        setTransformFunc(elm, "translate", translate);
        elm.currentX = newX;
        elm.currentY = newY;
      }
    }
    else{
      action.completed = true;
      for (elm of self.elements) {
        elm.style.top = elm.initialX = elm.currentX;
        elm.style.left = elm.initialY = elm.currentY;
        setTransformFunc(elm, "translate", "translate(0, 0)");
      }
    }

    return self;
  }

  joon.prototype.fadeTo = function(action, startTime, duration, [fadeLevel, tweenFunc]){
    var self = this;
    var t = Date.now() - startTime;

    if(t < 0){
      return this;
    }

    if (t <= duration*1000) {
      for (elm of this.elements) {
        var changeInOpacity =  fadeLevel - elm.initialOpacity;
        var newOpacity = tweenFunc(t, elm.initialOpacity, changeInOpacity, duration * 1000);
        elm.style.opacity = newOpacity;
        elm.currentOpacity = newOpacity;
      }
    }
    else{
      action.completed = true;
      for (elm of self.elements) {
        elm.initialOpacity = elm.currentOpacity;
      }
    }

    return this;
  }

  joon.prototype.scaleTo = function(action, startTime, duration, [x, y, tweenFunc]){
    var self = this;
    var t = Date.now() - startTime;
    if(t < 0){
      return this;
    }

    if (t <= duration*1000) {
      for (elm of self.elements) {
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
      for (elm of self.elements) {
        elm.initialScaleX = elm.currentScaleX;
        elm.initialScaleY = elm.currentScaleY;
      }
    }

    return self;
  }

  joon.prototype.rotate = function(action, startTime, duration, [degree, tweenFunc]){
    var self = this;
    var t = Date.now() - startTime;

    if(t < 0){
      return this;
    }

    if (t <= duration * 1000) {
      for (elm of self.elements) {
        var changeInRotateDegree = typeof degree == "string" ? parseFloat(degree) : degree - elm.initialRotateDegree;

        var newRotateDegree = changeInRotateDegree != 0 ? tweenFunc(t, elm.initialRotateDegree, changeInRotateDegree, duration * 1000) : elm.initialRotateDegree;

        var rotate = "rotate(" + newRotateDegree + "deg)";
        setTransformFunc(elm, "rotate", rotate);
        elm.currentRotateDegree = newRotateDegree;
      }
    }
    else{
      action.completed = true;
      for (elm of self.elements) {
        elm.initialRotateDegree = elm.currentRotateDegree;
      }
    }

    return self;
  }

  joon.prototype.skew = function(action, startTime, duration, [x, y, tweenFunc]){
    var self = this;
    var t = Date.now() - startTime;

    if(t < 0){
      return this;
    }

    if (t <= duration*1000) {
      for (elm of self.elements) {
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
      for (elm of self.elements) {
        elm.initialSkewX = elm.currentSkewX;
        elm.initialSkewY = elm.currentSkewY;
      }
    }

    return self;
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
        for ( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for ( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
  }

  return function(selector){
    return new joon(selector)._init();
  };

})();
