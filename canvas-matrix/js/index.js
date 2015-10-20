(function() {

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

	var original, wrapper = document.getElementById('wrapper'), first = document.getElementById('first'), second = document.getElementById('second'), gray = document.getElementById('gray'), oFReader = new FileReader();
	
	var readImage = function(obj) {
		var image = document.getElementById(obj);
		//将原图画在canvas上
		var canvas = document.getElementById('original-canvas');
		try {
			var context = canvas.getContext('2d');
		} catch(e) {
			alert("你的浏览器版本太低啦，请使用Chrome，Safari，火狐或者IE9及其以上的浏览器");
			return;
		}
		var height = image.height;
		var width = image.width;
		canvas.setAttribute('width', width);
		canvas.setAttribute('height', height);
		console.log(width + " " + height + " " + image.src);
		context.drawImage(image, 0, 0, width, height);
		try {
			var rawData = context.getImageData(0, 0, width, height).data;
		} catch(e) {
			document.getElementById('message').style.display = 'block';
			wrapper.style.display = 'none';
		}
		//转化为常见的灰度矩阵形式
		var a = [];
		var b = [];
		for (var i = 0; i < height; ++i) {
			a = [];
			for (var j = 0; j < width; ++j) {
				a.push(0.299*rawData[4*i*width + 4*j] + 0.587*rawData[4*i*width + 4*j + 1] + 0.114*rawData[4*i*width + 4*j + 2])    //RGB转灰度
			}
			b[i] = a;
		}
		return new imageProcessor(image, b);
	}

	//读取图片进行初始化处理
	var imageProcessor = function(obj, matrixData) {
		this.image = obj;
		this.width = obj.width;
		this.height = obj.height;
		this.level = 256;
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
			for (var i = 0; i < height; ++i) {
				tempRow = [];
				for (var j = 0; j < width; ++j) {
					tempRow[j] = this.matrixData[parseInt(i*scalingH)][parseInt(j*scalingW)];
				}
				resultMatrix[i] = tempRow;
			}
			return this.grayToRGB(resultMatrix, width, height);
		},
		//双线性插值法
		scaleSecond: function(width, height) {
			//宽度缩放比例
			var scalingW = this.width/width;
			//高度缩放比例
			var scalingH = this.height/height;
			var resultMatrix = []; //目标图像灰度矩阵
			var tempRow = [];     //每一行的数组
			var virtualSrcH, virtualSrcW, h1, h2, w1, w2, u, v;
			for (var i = 0; i < height; ++i) {
				tempRow = [];
				for (var j = 0; j < width; ++j) {
					virtualSrcH = i*scalingH;
					virtualSrcW = j*scalingW;
					h1 = parseInt(virtualSrcH);
					h2 = h1 + 1;
					w1 = parseInt(virtualSrcW);
					w2 = w1 + 1;
					u = virtualSrcH - h1;
					v = virtualSrcW - w1;
					if (h2 >= this.height) {
						h2 -= 1;
					}
					if (w2 >= this.width) {
						w2 -= 1;
					}
					tempRow[j] = (1-u)*(1-v)*this.matrixData[h1][w1] + (1-u)*v*this.matrixData[h1][w2] + (1-v)*u*this.matrixData[h2][w1] + u*v*this.matrixData[h2][w2];
				}
				resultMatrix[i] = tempRow;
			}
			return this.grayToRGB(resultMatrix, width, height);
		},
		//三次卷积法
		scaleThird: function() {

		},
		quantize: function(level) {
			var spacing = parseInt((this.level)/level);
			var d = parseInt((this.level - 1)/(level - 1)); //就是等差数列里面的d
			var resultMatrix = [];
			var tempRow = [];
			for (var i = this.height - 1; i >= 0; --i) {
				tempRow = [];
				for (var j = this.width - 1; j >= 0; --j) {
					tempRow[j] = parseInt(this.matrixData[i][j]/spacing)*d;
				}
				resultMatrix[i] = tempRow;
			}
			return this.grayToRGB(resultMatrix, this.width, this.height);
		},
		grayToRGB: function(grayMatrix, width, height) {
			var canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			var ctx = canvas.getContext('2d');
			var resultImg = ctx.createImageData(width, height);
			for (var i = 0; i < height; ++i) {
				for (var j = 0; j < width; ++j) {
					var temp = grayMatrix[i][j];
					resultImg.data[4*i*width + 4*j] = temp;
					resultImg.data[4*i*width + 4*j + 1] = temp;
					resultImg.data[4*i*width + 4*j + 2] = temp;
					resultImg.data[4*i*width + 4*j + 3] = 255;
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
	};


	var init = function() {
		bindEvent();
		original = readImage('original-image');
	}

	window.onload = init;
}())