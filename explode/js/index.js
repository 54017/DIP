(function() {

	"use strict";

	var stage, circles, rawData, windowSize = 6, offsetLeft, offsetTop;

	var changeToMatrix = function(rawData, height, width) {
		//转化为常见的矩阵形式（RGBA矩阵每行是4*width个）
		var b = [];
		var tempStart, num = 4*width;
		for (var i = 0; i < height; ++i) {
		    tempStart = i*num;
			b[i] = Array.prototype.slice.call(rawData, tempStart, tempStart + num);
		}
		return b;
	}

	//像素点化
	var pixelate = function() {
		var image = document.getElementById('logo');
		//将原图画在canvas上
		var canvas = document.getElementById('logo-canvas');
		try {
			var context = canvas.getContext('2d');
		} catch(e) {
			console.log(e)
			alert("你的浏览器版本太低啦，请使用Chrome，Safari，火狐或者IE10及其以上的浏览器");
			return;
		}
		var height = image.height,
			width = image.width;
		offsetLeft = (window.innerWidth - width)/2;
		offsetTop = (window.innerHeight - height)/2;
		console.log(offsetLeft)
		canvas.setAttribute('width', width);
		canvas.setAttribute('height', height);
		context.drawImage(image, 0, 0, width, height);
		try {
			rawData = context.getImageData(0, 0, width, height).data;
		} catch(e) {
			console.log(e);
		}
		var windowSize = 6,
			matrixData = changeToMatrix(rawData, height, width),
			resultMatrix = changeToMatrix(rawData, height, width);
		for (var k = 0; k < 3; ++k) {
			for (var i = 0; i < height - windowSize; i += windowSize) {
				var sum = 0
				for (var j = 0; j < width - windowSize; j += windowSize) {
					for (var v = 0; v < windowSize; ++v) {
						for (var t = 0; t < windowSize; ++t) {
							sum += matrixData[i + v][4 * (j + t) + k];
						}
					}
					sum = sum/(windowSize * windowSize);
					for (var v = 0; v < windowSize; ++v) {
						for (var t = 0; t < windowSize; ++t) {
							resultMatrix[i + v][4 * (j + t) + k] = sum;
						}
					}
				}
			}
		}
		//将像素化的图画出来
		var space = windowSize / 2;
		circles = []
		for(var i = 0; i < height - windowSize; i += windowSize) {
			for (j = 0; j < width - windowSize; j += windowSize) {
				var circle = new createjs.Shape(),
	            	radius = Math.sqrt(windowSize * windowSize) / 2,
	            	originY = i + space,
	            	originX = j + space,
	            	r = parseInt(resultMatrix[i][4 * j]),
	            	g = parseInt(resultMatrix[i][4 * j + 1]),
	            	b = parseInt(resultMatrix[i][4 * j + 2]),
	            	color = "rgba(" + r + ", " + g + ", " + b + ", " + 1 + ")";
	            if (resultMatrix[i][4 * j + 3] == 0 || (r < 120 && g < 120 && b < 120)) {
	            	continue;
	            }
	         	circle.radius = r;
	            circle.graphics.beginFill(color).drawCircle(0, 0, radius);
	            circle.x = Math.random() * window.innerWidth;
	            circle.y = Math.random() * window.innerHeight;
	            circle.originX = originX + offsetLeft;
	            circle.originY = originY + offsetTop;
	            console.log(originX, originY)
	            stage.addChild(circle);
	            circles.push(circle);
	            tweenCircle(circle, 'float')
			}
    	}
	}

	var tweenCircle = function(c, state) {
		if(c.tween) c.tween.kill();
		if (state == 'in') {
			c.tween = TweenLite.to(c, 0.4, {x: c.originX, y: c.originY, ease:Quad.easeInOut, alpha: 1, radius: 5, scaleX: 0.4, scaleY: 0.4, onComplete: function() {
                c.movement = 'jiggle';
                tweenCircle(c);
            }});
		} else if (state == 'float') {
			c.tween = TweenLite.to(c, 5 + Math.random()*3.5, {x: c.x + -100+Math.random()*200, y: c.y + -100+Math.random()*200, ease:Quad.easeInOut, alpha: 0.2 + Math.random()*0.5,
                    onComplete: function() {
                        tweenCircle(c, 'float');
                    }});
		}
	}

	var animate = function() {
        stage.update();
        requestAnimationFrame(animate);
    }

    var initCircles = function() {
    	circles = []
    	for(var i = 0; i < 300; ++i) {
			var circle = new createjs.Shape(),
            	radius = Math.sqrt(windowSize * windowSize) / 2,
            	x = window.innerWidth*Math.random(),
            	y = window.innerHeight*Math.random(),
            	r = parseInt(resultMatrix[i][4 * j]),
            	g = parseInt(resultMatrix[i][4 * j + 1]),
            	b = parseInt(resultMatrix[i][4 * j + 2]),
            	color = "rgba(" + r + ", " + g + ", " + b + ", " + 1 + ")";
            if (resultMatrix[i][4 * j + 3] == 0 || (r < 120 && g < 120 && b < 120)) {
            	continue;
            }
         	circle.radius = r;
            circle.graphics.beginFill(color).drawCircle(0, 0, radius);
            circle.x = y;
            circle.y = x;
            stage.addChild(circle);
            circls.push(circle);
    	}
    }

	var init = function() {
		stage = new createjs.Stage('stage');
		stage.canvas.width = window.innerWidth;
		stage.canvas.height = window.innerHeight;
		setTimeout(function() {
			pixelate();
			animate();
		}, 100)
		setTimeout(function(){
			for (var i = 0; i < circles.length; ++i) {
				tweenCircle(circles[i], 'in')
			}
		}, 1000)
	}

	window.onload = init;
}())