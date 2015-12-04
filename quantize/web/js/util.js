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

    //全1均值滤波器
    var createAveragingFilter = function(size) {
    	var filter = [],
    		tempRow;
    	for (var i = 0; i < size; ++i) {
			tempRow = [];
			for (var j = 0; j < size; ++j) {
				tempRow[j] = 1 / (size * size);
			}
			filter[i] = tempRow;
		}
		return filter;
	}

	//3*3中间为-8
	var createLaplacianFilter = function() {
		var filter = [], tempRow = [], size = 3;
		for (var i = 0; i < size; ++i) {
			tempRow = [];
			for (var j = 0; j < size; ++j) {
				tempRow[j] = 1;
				if (i == 0 && j == 0) {
					tempRow[j] = -8;
				}
			}
			filter[i] = tempRow;
		}
		return filter;
	}

	//创建二维数组
	var	createTwoDimensionalArray = function(row, col) {
			var matrix = [];
			for (var i = 0; i < row; ++i) {
				var tempRow = [];
				matrix.push(tempRow);
			}
			return matrix;
		}

	return {
		createAveragingFilter: createAveragingFilter,
		createLaplacianFilter: createLaplacianFilter,
		createTwoDimensionalArray: createTwoDimensionalArray,
		addHandler: addHandler
	}

}());