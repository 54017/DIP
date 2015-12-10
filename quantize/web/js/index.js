(function() {

	"use strict";


	var original, canvas, context, left, top, lineW, strokeColor, rawData, mouseDown,
		wrapper = document.getElementById('wrapper'),
		first = document.getElementById('first'), 
		second = document.getElementById('second'), 
		gray = document.getElementById('gray');
	
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
		var height = image.height,
			width = image.width;
		left = canvas.getBoundingClientRect().left;
		top = canvas.getBoundingClientRect().top;
		canvas.setAttribute('width', width);
		canvas.setAttribute('height', height);
		context.drawImage(image, 0, 0, width, height);
		try {
			rawData = context.getImageData(0, 0, width, height).data;
		} catch(e) {
			console.log(e);
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
		//hsi中的intensity矩阵
		this.intensity = Util.createTwoDimensionalArray(this.height);
		for (var i = 0; i < this.height; ++i) {
			for (var j = 0; j < this.width; ++j) {
				this.intensity[i][j] = this.hsiData[i][4 * j + 2];
			}
		}
		//傅立叶变换F(u, v)
		this.fourierData = null;
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
			var scalingW = this.width/width,
				//高度缩放比例
				scalingH = this.height/height,
				resultMatrix = [], //目标图像灰度矩阵
				tempRow = [],  //每一行的数组
				rowNum, colNum;
			for (var i = 0; i < height; ++i) {
				tempRow = [];
				rowNum = parseInt(i*scalingH);
				for (var j = 0; j < width; ++j) {
					colNum = 4*parseInt(j*scalingW);
					for (var k = 0; k < 4; ++k) {
						tempRow[4*j + k] = this.matrixData[rowNum][colNum + k];           //RGBA
					}
				}
				resultMatrix[i] = tempRow;
			}
			return this.draw(resultMatrix, width, height);
		},
		//双线性插值法
		scaleSecond: function(width, height) {
				//宽度缩放比例
			var scalingW = this.width/width,
				//高度缩放比例
				scalingH = this.height/height,
				resultMatrix = [], //目标图像灰度矩阵
				tempRow = [],     //每一行的数组
				virtualSrcH, virtualSrcW, h1, h2, w1, w2, u, v, first, second, third, fourth;
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
					for (var k = 0; k < 4; ++k) {
						tempRow[4*j + k] = first*this.matrixData[h1][4*w1 + k] + second*this.matrixData[h1][4*w2 + k] + third*this.matrixData[h2][4*w1 + k] + fourth*this.matrixData[h2][4*w2 + k];
					}
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
			var spacing = parseInt((this.level)/level),
				d = parseInt((this.level - 1)/(level - 1)), //就是等差数列里面的d
				resultMatrix = [],
				tempRow = [],
				gray, num, 
				level = this.level;
			for (var i = this.height - 1; i >= 0; --i) {
				tempRow = [];
				for (var j = this.width - 1; j >= 0; --j) {
					gray = this.matrixData[i][4*j]*0.299 + this.matrixData[i][4*j + 1]*0.587 + this.matrixData[i][4*j + 2] *0.114;
					num = parseInt(gray/spacing)*d;
					tempRow[4*j] = tempRow[4*j + 1] = tempRow[4*j + 2] = num;
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
		//转换到频谱域
		fourierTransform: function(flag) {
			var width = this.width,
				height = this.height;
			if (flag == 0) {
				return this.fft();
			} else if (flag == 1) {
				return this.dft();
			} else if (flag == 2) {
				return this.idft();
			} else if (flag == 3) {
				var result = this.fastDft(this.intensity, this.width, this.height);
				this.fourierData = result.fourierData;
				return this.draw(result.resultMatrix, this.width, this.height);
			} else if (flag == 4) {
				return this.fastIdft(this.fourierData, this.width, this.height);
			}
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
		//算术滤波
		filting: function(filter) {
			if (typeof filter[0] === 'undefined' || filter.length !== filter[0].length) {
				alert("传入的矩阵格式错误或者不是等行列，请换一个");
				return;
			}
			var length = filter.length;
			var width = this.width, height = this.height
			var sum, resultMatrix = this.changeToHSI(), tempRow = [];
			for (var i = 0; i < height; ++i) {
				for (var j = 0; j < width; ++j) {
					sum = 0;
					for (var k = 0; k < length; ++k) {
						for (var v = 0; v < length; ++v) {
							if (i + k - 1 < 0 || j + v - 1 < 0 || i + k - 1 > height - 1 || j + v - 1 > width - 1) {
							} else {
								sum += filter[k][v] * this.hsiData[i + k - 1][4 * (j + v - 1) + 2];
							}
						}
					}
					resultMatrix[i][4 * j + 2] = sum;
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//中值滤波
		medianFilting: function(size) {
			var width = this.width, height = this.height;
			var sum, resultMatrix = this.changeToHSI(), tempRow = [],
				median = parseInt(size * size / 2);
			for (var i = 0; i < height; ++i) {
				for (var j = 0; j < width; ++j) {
					sum = [];
					for (var k = 0; k < size; ++k) {
						for (var v = 0; v < size; ++v) {
							if (i + k - 1 < 0 || j + v - 1 < 0 || i + k - 1 > height - 1 || j + v - 1 > width - 1) {
								sum.push(0);
							} else {
								sum.push(this.hsiData[i + k - 1][4 * (j + v - 1) + 2]);
							}
						}
					}
					sum.sort();
					resultMatrix[i][4 * j + 2] = sum[median];
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//最大滤波
		maxFilting: function(size) {
			var width = this.width, height = this.height;
			var max, resultMatrix = this.changeToHSI(), tempRow = [],
				median = parseInt(size * size / 2);
			for (var i = 0; i < height; ++i) {
				for (var j = 0; j < width; ++j) {
					max = 0;
					for (var k = 0; k < size; ++k) {
						for (var v = 0; v < size; ++v) {
							if (i + k - 1 < 0 || j + v - 1 < 0 || i + k - 1 > height - 1 || j + v - 1 > width - 1) {
							} else {
								max = this.hsiData[i + k - 1][4 * (j + v - 1) + 2] > max ? this.hsiData[i + k - 1][4 * (j + v - 1) + 2] : max;
							}
						}
					}
					resultMatrix[i][4 * j + 2] = max;
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//最小滤波
		minFilting: function(size) {
			var width = this.width, height = this.height;
			var min, resultMatrix = this.changeToHSI(), tempRow = [],
				median = parseInt(size * size / 2);
			for (var i = 0; i < height; ++i) {
				for (var j = 0; j < width; ++j) {
					min= Infinity;
					for (var k = 0; k < size; ++k) {
						for (var v = 0; v < size; ++v) {
							if (i + k - 1 < 0 || j + v - 1 < 0 || i + k - 1 > height - 1 || j + v - 1 > width - 1) {
								min = 0;
							} else {
								min = this.hsiData[i + k - 1][4 * (j + v - 1) + 2] < min ? this.hsiData[i + k - 1][4 * (j + v - 1) + 2] : min;
							}
						}
					}
					resultMatrix[i][4 * j + 2] = min;
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//调和均值滤波
		hamonicFilting: function(size) {
			var width = this.width, height = this.height
			var sum, resultMatrix = this.changeToHSI(), tempRow = [];
			for (var i = 0; i < height; ++i) {
				for (var j = 0; j < width; ++j) {
					sum = 0;
					for (var k = 0; k < size; ++k) {
						for (var v = 0; v < size; ++v) {
							if (i + k - 1 < 0 || j + v - 1 < 0 || i + k - 1 > height - 1 || j + v - 1 > width - 1) {
							} else {
								sum += 1 / this.hsiData[i + k - 1][4 * (j + v - 1) + 2];
								if (this.hsiData[i + k - 1][4 * (j + v - 1) + 2] == 0) {
									console.log(sum);
								}
							}
						}
					}
					resultMatrix[i][4 * j + 2] = size * size / sum;
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//反调和均值滤波
		contraHamonicFilting: function(size, q) {
			var width = this.width, height = this.height
			var sumUp, sumDown, resultMatrix = this.changeToHSI(), tempRow = [];
			console.log(q);
			for (var i = 0; i < height; ++i) {
				for (var j = 0; j < width; ++j) {
					sumUp = 0;
					sumDown = 0;
					for (var k = 0; k < size; ++k) {
						for (var v = 0; v < size; ++v) {
							if (i + k - 1 < 0 || j + v - 1 < 0 || i + k - 1 > height - 1 || j + v - 1 > width - 1) {
							} else {
								sumUp += Math.pow(this.hsiData[i + k - 1][4 * (j + v - 1) + 2], q + 1);
								sumDown += Math.pow(this.hsiData[i + k - 1][4 * (j + v - 1) + 2], q);
							}
						}
					}
					resultMatrix[i][4 * j + 2] = sumUp / sumDown;
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//几何均值滤波
		geometricFilting: function(size) {
			var width = this.width, height = this.height;
			var sum, resultMatrix = this.changeToHSI(), tempRow = [];
			for (var i = 0; i < height; ++i) {
				for (var j = 0; j < width; ++j) {
					sum = 1;
					for (var k = 0; k < size; ++k) {
						for (var v = 0; v < size; ++v) {
							if (i + k - 1 < 0 || j + v - 1 < 0 || i + k - 1 > height - 1 || j + v - 1 > width - 1) {
							} else {
								sum *= this.hsiData[i + k - 1][4 * (j + v - 1) + 2];
							}
						}
					}
					resultMatrix[i][4 * j + 2] = Math.pow(sum, 1 / (size * size));
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//频谱域滤波
		fourierFilting: function(filter) {
			var length = filter.length,
				width = this.width,
				height = this.height,
				result, tempDataReal, tempDataImag, real, imag, sumReal, sumImag, matrixReal, matrixImag,
				resultMatrix,
				tempRow = [], fourierData, mn = width * height,
				paddingWidth = width + length,
				paddingHeight = height + length, temp;
			filter = Util.paddingZero(filter, paddingWidth, paddingHeight);
			filter = this.fastDft(filter, paddingWidth, paddingHeight).fourierData;
			fourierData = this.fastDft(Util.paddingZero(this.intensity, paddingWidth, paddingHeight), paddingWidth, paddingHeight).fourierData;
			resultMatrix = Util.multiply(filter, fourierData, paddingWidth, paddingHeight);
			temp = Util.fastIdft(resultMatrix, paddingWidth, paddingHeight);
			for (var v = 0; v < height; ++v) {
				for (var u = 0; u < width; ++u) {
					result = parseInt(temp[v][u].real/mn) * Math.pow(-1, (u + v) % 2);
					resultMatrix[v][4 * u] = this.hsiData[v][4 * u];
					resultMatrix[v][4 * u + 1] = this.hsiData[v][4 * u + 1];
					resultMatrix[v][4 * u + 2] = result;
					resultMatrix[v][4 * u + 3] = this.hsiData[v][4 * u + 3];
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//高提升滤波
		rise: function(filter) {
			var average = this.filting(filter).canvas,
				averageData = average.getContext('2d').getImageData(0, 0, average.width, average.height).data,
				averageMatrix = this.changeToMatrix(averageData);
			for (var i = 0; i < this.height; ++i) {
				for (var j = 0; j < this.width; ++j) {
					for (var k = 0; k < 3; ++k) {
						averageMatrix[i][4*j + k] = this.matrixData[i][4 * j + k] - averageMatrix[i][4 * j + k];
					}
				}
			}
			for (var i = 0; i < this.height; ++i) {
				for (var j = 0; j < this.width; ++j) {
					for (var k = 0; k < 3; ++k) {
						averageMatrix[i][4*j + k] = this.matrixData[i][4 * j + k] + k*averageMatrix[i][4 * j + k];
					}
				}
			}
			return this.draw(averageMatrix, this.width, this.height);
		},
		//傅立叶变换 (M*N)^2复杂度
		dft: function() {
			var width = this.width,
				height = this.height,
				sumReal, sumImag, result, tempData, number, real, imag,
				resultMatrix = Util.createTwoDimensionalArray(height),
				mn = Math.sqrt(width * height);
			for (var u = 0; u < width; ++u) {
				for (var v = 0; v < height; ++v) {
					sumReal = sumImag = 0;
					for (var x = 0; x < width; ++x) {
						for (var y = 0; y < height; ++y) {
							tempData = this.hsiData[y][4 * x + 2] * Math.pow(-1, (x + y)%2);
							number = 2 * Math.PI * (u * x / width + v * y / height);
							real = tempData * Math.cos(number);
							imag = tempData * Math.sin(number) * (-1);
							sumReal += real;
							sumImag += imag;
						}
					}
					this.fourierData[v][u] = { real: sumReal, imag: sumImag }    //后面inverse除以MN （公式完全正确）
					result = parseInt(Math.sqrt(Math.pow(sumReal, 2) + Math.pow(sumImag, 2)))/mn; //这里除以Math.sqrt(MN)是为了显示 和上面没关系
					for (var z = 0; z < 3; ++z) {
						resultMatrix[v][4 * u + z] = result;
					}
					resultMatrix[v][4 * u + 3] = 255;
				}
			}
			return this.draw(resultMatrix, width, height);
		},
		//(M + N) * M * N复杂度 先行后列
		fastDft: function(matrix, width, height) {
			var sumReal, sumImag, result, tempData, number, real, imag, tempDataReal, tempDataImag,
				resultMatrix = Util.createTwoDimensionalArray(height),
				tempMatrix = Util.createTwoDimensionalArray(height),
				mn = Math.sqrt(width * height),
				fourierData = Util.createTwoDimensionalArray(height);
			for (var v = 0; v < height; ++v) {
				for (var u = 0; u < width; ++u) {
					sumReal = sumImag = 0;
					for (var x = 0; x < width; ++x) {
							tempData = matrix[v][x] * Math.pow(-1, (x + v) % 2);
							number = 2 * Math.PI * (u * x / width);
							real = tempData * Math.cos(number);
							imag = tempData * Math.sin(number) * (-1);
							sumReal += real;
							sumImag += imag;
					}
					tempMatrix[v][u] = { real: sumReal, imag: sumImag }
				}
			}
			for (var u = 0; u < width; ++u) {
				for (var v = 0; v < height; ++v) {
					sumReal = sumImag = 0;
					for (var y = 0; y < height; ++y) {
							tempDataReal = tempMatrix[y][u].real;
							tempDataImag = tempMatrix[y][u].imag;
							number = 2 * Math.PI * (v * y / height);
							real = tempDataReal * Math.cos(number) - tempDataImag * Math.sin(number) * (-1);
							imag = tempDataReal * Math.sin(number) * (-1) + tempDataImag * Math.cos(number);
							sumReal += real;
							sumImag += imag;
					}
					fourierData[v][u] = { real: sumReal, imag: sumImag }
					result = parseInt(Math.sqrt(Math.pow(sumReal, 2) + Math.pow(sumImag, 2)))/mn; //ParseInt很重要，不然后面会浮点数计算，导致时间变为3倍
					for (var z = 0; z < 3; ++z) {
						resultMatrix[v][4 * u + z] = result;
					}
					resultMatrix[v][4 * u + 3] = 255;
				}
			}
			return { fourierData: fourierData, resultMatrix: resultMatrix };
		},
		//逆傅立叶变换(10分钟版)
		idft: function() {
			var width = this.width,
				height = this.height,
				tempDataReal, tempDataImag,
				resultMatrix = Util.createTwoDimensionalArray(height),
				sumImag, sumReal, number, real, imag, result, mn = width * height;
			for (var u = 0; u < width; ++u) {
				for (var v = 0; v < height; ++v) {
					sumReal = sumImag = 0;
					for (var x = 0; x < width; ++x) {
						for (var y = 0; y < height; ++y) {
							tempDataReal = this.fourierData[y][x].real;
							tempDataImag = this.fourierData[y][x].imag;
							number = 2 * Math.PI * (u * x / width + v * y / height);
							real = tempDataReal * Math.cos(number) - tempDataImag * Math.sin(number);
							imag = tempDataReal * Math.sin(number) + tempDataImag * Math.cos(number);
							sumReal += real;
							sumImag += imag;
						}
					}
					result = parseInt(Math.sqrt(Math.pow(sumReal, 2) + Math.pow(sumImag, 2)))/mn;
					resultMatrix[v][4 * u] = this.hsiData[v][4 * u];
					resultMatrix[v][4 * u + 1] = this.hsiData[v][4 * u + 1];
					resultMatrix[v][4 * u + 2] = result;
					resultMatrix[v][4 * u + 3] = this.hsiData[v][4 * u + 3];
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//逆傅立叶变换(5秒钟版)
		fastIdft: function(fourierData, width, height) {
			var tempDataReal, tempDataImag,
				resultMatrix = Util.createTwoDimensionalArray(height),
				tempMatrix = Util.createTwoDimensionalArray(height),
				sumImag, sumReal, number, real, imag, result, mn = width * height;
			for (var v = 0; v < height; ++v) {
				for (var u = 0; u < width; ++u) {
					sumReal = sumImag = 0;
					for (var x = 0; x < width; ++x) {
						tempDataReal = fourierData[v][x].real;
						tempDataImag = fourierData[v][x].imag;
						number = 2 * Math.PI * (u * x / width);
						real = tempDataReal * Math.cos(number) - tempDataImag * Math.sin(number);
						imag = tempDataReal * Math.sin(number) + tempDataImag * Math.cos(number);
						sumReal += real;
						sumImag += imag;
					}
					tempMatrix[v][u] = { real: sumReal, imag: sumImag };
				}
			}
			for (var u = 0; u < width; ++u) {
				for (var v = 0; v < height; ++v) {
					sumReal = sumImag = 0;
					for (var y = 0; y < height; ++y) {
						tempDataReal = tempMatrix[y][u].real;
						tempDataImag = tempMatrix[y][u].imag;
						number = 2 * Math.PI * (v * y / height);
						real = tempDataReal * Math.cos(number) - tempDataImag * Math.sin(number);
						imag = tempDataReal * Math.sin(number) + tempDataImag * Math.cos(number);
						sumReal += real;
						sumImag += imag;
					}
					result = parseInt(sumReal/mn) * Math.pow(-1, (u + v) % 2);
					resultMatrix[v][4 * u] = this.hsiData[v][4 * u];
					resultMatrix[v][4 * u + 1] = this.hsiData[v][4 * u + 1];
					resultMatrix[v][4 * u + 2] = result;
					resultMatrix[v][4 * u + 3] = this.hsiData[v][4 * u + 3];
				}
			}
			resultMatrix = this.restoreToRGB(resultMatrix, width, height);
			return this.draw(resultMatrix, width, height);
		},
		//快速傅立叶变换
		fft: function() {

		},
		//返回canvas元素
		draw: function(matrix, width, height) {
			var canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			var	ctx = canvas.getContext('2d'), 
				resultImg = ctx.createImageData(width, height),
				tempStart, num = 4*width,
				dstHistogram = [];   //目标图的直方图
			for (var i = 0, level = this.level; i < level; ++i) {
				dstHistogram[i] = 0;
			}
			for (var i = 0; i < height; ++i) {
				tempStart = i*num;
				for (var j = 0; j < width; ++j) {
					for (var k = 0; k < 4; ++k) {
						resultImg.data[tempStart + 4*j + k] = matrix[i][4*j + k];
					}
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
		var buttons = document.getElementById('button-group-scale'),
			buttonsGray = document.getElementById('button-group-gray');
		//图像缩放
		Util.addHandler(buttons, 'click', function(e) {
			var button = e.target;
			if (e.target.tagName.toLowerCase() != 'button') {return;}
			if (e.target.id == 'submit') {
				var width = document.getElementById('input-width').value,
					height = document.getElementById('input-height').value;
				if (width*height > 8000000) {
					alert("你设置的值太大了,窗口都要装不下了（程序跑这么大的图也很慢23333）");
					return;
				}
				var result = original.scaleFirst(width, height).canvas,
					resultSecond = original.scaleSecond(width, height).canvas;
			} else {
				var result = original.scaleFirst(button.getAttribute('data-width'), button.getAttribute('data-height')).canvas,
					resultSecond = original.scaleSecond(button.getAttribute('data-width'), button.getAttribute('data-height')).canvas;
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
		//滤波
		Util.addHandler(document.getElementById('button-group-filting'), 'click', function(e) {
			var button = e.target, size = parseInt(button.getAttribute('data-size')),
				buttonParentName = button.parentNode.className;
			if (button.tagName.toLowerCase() !== 'button') {
				return;
			}
			if (buttonParentName == 'arithmetic') {
				var filter = Util.createAveragingFilter(size),
					result = original.filting(filter);
			} else if (buttonParentName == 'geometric') {
				var result = original.geometricFilting(size);
			} else if (buttonParentName == 'median') {
				var result = original.medianFilting(size);
			} else if (buttonParentName == 'harmonic') {
				var result = original.hamonicFilting(size);
			} else if (buttonParentName == 'contra-harmonic') {
				var index = document.getElementById('qValue').selectedIndex;
				var q = document.getElementById('qValue').options[index].value;
				var result = original.contraHamonicFilting(size, parseFloat(q));
			} else if (buttonParentName == 'max') {
				var result = original.maxFilting(size);
			} else if (buttonParentName == 'min') {
				var result = original.minFilting(size);
			}
			document.body.appendChild(result.canvas);
		});

		//图像锐化
		Util.addHandler(document.getElementById('sharpen'), 'click', function(e) {
			var filter = Util.createLaplacianFilter(),
				result = original.filting(filter);
			document.body.appendChild(result.canvas);
		});

		//高提升滤波
		Util.addHandler(document.getElementById('rise'), 'click', function(e) {
			var filter = Util.createAveragingFilter(3),
				result = original.rise(filter);
			document.body.appendChild(result.canvas);
		});

		//傅立叶变换
		Util.addHandler(document.getElementById('button-group-fourier'), 'click', function(e) {
			var button = e.target,
				result, flag;
			if (button.id == 'fft') {
				flag = 0;
			} else if (button.id == 'slow-dft') {
				flag = 1;
			} else if (button.id.indexOf('idft') > -1) {
				if (original.fourierData != null) {
					if (button.id == 'slow-idft') {
						flag = 2;
					} else {
						flag = 4;
					}
				} else {
					alert("请先点击DFT");
					return;
				}
			} else if (button.id == 'fast-dft') {
				flag = 3;
			}
			var a = new Date();
			if (button.id == 'average') {
				var filter = Util.createAveragingFilter(7);
				result = original.fourierFilting(filter);
			} else if (button.id == 'laplacian') {
				var filter = Util.createLaplacianFilter();
				result = original.fourierFilting(filter);
			} else {
				result = original.fourierTransform(flag);

			}
			var b = new Date();
			console.log((b - a) / 1000);
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