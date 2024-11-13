function addVectors(vector1, vector2) {
    if (vector1.length !== vector2.length) {} // Error
    return vector1.map((value, index) => value + vector2[index]);
}

function subtractVectors(vector1, vector2) {
    if (vector1.length !== vector2.length) {} // Error
    return vector1.map((value, index) => value - vector2[index]);
}

function elementWiseVectorProduct(vector1, vector2) {
    if (vector1.length !== vector2.length) {} // Error
    return vector1.map((value, index) => value * vector2[index]);
}

function scalarMultiplyVector(vector, scalar) {
    return vector.map(value => value * scalar);
}

function outerProduct(vector1, vector2) {
    let result = [];
    
    for (let i = 0; i < vector1.length; i++) {
      for (let j = 0; j < vector2.length; j++) {
        result.push(vector1[i] * vector2[j]);
      }
    }
  
    return new Matrix(result, vector2.length);
}

class Matrix {
    constructor(elements, columns) {
        this.elements = elements;
        this.columns = columns;
        this.rows = elements.length / columns;
    }

    static multiplyVector(matrix, vector) {
        let outputVector = [];
        for (let i = 0; i < matrix.rows; i++) {
            let sum = 0;
            for (let j = 0; j < matrix.columns; j++) {
                sum += matrix.elements[i * matrix.columns + j] * vector[j];
            }
            outputVector.push(sum);
        }
        return outputVector;
    }

    static elementWiseSum(matrix1, matrix2) {
        return new Matrix(matrix1.elements.map((value, index) => value + matrix2.elements[index]), matrix1.columns);
    }

    static transpose(matrix) {
        let outputMatrix = [];
        for (let i = 0; i < matrix.columns; i++) {
            for (let j = 0; j < matrix.rows; j++) {
                outputMatrix.push(matrix.elements[j * matrix.columns + i]);
            }
        }
        return new Matrix(outputMatrix, matrix.rows);
    }
}
