class Vector {
    constructor(elements) {
        this.elements = elements;
    }

    static add(vector1,vector2) {
        if (vector1.elements.length !== vector2.elements.length); // Error
        for (let i = 0; i < vector1.elements.length; i++) {
            vector1.elements[i] += vector2.elements[i];
        }
        return vector1;
    }
}

class Matrix {
    constructor(elements,stride) {
        this.elements = elements;
        this.stride = stride;
    }

    static multiplyVector(matrix,vector) {
        let outputVector = [];
        const rows = matrix.elements.length / matrix.stride;
        for (let i = 0; i < rows; i++) {
            let sum = 0;
            for (let j = 0; j < matrix.stride; j++) {
                sum += matrix.elements[i * matrix.stride + j] * vector.elements[j];
            }
            outputVector.push(sum);
        }
        return new Vector(outputVector);
    }

    static matrixTranspose(matrix) {
        let outputMatrix = new Array(matrix.elements.length);
        const rows = matrix.elements.length / matrix.stride;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < matrix.stride; j++) {
                outputMatrix[j * rows + i] = matrix[i * matrix.stride + j];
            }
        }
        return new Matrix(outputMatrix,rows);
    }
}
