window.$ = window.joon = (function(){
  'use strict';

  function joon(selector) {
    var self = this;

    if(selector.startsWith("@")){
      self.templateName = selector.substring(1);
      self.isTemplate = true;
    }
    else{
      self.selector = selector;
      self.elements = getElements(selector);
      self.animationLength = 0;
      self.totalLaps = 0;
      self.completedLaps = 0;
      self.actionIndex = 0;
    }

    self.actions = [];
    self.name = "this is joon.js";
  }

  joon.templates = {};

  joon.prototype.preRunFunctions = {
      moveTo: function(elm, [x, y]){
          elm.changeInX = calcChangeInValue(x, elm.initialX);
          elm.changeInY = calcChangeInValue(x, elm.initialY);

          elm.finalX = elm.initialX + elm.changeInX;
          elm.finalY = elm.initialY + elm.changeInY;
      },

      fadeTo: function(elm, [x]){
          elm.changeInOpacity =  calcChangeInValue(x, elm.initialOpacity);
          elm.finalOpacity = elm.initialOpacity + elm.changeInOpacity;
      },

      rotate: function(elm, [x, y, z]){
          elm.changeInRotateX = calcChangeInValue(x, elm.initialRotateX);
          elm.changeInRotateY = calcChangeInValue(y, elm.initialRotateY);
          elm.changeInRotateZ = calcChangeInValue(z, elm.initialRotateZ);

          elm.finalRotateX = elm.initialRotateX + elm.changeInRotateX;
          elm.finalRotateY = elm.initialRotateY + elm.changeInRotateY;
          elm.finalRotateZ = elm.initialRotateZ + elm.changeInRotateZ;
      },

      skew: function(elm, [x, y]){
          elm.changeInSkewX = calcChangeInValue(x, elm.initialSkewX);
          elm.changeInSkewY = calcChangeInValue(y, elm.initialSkewY);

          elm.finalSkewX = elm.initialSkewX + elm.changeInSkewX;
          elm.finalSkewY = elm.initialSkewY + elm.changeInSkewY;
      },

      scaleTo: function(elm, [x, y, z]){
          elm.changeInScaleX = calcChangeInValue(x, elm.initialScaleX);
          elm.changeInScaleY = calcChangeInValue(y, elm.initialScaleY);
          elm.changeInScaleZ = calcChangeInValue(z, elm.initialScaleZ);

          elm.finalScaleX = elm.initialScaleX + elm.changeInScaleX;
          elm.finalScaleY = elm.initialScaleY + elm.changeInScaleY;
          elm.finalScaleZ = elm.initialScaleZ + elm.changeInScaleZ;
      },

      changeColor: function(elm, [property, value]){
          if(!elm.initialRgbColor)
          {
            elm.initialRgbColor = extractRgb(window.getComputedStyle(elm, null).getPropertyValue(property));
          }

          elm.finalRgbColor = hexToRgb(value);

          elm.changeInRgbColor = calcRgbDistance(elm.initialRgbColor, elm.finalRgbColor);
      },

      change: function(elm, [property, value]){
          if(!hasInitValue(elm, property))
          {
              var isBorderWidth = property.toLowerCase() == "border-width";

                var initVal = !isBorderWidth ?
                                window.getComputedStyle(elm, null).getPropertyValue(property) :
                                window.getComputedStyle(elm, null).getPropertyValue("border-right-width");

                elm.initialPropValue[property] = parseFloat(initVal);
          }

          elm.changeInPropValue[property] = value - elm.initialPropValue[property];
          elm.finalPropValue[property] = elm.initialPropValue[property] + elm.changeInPropValue[property];
      }
  }

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
        var initialScale = getTransformFunc(elm, "scale3d");

        if(initialScale){
            elm.initialScaleX = parseFloat(initialScale[1]);
            elm.initialScaleY = parseFloat(initialScale[2]);
            elm.initialScaleZ = parseFloat(initialScale[3]);
            return;
        }

        initialScale = getTransformFunc(elm, "scale");

        if(initialScale){
            elm.initialScaleX = parseFloat(initialScale[1]);
            elm.initialScaleY = initialScale.length > 2 ? parseFloat(initialScale[2]) : parseFloat(initialScale[1]);
            elm.initialScaleZ = 1;
            return;
        }

         var initialScaleX = getTransformFunc(elm, "scaleX") || [0, "1"];
         var initialScaleY = getTransformFunc(elm, "scaleY") || [0, "1"];
         var initialScaleZ = getTransformFunc(elm, "ScaleZ") || [0, "1"];

         elm.initialScaleX = parseFloat(initialScaleX[1]);
         elm.initialScaleY = parseFloat(initialScaleY[1]);
         elm.initialScaleZ = parseFloat(initialScaleZ[1]);
    },

    rotate: function(elm){
        var initialRotate = getTransformFunc(elm, "rotate");

        if(initialRotate){
            elm.initialRotateX = parseFloat(initialRotate[1]);
            elm.initialRotateY = parseFloat(initialRotate[1]);
            return;
        }

         var initialRotateX = getTransformFunc(elm, "rotateX") || [0, "0deg"];
         var initialRotateY = getTransformFunc(elm, "rotateY") || [0, "0deg"];
         var initialRotateZ = getTransformFunc(elm, "rotateZ") || [0, "0deg"];

         elm.initialRotateX = parseFloat(initialRotateX[1]);
         elm.initialRotateY = parseFloat(initialRotateY[1]);
         elm.initialRotateZ = parseFloat(initialRotateZ[1]);
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
              self.completedLaps = 0;
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

    var action = {
      index: self.actionIndex++,
      name: func,
      completed: false,
      possibleArgs: funcArgs,
      possibleStarts: start,
      possibleDurations: duration
    };

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
        self.actions.push({
          index: action.index,
          name: action.name,
          completed: false,
          possibleArgs: action.possibleArgs,
          possibleStarts: RangeSum(action.possibleStarts, start),
          possibleDurations: action.possibleDurations});
      }
    }
    return self;
  }

  joon.prototype.then = function(func){
    this.callback = func;
    return this;
  }

  joon.prototype.run = function(){
    var self = this;
    for(var action of self.actions){
      action.completed = false;
      for(var elm of self.elements){
        if(!elm.actionsParameters) elm.actionsParameters = [];
        elm.actionsParameters[action.index] = {
          completed: false,
          args: getRandomParameters(action.possibleArgs),
          duration: getRandomNumericParameter(action.possibleDurations, true),
          startTime: Date.now() + getRandomNumericParameter(action.possibleStarts, true) * 1000
        };
        self.preRunFunctions[action.name](elm, elm.actionsParameters[action.index].args);
      }
    }
    self.runActions();
  }

  joon.prototype.runActions = function(){
    var self = this;

    var actionsToRun = self.actions.filter(a => !a.completed);

    if(actionsToRun.length == 0){

      self.completedLaps += 1;

      if(self.callback){
        self.callback(self.elements);
      }

      if(self.totalLaps == "infinite" || self.totalLaps > self.completedLaps)
      {
        self.run();
      }
    }
    else{
      for(var action of actionsToRun) {
        for(var elm of self.elements){
          self[action.name](action, elm, elm.actionsParameters[action.index].startTime, elm.actionsParameters[action.index].duration, elm.actionsParameters[action.index].args);
        }
      }

      requestAnimationFrame(self.runActions.bind(self));
    }
  }

  joon.prototype.loop = function(laps){
    var self = this;

    self.totalLaps = laps;

    return self;
  }

  joon.prototype.moveTo = function(action, elm, startTime, duration, [x, y, tweenFunc]){
    var self = this;

    var t = Date.now() - startTime;

    if(t < 0){
      return;
    }

    if (t < duration * 1000) {
      var newX = getNextStep(elm.initialX, elm.changeInX, t, duration, tweenFunc);
      var newY = getNextStep(elm.initialY, elm.changeInY, t, duration, tweenFunc);

      elm.style.top = newX;
      elm.style.left = newY;
    }
    else{
      elm.actionsParameters[action.index].completed = true;
      self._updateActionStatus(action);

      elm.style.top = elm.initialX = elm.finalX;
      elm.style.left = elm.initialY = elm.finalY;
    }
  }

  joon.prototype.addContent = function(action, elm, startTime, duration,[content]){
    var self = this;

    var t = Date.now() - startTime;

    if(t < 0 || action.completed){
      return;
    }

    elm.innerText = elm.innerText + content;
    elm.actionsParameters[action.index].completed = true;
    self._updateActionStatus(action);
  }

  joon.prototype.fadeTo = function(action, elm, startTime, duration, [fadeLevel, tweenFunc]){
    var self = this;
    var t = Date.now() - startTime;

    if(t < 0){
      return;
    }

    if (t < duration * 1000) {
      var newOpacity = getNextStep(elm.initialOpacity, elm.changeInOpacity, t, duration, tweenFunc);
      elm.style.opacity = newOpacity;
    }
    else{
      elm.actionsParameters[action.index].completed = true;
      self._updateActionStatus(action);

      elm.style.opacity = elm.initialOpacity = elm.finalOpacity;
    }
  }

  joon.prototype.scaleTo = function(action, elm, startTime, duration, [x, y, z, tweenFunc]){
    var self = this;

    var t = Date.now() - startTime;

    if(t < 0){
      return;
    }

    if (t < duration * 1000) {
      var newX = getNextStep(elm.initialScaleX, elm.changeInScaleX, t, duration, tweenFunc);
      var newY = getNextStep(elm.initialScaleY, elm.changeInScaleY, t, duration, tweenFunc);
      var newZ = getNextStep(elm.initialScaleZ, elm.changeInScaleZ, t, duration, tweenFunc);

      setTransformFunc(elm, "scaleX", "scaleX(" + newX + ")");
      setTransformFunc(elm, "scaleY", "scaleY(" + newY + ")");
      setTransformFunc(elm, "scaleZ", "scaleZ(" + newZ + ")");
    }
    else{
      elm.actionsParameters[action.index].completed = true;
      self._updateActionStatus(action);

      elm.initialScaleX = elm.finalScaleX;
      elm.initialScaleY = elm.finalScaleY;
      elm.initialScaleZ = elm.finalScaleZ;

      setTransformFunc(elm, "scaleX", "scaleX(" + elm.finalScaleX + ")");
      setTransformFunc(elm, "scaleY", "scaleY(" + elm.finalScaleY + ")");
      setTransformFunc(elm, "scaleZ", "scaleZ(" + elm.finalScaleZ + ")");
    }
  }

  joon.prototype.rotate = function(action, elm, startTime, duration, [x, y, z, tweenFunc]){
    var self = this;

    var t = Date.now() - startTime;

    if(t < 0){
      return;
    }

    if (t < duration * 1000) {
      var newX = getNextStep(elm.initialRotateX, elm.changeInRotateX, t, duration, tweenFunc);
      var newY = getNextStep(elm.initialRotateY, elm.changeInRotateY, t, duration, tweenFunc);
      var newZ = getNextStep(elm.initialRotateZ, elm.changeInRotateZ, t, duration, tweenFunc);

      setTransformFunc(elm, "rotateX", "rotateX(" + newX + "deg)");
      setTransformFunc(elm, "rotateY", "rotateY(" + newY + "deg)");
      setTransformFunc(elm, "rotateZ", "rotateZ(" + newZ + "deg)");
    }
    else{
      elm.actionsParameters[action.index].completed = true;
      self._updateActionStatus(action);

      elm.initialRotateX = elm.finalRotateX;
      elm.initialRotateY = elm.finalRotateY;
      elm.initialRotateZ = elm.finalRotateZ;

      setTransformFunc(elm, "rotateX", "rotateX(" + elm.finalRotateX + "deg)");
      setTransformFunc(elm, "rotateY", "rotateY(" + elm.finalRotateY + "deg)");
      setTransformFunc(elm, "rotateZ", "rotateZ(" + elm.finalRotateZ + "deg)");
    }
  }

  joon.prototype.skew = function(action, elm, startTime, duration, [x, y, tweenFunc]){
    var self = this;

    var t = Date.now() - startTime;

    if(t < 0){
      return;
    }

    if (t < duration * 1000) {
      var newX = getNextStep(elm.initialSkewX, elm.changeInSkewX, t, duration, tweenFunc);
      var newY = getNextStep(elm.initialSkewY, elm.changeInSkewY, t, duration, tweenFunc);

      var skew = "skew(" + newY + "deg, " + newX + "deg)";
      setTransformFunc(elm, "skew", skew);
    }
    else{
      elm.actionsParameters[action.index].completed = true;
      self._updateActionStatus(action);

      elm.initialSkewX = elm.finalSkewX;
      elm.initialSkewY = elm.finalSkewY;

      setTransformFunc(elm, "skew", "skew(" + elm.finalSkewY + "deg, " + elm.finalSkewX + "deg)");
    }
  }

  joon.prototype.changeColor = function(action, elm, startTime, duration, [property, value, tweenFunc]){
    var self = this;

    var t = Date.now() - startTime;

    if(t < 0){
      return;
    }

    if (t < duration * 1000) {
        var newRed = Math.round(getNextStep(elm.initialRgbColor[0], elm.changeInRgbColor[0], t, duration, tweenFunc));
        var newGreen = Math.round(getNextStep(elm.initialRgbColor[1], elm.changeInRgbColor[1], t, duration, tweenFunc));
        var newBlue = Math.round(getNextStep(elm.initialRgbColor[2], elm.changeInRgbColor[2], t, duration, tweenFunc));

        var newRgbColor = [newRed, newGreen, newBlue];
        elm.style[property] = rgbToHex(newRgbColor);
    }
    else{
      elm.actionsParameters[action.index].completed = true;
      self._updateActionStatus(action);

      elm.style[property] = value;
      elm.initialRgbColor = elm.finalRgbColor;
    }
  }

  joon.prototype.change = function(action, elm, startTime, duration, [property, value, tweenFunc]){
    var self = this;

    var t = Date.now() - startTime;

    if(t < 0){
      return;
    }

    var isBorderWidth = property.toLowerCase() == "border-width";

    if (t < duration * 1000) {
      var newValue = getNextStep(elm.initialPropValue[property], elm.ChangeInPropValue[property], t, duration, tweenFunc);

      if(isBorderWidth){
          setElmBorderWidth(elm, newValue);
      }
      else{
          elm.style[property] = newValue;
      }
    }
    else{
      elm.actionsParameters[action.index].completed = true;
      self._updateActionStatus(action);

      if(isBorderWidth){
          setElmBorderWidth(elm, elm.finalPropValue[property]);
      }
      else{
          elm.style[property] = elm.finalPropValue[property];
      }

      elm.initialPropValue[property] = elm.finalPropValue[property];
    }
  }

  joon.prototype._updateActionStatus = function(action){
    var notCompletedElements = 0;

    for(var elm of this.elements){
      if(elm.actionsParameters[action.index].completed === false){
        notCompletedElements += 1;
      }
    }

    if(notCompletedElements == 0) action.completed = true;
  }

  function getElements(selector){

    if(isEmpty(selector)){
      return [];
    }

    return document.querySelectorAll(selector);
  }

  function setElmBorderWidth(elm, value){
    elm.style["border-right-width"] = value;
    elm.style["border-left-width"] = value;
    elm.style["border-top-width"] = value;
    elm.style["border-bottom-width"] = value;
  }

  function hasInitValue(elm, prop){
    if(!elm.initialPropValue){
      elm.initialPropValue = elm.currentPropValue = [];
    }

    return !isEmpty(elm.initialPropValue[prop]);
  }

  function isEmpty(val){
    return val === undefined || val === null || (typeof val == "string" && val.trim() === "");
  }

  function calcAnimationLength(actions){
    var sortedActions = actions.slice().sort(function(a, b) {
		    return (b.start + b.duration) - (a.start + a.duration);
		});

    return (sortedActions[0].start + sortedActions[0].duration);
  }

  function getRandomParameters(funcParameters){
    if(!funcParameters || funcParameters.length == 0){
      return undefined;
    }

    var choosenParameters = [];

    for (var i = 0; i <= funcParameters.length - 1; i++) {
      var param = funcParameters[i];

      if(typeof param == "string" || typeof param == "number")
        choosenParameters[i] = param;

        if(typeof param == "function")
            choosenParameters[i] = i < funcParameters.length - 1 ? param() : param;

      if(typeof param[0] == "string")
        choosenParameters[i] = getRandomStringParameter(param);

      if(typeof param[0] == "number")
        choosenParameters[i] = getRandomNumericParameter(param, true);
    }

    return choosenParameters;
  }

  function getRandomStringParameter(availParameters){
    if(typeof availParameters == "string") return availParameters;

    var randomIndex = getRandomInteger(0, availParameters.length - 1);

    return availParameters[randomIndex];
  }

  function getRandomNumericParameter(parameterRange, float){
    if(typeof parameterRange == "number") return parameterRange;

    if(parameterRange.length != 2){
      return 0;
    }

    if(float) return getRandomNumber(parameterRange[0], parameterRange[1]);

    return getRandomInteger(parameterRange[0], parameterRange[1]);
  }

  function getRandomInteger(min, max) {
      return Math.floor(getRandomNumber(min, max));
  }

  function getRandomNumber(min, max) {
      var rnd = (Math.random() * ((max - 1) - min + 1) + min).toFixed(2);
      return parseFloat(rnd);
  }

  function setTransformFunc(elm, funcName, newValue){
    var checkRegex = new RegExp(funcName, "i");
    var replaceRegex = new RegExp(funcName + "(?:.*?)\\)", "i");

    var elmCurrentTransform = getBrowserTransform(elm);

    if(checkRegex.test(elmCurrentTransform)){
      setBrowserTransform(elm, elmCurrentTransform.replace(replaceRegex, newValue));
    }
    else{
      setBrowserTransform(elm, elmCurrentTransform + " " + newValue);
    }
  }

  function getTransformFunc(elm, funcName){
    var checkRegex = new RegExp(funcName, "i");
    var matchRegex = new RegExp(funcName + "\\((.*?)(?:(?:\\,)(.*?)(?:(?:\\,)(.*?))?)?\\)", "i");

    var elmTransform = hasBrowserTransform(elm) ? getBrowserTransform(elm) : elm.style.transform;

    if(checkRegex.test(elmTransform)){
      return elmTransform.match(matchRegex);
    }
    else{
      return undefined;
    }
  }

  function hasBrowserTransform(elm) {
    return !isEmpty(elm.style.webkitTransform) ||
          !isEmpty(elm.style.MozTransform) ||
          !isEmpty(elm.style.msTransform) ||
          !isEmpty(elm.style.OpTransform);
  }

  function getBrowserTransform(elm){
    if(bowser.chrome || bowser.safari)
      return elm.style.webkitTransform;

    if(bowser.firefox)
      return elm.style.MozTransform;

    if(bowser.msie)
      return elm.style.msTransform;

    if(bowser.opera)
      return elm.style.OpTransform;

    return elm.style.transform;
  }

  function setBrowserTransform(elm, value){
    if(bowser.chrome || bowser.safari)
      elm.style.webkitTransform = value;

    if(bowser.firefox)
      elm.style.MozTransform = value;;

    if(bowser.msie)
      elm.style.msTransform = value;;

    if(bowser.opera)
      elm.style.OpTransform = value;;

    elm.style.transform = value;;
  }

  function RangeSum(range, number){
    if(typeof range == "number") return range + number;
    else return [range[0] + number, range[1] + number];
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

  function hasSign(param){
      return param.indexOf("+") > -1 || param.indexOf("-") > -1;
  }

  function getNextStep(initValue, changeInValue, t, duration, tweenFunc){
      return changeInValue != 0 ? tweenFunc(t, initValue, changeInValue, duration * 1000) : initValue;
  }

  function calcChangeInValue(val, initVal){
      return (typeof val == "string" && hasSign(val)) ? parseFloat(val) : parseFloat(val) - initVal;
  }

  return function(selector){
    return new joon(selector)._init();
  };

})();
