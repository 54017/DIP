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

    var changeToMatrix = function(rawData, width, height) {
        //转化为常见的矩阵形式（RGBA矩阵每行是4*width个）
        var b = [];
        var tempStart, num = 4 * width;
        for (var i = 0; i < height; ++i) {
            tempStart = i * num;
            b[i] = Array.prototype.slice.call(rawData, tempStart, tempStart + num);
        }
        return b;
    }

    //二维数组padding
    var pad = function(array, width, height) {
        var result = [],
            arrayWidth = array[0].length,
            arrayHeight = array.length,
            newWidth = 2 * width + arrayWidth,
            newHeight = 2 * height + arrayHeight;
        for (var i = 0; i < height; ++i) {
            result.push(Array(newWidth).fill(0));
        }
        for (var i = 0; i < arrayHeight; ++i) {
            var temp = array[i].slice(0);
            temp = Array(width).fill(0).concat(temp);
            temp = temp.concat(Array(width).fill(0));
            result.push(temp);
        }
        for (var i = 0; i < height; ++i) {
            result.push(Array(newWidth).fill(0));
        }
        return result;
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
    var createTwoDimensionalArray = function(row) {
        var matrix = [];
        for (var i = 0; i < row; ++i) {
            var tempRow = [];
            matrix.push(tempRow);
        }
        return matrix;
    }


    var paddingZero = function(matrix, width, height) {
        var resultMatrix = createTwoDimensionalArray(height);
        var length = matrix.length;
        for (var i = 0; i < height; ++i) {
            for (var j = 0; j < width; ++j) {
                if (typeof matrix[i] == 'undefined' || typeof matrix[i][j] == 'undefined') {
                    resultMatrix[i][j] = 0;
                }
                 else {
                    resultMatrix[i][j] = matrix[i][j];
                }
            }
        }
        return resultMatrix;
    }
    

    var fillZeroForComplex = function(matrix, width, height) {
        for (var i = 0; i < height; ++i) {
            for (var  j = 0; j < width; ++j) {
                matrix[i][j] = { real: 0, imag: 0 };
            }
        }
    }

    var multiply = function(first, second, width, height) {
        var resultMatrix = createTwoDimensionalArray(height);
        fillZeroForComplex(resultMatrix, width, height);
        for (var i = 0; i < height; ++i) {
            for (var j = 0; j < width; ++j) {
                resultMatrix[i][j].real = first[i][j].real * second[i][j].real;
                resultMatrix[i][j].imag = first[i][j].real * second[i][j].imag;
            }
        }
        return resultMatrix;
    }

    var fastIdft = function(fourierData, width, height) {
        var tempDataReal, tempDataImag,
            resultMatrix = Util.createTwoDimensionalArray(height),
            tempMatrix = Util.createTwoDimensionalArray(height),
            sumImag, sumReal, number, real, imag;
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
                resultMatrix[v][u] = { real: sumReal, imag: sumImag };
            }
        }
        return resultMatrix;
    }

    //RGB转LAB
    var rgb2lab = function(matrix, width, height) {
        var result = createTwoDimensionalArray(height);
        for (var i = 0; i < height; ++i) {
            for (var j = 0; j < width; ++j) {
                for (var k = 0; k < 3; ++k) {
                    var value = matrix[i][4 * j + k] / 255;
                    if (value > 0.04045) {
                        value = Math.pow(((value + 0.055) / 1.055), 2.4);
                    } else {
                        value /= 12.92;
                    }
                    result[i][3 * j + k] = value * 100;
                }
            }
        }
        for (var i = 0; i < height; ++i) {
            for (var j = 0; j < width; ++j) {
                var X = result[i][3 * j] * 0.4124 + result[i][3 * j + 1] * 0.3576 + result[i][3 * j + 2] * 0.1805,
                    Y = result[i][3 * j] * 0.2126 + result[i][3 * j + 1] * 0.7152 + result[i][3 * j + 2] * 0.0722,
                    Z = result[i][3 * j] * 0.0193 + result[i][3 * j + 1] * 0.1192 + result[i][3 * j + 2] * 0.9505;
                result[i][3 * j] = X / 95.047;
                result[i][3 * j + 1] = Y / 100.0;
                result[i][3 * j + 2] = Z / 108.883;
            }
        }
        for (var i = 0; i < height; ++i) {
            for (var j = 0; j < width; ++j) {
                for (var k = 0; k < 3; ++k) {
                    if (result[i][3 * j + k] > 0.008856) {
                        result[i][3 * j + k] = Math.pow(result[i][3 * j + k], 1/3)
                    } else {
                        result[i][3 * j + k] = (7.787 * result[i][3 * j + k]) + (16 / 116)
                    }
                }
            } 
        }
        for (var i = 0; i < height; ++i) {
            for (var j = 0; j < width; ++j) {
                var L = (116 * result[i][3 * j + 1]) - 16,
                    A = 500 * (result[i][3 * j] - result[i][3 * j + 1]),
                    B = 200 * (result[i][3 * j + 1] - result[i][3 * j + 2]);
                result[i][3 * j] = L
                result[i][3 * j + 1] = A
                result[i][3 * j + 2] = B
            }
        }
        return result
    }

    return {
        createAveragingFilter: createAveragingFilter,
        createLaplacianFilter: createLaplacianFilter,
        createTwoDimensionalArray: createTwoDimensionalArray,
        addHandler: addHandler,
        multiply: multiply,
        fillZeroForComplex: fillZeroForComplex,
        fastIdft: fastIdft,
        paddingZero: paddingZero,
        rgb2lab: rgb2lab,
        changeToMatrix: changeToMatrix,
        pad: pad
    }

}());