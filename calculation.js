
class Layer {
    constructor(inputSize, outputSize) {
        this.inputSize = inputSize;
        this.outputSize = outputSize;
    }
}

class DenseLayer extends Layer {
    constructor(inputSize, outputSize) {
        super(inputSize, outputSize);

        this.weights = Matrix.zeros(inputSize, outputSize);  // Float32Array
        this.biases  = Vector.fromLength(outputSize);        // Float32Array

        this.weightRange = 1;
        this.biasRange = 1

        this.layerInput = null;
        this.outputCost = null;
    }

    xavierInitialization() {
        const limit = Math.sqrt(6 / (this.inputSize + this.outputSize));

        const w = new Float32Array(this.inputSize * this.outputSize);
        for (let i = 0; i < w.length; i++)
            w[i] = Math.random() * 2 * limit - limit;

        this.weights = new Matrix(w, this.inputSize, this.outputSize);
    }

    async forward(layerInput) {
        this.layerInput = layerInput;

        let layerOutput = await this.weights.multiply(layerInput);

        // Add biases
        layerOutput.add(this.biases);

        return layerOutput;
    }

    async backward(outputCost) {
        this.outputCost = outputCost;

        const Wt = this.weights.transpose();
        return await Wt.multiply(outputCost);
    }

    updateWeights(learningRate, batchSize) {
        const scaledGrad = this.outputCost.sumRows().scale(learningRate / batchSize);
        const dW = this.layerInput.outer(scaledGrad);

        this.weights.data.set(
            this.weights.add(dW).data
        );
    }

    updateBiases(learningRate, batchSize) {
        this.biases.add(
            this.outputCost.sumRows().scale(learningRate / batchSize)
        );
    }
}

class ActivationLayer extends Layer {
    constructor(size) {
        super(size, size);

        this.layerInput  = null;
        this.layerOutput = null;
        this.outputCost  = null;

        this.activationFunction = null;
        this.derivativeFunction = null;
    }

    initializeActivationFunction(type) {
        this.activationFunction = activationFunctions[type];
        this.derivativeFunction = derivativeActivationFunctions[type];

        if (!this.activationFunction)
            throw new Error("Unknown activation: " + type);
    }

    forward(layerInput) {
        this.layerInput = layerInput;

        this.layerOutput = this.activationFunction(layerInput.data);
        return this.layerOutput;
    }

    backward(outputCost) {
        // Softmax cross-entropy already has gradient
        if (this.activationFunction === activationFunctions.softmax) {
            this.outputCost = outputCost;
            return outputCost;
        }

        this.outputCost = this.derivativeFunction(this.layerInput.data, this.layerOutput.data);
        return this.outputCost;
    }

    updateWeights() {}
    updateBiases() {}
}


class Network {
    constructor() {
        this.layers = [];
        this.outputNeurons = null;
        this.learningRate = 0.01;
        this.batchSize = 1;
    }

    initializeArchitecture(architecture) {
        for (let [type, ...params] of architecture) {
            switch (type) {
                case "dense":
                    this.layers.push(new DenseLayer(...params));
                    break;
                case "activation":
                    this.layers.push(new ActivationLayer(...params));
                    break;
                default:
                    throw new Error("Unknown layer type: " + type);
            }
        }
    }

    async feedForward(inputNeurons) {
        let output = inputNeurons;
        for (let layer of this.layers) {
            output = await layer.forward(output);
        }
        this.outputNeurons = output;
    }

    async backpropagate(targets) {
        // target - output
        let outputCost = targets.sub(this.outputNeurons);

        for (let i = this.layers.length - 1; i >= 0; i--) {
            outputCost = await this.layers[i].backward(outputCost);
        }
    }

    updateParameters() {
        for (let layer of this.layers) {
            if (layer instanceof DenseLayer) {
                layer.updateWeights(this.learningRate, this.batchSize);
                layer.updateBiases(this.learningRate, this.batchSize);
            }
        }
    }

    async train(inputNeurons, targets) {
        await this.feedForward(inputNeurons);
        await this.backpropagate(targets);
        this.updateParameters();
    }

    meanSquaredError(targets) {
        const t = targets.data;
        const o = this.outputNeurons.data;
        let sum = 0;

        for (let i = 0; i < t.length; i++) {
            const diff = t[i] - o[i];
            sum += diff * diff;
        }
        return sum / t.length;
    }

    getNeurons() {
        let neurons = [];

        for (let layer of this.layers) {
            if (layer instanceof DenseLayer) {
                neurons = neurons.concat(layer.layerOutput.data);
            }
        }
        
        // if (this.outputNeurons) neurons = neurons.concat(this.outputNeurons.data);

        return neurons;
    }

    getWeights() {
        let weights = [];

        for (let layer of this.layers) {
            if (layer instanceof DenseLayer) {
                weights = weights.concat(layer.weights.data);
            }
        }

        return weights;
    }

    getBiases() {
        let biases = [];

        for (let layer of this.layers) {
            if (layer instanceof DenseLayer) {
                biases = biases.concat(layer.biases.data);
            }
        }

        return biases;
    }

    getStructure() {
        let structure = [this.layers[0].inputSize];

        for (let layer of this.layers) {
            if (layer instanceof DenseLayer) {
                structure.push(layer.outputSize);
            }
        }

        return structure;
    }
}
