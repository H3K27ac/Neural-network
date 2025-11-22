class GPUBackend {
    constructor() {
        this.ready = false;
    }

    async init() {
        if (!("gpu" in navigator)) {
            console.warn("WebGPU not supported - falling back to CPU.");
            return;
        }

        try {
            this.adapter = await navigator.gpu.requestAdapter();
            if (!this.adapter) return;

            this.device = await this.adapter.requestDevice();
            this.queue = this.device.queue;
            this.ready = true;
        } catch (e) {
            console.warn("WebGPU initialization failed - using CPU fallback");
            this.ready = false;
        }
    }

    isReady() { return this.ready; }

    // --- GPU buffer helpers ---
    createBuffer(arr, usage) {
        const buffer = this.device.createBuffer({
            size: arr.byteLength,
            usage,
            mappedAtCreation: true,
        });

        new Float64Array(buffer.getMappedRange()).set(arr);
        buffer.unmap();
        return buffer;
    }

    async readBuffer(buffer, size) {
        const out = this.device.createBuffer({
            size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });

        const commandEncoder = this.device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(buffer, 0, out, 0, size);
        this.queue.submit([commandEncoder.finish()]);

        await out.mapAsync(GPUMapMode.READ);
        return new Float64Array(out.getMappedRange()).slice();
    }

    // --- GPU Compute: Matrix Multiply ---
    async matmul(a, b, rowsA, colsA, colsB) {
        const sizeA = rowsA * colsA * 8;
        const sizeB = colsA * colsB * 8;
        const sizeC = rowsA * colsB * 8;

        const bufferA = this.createBuffer(a, GPUBufferUsage.STORAGE);
        const bufferB = this.createBuffer(b, GPUBufferUsage.STORAGE);
        const bufferC = this.device.createBuffer({
            size: sizeC,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

        const shader = `
            @group(0) @binding(0) var<storage, read> A : array<f64>;
            @group(0) @binding(1) var<storage, read> B : array<f64>;
            @group(0) @binding(2) var<storage, read_write> C : array<f64>;

            @compute @workgroup_size(8,8)
            fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
                let r = gid.x;
                let c = gid.y;
                if (r >= ${rowsA}u || c >= ${colsB}u) { return; }

                var sum : f64 = 0.0;
                for (var k = 0u; k < ${colsA}u; k++) {
                    let aIndex = r * ${colsA}u + k;
                    let bIndex = k * ${colsB}u + c;
                    sum = sum + A[aIndex] * B[bIndex];
                }
                C[r * ${colsB}u + c] = sum;
            }
        `;

        const module = this.device.createShaderModule({ code: shader });

        const pipeline = this.device.createComputePipeline({
            layout: "auto",
            compute: { module, entryPoint: "main" }
        });

        const bind = this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: bufferA } },
                { binding: 1, resource: { buffer: bufferB } },
                { binding: 2, resource: { buffer: bufferC } }
            ]
        });

        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bind);
        pass.dispatchWorkgroups(
            Math.ceil(rowsA / 8),
            Math.ceil(colsB / 8)
        );
        pass.end();
        this.queue.submit([encoder.finish()]);

        return await this.readBuffer(bufferC, sizeC);
    }
}

const GPU = new GPUBackend();
GPU.init();




class Vector {
    constructor(data) {
        // Accept array or Float64Array
        this.data = data instanceof Float64Array ? data : new Float64Array(data);
        this.length = this.data.length;
    }

    static fromLength(n) {
        return new Vector(new Float64Array(n));
    }

    // --- Basic arithmetic (in-place operations) ---

    add(v) {
        if (v.length !== this.length) throw new Error("Vector length mismatch");
        const a = this.data, b = v.data;
        for (let i = 0; i < a.length; i++) a[i] += b[i];
        return this;
    }

    sub(v) {
        if (v.length !== this.length) throw new Error("Vector length mismatch");
        const a = this.data, b = v.data;
        for (let i = 0; i < a.length; i++) a[i] -= b[i];
        return this;
    }

    mul(v) {
        if (v.length !== this.length) throw new Error("Vector length mismatch");
        const a = this.data, b = v.data;
        for (let i = 0; i < a.length; i++) a[i] *= b[i];
        return this;
    }

    scale(s) {
        const a = this.data;
        for (let i = 0; i < a.length; i++) a[i] *= s;
        return this;
    }

