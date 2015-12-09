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


    return {
        createAveragingFilter: createAveragingFilter,
        createLaplacianFilter: createLaplacianFilter,
        createTwoDimensionalArray: createTwoDimensionalArray,
        addHandler: addHandler,
        multiply: multiply,
        fillZeroForComplex: fillZeroForComplex,
        fastIdft: fastIdft,
        paddingZero: paddingZero
    }

}());