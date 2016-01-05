(function() {


	var stage, circles, rawData, offsetLeft, offsetTop, textStage, colors = ["rgb(52, 217, 244), rgb(255, 224, 40), rgb(80, 255, 38), rgb(253, 0, 32)"];

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
	var pixelate = function(context, height, width, state) {
		offsetLeft = (window.innerWidth - width)/2;
		offsetTop = (window.innerHeight - height)/2;
		try {
			rawData = context.getImageData(0, 0, width, height).data;
		} catch(e) {
			console.log(e);
		}
		var windowSize = 4,
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
	            	color = "rgb(" + r + ", " + g + ", " + b + ")";
	            if (resultMatrix[i][4 * j + 3] == 0 || (r < 200 && g < 200 && b < 200)) {
	            	continue;
	            }
	         	circle.radius = r;
	            circle.graphics.beginFill(color).drawCircle(0, 0, radius);
	            circle.x = Math.random() * window.innerWidth;
	            circle.y = Math.random() * window.innerHeight;
	            circle.originX = originX + offsetLeft;
	            circle.originY = originY + offsetTop;
	            circle.alpha = 0.2 + Math.random()*0.5;
	            stage.addChild(circle);
	            circles.push(circle);
	            tweenCircle(circle, state)
			}
    	}
	}

	var tweenCircle = function(c, state) {
		if(c.tween) c.tween.kill();
		if (state == 'in') {
			c.tween = TweenLite.to(c, 0.4, {x: c.originX, y: c.originY, ease:Quad.easeInOut, alpha: 1, radius: 5, scaleX: 0.4, scaleY: 0.4, onComplete: function() {
				tweenCircle(c, 'jiggle');
            }});
		} else if (state == 'float') {
			c.tween = TweenLite.to(c, 5 + Math.random()*3.5, {x: c.x + -100+Math.random()*200, y: c.y + -100+Math.random()*200, ease:Quad.easeInOut, alpha: 0.2 + Math.random()*0.5, onComplete: function() {
                tweenCircle(c, 'float');
            }});
		} else if (state == 'out') {
			c.tween = TweenLite.to(c, 0.8, {x: window.innerWidth*Math.random(), y: window.innerHeight*Math.random(), ease:Quad.easeInOut, alpha: 0.2 + Math.random()*0.5, scaleX: 1, scaleY: 1, onComplete: function() {
                tweenCircle(c, 'float');
            }});
		} else if (state == 'jiggle') {
			c.tween = TweenLite.to(c, 0.05, {x: c.originX + Math.random()*3, y: c.originY + Math.random()*3, ease:Quad.easeInOut,
                    onComplete: function() {
                        tweenCircle(c, 'jiggle');
                    }});
		}
	}

	var animate = function() {
        stage.update();
        requestAnimationFrame(animate);
    }

    

    var explode = function() {
    	for (var i = 0; i < circles.length; ++i) {
    		tweenCircle(circles[i], 'out');
    	}
    	setTimeout(function() {
    		formText("Final News");
    	}, 1000);
    }

    var formText = function(words) {
    	var text = new createjs.Text(words, "70px 'Source Sans Pro'", "green");
    	text.textAlign = 'center';
    	text.x = 350/2;
        textStage.addChild(text);
        textStage.update();
        var count = 0;
        var canvas = document.getElementById('text'),
        	context = canvas.getContext('2d');
        var width = canvas.width,
        	height = canvas.height;
        var pix = context.getImageData(0, 0, width, height).data;
       	var matrixData = changeToMatrix(pix, height, width);
        var textPixels = [];
        console.log(width)
        var offsetX = (window.innerWidth - width)/2,
			offsetY = (window.innerHeight - height)/2;
		var windowSize = 4, space = windowSize / 2;
		for(var i = 0; i < height - windowSize; i += windowSize) {
			for (j = 0; j < width - windowSize; j += windowSize) {
	            var	radius = Math.sqrt(windowSize * windowSize) / 2,
	            	originY = i + space,
	            	originX = j + space,
	            	r = parseInt(matrixData[i][4 * j]),
	            	g = parseInt(matrixData[i][4 * j + 1]),
	            	b = parseInt(matrixData[i][4 * j + 2]),
	            	color = colors[Math.floor(i%colors.length)];
	            if (matrixData[i][4 * j + 3] == 0) {
	            	continue;
	            }
	            ++count;
	         	circles[count].radius = r;
	            circles[count].graphics.beginFill(color);
	            
	            circles[count].originX = originX + offsetX;
	            circles[count].originY = originY + offsetY;
	            tweenCircle(circles[count], 'in')
			}
    	}
      	for (var i = count + 1; i < circles.length; ++i) {
      		TweenLite.to(circles[i], 0.4, {alpha: 0.1})
      	}
    }

	var init = function() {
		stage = new createjs.Stage('stage');
		stage.canvas.width = window.innerWidth;
		stage.canvas.height = window.innerHeight;
		textStage = new createjs.Stage('text');
		var image = document.getElementById('logo');
		//将原图画在canvas上
		var canvas = document.getElementById('logo-canvas'),
			height = image.height,
			width = image.width;
		canvas.width = width;
		canvas.height = height;
		try {
			var context = canvas.getContext('2d');
		} catch(e) {
			console.log(e)
			alert("你的浏览器版本太低啦，请使用Chrome，Safari，火狐或者IE10及其以上的浏览器");
			return;
		}	
		context.drawImage(image, 0, 0, width, height);
		pixelate(context, height, width, 'float');
		animate();
		setTimeout(function() {
			for (var i = 0; i < circles.length; ++i) {
				tweenCircle(circles[i], 'in')
			}
		}, 1500)
		setTimeout(function() {
			explode();
		}, 3000)
	}

	window.onload = init;
}())