    // --- Reductions ---

    dot(v) {
        const n = this.length;
        if (v.length !== n) throw new Error("Vector length mismatch");

        const a = this.data, b = v.data;
        let sum = 0;
        for (let i = 0; i < n; i++) sum += a[i] * b[i];
        return sum;
    }

    norm() { return Math.sqrt(this.dot(this)); }

    normalize() {
        const n = this.norm();
        if (n !== 0) this.scaleInPlace(1 / n);
        return this;
    }

    distance(v) {
        return this.sub(v).norm();
    }

    projectOnto(v) {
        const denom = v.dot(v);
        if (denom === 0) throw new Error("Cannot project onto zero vector");
        return v.scale(this.dot(v) / denom);
    }

    // --- Matrix related ---

    outer(v) {
        return Matrix.outerProduct(this, v);
    }
}


// Row-major matrix
class Matrix {
    constructor(data, rows, cols) {
        this.data = data instanceof Float64Array ? data : new Float64Array(data);
        this.rows = rows;
        this.cols = cols;

        if (this.data.length !== rows * cols)
            throw new Error("Matrix size mismatch");
    }

    static zeros(rows, cols) {
        return new Matrix(new Float64Array(rows * cols), rows, cols);
    }

    static outerProduct(v1, v2) {
        const rows = v1.length;
        const cols = v2.length;
        const out = new Float64Array(rows * cols);

        const a = v1.data, b = v2.data;
        let index = 0;
        for (let i = 0; i < rows; i++) {
            const ai = a[i];
            for (let j = 0; j < cols; j++) {
                out[index++] = ai * b[j];
            }
        }
        return new Matrix(out, rows, cols);
    }

    // --- Matrix-vector multiply ---

    multiplyVector(vec) {
        if (vec.length !== this.cols)
            throw new Error("Vector length must match matrix columns");

        const out = new Float64Array(this.rows);
        const d = this.data, v = vec.data;
        const cols = this.cols;

        for (let r = 0; r < this.rows; r++) {
            let sum = 0;
            const rowStart = r * cols;
            for (let c = 0; c < cols; c++)
                sum += d[rowStart + c] * v[c];

            out[r] = sum;
        }
        return new Vector(out);
    }

    // --- Matrix multiply ---

    async multiply(mat) {
        if (this.cols !== mat.rows) throw "Dimension mismatch";

        // --- GPU path ---
        if (GPU.isReady() && this.data.length > 512) {
            const out = await GPU.matmul(
                this.data,
                mat.data,
                this.rows,
                this.cols,
                mat.cols
            );
            return new Matrix(out, this.rows, mat.cols);
        }

        // --- CPU fallback ---
        const a = this.data, b = mat.data;
        const out = new Float64Array(this.rows * mat.cols);

        const R = this.rows, C = this.cols, C2 = mat.cols;

        for (let r = 0; r < R; r++) {
            const rowOffset = r * C;
            for (let c = 0; c < C2; c++) {
                let sum = 0;
                let aIdx = rowOffset;
                let bIdx = c;
                for (let k = 0; k < C; k++) {
                    sum += a[aIdx++] * b[bIdx];
                    bIdx += C2;
                }
                out[r * C2 + c] = sum;
            }
        }

        return new Matrix(out, this.rows, mat.cols);
    }

    // --- Elementwise ---

    add(m) {
        if (m.rows !== this.rows || m.cols !== this.cols)
            throw new Error("Matrix dimensions must match");

        const out = new Float64Array(this.data.length);
        const a = this.data, b = m.data;

        for (let i = 0; i < a.length; i++) out[i] = a[i] + b[i];

        return new Matrix(out, this.rows, this.cols);
    }

    sub(m) {
        if (m.rows !== this.rows || m.cols !== this.cols)
            throw new Error("Matrix dimensions must match");

        const out = new Float64Array(this.data.length);
        const a = this.data, b = m.data;

        for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];

        return new Matrix(out, this.rows, this.cols);
    }

    // --- Transpose ---

    transpose() {
        const rows = this.rows, cols = this.cols;
        const out = new Float64Array(rows * cols);
        const a = this.data;

        let idx = 0;
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                out[idx++] = a[r * cols + c];
            }
        }
        return new Matrix(out, cols, rows);
    }
}
