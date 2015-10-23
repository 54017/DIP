(function() {

	"use strict";

	var Util = {
        addHandler: function(ele, type, handler) {
            if (ele.addEventListener) {
                ele.addEventListener(type, handler, false);
            } else if (ele.attachEvent) {
                ele.attachEvent('on'+type, handler);
            } else {
                ele['on'+type] = handler;
            }
        }
     };

	var original, wrapper = document.getElementById('wrapper'), first = document.getElementById('first'), second = document.getElementById('second'), gray = document.getElementById('gray'), canvas, context, left, top, lineW, strokeColor, rawData, mouseDown;
	
	try {
		var oFReader = new FileReader();
	} catch(e) {
		alert("你的浏览器版本太低啦，请使用Chrome，Safari，火狐或者IE10及其以上的浏览器");
		return;
	}
	var readImage = function(obj, level) {
		var image = document.getElementById(obj);
		//将原图画在canvas上
		canvas = document.getElementById('original-canvas');
		try {
			context = canvas.getContext('2d');
		} catch(e) {
			alert("你的浏览器版本太低啦，请使用Chrome，Safari，火狐或者IE10及其以上的浏览器");
			return;
		}
		var height = image.height;
		var width = image.width;
		left = canvas.getBoundingClientRect().left;
		top = canvas.getBoundingClientRect().top;
		canvas.setAttribute('width', width);
		canvas.setAttribute('height', height);
		context.drawImage(image, 0, 0, width, height);
		try {
			rawData = context.getImageData(0, 0, width, height).data;
		} catch(e) {
			document.getElementById('message').style.display = 'block';
			wrapper.style.display = 'none';
		}
		//转化为常见的矩阵形式
		var b = [];
		var tempStart, num = 4*width;
		for (var i = 0; i < height; ++i) {
		    tempStart = i*num;
			b[i] = Array.prototype.slice.call(rawData, tempStart, tempStart + num);
		}
		return new imageProcessor(image, b, level);
	}

	//读取图片进行初始化处理
	var imageProcessor = function(obj, matrixData, level) {
		this.image = obj;
		this.width = obj.width;
		this.height = obj.height;
		this.level = typeof level !== 'undefined' ? level : 256;
		//二维灰度矩阵
		this.matrixData = matrixData;
	}

	imageProcessor.prototype = {
		constructor: imageProcessor,
		//最近邻插值算法
		scaleFirst: function(width, height) {
			//宽度缩放比例
			var scalingW = this.width/width;
			//高度缩放比例
			var scalingH = this.height/height;
			var resultMatrix = []; //目标图像灰度矩阵
			var tempRow = [];     //每一行的数组
			var rowNum, colNum;
			for (var i = 0; i < height; ++i) {
				tempRow = [];
				rowNum = parseInt(i*scalingH);
				for (var j = 0; j < width; ++j) {
					colNum = 4*parseInt(j*scalingW);
					tempRow[4*j] = this.matrixData[rowNum][colNum];           //R
					tempRow[4*j + 1] = this.matrixData[rowNum][colNum + 1];   //G
					tempRow[4*j + 2] = this.matrixData[rowNum][colNum + 2];	  //B
					tempRow[4*j + 3] = this.matrixData[rowNum][colNum + 3];	  //A
				}
				resultMatrix[i] = tempRow;
			}
			return this.draw(resultMatrix, width, height);
		},
		//双线性插值法
		scaleSecond: function(width, height) {
			//宽度缩放比例
			var scalingW = this.width/width;
			//高度缩放比例
			var scalingH = this.height/height;
			var resultMatrix = []; //目标图像灰度矩阵
			var tempRow = [];     //每一行的数组
			var virtualSrcH, virtualSrcW, h1, h2, w1, w2, u, v, first, second, third, fourth;
			for (var i = 0; i < height; ++i) {
				tempRow = [];
				virtualSrcH = i*scalingH;
				h1 = parseInt(virtualSrcH);
				h2 = h1 + 1;
				u = virtualSrcH - h1;
				if (h2 >= this.height) {
						h2 -= 1;
				}
				for (var j = 0; j < width; ++j) {
					virtualSrcW = j*scalingW;
					w1 = parseInt(virtualSrcW);
					w2 = w1 + 1;
					v = virtualSrcW - w1;
					if (w2 >= this.width) {
						w2 -= 1;
					}
					first = (1-u)*(1-v);
					second = (1-u)*v;
					third = (1-v)*u;
					fourth = u*v;
					tempRow[4*j] = first*this.matrixData[h1][4*w1] + second*this.matrixData[h1][4*w2] + third*this.matrixData[h2][4*w1] + fourth*this.matrixData[h2][4*w2];
					tempRow[4*j + 1] = first*this.matrixData[h1][4*w1 + 1] + second*this.matrixData[h1][4*w2 + 1] + third*this.matrixData[h2][4*w1 + 1] + fourth*this.matrixData[h2][4*w2 + 1];
					tempRow[4*j + 2] = first*this.matrixData[h1][4*w1 + 2] + second*this.matrixData[h1][4*w2 + 2] + third*this.matrixData[h2][4*w1 + 2] + fourth*this.matrixData[h2][4*w2 + 2];
					tempRow[4*j + 3] = tempRow[4*j + 3] = first*this.matrixData[h1][4*w1 + 3] + second*this.matrixData[h1][4*w2 + 3] + third*this.matrixData[h2][4*w1 + 3] + fourth*this.matrixData[h2][4*w2 + 3];
				}
				resultMatrix[i] = tempRow;
			}
			return this.draw(resultMatrix, width, height);
		},
		//三次卷积法
		scaleThird: function() {

		},
		quantize: function(level) {
			var spacing = parseInt((this.level)/level);
			var d = parseInt((this.level - 1)/(level - 1)); //就是等差数列里面的d
			var resultMatrix = [];
			var tempRow = [], gray, num, level = this.level;
			for (var i = this.height - 1; i >= 0; --i) {
				tempRow = [];
				for (var j = this.width - 1; j >= 0; --j) {
					gray = this.matrixData[i][4*j]*0.299 + this.matrixData[i][4*j + 1]*0.587 + this.matrixData[i][4*j + 2] *0.114;
					num = parseInt(gray/spacing)*d;
					tempRow[4*j] = num;
					tempRow[4*j + 1] = num;
					tempRow[4*j + 2] = num;
					tempRow[4*j + 3] = level;
				}
				resultMatrix[i] = tempRow;
			}
			return this.draw(resultMatrix, this.width, this.height);
		},
		draw: function(matrix, width, height) {
			var canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			var ctx = canvas.getContext('2d');
			var resultImg = ctx.createImageData(width, height);
			var tempStart, num = 4*width;
			for (var i = 0; i < height; ++i) {
				tempStart = i*num;
				for (var j = 0; j < width; ++j) {
					resultImg.data[tempStart + 4*j] = matrix[i][4*j];
					resultImg.data[tempStart + 4*j + 1] = matrix[i][4*j + 1];
					resultImg.data[tempStart + 4*j + 2] = matrix[i][4*j + 2];
					resultImg.data[tempStart + 4*j + 3] = matrix[i][4*j + 3];
				}
			}
			ctx.putImageData(resultImg, 0, 0)
			return canvas;
		}
	}

	var bindEvent = function() {
		var buttons = document.getElementById('button-group-scale');
		var buttonsGray = document.getElementById('button-group-gray');
		Util.addHandler(buttons, 'click', function(e) {
			var button = e.target;
			if (e.target.tagName.toLowerCase() != 'button') {return;}
			if (e.target.id == 'submit') {
				var width = document.getElementById('input-width').value;
				var height = document.getElementById('input-height').value;
				if (width*height > 8000000) {
					alert("你设置的值太大了,窗口都要装不下了（程序跑这么大的图也很慢23333）");
					return;
				}
				var result = original.scaleFirst(width, height);
				var resultSecond = original.scaleSecond(width, height);
			} else {
				var result = original.scaleFirst(button.getAttribute('data-width'), button.getAttribute('data-height'));
				var resultSecond = original.scaleSecond(button.getAttribute('data-width'), button.getAttribute('data-height'));
			}
			if (first.lastChild) {
				first.removeChild(first.lastChild);
			}
			if (second.lastChild) {
				second.removeChild(second.lastChild);
			}
			first.appendChild(result);
			second.appendChild(resultSecond);
			first.style.display = 'block';
			second.style.display = 'block';
			gray.style.display = 'none';
		});
		Util.addHandler(buttonsGray, 'click', function(e) {
			var button = e.target;
			if (e.target.tagName.toLowerCase() != 'button') {return;}
			var level = button.getAttribute('data-level');
			var result = original.quantize(level);
			if (gray.lastChild) {
				gray.removeChild(gray.lastChild);
			}
			first.style.display = 'none';
			second.style.display = 'none';
			gray.style.display = 'block';
			gray.appendChild(result);
		})		

		//本地预览
		Util.addHandler(oFReader, 'load', function(e) {
			document.getElementById("original-image").src = e.target.result;
			setTimeout(function() {
				original = readImage('original-image');
			}, 10);
		})

		//上传文件事件
		var reader = document.getElementsByClassName("reader")[0];
		Util.addHandler(reader, 'change', function(e) {
			if (reader.files.length === 0) {
				return;
			}
			var oFile = reader.files[0];
  			oFReader.readAsDataURL(oFile);
		});

		//画画板
		Util.addHandler(canvas, 'mousedown', function(e) {
			
			context.beginPath();
			context.lineWidth = parseInt(lineW);
			context.strokeStyle = '#' + strokeColor; 
			mouseDown = true;
		})

		Util.addHandler(canvas, 'mouseup', function(e) {
			
			mouseDown = false;
		})

		Util.addHandler(canvas, 'mousemove', function(e) {
			if (mouseDown) {
				var x = e.pageX - left;
				var y = e.pageY - top;
				context.lineTo(x, y);
				context.stroke();
			}
		})

		//颜色，线宽改变事件
		var colorInput = document.getElementById('color');
		Util.addHandler(colorInput, 'change', function(e) {
			strokeColor = colorInput.value;
		})

		var select = document.getElementById('select');
		Util.addHandler(select, 'change', function(e) {
			lineW = select.value;
			console.log(lineW);
		})

	};


	var init = function() {
		strokeColor = '#FFFFFF';
		lineW = 1;
		original = readImage('original-image');
		bindEvent();
	}

	window.onload = init;
}())