function addVectors(vector1,vector2) {
    if (vector1.length !== vector2.length) {} // Error
    return vector1.map((value, index) => value + vector2[index]);
}

class Matrix {
    constructor(elements,columns) {
        this.elements = elements;
        this.columns = columns;
        this.rows = elements.length / stride;
    }

    static multiplyVector(matrix,vector) {
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

    static transpose(matrix) {
        let outputMatrix = new Array(matrix.elements.length);
        for (let i = 0; i < matrix.rows; i++) {
            for (let j = 0; j < matrix.columns; j++) {
                outputMatrix[j * matrix.rows + i] = matrix[i * matrix.columns + j];
            }
        }
        return new Matrix(outputMatrix.rows);
    }
}
