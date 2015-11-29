(function() {
	
	"use strict";

	try {

		new FileReader();
	
	} catch(e) {
		console.log(e);
		alert("请使用Chrome，FireFox或者IE10以上浏览器打开本页面");
	} 

	var theta, k , r,
		count = -1,
		harris = [],
		canvasArray = [],
		matrixs = [], results = [], matrix, hiddenCtx, context;

	var init = function() {
		bindEvent();
	}

	var bindEvent = function() {
		document.querySelector('#uploader').addEventListener('change', function(e) {
			var files = this.files, 
			 	length = files.length;
			 	theta = Math.PI/3;
			if (length <= 1) {
				alert("请选择两张照片");
				return;
			}
			for (var i = 0; i < length; ++i) {
				var temp = [];
				harris.push(temp);
			}
			for (var i = 0; i < length; ++i) {
				//文件读取
				var oFReader = new FileReader();
				oFReader.readAsDataURL(files[i]);
				oFReader.addEventListener('load', function(e) {
					var image = new Image();
					image.src = e.target.result;
					image.onload = function() {
						var canvas = document.createElement('canvas');
						canvas.width = this.width;
						canvas.height = this.height;
						var context = canvas.getContext('2d');
						context.drawImage(this, 0, 0);
						document.body.appendChild(canvas);
						canvas.style.position = 'absolute';
						canvas.style.visibility = 'hidden';
						canvasArray.push(canvas);
						setTimeout(function() {
							projecting(canvas, context);
						}, 100);
					}
				})
			}
		});

	}

	var projecting = function(canvas, context) {
		++count;
		var width = canvas.width,
			height = canvas.height,
			r = width / (2 * Math.tan(theta/2)),
			resultMatrix = Util.createZeroMatrix(width, height);
		try {
			var testImageData = context.getImageData(0, 0, width, height).data;
		} catch(e) {
			console.log(e);
			alert("Chrome因为安全原因无法加载图片，请用火狐或者IE10以上浏览器打开");
			return;
		}
		var matrix = Util.changeToMatrix(testImageData, width, height);
		for (var i = 0; i < height; ++i) {
			for (var j = 0; j < width; ++j) {
				k = Math.sqrt(Math.pow(r, 2) + Math.pow(width / 2 - j, 2));
				var py = parseInt(r * Math.sin(theta / 2) + r * Math.sin(Math.atan((j - width / 2)/r)));
				var px = parseInt(height / 2 + r * (i - height / 2) / k);
				if (px < 0) {
					px = 0;
				}
				resultMatrix[px][4 * py] = matrix[i][4 * j];
				resultMatrix[px][4 * py + 1] = matrix[i][4 * j + 1];
				resultMatrix[px][4 * py + 2] = matrix[i][4 * j + 2];
				resultMatrix[px][4 * py + 3] = matrix[i][4 * j + 3];
			} 
		}
		results.push(resultMatrix);
		matrixs.push(Util.changeToGrayMatrix(resultMatrix));
		
		if (count == 1) {
			find();
			match();
		}
	}

	var find = function() {
		drawToCanvas(results);
		matrix = results;
		var width = (matrix[0][0].length + matrix[1][0].length)/4;
		var height = Math.max(matrix[0].length, matrix[1].length);
		var leftWidth = matrix[0][0].length/4;
		var leftHeight = matrix[0].length;
		var rightWidth = matrix[1][0].length/4;
		var rightHeight = matrix[1].length;
		var params = { blockSize: 3, k: 0.04, qualityLevel: 0.01 };
		// img: ImageData object
		// returns Array of detected corners
		var corners = CornerDetector.detect(context.getImageData(0, 0, width, height), CornerDetector.HARRIS, params);
		var leftWidth = matrix[0][0].length/4;
		var trueWidth = parseInt(2 * leftWidth / (2 * Math.tan(theta/2))*Math.sin(theta/2));
		for (var i = 0; i < corners.length; ++i) {
			if (corners[i] !== 0) {
				var position = {};
				position.x = parseInt(i / width);
				position.y = parseInt(i - position.x * width);
				if (position.x < height * 0.1 || position.x > 0.9 * height) {
					continue;
				}
				if (position.y > trueWidth - 30 && position.y < leftWidth + 30) {
					continue;
				}
				if (position.y < leftWidth) {
					harris[0].push(position);
				} else {
					harris[1].push(position);
				}
				context.beginPath();
				context.arc(position.y, position.x, 2, 0, 2*Math.PI, true);
				context.fill();
			}
		}
	}

	var drawToCanvas = function(matrix) {
		var hiddenCanvas = document.createElement('canvas');
		var canvas = document.createElement('canvas');
		var leftWidth = matrix[0][0].length/4;
		var leftHeight = matrix[0].length;
		var rightWidth = matrix[1][0].length/4;
		var rightHeight = matrix[1].length;
		canvas.width = (matrix[0][0].length + matrix[1][0].length)/4;
		canvas.height = Math.max(matrix[0].length, matrix[1].length);
		hiddenCanvas.width = canvas.width;
		hiddenCanvas.height = canvas.height;
		hiddenCanvas.style.visibility = 'hidden';
		hiddenCanvas.style.position = 'absolute';
		document.body.appendChild(canvas);
		document.body.appendChild(hiddenCanvas);
		var ctx = canvas.getContext('2d');
		context = ctx;
		hiddenCtx = hiddenCanvas.getContext('2d');
		var resultImg = ctx.createImageData(canvas.width, canvas.height);
		var hiddenResultImg = hiddenCtx.createImageData(hiddenCanvas.width, hiddenCanvas.height);
		var tempStart;
		for (var i = 0; i < leftHeight; ++i) {
			tempStart = i*4*canvas.width;
			for (var j = 0; j < leftWidth; ++j) {
				for (var k = 0; k < 4; ++k) {
					//hiddenResultImg.data[tempStart + 4 * j + k] = matrix[0][i][4 * j + k];
					resultImg.data[tempStart + 4 * j + k] = matrix[0][i][4 * j + k];
				}
			}
		}
		for (var i = 0; i < rightHeight; ++i) {
			tempStart = i*4*canvas.width;
			for (var j = 0; j < rightWidth; ++j) {
				for (var k = 0; k < 4; ++k) {
					resultImg.data[tempStart + 4*j + 4*leftWidth + k] = matrix[1][i][4 * j + k];
					//hiddenResultImg.data[tempStart + 4*j + 4*leftWidth + k] = matrix[1][i][4 * j + k];
				}
			}
		}

		hiddenCtx.putImageData(resultImg, 0, 0);
		ctx.putImageData(resultImg, 0, 0);
	}

	var match = function() {
		var leftWidth = matrix[0][0].length/4;
		var leftHeight = matrix[0].length;
		var averageOne, averageTwo, nineSum,
			firstMatrix = matrixs[0], secondMatrix = matrixs[1], firstHarris = harris[0], secondHarris = harris[1], finalResults = [], harrisArray = [];
		for (var i = 0; i < firstHarris.length; ++i) {
			var row = [];
			row[1] = 0;
			harrisArray[i] = row;
		}
		for (var i = 0; i < firstHarris.length; ++i) {
			var nineSum = 0;
			for (var p = -2; p < 3; ++p) {
				for (var q = -2; q < 3; ++q) {
					nineSum += firstMatrix[firstHarris[i].x + p][firstHarris[i].y + q];
				}
			}
			averageOne = nineSum/9;
			for (var j = 0; j < secondHarris.length; ++j) {
				var nineSumTwo = 0, sum = 0;
				for (var k = -2; k < 3; ++k) {
					for (var v = -2; v < 3; ++v) {
							nineSumTwo += secondMatrix[secondHarris[j].x + k][secondHarris[j].y + v - leftWidth];
					}
				}
				averageTwo = nineSumTwo/9;
				var sumUp = 0, sumDownLeft = 0, sumDownRight = 0;
				for (var k = -2; k < 3; ++k) {
					for (var v = -2; v < 3; ++v) {
						sumUp += (firstMatrix[firstHarris[i].x + k][firstHarris[i].y + v] - averageOne) * (secondMatrix[secondHarris[j].x + k][secondHarris[j].y + v - leftWidth] - averageTwo);
						sumDownLeft += Math.pow(firstMatrix[firstHarris[i].x + k][firstHarris[i].y + v] - averageOne, 2);
						sumDownRight += Math.pow(secondMatrix[secondHarris[j].x + k][secondHarris[j].y + v - leftWidth] - averageTwo, 2);
					}
				}
				var sum = sumUp/Math.sqrt(sumDownRight*sumDownLeft);
				if (sum > 0.9995) {
					if (sum > harrisArray[i][1]) {
						harrisArray[i][0] = j;
						harrisArray[i][1] = sum;
					}
					// var finalResult = {};				
					// finalResult.x = harris[0][i].x;
					// finalResult.y = harris[0][i].y;
					// finalResult.k = harris[1][j].x;
					// finalResult.v = harris[1][j].y;
					// finalResults.push(finalResult);
					// var k = (finalResult.x - finalResult.k)/(finalResult.y - finalResult.v);
					// context.beginPath();
					// context.fillStyle="#ff0000"
					// context.arc(finalResult.y, finalResult.x, 4, 0, 2*Math.PI, true);
					// context.fill();
					// context.beginPath();
					// context.fillStyle="#ff0000"
					// context.arc(finalResult.v, finalResult.k, 4, 0, 2*Math.PI, true);
					// context.fill();
					// context.strokeStyle = "#ffff00";
					// context.lineTo(finalResult.y, finalResult.x);
					// context.moveTo(finalResult.v, finalResult.k);
					// context.stroke();
				}
			}
		}
		var harrisArrayTwice = [];
		for (var i = 0; i < secondHarris.length; ++i) {
			var row = [];
			row[1] = 0;
			harrisArrayTwice[i] = row;
		}
		for (var i = 0; i < secondHarris.length; ++i) {
			var nineSum = 0;
			for (var p = -2; p < 3; ++p) {
				for (var q = -2; q < 3; ++q) {
					nineSum += secondMatrix[secondHarris[i].x + p][secondHarris[i].y + q - leftWidth];
				}
			}
			averageOne = nineSum/9;
			for (var j = 0; j < firstHarris.length; ++j) {
				var nineSumTwo = 0, sum = 0;
				for (var k = -2; k < 3; ++k) {
					for (var v = -2; v < 3; ++v) {
							nineSumTwo += firstMatrix[firstHarris[j].x + k][firstHarris[j].y + v];
					}
				}
				averageTwo = nineSumTwo/9;
				var sumUp = 0, sumDownLeft = 0, sumDownRight = 0;
				for (var k = -2; k < 3; ++k) {
					for (var v = -2; v < 3; ++v) {
						sumUp += (secondMatrix[secondHarris[i].x + k][secondHarris[i].y + v - leftWidth] - averageOne) * (firstMatrix[firstHarris[j].x + k][firstHarris[j].y + v] - averageTwo);
						sumDownLeft += Math.pow(secondMatrix[secondHarris[i].x + k][secondHarris[i].y + v - leftWidth] - averageOne, 2);
						sumDownRight += Math.pow(firstMatrix[firstHarris[j].x + k][firstHarris[j].y + v] - averageTwo, 2);
					}
				}
				var sum = sumUp/Math.sqrt(sumDownRight*sumDownLeft);
				if (sum > 0.9995) {
					if (typeof harrisArrayTwice[i] != 'undefined') {
						if (sum > harrisArrayTwice[i][1]) {
							harrisArrayTwice[i][0] = j;
							harrisArrayTwice[i][1] = sum;
						}
					}
					// var finalResult = {};				
					// finalResult.x = harris[0][i].x;
					// finalResult.y = harris[0][i].y;
					// finalResult.k = harris[1][j].x;
					// finalResult.v = harris[1][j].y;
					// finalResults.push(finalResult);
					// var k = (finalResult.x - finalResult.k)/(finalResult.y - finalResult.v);
					
				}
			}
		}
		for (var i = 0; i < firstHarris.length; ++i) {
			if (typeof harrisArray[i][0] != 'undefined') {

				if (i === harrisArrayTwice[harrisArray[i][0]][0]) {
					var finalResult = {};				
					finalResult.x = harris[0][i].x;
					finalResult.y = harris[0][i].y;
					finalResult.k = harris[1][harrisArray[i][0]].x;
					finalResult.v = harris[1][harrisArray[i][0]].y;
					finalResults.push(finalResult);
					context.beginPath();
					context.fillStyle="#ff0000"
					context.arc(finalResult.y, finalResult.x, 4, 0, 2*Math.PI, true);
					context.fill();
					context.beginPath();
					context.fillStyle="#ff0000"
					context.arc(finalResult.v, finalResult.k, 4, 0, 2*Math.PI, true);
					context.fill();
					context.strokeStyle = "#ffff00";
					context.lineTo(finalResult.y, finalResult.x);
					context.moveTo(finalResult.v, finalResult.k);
					context.stroke();
				}
			}
		}
		concat(finalResults);
	}

	var concat = function(arrays) {
		var offsetY = 0, cut = 0;
		var leftWidth = matrix[0][0].length/4;
		var trueWidth = parseInt(2 * leftWidth / (2 * Math.tan(theta/2))*Math.sin(theta/2));
		var leftHeight = matrix[0].length;
		var rightWidth = matrix[1][0].length/4;
		var rightHeight = matrix[1].length;
		for (var i = 0; i < arrays.length; ++i) {
			offsetY += arrays[i].x - arrays[i].k; 
			cut += arrays[i].v - arrays[i].y - (leftWidth - trueWidth);
		}
		offsetY = parseInt(offsetY/arrays.length) - 4;
		cut = parseInt(cut/arrays.length);
		console.log(cut);
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		var first = hiddenCtx.getImageData(0, 0, trueWidth, leftHeight).data;
		var second = hiddenCtx.getImageData(leftWidth, 0, rightWidth, rightHeight).data;
		var resultImg = ctx.createImageData(trueWidth + rightWidth, Math.max(leftHeight, rightHeight));
		var width = parseInt(trueWidth + rightWidth), height = Math.max(leftHeight, rightHeight), tempStart;
		first = Util.changeToMatrix(first, trueWidth, leftHeight);
		second = Util.changeToMatrix(second, leftWidth, leftHeight);
		canvas.width = width;
		canvas.height = height;
		for (var i = 0; i < leftHeight; ++i) {
			tempStart = i*4*width;
			for (var j = 0; j < trueWidth; ++j) {
				for (var k = 0; k < 4; ++k) {
					resultImg.data[tempStart + 4 * j + k] = first[i][4 * j + k];
					
				}
			}
		}
		for (var i = 0; i < rightHeight; ++i) {
			tempStart = i*4*width + 4*trueWidth;
			for (var j = 0; j < rightWidth - cut; ++j) {
				for (var k = 0; k < 4; ++k) {
					if (i - offsetY > 0 && i - offsetY < rightHeight) {
						resultImg.data[tempStart + 4 * j + k] = second[i - offsetY][4 * (j + cut) + k];
					}
				}
			}
		}
		ctx.putImageData(resultImg, 0, 0);
		console.log(resultImg);
		document.body.appendChild(canvas);
	}

	window.onload = init;

}())