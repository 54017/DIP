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

	//创建全0矩阵
	var createZeroMatrix = function(width, height) {
		var resultMatrix = [],
			tempRow = [];
		for (i = 0; i < height; ++i) {
			tempRow = [];
			for (var j = 0; j < width; ++j) {
				for (var k = 0; k < 4; ++k) {
					tempRow.push(0);
				}
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
	var changeToMatrix = function(rawData, width, height) {
		//转化为常见的矩阵形式（RGBA矩阵每行是4*width个）
		var b = [];
		var tempStart, num = 4*width;
		for (var i = 0; i < height; ++i) {
		    tempStart = i*num;
			b[i] = Array.prototype.slice.call(rawData, tempStart, tempStart + num);
		}
		return b;
	}

	var draw = function(matrix, width, height) {
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
		return canvas;
	}

	var changeToGrayMatrix = function(matrix) {
		var resultMatrix = [], tempRow;
		for (var i = 0, height = matrix.length; i < height; ++i) {
			tempRow = [];
			for (var j = 0, width = matrix[0].length/4; j < width; ++j) {
				var temp = 0.299 * matrix[i][4*j] + 0.587 * matrix[i][4*j + 1] + 0.114 * matrix[i][4*j + 2];
				tempRow.push(temp);
			}
			resultMatrix.push(tempRow);
		}
		return resultMatrix;
	}

	return {
		createMatrix: createMatrix,
		filting: filting,
		addHandler: addHandler,
		changeToMatrix: changeToMatrix,
		createZeroMatrix: createZeroMatrix,
		draw, draw,
		changeToGrayMatrix: changeToGrayMatrix
	}

}());