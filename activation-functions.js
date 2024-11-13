const activationFunctions = {
    sigmoid: (z) => 1 / (1 + Math.exp(-z)),
    relu: (z) => Math.max(0, z),
    tanh: (z) => Math.tanh(z)
};

const derivativeActivationFunctions = {
    sigmoidDerivative: (a) => a*(1-a),
    reluDerivative: (z) => (z > 0 ? 1 : 0),
    tanhDerivative: (a) => 1 - Math.pow(a, 2)
}