window.$ = window.joon = (function(){
    'use strict';

    function joon(selector) {
        var self = this;

        // @templateName
        // means you want to define a template (several actions together) to use in animations later
        if(selector.startsWith("@")){
          self._templateName = selector.substring(1);
          self._isTemplate = true;
        }
        // else you are defining an animation on elements
        // you can use all selectors supported by js document.querySelectorAll function
        else{
          self._selector = selector;
          self._elements = getElements(selector);
          self._totalLaps = 0;
          self._completedLaps = 0;
          // index of action in the list of actions
          self._actionIndex = 0;
        }

        // all of the actions defined on selected elements
        self._actions = [];

        self.name = "joon.js";
        self.description = "an animation library";
        self.author = "Mohsen Dorparasti";
    }

    // all of the templates defined by you
    joon._templates = {};

    /**
    * functions which will be used to calculate total change in values and final values of elements'
    * properties that are going to be manipulated by defined actions
    * for example change in and final values of top and left properties in moveTo action
    *
    * change is the difference between initial value and value provided through action parameter
    * final value is sum of initial value and the change
    **/
    joon.prototype._actionsCalculations = {
        moveTo: function(elm, [x, y]){
          elm.changeInX = calcChangeInValue(x, elm.initialX);
          elm.changeInY = calcChangeInValue(y, elm.initialY);

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
          // extract rgb equivalent of element's initial color
          if(!elm.initialRgbColor)
          {
              // this is an array containing [red, green, blue] values of initial rgb color
              elm.initialRgbColor = extractRgb(window.getComputedStyle(elm, null).getPropertyValue(property));
          }

          // this is an array containing [red, green, blue] values of final rgb color
          elm.finalRgbColor = hexToRgb(value);

          // this is an array containing [red, green, blue] distance between initial color and final color
          elm.changeInRgbColor = calcRgbDistance(elm.initialRgbColor, elm.finalRgbColor);
        },

        change: function(elm, [property, value]){
          // extract initial value of property
          if(!hasInitValue(elm, property))
          {
              // as window.getComputedStyle().getPropertyValue() contains border-width-right, border-width-left and ...
              // instead of border-width, we have to look for one of them instead of border-width
              var isBorderWidth = property.toLowerCase() == "border-width";

              var initVal = !isBorderWidth ?
                            window.getComputedStyle(elm, null).getPropertyValue(property) :
                            window.getComputedStyle(elm, null).getPropertyValue("border-right-width");

              elm.initialPropValue[property] = parseFloat(initVal);
          }

          elm.changeInPropValue[property] = value - elm.initialPropValue[property];
          elm.finalPropValue[property] = elm.initialPropValue[property] + elm.changeInPropValue[property];
        },

        changeBoxShadow: function(elm, [x, y, blur, spread, color]){
          elm.changeInBoxShadowX = calcChangeInValue(x, elm.initBoxShadowX);
          elm.changeInBoxShadowY = calcChangeInValue(y, elm.initBoxShadowY);
          elm.changeInBoxShadowBlur = calcChangeInValue(blur, elm.initBoxShadowBlur);
          elm.changeInBoxShadowSpread = calcChangeInValue(spread, elm.initBoxShadowSpread);
          elm.changeInBoxShadowColor = [calcChangeInValue(color[0], elm.initBoxShadowColor[0]), calcChangeInValue(color[1], elm.initBoxShadowColor[1]), calcChangeInValue(color[2], elm.initBoxShadowColor[2])];

          elm.finalBoxShadowX = elm.initBoxShadowX + elm.changeInBoxShadowX;
          elm.finalBoxShadowY = elm.initBoxShadowY + elm.changeInBoxShadowY;
          elm.finalBoxShadowBlur = elm.initBoxShadowBlur + elm.changeInBoxShadowBlur;
          elm.finalBoxShadowSpread = elm.initBoxShadowSpread + elm.changeInBoxShadowSpread;
          elm.finalBoxShadowColor = [elm.initBoxShadowColor[0] + elm.changeInBoxShadowColor[0], elm.initBoxShadowColor[1] + elm.changeInBoxShadowColor[1], elm.initBoxShadowColor[2] + elm.changeInBoxShadowColor[2]];
        },

        changeTextShadow: function(elm, [x, y, blur, color]){
          elm.changeInTextShadowX = calcChangeInValue(x, elm.initTextShadowX);
          elm.changeInTextShadowY = calcChangeInValue(y, elm.initTextShadowY);
          elm.changeInTextShadowBlur = calcChangeInValue(blur, elm.initTextShadowBlur);
          elm.changeInTextShadowColor = [calcChangeInValue(color[0], elm.initTextShadowColor[0]), calcChangeInValue(color[1], elm.initTextShadowColor[1]), calcChangeInValue(color[2], elm.initTextShadowColor[2])];

          elm.finalTextShadowX = elm.initTextShadowX + elm.changeInTextShadowX;
          elm.finalTextShadowY = elm.initTextShadowY + elm.changeInTextShadowY;
          elm.finalTextShadowBlur = elm.initTextShadowBlur + elm.changeInTextShadowBlur;
          elm.finalTextShadowSpread = elm.initTextShadowSpread + elm.changeInTextShadowSpread;
          elm.finalTextShadowColor = [elm.initTextShadowColor[0] + elm.changeInTextShadowColor[0], elm.initTextShadowColor[1] + elm.changeInTextShadowColor[1], elm.initTextShadowColor[2] + elm.changeInTextShadowColor[2]];
        }
    }

    /**
    * functions which do the calculations for each step of each animation
    * e.g what should be each move (x, y) in the moveTo action
    **/
    joon.prototype._actionsStepFunctions = {

        moveTo: function(elm, t, duration, tweenFunc, [x, y]){
            // calc next steps
            var newX = getNextStep(elm.initialX, elm.changeInX, t, duration, tweenFunc);
            var newY = getNextStep(elm.initialY, elm.changeInY, t, duration, tweenFunc);

            // apply new values
            elm.style.top = newX;
            elm.style.left = newY;
        },

        fadeTo: function(elm, t, duration, tweenFunc, [x]){
            var newOpacity = getNextStep(elm.initialOpacity, elm.changeInOpacity, t, duration, tweenFunc);
            elm.style.opacity = newOpacity;
        },

        scaleTo: function(elm, t, duration, tweenFunc, [x, y, z]){
            var newX = getNextStep(elm.initialScaleX, elm.changeInScaleX, t, duration, tweenFunc);
            var newY = getNextStep(elm.initialScaleY, elm.changeInScaleY, t, duration, tweenFunc);
            var newZ = getNextStep(elm.initialScaleZ, elm.changeInScaleZ, t, duration, tweenFunc);

            setTransformFunc(elm, "scaleX", "scaleX(" + newX + ")");
            setTransformFunc(elm, "scaleY", "scaleY(" + newY + ")");
            setTransformFunc(elm, "scaleZ", "scaleZ(" + newZ + ")");
        },

        rotate: function(elm, t, duration, tweenFunc, [x, y, z]){
            var newX = getNextStep(elm.initialRotateX, elm.changeInRotateX, t, duration, tweenFunc);
            var newY = getNextStep(elm.initialRotateY, elm.changeInRotateY, t, duration, tweenFunc);
            var newZ = getNextStep(elm.initialRotateZ, elm.changeInRotateZ, t, duration, tweenFunc);

            setTransformFunc(elm, "rotateX", "rotateX(" + newX + "deg)");
            setTransformFunc(elm, "rotateY", "rotateY(" + newY + "deg)");
            setTransformFunc(elm, "rotateZ", "rotateZ(" + newZ + "deg)");
        },

        skew: function(elm, t, duration, tweenFunc, [x, y]){
            var newX = getNextStep(elm.initialSkewX, elm.changeInSkewX, t, duration, tweenFunc);
            var newY = getNextStep(elm.initialSkewY, elm.changeInSkewY, t, duration, tweenFunc);

            var skew = "skew(" + newY + "deg, " + newX + "deg)";
            setTransformFunc(elm, "skew", skew);
        },

        changeColor: function(elm, t, duration, tweenFunc, [property, value]){
            var newRed = Math.round(getNextStep(elm.initialRgbColor[0], elm.changeInRgbColor[0], t, duration, tweenFunc));
            var newGreen = Math.round(getNextStep(elm.initialRgbColor[1], elm.changeInRgbColor[1], t, duration, tweenFunc));
            var newBlue = Math.round(getNextStep(elm.initialRgbColor[2], elm.changeInRgbColor[2], t, duration, tweenFunc));

            var newRgbColor = [newRed, newGreen, newBlue];
            elm.style[property] = rgbToHex(newRgbColor);
        },

        change: function(elm, t, duration, tweenFunc, [property, value]){

            // as border-width is not available in the element.style[] list and we have
            // border-width-right, border-width-left, border-width-top and border-width-bottom
            // we need to apply new values to these 4 properties instead
            var isBorderWidth = property.toLowerCase() == "border-width";

            var newValue = getNextStep(elm.initialPropValue[property], elm.changeInPropValue[property], t, duration, tweenFunc);

            if(isBorderWidth){
                setElmBorderWidth(elm, newValue);
            }
            else{
                elm.style[property] = newValue;
            }
        },

        changeBoxShadow: function(elm, t, duration, tweenFunc, [x, y, blur, spread, color]){
            var newX = getNextStep(elm.initBoxShadowX, elm.changeInBoxShadowX, t, duration, tweenFunc);
            var newY = getNextStep(elm.initBoxShadowY, elm.changeInBoxShadowY, t, duration, tweenFunc);
            var newBlur = getNextStep(elm.initBoxShadowBlur, elm.changeInBoxShadowBlur, t, duration, tweenFunc);
            var newSpread = getNextStep(elm.initBoxShadowSpread, elm.changeInBoxShadowSpread, t, duration, tweenFunc);

            var newRed = Math.round(getNextStep(elm.initBoxShadowColor[0], elm.changeInBoxShadowColor[0], t, duration, tweenFunc));
            var newGreen = Math.round(getNextStep(elm.initBoxShadowColor[1], elm.changeInBoxShadowColor[1], t, duration, tweenFunc));
            var newBlue = Math.round(getNextStep(elm.initBoxShadowColor[2], elm.changeInBoxShadowColor[2], t, duration, tweenFunc));

            var newRule = "rgb(" + newRed + ", " + newGreen + ", " + newBlue + ") " + newX + "px " + newY + "px " + newBlur + "px " + newSpread +"px";

            elm.style["box-shadow"] = newRule;
        },

        changeTextShadow: function(elm, t, duration, tweenFunc, [x, y, blur, color]){
            var newX = getNextStep(elm.initTextShadowX, elm.changeInTextShadowX, t, duration, tweenFunc);
            var newY = getNextStep(elm.initTextShadowY, elm.changeInTextShadowY, t, duration, tweenFunc);
            var newBlur = getNextStep(elm.initTextShadowBlur, elm.changeInTextShadowBlur, t, duration, tweenFunc);

            var newRed = Math.round(getNextStep(elm.initTextShadowColor[0], elm.changeInTextShadowColor[0], t, duration, tweenFunc));
            var newGreen = Math.round(getNextStep(elm.initTextShadowColor[1], elm.changeInTextShadowColor[1], t, duration, tweenFunc));
            var newBlue = Math.round(getNextStep(elm.initTextShadowColor[2], elm.changeInTextShadowColor[2], t, duration, tweenFunc));

            var newRule = "rgb(" + newRed + ", " + newGreen + ", " + newBlue + ") " + newX + "px " + newY + "px " + newBlur + "px";
            elm.style["text-shadow"] = newRule;
        }
    }

    /**
    * functions which finalize the animation
    * which is taking the element to the final condition
    **/
    joon.prototype._actionsFinalStepFunctions = {

        moveTo: function(elm, [x, y]){
            // update element position and initial values
            elm.style.top = elm.initialX = elm.finalX;
            elm.style.left = elm.initialY = elm.finalY;
        },

        fadeTo: function(elm, [x]){
            elm.style.opacity = elm.initialOpacity = elm.finalOpacity;
        },

        scaleTo: function(elm, [x, y, z]){
            elm.initialScaleX = elm.finalScaleX;
            elm.initialScaleY = elm.finalScaleY;
            elm.initialScaleZ = elm.finalScaleZ;

            setTransformFunc(elm, "scaleX", "scaleX(" + elm.finalScaleX + ")");
            setTransformFunc(elm, "scaleY", "scaleY(" + elm.finalScaleY + ")");
            setTransformFunc(elm, "scaleZ", "scaleZ(" + elm.finalScaleZ + ")");
        },

        rotate: function(elm, [x, y, z]){
            elm.initialRotateX = elm.finalRotateX;
            elm.initialRotateY = elm.finalRotateY;
            elm.initialRotateZ = elm.finalRotateZ;

            setTransformFunc(elm, "rotateX", "rotateX(" + elm.finalRotateX + "deg)");
            setTransformFunc(elm, "rotateY", "rotateY(" + elm.finalRotateY + "deg)");
            setTransformFunc(elm, "rotateZ", "rotateZ(" + elm.finalRotateZ + "deg)");
        },

        skew: function(elm, [x, y]){
            elm.initialSkewX = elm.finalSkewX;
            elm.initialSkewY = elm.finalSkewY;

            setTransformFunc(elm, "skew", "skew(" + elm.finalSkewY + "deg, " + elm.finalSkewX + "deg)");
        },

        changeColor: function(elm, [property, value]){
            elm.style[property] = elm.finalRgbColor;
            elm.initialRgbColor = elm.finalRgbColor;
        },

        change: function(elm, [property, value]){
            // as border-width is not available in the element.style[] list and we have
            // border-width-right, border-width-left, border-width-top and border-width-bottom
            // we need to apply new values to these 4 properties instead
            var isBorderWidth = property.toLowerCase() == "border-width";

            if(isBorderWidth){
                setElmBorderWidth(elm, elm.finalPropValue[property]);
            }
            else{
                elm.style[property] = elm.finalPropValue[property];
            }

            elm.initialPropValue[property] = elm.finalPropValue[property];
        },

        changeBoxShadow: function(elm, [x, y, blur, spread, color]){
            elm.initBoxShadowX = elm.finalBoxShadowX;
            elm.initBoxShadowY = elm.finalBoxShadowY;
            elm.initBoxShadowBlur = elm.finalBoxShadowBlur;
            elm.initBoxShadowSpread = elm.finalBoxShadowSpread;
            elm.initBoxShadowColor = elm.finalBoxShadowColor;

            var finalRule = "rgb(" + elm.finalBoxShadowColor[0] + ", " + elm.finalBoxShadowColor[1] + ", " + elm.finalBoxShadowColor[2] + ") " + elm.finalBoxShadowX + "px " + elm.finalBoxShadowY + "px " + elm.finalBoxShadowBlur + "px " + elm.finalBoxShadowSpread +"px";

            elm.style["box-shadow"] = finalRule;
        },

        changeTextShadow: function(elm, [x, y, blur, color]){
            elm.initTextShadowX = elm.finalTextShadowX;
            elm.initTextShadowY = elm.finalTextShadowY;
            elm.initTextShadowBlur = elm.finalTextShadowBlur;
            elm.initTextShadowSpread = elm.finalTextShadowSpread;
            elm.initTextShadowColor = elm.finalTextShadowColor;

            var finalRule = "rgb(" + elm.finalTextShadowColor[0] + ", " + elm.finalTextShadowColor[1] + ", " + elm.finalTextShadowColor[2] + ") " + elm.finalTextShadowX + "px " + elm.finalTextShadowY + "px " + elm.finalTextShadowBlur + "px";
            elm.style["text-shadow"] = finalRule;
        }
    }

    /**
    * functions which will be called once at the beginning of animation to get initial values of elements'
    * properties that are going to be manipulated by defined actions
    * for example initial values of scaleX, scaleY and scaleZ in scaleTo action
    **/
    joon.prototype._initFunctions = {
        moveTo: function(elm){
            // get translate(x, y) values if they are set in style
            var initialTranslate = getTransformFunc(elm, "translate") || [0, 0, 0];

            // get element's initial top and left
            var initialTop = window.getComputedStyle(elm, null).getPropertyValue("top");
            var initialLeft = window.getComputedStyle(elm, null).getPropertyValue("left");

            // initial values are sum of initial top and left and translation applied to them
            // e.g if element's top is 10px and it's translated 30px then initial value would be 40px.
            elm.initialX = parseFloat(initialTranslate[2]) + parseFloat(initialTop);
            elm.initialY = parseFloat(initialTranslate[1]) + parseFloat(initialLeft);
        },

        fadeTo: function(elm){
          elm.initialOpacity = elm.style.opacity || 1;
        },

        scaleTo: function(elm){
            //to get initial scale value of element
            // first we check if scale3d() is defined for element
            var initialScale = getTransformFunc(elm, "scale3d");

            if(initialScale){
                elm.initialScaleX = parseFloat(initialScale[1]);
                elm.initialScaleY = parseFloat(initialScale[2]);
                elm.initialScaleZ = parseFloat(initialScale[3]);
            }
            // else look for scale()
            else{
                initialScale = getTransformFunc(elm, "scale");

                if(initialScale){
                    elm.initialScaleX = parseFloat(initialScale[1]);
                    elm.initialScaleY = initialScale.length > 2 ? parseFloat(initialScale[2]) : parseFloat(initialScale[1]);
                    elm.initialScaleZ = 1;
                }
                // finally look for scaleX(), scaleY() and scaleZ()
                else{
                     var initialScaleX = getTransformFunc(elm, "scaleX") || [0, "1"];
                     var initialScaleY = getTransformFunc(elm, "scaleY") || [0, "1"];
                     var initialScaleZ = getTransformFunc(elm, "ScaleZ") || [0, "1"];

                     elm.initialScaleX = parseFloat(initialScaleX[1]);
                     elm.initialScaleY = parseFloat(initialScaleY[1]);
                     elm.initialScaleZ = parseFloat(initialScaleZ[1]);
                 }
            }
        },

        rotate: function(elm){
            // to get initial rotate value of element
            // first we check if rotate() is defined for element
            var initialRotate = getTransformFunc(elm, "rotate");

            if(initialRotate){
                elm.initialRotateX = parseFloat(initialRotate[1]);
                elm.initialRotateY = parseFloat(initialRotate[1]);
                return;
            }

            // else we should look for rotateX(), rotateY() and rotateZ()
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
        },

        changeBoxShadow: function(elm){
            var initValue = window.getComputedStyle(elm, null).getPropertyValue("box-shadow");

            // if no box-shadow is defined, set all initial values as 0 and color as white
            if(initValue === "none"){
                elm.initBoxShadowX = 0;
                elm.initBoxShadowY = 0;
                elm.initBoxShadowBlur = 0;
                elm.initBoxShadowSpread = 0;
                elm.initBoxShadowColor = [255, 255, 255];
            }
            // else extract values by usign regex
            // structure is box-shadow: rgb(red, green, blue) x y blur spread;
            else{
                var regex = new RegExp("\\((.*)\\, (.*)\\, (.*)\\)(.*) (.*) (.*) (.*)", "i");
                var initValues = initValue.match(regex);
                elm.initBoxShadowX = parseFloat(initValues[4]);
                elm.initBoxShadowY = parseFloat(initValues[5]);
                elm.initBoxShadowBlur = parseFloat(initValues[6]);
                elm.initBoxShadowSpread = parseFloat(initValues[7]);
                elm.initBoxShadowColor = [parseFloat(initValues[1]), parseFloat(initValues[2]), parseFloat(initValues[3])];
            }
        },

        changeTextShadow: function(elm){
            var initValue = window.getComputedStyle(elm, null).getPropertyValue("text-shadow");

            // if no text-shadow is defined, set all initial values as 0 and color as white
            if(initValue === "none"){
                elm.initTextShadowX = 0;
                elm.initTextShadowY = 0;
                elm.initTextShadowBlur = 0;
                elm.initTextShadowColor = [255, 255, 255];
            }
            // else extract values by using regex
            // structure is text-shadow: rgb(red, green, blue) x y blur;
            else{
                var regex = new RegExp("\\((.*)\\, (.*)\\, (.*)\\)(.*) (.*) (.*)", "i");
                var initValues = initValue.match(regex);
                elm.initTextShadowX = parseFloat(initValues[4]);
                elm.initTextShadowY = parseFloat(initValues[5]);
                elm.initTextShadowBlur = parseFloat(initValues[6]);
                elm.initTextShadowColor = [parseFloat(initValues[1]), parseFloat(initValues[2]), parseFloat(initValues[3])];
            }
        },

        change: function(elm){
            // we extract initial value in _actionsCalculations()
            // because we need parameters like properyName to get the value
            elm.initialPropValue = [];
            elm.changeInPropValue = [];
            elm.finalPropValue = [];
        }
    }

    /**
      * _init() function is called in the constructor and calls all functions defined in _initFunctions
      * to extract initial values of required properties of elements for each action
    **/
    joon.prototype._init = function(){
        var self = this;

        // do nothing if developer is defining a template
        if(self._isTemplate) return self;

        // else get required initial values of each element's properties for each action
        for(var elm of self._elements){
          for(var func in self._initFunctions)
          {
            self._initFunctions[func](elm);
          }
        }
        return self;
    }

    /**
      * _atAction() function adds actions to the animation/template actions list
      *
      * @param {(int|int[]|float|float[])} start - a number or an array containing min and max time at which the action should start ([0, 1] means between 0 and 1 second after animation starts)
      * @param {(int|int[]|float|float[])} duration - a number or an array containing min and max duration of action ([.5, 1] means it should lasts between .5 to 1 second)
      * @param {string} func - (don't provide if appending a template) name of action that you want to run at specified time (e.g moveTo or rotate)
      * @param {...args} funcArgs - (don't provide if appending a template) other parameters required by the action
    **/
    joon.prototype._atAction = function([start, duration, tweenFunc, func, ...funcArgs]){
        var self = this;

        var action = {
          index: self._actionIndex++,
          name: func,
          status: "not-started",
          possibleArgs: funcArgs,
          possibleStarts: start,
          possibleDurations: duration,
          tweenFunc: tweenFunc
        };

        if(self._isTemplate){
          if(joon._templates[self._templateName]){
            joon._templates[self._templateName].push(action);
          }
          else{
            joon._templates[self._templateName] = [action];
          }
        }
        else{
          self._actions.push(action);
        }

        return self;
    }

    /**
      * _atTemplate() function adds actions defined in the given template to the actions list of current animation
      *
      * @param {(int|int[]|float|float[])} start - a number or an array containing min and max time at which the action should start ([0, 1] means between 0 and 1 second after animation starts)
      * @param {string} templateName - name of template
    **/
    joon.prototype._atTemplate = function([start, templateName]){
        var self = this;

        if(joon._templates[templateName]){

            var templateActions = joon._templates[templateName];

            for(var action of templateActions) {
                self._actions.push({
                    index: self._actionIndex++,
                    name: action.name,
                    status: "not-started",
                    possibleArgs: action.possibleArgs,
                    // here we have to add the start parameter to the action start options.
                    // if template contains an action that starts at second 1
                    // and template is appended at second 2
                    // then the actual start time of the action would be second 3
                    possibleStarts: RangeSum(action.possibleStarts, start),
                    possibleDurations: action.possibleDurations,
                    tweenFunc: action.tweenFunc
                });
            }
        }

        return self;
    }

    /**
      * _runActions() function manages animation's running and loops
    **/
    joon.prototype._runActions = function(){
        var self = this;

        // filter actions that are not finished yet
        var actionsToRun = self._actions.filter(a => a.status !== "completed");

        // if all actions are completed
        if(actionsToRun.length == 0){

            self._completedLaps += 1;

            // call the callback function if there is any
            if(self._callback){
                self._callback(self._elements);
            }

            if(self._totalLaps == "infinite" || self._totalLaps > self._completedLaps)
            {
                self.run();
            }
        }
        else{
            for(var action of actionsToRun) {
                if(self._isSameActionInProgress(action)){
                    continue;
                }

                action.status = "in-progress";

                for(var elm of self._elements){
                  self._apply(action, elm);
                }
            }

            requestAnimationFrame(self._runActions.bind(self));
        }
    }

    /**
      * _apply() function manages steps of animations
      * this function is the one which calls _actionsCalculations() & _actionsStepFunctions() & _actionsFinalStepFunctions()
      *
      * @param {object} action - a reference to the action
      * @param {object} elm - a reference to the element
    **/
    joon.prototype._apply = function(action, elm){
        var self = this;

        // extracting parameters
        var startTime = elm.actionsParameters[action.index].startTime;
        var duration = elm.actionsParameters[action.index].duration;
        var tweenFunc = action.tweenFunc;
        var params = elm.actionsParameters[action.index].args;

        var t = Date.now() - startTime;

        // t < 0 means time for this action has not come yet. be patient
        if(t < 0){
            return;
        }

        // if change and final values are not calculated , do it now
        // this should happen once, I expect
        if(!elm.actionsParameters[action.index].calculated){
            self._actionsCalculations[action.name](elm, params);
            elm.actionsParameters[action.index].calculated = true;
        }

        // if still have time to animate the element, do it
        if (t < duration * 1000) {
            self._actionsStepFunctions[action.name](elm, t, duration, tweenFunc, params);
        }
        // if out of time , then jump to final values
        else{
            self._actionsFinalStepFunctions[action.name](elm, params);

            // now we can say the action is applied to the element
            elm.actionsParameters[action.index].applied = true;
            // if all elements has completed this action, then set action as completed
            self._updateActionStatus(action);
        }
    }

    /**
      * _isSameActionInProgress() function checks if another action of the same type is already in progress
      *
      *
      * @param {object} action - the action you want to check its similar in progress actions
    **/
    joon.prototype._isSameActionInProgress = function(action){
        var sameActionsInProgress = this._actions.filter(a => a.index != action.index && a.name === action.name && a.status === "in-progress");
        return sameActionsInProgress.length > 0;
    }

    /**
      * _updateActionStatus() function checks if the action is applied to all elements.if so, then
      * its .completed property would be true preventing it from running again.
      *
      *
      * @param {object} action - a reference to the action
    **/
    joon.prototype._updateActionStatus = function(action){
        var notCompletedElements = 0;

        for(var elm of this._elements){
          if(elm.actionsParameters[action.index].applied === false){
            notCompletedElements += 1;
          }
        }

        if(notCompletedElements == 0){
            action.status = "completed";
        }
    }




    /**
      * on() function enables you to bind start of the animation to an event
      *
      * @param {String} selector - elements that trigger the event like ".trigger"
      * @param {String} eventName - name of the event like "click"
    **/
    joon.prototype.on = function(selector, eventName){
        var self = this;

        // here we have defined a general eventListener on document
        // when the event is triggered we go up through parents till we find the one
        // which matchs the specified selector parameter. then we run the animation.
        document.addEventListener(eventName, function(e) {
            var target = e.target;

            // here "this" means "document"
            while (target && target !== this) {
                if (target.matches(selector)) {
                    self._completedLaps = 0;
                    self.run();
                    return;
                }
                target = target.parentNode;
            }
        }, false);

        return self;
    }

    /**
      * at() function is the main function of the library
      * by at() function you define at a specific time what action should runs and how long should it lasts
      *
      * @param {(int|int[]|float|float[])} start - a number or an array containing min and max time at which the action should start ([0, 1] means between 0 and 1 second after animation starts)
      * @param {(int|int[]|float|float[]|string)} duration_or_templateName - a number or an array containing min and max duration of action ([.5, 1] means it should lasts between .5 to 1 second) or name of template you want to append
      * @param {string} func - (don't provide if appending a template) name of action that you want to run at specified time (e.g moveTo or rotate)
      * @param {...args} funcArgs - (don't provide if appending a template) other parameters required by the action
    **/
    joon.prototype.at = function(...args){
        var self = this;

        // if there are more than 2 parameters, it means you are adding actions (either you are defining a template or an actual animation)
        if(arguments.length > 2){
          return self._atAction(args);
        }
        // else if there are only 2 parameters, it means you want to append a pre-defined template here
        // so we find the template and append all actions defined there to our list of actions
        else{
          return self._atTemplate(args);
        }
    }

    /**
      * then() function allows you to set a callback function to be called after the animation is completed
      *
      * @param {function} func - callback function
    **/
    joon.prototype.then = function(func){
        this._callback = func;
        return this;
    }

    /**
      * run() function is the one which triggers the animation. after you set all actions you should call run()
      * to start the animation except when you are defining a template or want to run the animation after an event
    **/
    joon.prototype.run = function(){
        var self = this;

        // we should reset actions and elements' parameters in each loop of run
        for(var action of self._actions){
            action.status = "not-started";

            for(var elm of self._elements){
                if(!elm.actionsParameters) elm.actionsParameters = [];

                elm.actionsParameters[action.index] = {
                    // change in Values and final values should be calculated again
                    calculated: false,
                    // is action applied on the element
                    applied: false,
                    // get a random value for each parameter from provided array
                    args: getRandomParameters(action.possibleArgs),
                    // get a random value for duration from provided array
                    duration: getRandomNumericParameter(action.possibleDurations, true),
                    // get a random value for startTime from provided array
                    startTime: Date.now() + getRandomNumericParameter(action.possibleStarts, true) * 1000
                };
            }
        }

        // now run actions
        self._runActions();
    }

    /**
      * loop() function allows you to say how many times animation should run
      *
      *
      * @param {(int|string)} laps - for infinite loops send word "infinite" as parameter
    **/
    joon.prototype.loop = function(laps){
        var self = this;

        self._totalLaps = laps;

        return self;
    }




    /**
      * getElements() function returns a list of all elements which match the specified selector
      *
      *
      * @param {string} selector - selection rule e.g "div" or ".className"
      * @return {Object[]}       matched elements
    **/
    function getElements(selector){
        if(isEmpty(selector)){
          return [];
        }

        return document.querySelectorAll(selector);
    }

    /**
      * setElmBorderWidth() function is a helper function for the change() function
      * if the property is "border-width" shorthand then we have to set the calculated value
      * to its 4 individual properties (right, left, top, bottom)
      *
      *
      * @param {object} elm - the element
      * @param {int} value - value for borders
    **/
    function setElmBorderWidth(elm, value){
        elm.style["border-right-width"] = value;
        elm.style["border-left-width"] = value;
        elm.style["border-top-width"] = value;
        elm.style["border-bottom-width"] = value;
    }

    /**
      * hasInitValue() function check if the initial value for the property is calculated or not
      * it is a helper function for change() function
      *
      *
      * @param {object} elm - the element
      * @param {int} prop - property to be checked
      * @return {bool}  true if has initial value , false if not
    **/
    function hasInitValue(elm, prop){
        return !isEmpty(elm.initialPropValue[prop]);
    }

    /**
      * isEmpty() function check if the provided value is empty or not
      * it checks for undefined, null and "" string
      *
      *
      * @param {object} val - the value
      * @return {bool}  true if empty , false if not
    **/
    function isEmpty(val){
        return val === undefined || val === null || (typeof val == "string" && val.trim() === "");
    }

    /**
      * getRandomParameters() function gets all parameters provided by the developer for an action
      * then loops through them one by one and randomly choose a value from the given range
      *
      *
      * @param {object[]} funcParameters - action parameters
      * @return {object[]}  an array of choosen values for each parameter
    **/
    function getRandomParameters(funcParameters){
        if(!funcParameters || funcParameters.length == 0){
            return undefined;
        }

        var choosenParameters = [];

        for (var i = 0; i <= funcParameters.length - 1; i++) {
            var param = funcParameters[i];

            // if it is just a string or number and not an array then there is no choice
            if(typeof param == "string" || typeof param == "number")
                choosenParameters[i] = param;

            // if it is a function then
            //  we invoke it and use the result as parameter value
            if(typeof param == "function")
                choosenParameters[i] = param();

            // if it is an array of strings we should choose one of its values randomly
            if(typeof param[0] == "string")
                choosenParameters[i] = getRandomStringParameter(param);

            // if it is an array of numbers we should choose a number from the given range
            if(typeof param[0] == "number")
                choosenParameters[i] = getRandomNumericParameter(param, true);
        }

        return choosenParameters;
    }

    /**
      * getRandomStringParameter() function chooses one value from a given array of strings randomly
      *
      *
      * @param {string[]} availValues - array of strings
      * @return {string}  choosen string
    **/
    function getRandomStringParameter(availValues){
        var randomIndex = getRandomInteger(0, availValues.length - 1);

        return availValues[randomIndex];
    }

    /**
      * getRandomNumericParameter() function chooses one value from a given range
      *
      *
      * @param {(float[]|int[])} parameterRange - an array with 2 members as min and max values
      * @param {bool} float - should the value be rounded or not
      * @return {(float|int)}  choosen value
    **/
    function getRandomNumericParameter(parameterRange, float){
        if(typeof parameterRange == "number") return parameterRange;

        if(parameterRange.length != 2){
          return parameterRange;
        }

        var rnd = (Math.random() * ((parameterRange[1] - 1) - parameterRange[0] + 1) + parameterRange[0]).toFixed(2);
        rnd = parseFloat(rnd);

        if(!float){
            rnd = Math.floor(rnd);
        }

        return rnd;
    }

    /**
      * setTransformFunc() replaces current value of the given transform function (rotate, scale, skew) with a new one
      * this function is used with rotate(), scaleTo() and skew() functions
      *
      *
      * @param {object} elm - the element
      * @param {string} funcName - name of the function (rotateX, scaleY or ...)
      * @param {string}  newValue - new value for the function (rotateX(20deg) or scaleY(.5))
    **/
    function setTransformFunc(elm, funcName, newValue){
        // regex to check if the function is defined in the transform rule
        var checkRegex = new RegExp(funcName, "i");
        // regex to replace current value with new value
        var replaceRegex = new RegExp(funcName + "(?:.*?)\\)", "i");

        // first we get the element's transform rule value for example "rotatex(20deg) skewY(10deg) translateX(10px)"
        var elmCurrentTransform = getBrowserTransform(elm);

        // if the given function already exists in the transform rule then replace it with new value
        if(checkRegex.test(elmCurrentTransform)){
            setBrowserTransform(elm, elmCurrentTransform.replace(replaceRegex, newValue));
        }
        else{
            // else append the value to the end of the transform rule
            setBrowserTransform(elm, elmCurrentTransform + " " + newValue);
        }
    }

    /**
      * getTransformFunc() extracts the current value for the given transform function
      *
      *
      * @param {object} elm - the element
      * @param {string} funcName - name of the function ("rotateX", "scaleY" or ...)
      * @return {string}  currentvalue of transform function - for example "rotateY(20deg)"
    **/
    function getTransformFunc(elm, funcName){
        var checkRegex = new RegExp(funcName, "i");
        var matchRegex = new RegExp(funcName + "\\((.*?)(?:(?:\\,)(.*?)(?:(?:\\,)(.*?))?)?\\)", "i");

        // if the browser specific version of transform rule is used in css then we extract that else use the main rule
        // e.g moz-transform or ms-transform
        var elmTransform = hasBrowserTransform(elm) ? getBrowserTransform(elm) : elm.style.transform;

        if(checkRegex.test(elmTransform)){
            return elmTransform.match(matchRegex);
        }
        else{
            return undefined;
        }
    }

    /**
      * hasBrowserTransform() checks if a browser-specific version of transform rule is used or not
      * it checks for webkit, moz, ms and op prefixed rules
      *
      * @param {object} elm - the element
      * @return {bool} true if it has and false if not
    **/
    function hasBrowserTransform(elm) {
        return !isEmpty(elm.style.webkitTransform) ||
              !isEmpty(elm.style.MozTransform) ||
              !isEmpty(elm.style.msTransform) ||
              !isEmpty(elm.style.OpTransform);
    }

    /**
      * getBrowserTransform() returns the browser-specific version of transform rule
      *
      * @param {object} elm - the element
      * @return {string} transform rule value
    **/
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

    /**
      * setBrowserTransform() set the browser-specific version of transform rule
      *
      * @param {object} elm - the element
      * @param {string} value - the new value for the transform rule
    **/
    function setBrowserTransform(elm, value){
        if(bowser.chrome || bowser.safari)
          elm.style.webkitTransform = value;

        if(bowser.firefox)
          elm.style.MozTransform = value;

        if(bowser.msie)
          elm.style.msTransform = value;

        if(bowser.opera)
          elm.style.OpTransform = value;

        elm.style.transform = value;
    }

    /**
      * RangeSum() adds a given number to members of an [min, max] array
      *
      * @param {(int[]|float[])} range - the [min, max] array
      * @param {(int|float)} number
      * @return {(int[]|float[])} the modified range
    **/
    function RangeSum(range, number){
        if(typeof range == "number") return range + number;
        else return [range[0] + number, range[1] + number];
    }

    /**
      * formatHex() gets a hex number and turns it into equivalent string (#abc123)
      *
      * @param {int} hexInt - hex number
      * @return {string} the hex equivalent string
    **/
    function formatHex(hexInt) {
        var hex = hexInt.toString(16);
        while (hex.length < 6) { hex = '0' + hex; }
        return "#" + hex.split(".")[0];
    }

    /**
      * extractRgb() gets a string containing rgb(red, green, blue) and returns an int array [red, green, blue]
      *
      * @param {string} rgb - rgb string "rgb(red, green, blue)"
      * @return {int[]} rgb array [red, green, blue]
    **/
    function extractRgb(rgb){
        rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
        return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
    }

    /**
      * calcRgbDistance() calculates the difference between 2 int array containing rgb colors
      *
      * @param {int[]} from - initial rgb array [red, green, blue]
      * @param {int[]} to - final rgb array [red, green, blue]
      * @return {int[]} change in rgb array [red, green, blue]
    **/
    function calcRgbDistance(from, to){
        return [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
    }

    /**
      * rgbToHex() converts a rgb int array [red, green, blue] into its hex equivalent string
      *
      * @param {int[]} rgb - rgb array [red, green, blue]
      * @return {string} hex string
    **/
    function rgbToHex(rgb) {
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }

        return "#" + hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
    }

    /**
      * hexToRgb() converts a hex string into its equivalent rgb int array [red, green, blue]
      *
      * @param {string} hex - hex string
      * @return {int[]} rgb array [red, green, blue]
    **/
    function hexToRgb(hex) {
        // here we extract parts of hex string, first pair for red, second pair for green and third for blue
        var result = /^#?([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2})$/i.exec(hex);

        if(result){
            // if any of parts consists of one digit , we make it two e.g #af2 -> #aaff22
            result[1] = result[1].length == 1 ? result[1] + result[1] : result[1];
            result[2] = result[2].length == 1 ? result[2] + result[2] : result[2];
            result[3] = result[3].length == 1 ? result[3] + result[3] : result[3];
            // then convert them back into rgb equivalents
            return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
        }

        return null;
    }

    /**
      * hasSign() checks whether the given string parameter contains + or - signs or not
      *
      * @param {string} param - parameter e.g "12" or "+45" or "foo"
      * @return {bool} true if it has a sign , false if not
    **/
    function hasSign(param){
        return param.indexOf("+") > -1 || param.indexOf("-") > -1;
    }

    /**
      * getNextStep() calcs next value in the animation based on given parameters
      *
      * @param {(int|float)} initValue - initial value of property
      * @param {(int|float)} changeInValue - total change in value of property
      * @param {(int|float)} t - passed time since the start of animation
      * @param {(int|float)} duration - total duration of animation
      * @param {function} tweenFunc - tweening function
      * @return {(int|float)} next value
    **/
    function getNextStep(initValue, changeInValue, t, duration, tweenFunc){
        return changeInValue != 0 ? tweenFunc(t, initValue, changeInValue, duration * 1000) : initValue;
    }

    /**
      * calcChangeInValue() calcs the difference between property's initial value and the final value
      *
      * @param {(int|float)} value - final value of property
      * @param {(int|float)} initVal - initial value of property
      * @return {(int|float)} change in value
    **/
    function calcChangeInValue(val, initVal){
        // if the val is of type string and has a sign ("+10") it means that it contains the amount of change we want
        // so we just parse it
        // on the other hand we calc the distance
        return (typeof val == "string" && hasSign(val)) ? parseFloat(val) : parseFloat(val) - initVal;
    }



    /**
     *  main constructor
     *
     * @param  {String} selector selector for elements to apply animations to
     * @return {Object} joon.js object
     */
    return function(selector){
        if (!selector || selector === "") {
            throw new Error("no selector is specified.");
        }

        return new joon(selector)._init();
    };

})();
