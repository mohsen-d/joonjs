window.$ = window.joon = (function(){

  function joon(selector) {
    var self = this;
    self.elements = getElements(selector);
    self.name = "this is joon.js";
  }

  joon.prototype.printElements = function(){
    for (elm of this.elements) {
      console.log(elm);
    }
    return this;
  }

  joon.prototype.at = function(time, func, ...funcArgs){
    var self = this;
    setTimeout(function(){
      self[func](funcArgs);
    }, time*1000);
    return this;
  }

  joon.prototype.moveTo = function([x, y, duration, ease]){
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

  joon.prototype.fadeTo = function([fadeLevel, duration, ease]){
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

  return function(selector){
    return new joon(selector);
  };

})();
