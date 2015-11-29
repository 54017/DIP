Util = (function() {

    var addHandler = function(ele, type, handler) {
        if (ele.addEventListener) {
            ele.addEventListener(type, handler, false);
        } else if (ele.attachEvent) {
            ele.attachEvent('on'+type, handler);
        } else {
            ele['on'+type] = handler;
        }
    }

    //创建正矩阵
	var createMatrix = function() {
	var length = arguments.length;
	var height = width = Math.sqrt(length);
	if (height * width != length) {
		alert("数量不能组成单位矩阵");
		return;
	}
	var resultMatrix = [];
	for (var i = 0; i < height; ++i) {
		var tempRow = [];
		for (var j = 0; j < width; ++j) {
			tempRow[j] = arguments[i*width + j];
		}
		resultMatrix[i] = tempRow;
	}
	return resultMatrix;
	}

	//灰度图的均值滤波
	var filting = function(original, filter) {
		if (typeof filter[0] === 'undefined' || typeof original[0] === 'undefined') {
					alert("矩阵传的不对！都没有第一行");
					return;
		}
		var tempRow = [], resultMatrix = [];
		var filterHeight = filter.length;
		var filterWidth = filter[0].length;
		var height = original.length;
		var width = original[0].length;
		for (var i = 0; i < height; ++i) {
			tempRow = [];
			for (var j = 0; j < width; ++j) {
				sum = 0;
				for (var k = 0; k < filterHeight; ++k) {
					for (var v = 0; v < filterWidth; ++v) {
						if (i + k -1 < 0 || j + v - 1 < 0 || i + k - 1 > height - 1 || j + v - 1 > width - 1) {
						} else {
							sum += filter[k][v] * original[i + k - 1][j + v - 1];
						}
					}
				}
				tempRow[j] = sum;
			}
			resultMatrix[i] = tempRow;
		}
		return resultMatrix;
	}

	//rawData转化为矩阵
	var changeToMatrix = function(rawData) {
			//转化为常见的矩阵形式（RGBA矩阵每行是4*width个）
			var b = [];
			var tempStart, num = 4*this.width;
			for (var i = 0, height = this.height; i < height; ++i) {
			    tempStart = i*num;
				b[i] = Array.prototype.slice.call(rawData, tempStart, tempStart + num);
			}
			return b;
		}

	return {
		createMatrix: createMatrix,
		filting: filting,
		addHandler: addHandler,
		changeToMatrix: changeToMatrix
	}

}());