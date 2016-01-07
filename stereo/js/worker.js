importScripts('Util.js')

onmessage = function(e) {
	var startTime = new Date();
	var leftData = e.data[0],
		rightData = e.data[1],
		leftWidth = leftData.width,
		leftHeight = leftData.height,
		rightWidth = rightData.width,
		rightHeight = rightData.height,
		leftResult = Util.createTwoDimensionalArray(leftHeight),
		rightResult = Util.createTwoDimensionalArray(rightHeight),
		windowSize = 33,
		DISPARITY = 79,
		HALFSIZE = parseInt(windowSize/2),
		yc = 7,
		yp = 36;
	var	leftMatrix = Util.changeToMatrix(leftData.data, leftWidth, leftHeight),
		rightMatrix = Util.changeToMatrix(rightData.data, rightWidth, rightHeight), 
		leftLAB = Util.rgb2lab(leftMatrix, leftWidth, leftHeight),
		rightLAB = Util.rgb2lab(rightMatrix, rightWidth, rightHeight);
	leftLAB = Util.pad(leftLAB, 3 * HALFSIZE, HALFSIZE);
	rightLAB = Util.pad(rightLAB, 3 * HALFSIZE, HALFSIZE);
	leftMatrix = Util.pad(leftMatrix, 4 * HALFSIZE, HALFSIZE);
	rightMatrix = Util.pad(rightMatrix, 4 * HALFSIZE, HALFSIZE);
	for (var i = HALFSIZE; i < leftHeight + HALFSIZE; ++i) {
		 console.log("leftASW: ", i);
		for (var j = HALFSIZE; j < leftWidth + HALFSIZE; ++j) {
			var min = Infinity,
				resultDisparity = 0;
			for (var d = 0; d <= DISPARITY; ++d) {
				if (j - d >= HALFSIZE) {
					var tempUp = 0,
						tempDown = 0,
						bufferTwo = 3 * (j - d);
					for (var k = -HALFSIZE; k <= HALFSIZE; ++k) {
						for (var t = -HALFSIZE; t <= HALFSIZE; ++t) {
							var bufferOne = 3 * (j + t),
								c = Math.sqrt(Math.pow(leftLAB[i][3 * j] - leftLAB[i + k][bufferOne], 2) + Math.pow(leftLAB[i][3 * j + 1] - leftLAB[i + k][bufferOne + 1], 2) + Math.pow(leftLAB[i][3 * j + 2] - leftLAB[i + k][bufferOne + 2], 2)),
								g = Math.sqrt(k * k + t * t),
								w = Math.exp(-(c/yc + g/yp)),
								bufferThree = bufferTwo + 3 * t,
								cRight = Math.sqrt(Math.pow(rightLAB[i][bufferTwo] - rightLAB[i + k][bufferThree], 2) + Math.pow(rightLAB[i][bufferTwo + 1] - rightLAB[i + k][bufferThree + 1], 2) + Math.pow(rightLAB[i][bufferTwo + 2] - rightLAB[i + k][bufferThree + 2], 2)),
								wRight = Math.exp(-(cRight/yc + g/yp)),
								e = Math.abs(leftMatrix[i + k][4 * (j + t)] - rightMatrix[i + k][4 * (j - d + t)]) + Math.abs(leftMatrix[i + k][4 * (j + t) + 1] - rightMatrix[i + k][4 * (j - d + t) + 1]) + Math.abs(leftMatrix[i + k][4 * (j + t) + 2] - rightMatrix[i + k][4 * (j - d + t) + 2]),
								mul = w * wRight;
								tempUp += mul * e;
								tempDown += mul;
						}
					}
					var temp = tempUp / tempDown;
					if (temp < min) {
						min = temp;
						resultDisparity = d;
					}
				} else {
					break;
				}
			}
			for (var z = 0; z < 3; ++z) {
				leftResult[i - HALFSIZE][4 * (j - HALFSIZE) + z] = resultDisparity
			}
			leftResult[i - HALFSIZE][4 * (j - HALFSIZE) + 3] = 255
		}
	}
	//右眼
	for (var i = HALFSIZE; i < rightHeight + HALFSIZE; ++i) {
		 console.log("rightASW: ", i);
		for (var j = HALFSIZE; j < rightWidth + HALFSIZE; ++j) {
			var min = Infinity,
				resultDisparity = 0;
			for (var d = 0; d <= DISPARITY; ++d) {
				if (j + d < rightWidth + HALFSIZE) {
					var tempUp = 0,
						tempDown = 0,
						bufferTwo = 3 * (j + d);
					for (var k = -HALFSIZE; k <= HALFSIZE; ++k) {
						for (var t = -HALFSIZE; t <= HALFSIZE; ++t) {
							var bufferOne = 3 * (j + t),
								c = Math.sqrt(Math.pow(rightLAB[i][3 * j] - rightLAB[i + k][bufferOne], 2) + Math.pow(rightLAB[i][3 * j + 1] - rightLAB[i + k][bufferOne + 1], 2) + Math.pow(rightLAB[i][3 * j + 2] - rightLAB[i + k][bufferOne + 2], 2)),
								g = Math.sqrt(k * k + t * t),
								w = Math.exp(-(c/yc + g/yp)),
								bufferThree = bufferTwo + 3 * t,
								cLeft = Math.sqrt(Math.pow(leftLAB[i][bufferTwo] - leftLAB[i + k][bufferThree], 2) + Math.pow(leftLAB[i][bufferTwo + 1] - leftLAB[i + k][bufferThree + 1], 2) + Math.pow(leftLAB[i][bufferTwo + 2] - leftLAB[i + k][bufferThree + 2], 2)),
								wLeft = Math.exp(-(cLeft/yc + g/yp)),
								e = Math.abs(rightMatrix[i + k][4 * (j + t)] - leftMatrix[i + k][4 * (j + d + t)]) + Math.abs(rightMatrix[i + k][4 * (j + t) + 1] - leftMatrix[i + k][4 * (j + d + t) + 1]) + Math.abs(rightMatrix[i + k][4 * (j + t) + 2] - leftMatrix[i + k][4 * (j + d + t) + 2]),
								mul = w * wLeft;
								tempUp += mul * e;
								tempDown += mul;
						}
					}
					var temp = tempUp / tempDown;
					if (temp < min) {
						min = temp;
						resultDisparity = d;
					}
				} else {
					break;
				}
			}
			for (var z = 0; z < 3; ++z) {
				rightResult[i - HALFSIZE][4 * (j - HALFSIZE) + z] = resultDisparity
			}
			rightResult[i - HALFSIZE][4 * (j - HALFSIZE) + 3] = 255
		}
	}
	var endTime = new Date();
	console.log(endTime - startTime);
	postMessage([leftResult, rightResult]);
}