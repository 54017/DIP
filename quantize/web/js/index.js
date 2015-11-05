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
		return new imageProcessor(image, level);
	}

	//读取图片进行初始化处理
	var imageProcessor = function(obj, level) {
		this.image = obj;
		this.width = obj.width;
		this.height = obj.height;
		this.level = typeof level !== 'undefined' ? level : 256;
		//二维矩阵
		this.matrixData = this.changeToMatrix(rawData);
		//灰度占数量直方图
		this.histogram = [];
		//累积概率
		this.cumulation = [];
		for (var i = 0; i <= 255; ++i) {
			this.histogram[i] = 0;
		}
		for (var i = 0, height = this.height; i < height; ++i) {
			for (var j = 0, width = this.width; j < width; ++j) {
				++this.histogram[parseInt(this.matrixData[i][4*j + 2])];
			}
		}
		this.hsiData = this.changeToHSI();
	}

	imageProcessor.prototype = {
		constructor: imageProcessor,
		changeToMatrix: function(rawData) {
			//转化为常见的矩阵形式（RGBA矩阵每行是4*width个）
			var b = [];
			var tempStart, num = 4*this.width;
			for (var i = 0, height = this.height; i < height; ++i) {
			    tempStart = i*num;
				b[i] = Array.prototype.slice.call(rawData, tempStart, tempStart + num);
			}
			return b;
		},
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
		//灰度
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
		//RGB转HSI
		changeToHSI: function() {
			//RGB转HSI
			var resultMatrix = [], tempRow = [], height = this.height, width = this.width;
			for (var i = 0; i < height; ++i) {
				tempRow = [];
				for (var j = 0; j < width; ++j) {
					var r = this.matrixData[i][4*j],
						g = this.matrixData[i][4*j + 1],
						b = this.matrixData[i][4*j + 2],
						intensity = (r + g + b)/3,
						num = 2*r - g - b,
						den = 2*Math.sqrt(Math.pow(r-g, 2) + (r-b)*(g-b)),
						theta = den < 0.001 ? Math.acos(num/0.001) : Math.acos(num/den);
					tempRow[4*j] = (g >= b) ? theta : (2*Math.PI - theta);         //H
					tempRow[4*j + 2] = intensity;  							       //I                 
					tempRow[4*j + 1] = (intensity == 0) ? 0 : 1 - Math.min(r, g, b)/intensity;//S
					tempRow[4*j + 3] = this.matrixData[i][4*j + 3];
				}
				resultMatrix[i] = tempRow;
			}
			return resultMatrix;
		},
		restoreToRGB: function(resultMatrix, width, height) {
			for (var i = 0; i < height; ++i) {
				for (var j = 0; j < width; ++j) {
					var h = resultMatrix[i][4*j],
						s = resultMatrix[i][4*j + 1],
						intensity = resultMatrix[i][4*j + 2];
					if (h >= 0 && h <= 2*Math.PI/3) {
						resultMatrix[i][4*j + 2] = intensity*(1 - s);
						resultMatrix[i][4*j] = intensity*(1 + s*Math.cos(h)/Math.cos(Math.PI/3 - h));
						resultMatrix[i][4*j + 1] = 3*intensity - resultMatrix[i][4*j] - resultMatrix[i][4*j + 2];
					} else if (h <= 4*Math.PI/3) {
						resultMatrix[i][4*j] = intensity*(1 - s);
						resultMatrix[i][4*j + 1] = intensity*(1 + s*Math.cos(h - 2*Math.PI/3)/Math.cos(Math.PI - h));
						resultMatrix[i][4*j + 2] = 3*intensity - resultMatrix[i][4*j] - resultMatrix[i][4*j + 1];
					} else {
						resultMatrix[i][4*j + 1] = intensity*(1 - s);
						resultMatrix[i][4*j + 2] = intensity*(1 + s*Math.cos(h - 4*Math.PI/3)/Math.cos(5*Math.PI/3-h));
						resultMatrix[i][4*j] = 3*intensity - resultMatrix[i][4*j + 2] - resultMatrix[i][4*j + 1];
					}
				}
			}
			return resultMatrix;
		},
		//直方图均衡化
		equalize: function() {
			var height = this.height, width = this.width;
			var resultMatrix = this.changeToHSI();
			//计算累积概率
			var sumPixels = width * height, level = this.level;
			for (var i = 0; i < level; ++i) {
					this.cumulation[i] = i == 0 ? this.histogram[i]/sumPixels : (this.histogram[i]/sumPixels + this.cumulation[i - 1]);
			}
			//对I直方图均衡化
			for (var i = 0; i < height; ++i) {
				for (var j = 0; j < width; ++j) {
					resultMatrix[i][4*j + 2] = this.cumulation[parseInt(resultMatrix[i][4*j + 2])]*level;
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//滤波
		filting: function(filter) {
			if (typeof filter[0] === 'undefined' || filter.length !== filter[0].length) {
				alert("传入的矩阵格式错误或者不是等行列，请换一个");
				return;
			}
			var length = (filter.length - 1)*2 + 1, num = length*length, half = parseInt(length/2);
			var width = this.width, height = this.height
			var sum, resultMatrix = this.changeToHSI(), tempRow = [];
			for (var i = 0; i < height; ++i) {
				for (var j = 0; j < width; ++j) {
					sum = 0;
					for (var k = -half; k <= half; ++k) {
						for (var v = -half; v <= half; ++v) {
							if (i + k < 0 || j + v < 0 || i + k > height - 1 || j + v > width - 1) {
							} else {
								sum += filter[k][v] * this.hsiData[i+k][4*(j+v) + 2];
							}
						}
					}
					resultMatrix[i][4*j+2] = sum;
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//高提升滤波
		rise: function(filter, k) {
			var average = this.filting(filter).canvas;
			var averageData = average.getContext('2d').getImageData(0, 0, average.width, average.height).data;
			var averageMatrix = this.changeToMatrix(averageData);
			for (var i = 0; i < this.height; ++i) {
				for (var j = 0; j < this.width; ++j) {
					averageMatrix[i][4*j] = this.matrixData[i][4*j] - averageMatrix[i][4*j];
					averageMatrix[i][4*j + 1] = this.matrixData[i][4*j + 1] - averageMatrix[i][4*j + 1];
					averageMatrix[i][4*j + 2] = this.matrixData[i][4*j + 2] - averageMatrix[i][4*j + 2];
				}
			}
			for (var i = 0; i < this.height; ++i) {
				for (var j = 0; j < this.width; ++j) {
					averageMatrix[i][4*j] = this.matrixData[i][4*j] + k*averageMatrix[i][4*j];
					averageMatrix[i][4*j + 1] = this.matrixData[i][4*j + 1] + k*averageMatrix[i][4*j + 1];
					averageMatrix[i][4*j + 2] = this.matrixData[i][4*j + 2] + k*averageMatrix[i][4*j + 2];
				}
			}
			return this.draw(averageMatrix, this.width, this.height);
		},
		//返回canvas元素
		draw: function(matrix, width, height) {
			var canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			var ctx = canvas.getContext('2d');
			var resultImg = ctx.createImageData(width, height);
			var tempStart, num = 4*width;
			var dstHistogram = [];   //目标图的直方图
			for (var i = 0, level = this.level; i < level; ++i) {
				dstHistogram[i] = 0;
			}
			for (var i = 0; i < height; ++i) {
				tempStart = i*num;
				for (var j = 0; j < width; ++j) {
					resultImg.data[tempStart + 4*j] = matrix[i][4*j];
					resultImg.data[tempStart + 4*j + 1] = matrix[i][4*j + 1];
					resultImg.data[tempStart + 4*j + 2] = matrix[i][4*j + 2];
					resultImg.data[tempStart + 4*j + 3] = matrix[i][4*j + 3];
					++dstHistogram[parseInt(matrix[i][4*j + 2])];
				}
			}
			ctx.putImageData(resultImg, 0, 0);
			return {
				canvas: canvas,
				histogram: dstHistogram
			};
		}
	}

	var bindEvent = function() {
		var buttons = document.getElementById('button-group-scale');
		var buttonsGray = document.getElementById('button-group-gray');
		//图像缩放
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
				var result = original.scaleFirst(width, height).canvas;
				var resultSecond = original.scaleSecond(width, height).canvas;
			} else {
				var result = original.scaleFirst(button.getAttribute('data-width'), button.getAttribute('data-height')).canvas;
				var resultSecond = original.scaleSecond(button.getAttribute('data-width'), button.getAttribute('data-height')).canvas;
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
		//灰度变换
		Util.addHandler(buttonsGray, 'click', function(e) {
			var button = e.target;
			if (e.target.tagName.toLowerCase() != 'button') {return;}
			var level = button.getAttribute('data-level');
			var result = original.quantize(level).canvas;
			if (gray.lastChild) {
				gray.removeChild(gray.lastChild);
			}
			first.style.display = 'none';
			second.style.display = 'none';
			gray.style.display = 'block';
			gray.appendChild(result);
		});	

		//本地预览
		Util.addHandler(oFReader, 'load', function(e) {
			document.getElementById("original-image").src = e.target.result;
			setTimeout(function() {
				original = readImage('original-image');
				//先删除之前的chart
				var canvas = document.getElementById('original-chart');
				canvas.parentNode.removeChild(canvas);
				canvas = document.createElement('canvas');
				canvas.setAttribute('id', 'original-chart');
				canvas.setAttribute('width', 400);
				canvas.setAttribute('height', 400);
				document.getElementsByClassName('histogram')[0].appendChild(canvas);
				var ctx = canvas.getContext('2d');
				var data = {};
				data.labels = [];
				for (var i = 0; i < 256; ++i) {
					data.labels[i] = i;
				}
				data.datasets = original.histogram;
				drawHistogram(ctx, data);
			}, 10);
		});

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
		});

		Util.addHandler(canvas, 'mouseup', function(e) {
			
			mouseDown = false;
		});

		Util.addHandler(canvas, 'mousemove', function(e) {
			if (mouseDown) {
				var x = e.pageX - left;
				var y = e.pageY - top;
				context.lineTo(x, y);
				context.stroke();
			}
		});

		//颜色，线宽改变事件
		var colorInput = document.getElementById('color');
		Util.addHandler(colorInput, 'change', function(e) {
			strokeColor = colorInput.value;
		});

		var select = document.getElementById('select');
		Util.addHandler(select, 'change', function(e) {
			lineW = select.value;
		});

		Util.addHandler(document.getElementById('button-group-equalize'), 'click', function(e) {
			if (e.target.className == 'equalize') {
				var result = original.equalize();
				var lastChild = document.getElementsByClassName('success')[0].lastChild
				if (lastChild) {
					document.getElementsByClassName('success')[0].removeChild(lastChild);
				}
				document.getElementsByClassName('success')[0].appendChild(result.canvas);
				document.getElementsByClassName('destination')[0].style.display = 'block';
				var canvas = document.getElementById('success-chart');
				canvas.parentNode.removeChild(canvas);
				canvas = document.createElement('canvas');
				canvas.setAttribute('id', 'success-chart');
				canvas.setAttribute('width', 400);
				canvas.setAttribute('height', 400);
				document.getElementsByClassName('success-histogram')[0].appendChild(canvas);
				var ctx = canvas.getContext('2d');
				var data = {};
				data.labels = [];
				for (var i = 0; i < 256; ++i) {
					data.labels[i] = i;
				}
				data.datasets = result.histogram;
				drawHistogram(ctx, data);
			}
		});
		//图像滤波
		Util.addHandler(document.getElementById('button-group-filting'), 'click', function(e) {
			var button = e.target, size = parseInt(button.getAttribute('data-size'));
			if (button.tagName.toLowerCase() !== 'button') {
				return;
			}
			var filter = [], tempRow = [];
			for (var i = parseInt(-size/2); i <= parseInt(size/2); ++i) {
				tempRow = [];
				for (var j = parseInt(-size/2); j <= parseInt(size/2); ++j) {
					tempRow[j] = 1/(size*size);
				}
				filter[i] = tempRow;
			}
			var result = original.filting(filter);
			document.body.appendChild(result.canvas);
		})

		//图像锐化
		Util.addHandler(document.getElementById('sharpen'), 'click', function(e) {
			var filter = [], tempRow = [], size = 3;
			for (var i = parseInt(-size/2); i <= parseInt(size/2); ++i) {
				tempRow = [];
				for (var j = parseInt(-size/2); j <= parseInt(size/2); ++j) {
					tempRow[j] = 1;
					if (i == 0 && j == 0) {
						tempRow[j] = -8;
					}
				}
				filter[i] = tempRow;
			}
			var result = original.filting(filter);
			document.body.appendChild(result.canvas);
		})

		//高提升滤波
		Util.addHandler(document.getElementById('rise'), 'click', function(e) {
			var k = 3;
			var filter = [], tempRow = [], size = 3;
			for (var i = parseInt(-size/2); i <= parseInt(size/2); ++i) {
				tempRow = [];
				for (var j = parseInt(-size/2); j <= parseInt(size/2); ++j) {
					tempRow[j] = 1/(size*size);
				}
				filter[i] = tempRow;
			}
			var result = original.rise(filter, k);
			document.body.appendChild(result.canvas);
		});
	};


	//生成直方图
	var drawHistogram = function(ctx, data) {
		var barChartData = {
    		labels: data.labels,
            datasets: [{
                label: 'numbers: ',
                backgroundColor: "rgba(220,220,220,1)",
                data: data.datasets
            }]
        };

		new Chart(ctx, {
            type: 'bar',
            data: barChartData,
            options: {
                responsive: false,
            }
    	});
	}


	var init = function() {
		strokeColor = '#FFFFFF';
		lineW = 1;
		original = readImage('original-image');
		var canvas = document.getElementById('original-chart');
		var ctx = canvas.getContext('2d');
		var data = {};
		data.labels = [];
		for (var i = 0; i < 256; ++i) {
			data.labels[i] = i;
		}
		data.datasets = original.histogram;
		drawHistogram(ctx, data);
		bindEvent();
	}

	window.onload = init;
}())