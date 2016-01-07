(function() {

	"use strict";

	var leftCanvas, rightCanvas, leftCtx, rightCtx, leftFileReader, rightFileReader, leftImage, rightImage;

	var init = function() {
		leftImage = document.getElementById('left-image');
		rightImage = document.getElementById('right-image');
		leftCanvas = document.createElement('canvas');
		leftCanvas.id = "left";
		leftCanvas.width = leftImage.width;
		leftCanvas.height = leftImage.height;
		rightCanvas = document.createElement('canvas');
		rightCanvas.id = "right";
		rightCanvas.width = rightImage.width;
		rightCanvas.height = rightImage.height;
		leftCtx = leftCanvas.getContext('2d');
		rightCtx = rightCanvas.getContext('2d');
		leftCtx.drawImage(leftImage, 0, 0, leftImage.width, leftImage.height);
		rightCtx.drawImage(rightImage, 0, 0, rightImage.width, rightImage.height);
		leftFileReader = new FileReader();
		rightFileReader = new FileReader();
		document.body.appendChild(leftCanvas);
		document.body.appendChild(rightCanvas);
		bindEvent();
	}

	var bindEvent = function() {
		var leftUploader = document.getElementById('leftUploader'),
			rightUploader = document.getElementById('rightUploader'),
			bt = document.getElementById('compute');
		leftUploader.addEventListener('change', function(e) {
			var left = this.files[0];
			leftFileReader.readAsDataURL(left);
		});
		rightUploader.addEventListener('change', function(e) {
			var right = this.files[0];
			rightFileReader.readAsDataURL(right);
		});
		leftFileReader.addEventListener('load', function(e) {
			leftImage.src = e.target.result;
			setTimeout(function() {
				leftCtx.drawImage(leftImage, 0, 0, leftImage.width, leftImage.height);
			}, 100)
		});
		rightFileReader.addEventListener('load', function(e) {
			rightImage.src = e.target.result;
			setTimeout(function() {
				rightCtx.drawImage(rightImage, 0, 0, rightImage.width, rightImage.height);
			}, 100)
		})
		bt.addEventListener('click', function(e) {
			computeDisparity();
		})
	}	

	var computeDisparity = function() {
		var worker = new Worker('js/worker.js'),
			leftWidth = leftImage.width,
			leftHeight = leftImage.height,
			rightWidth = rightImage.width,
			rightHeight = rightImage.height,
			leftData = leftCtx.getImageData(0, 0, leftWidth, leftHeight),
			rightData = rightCtx.getImageData(0, 0, rightWidth, rightHeight);
		worker.postMessage([leftData, rightData]);
		worker.onmessage = function(e) {
			var canvasLeft = draw(e.data[0], leftWidth, leftHeight);
			document.body.appendChild(canvasLeft);
			var canvasRight = draw(e.data[1], leftWidth, leftHeight);
			document.body.appendChild(canvasRight);
		}
	}

	var draw = function(matrix, width, height) {
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		var	ctx = canvas.getContext('2d'), 
			resultImg = ctx.createImageData(width, height),
			tempStart, num = 4 * width;
		for (var i = 0; i < height; ++i) {
			tempStart = i*num;
			for (var j = 0; j < width; ++j) {
				for (var k = 0; k < 4; ++k) {
					resultImg.data[tempStart + 4*j + k] = 3 * matrix[i][4*j + k];
				}
			}
		}
		ctx.putImageData(resultImg, 0, 0);
		return canvas;
	}

	window.onload = init;

}());