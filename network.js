const svgNS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("network-container");

/* Config / ranges */
let weightRange = 1.0;
let biasRange = 1.0;
let neuronRange = 1.0;

/* Visual parameters */
const LAYER_X_PADDING = 120;   // horizontal spacing between layers
const LEFT_MARGIN = 80;
const RIGHT_MARGIN = 80;
const TOP_MARGIN = 40;
const BOTTOM_MARGIN = 40;
const NEURON_RADIUS = 12;
const MIN_VERTICAL_SPACING = 20; // min gap between neurons

/* Behavior flags */
let showTargets = true;
let showBiases = true;

/* Hidden neuron behavior - show first 5 and last 5 */
const VISIBLE_EDGE_COUNT = 5;

/* Helper: compute offsets into flattened arrays */
function computeOffsets(structure) {
  const neuronOffsets = []; // where each layer's neurons start in flattened neurons array
  let acc = 0;
  for (let i = 0; i < structure.length; i++){
    neuronOffsets.push(acc);
    acc += structure[i];
  }

  const weightOffsets = []; // for each layer i (0..L-2), where its block starts in weights array
  acc = 0;
  for (let i = 0; i < structure.length - 1; i++){
    weightOffsets.push(acc);
    acc += structure[i] * structure[i+1];
  }

  const biasOffsets = []; // biases are for layers 1..L-1 - we'll store by layer index (layer i starts at biases offset for layer i)
  acc = 0;
  // biasOffsets[0] unused (input layer has no biases) but for convenience we'll align indexes by layer
  biasOffsets.push(0);
  for (let i = 1; i < structure.length; i++){
    biasOffsets.push(acc);
    acc += structure[i];
  }

  return { neuronOffsets, weightOffsets, biasOffsets };
}

/* DOM clearing utility - removes children of svg */
function DeleteNN() {
  while (svg.lastChild) svg.removeChild(svg.lastChild);
}

/* Color functions converted to use SVG attributes (fill, stroke) */
/* Color(value, type) - for weights and biases */
function Color(value, type) {
  // handle NaN specially
  if (Number.isNaN(Number(value))) return `rgb(0,255,0)`;
  let val = Number(value);
  let valueRange = (type === "bias") ? biasRange : weightRange;
  if (valueRange === 0) valueRange = 1;
  if (val === 0) return `rgb(255,255,255)`;
  const value3 = val / valueRange;
  const red = val > 0 ? 255 : Math.round(255 * (1 + value3));
  const green = Math.round(255 * (1 - Math.abs(value3)));
  const blue = val > 0 ? Math.round(255 * (1 - value3)) : 255;
  return `rgb(${red}, ${green}, ${blue})`;
}

/* Color2(value) - neuron brightness -> grayscale fill */
function grayscaleColor(value) {
  const val = Number(value);
  const range = neuronRange || 1;
  const brightness = Math.round(255 * val / range);
  return `rgb(${brightness},${brightness},${brightness})`;
}

/* Layout: compute x for layer and y for neuron index within visible list */
function computeLayout(structure) {
  // Determine SVG viewBox dimensions
  const vb = svg.viewBox.baseVal;
  const totalWidth = vb.width || svg.clientWidth || 1200;
  const totalHeight = vb.height || svg.clientHeight || 800;
  const layers = structure.length;
  const usableWidth = totalWidth - LEFT_MARGIN - RIGHT_MARGIN;
  const xStep = layers > 1 ? (usableWidth / (layers - 1)) : 0;

  const coords = []; // coords[layer] = array of { j, x, y, visibleIndex }
  for (let i = 0; i < structure.length; i++){
    const count = structure[i];
    // compute which neuron indices are visible for this layer
    let visibleList = [];
    if (count > VISIBLE_EDGE_COUNT*2) {
      for (let j=0;j<VISIBLE_EDGE_COUNT;j++) visibleList.push(j);
      for (let j=count - VISIBLE_EDGE_COUNT; j<count; j++) visibleList.push(j);
    } else {
      for (let j=0;j<count;j++) visibleList.push(j);
    }
    // vertical spacing for visible nodes depends on number of visible nodes
    const visibleCount = visibleList.length;
    const usableHeight = totalHeight - TOP_MARGIN - BOTTOM_MARGIN;
    const spacing = Math.max(MIN_VERTICAL_SPACING, Math.floor(usableHeight / Math.max(visibleCount,1)));
    // center them vertically
    const blockHeight = spacing * (visibleCount - 1);
    const startY = TOP_MARGIN + (usableHeight - blockHeight) / 2;

    const layerCoords = [];
    const x = LEFT_MARGIN + i * xStep;
    for (let p = 0; p < visibleCount; p++) {
      const j = visibleList[p];
      const y = startY + p*spacing;
      layerCoords.push({ j, x, y, p, visible: true });
    }
    // if neurons hidden, also include a special position for HideText center (placing between 5th and (count-5)th)
    let hideInfo = null;
    if (count > VISIBLE_EDGE_COUNT*2) {
      const midIndex = Math.floor(visibleCount / 2);
      const hideY = startY + (VISIBLE_EDGE_COUNT - 0.5) * spacing;
      hideInfo = {
        countHidden: count - VISIBLE_EDGE_COUNT*2,
        x,
        y: hideY
      };
    }
    coords.push({ layerIndex:i, coords: layerCoords, hideInfo });
  }

  return coords;
}

/* Utility to create an SVG element with attributes */
function createSVG(tag, attrs = {}) {
  const el = document.createElementNS(svgNS, tag);
  for (const k in attrs) {
    if (attrs[k] === null || attrs[k] === undefined) continue;
    el.setAttribute(k, attrs[k]);
  }
  return el;
}

/* Create node & its text (neuron or target) */
function CreateNeuron(layerIndex, j, x, y, isTarget=false) {
  const id = `neuron ${layerIndex},${j}`;
  const circle = createSVG("circle", {
    cx: x,
    cy: y,
    r: NEURON_RADIUS,
    class: "Neuron",
    id
  });
  svg.appendChild(circle);

  const text = createSVG("text", {
    x: x,
    y: y + 1, // vertical offset to center text on circle
    class: "NeuronValue",
    id: `neuronvalue ${layerIndex},${j}`
  });
  // initial text blank; UpdateColor will set it
  text.textContent = "";
  svg.appendChild(text);

  return { circle, text };
}

/* Create "target" - visually identical to a neuron but ID uses target prefix */
function CreateTarget(index, x, y) {
  const id = `target ${index}`;
  const circle = createSVG("circle", {
    cx: x,
    cy: y,
    r: NEURON_RADIUS,
    class: "Neuron",
    id
  });
  svg.appendChild(circle);

  const text = createSVG("text", {
    x: x,
    y: y + 1,
    class: "NeuronValue",
    id: `targetvalue ${index}`
  });
  text.textContent = "";
  svg.appendChild(text);

  return { circle, text };
}

/* Create hidden-count UI (rounded rect + text) */
function CreateHideBox(layerIndex, x, y, countHidden) {
  const boxWidth = 60;
  const boxHeight = 28;
  const box = createSVG("rect", {
    x: x - boxWidth/2,
    y: y - boxHeight/2,
    width: boxWidth,
    height: boxHeight,
    class: "HideTextBox",
    id: `hidetextbox ${layerIndex}`
  });
  svg.appendChild(box);

  const text = createSVG("text", {
    x: x,
    y: y + 1,
    class: "HideText",
    id: `hidetext ${layerIndex}`
  });
  text.textContent = `${countHidden}`;
  svg.appendChild(text);

  return {box, text};
}

/* Create a weight as an SVG line between neuron i,k and neuron i+1,j */
function CreateWeight(i, j, k, idSuffix) {
  // i: source layer index, j: target-neuron index (in target layer), k: source-neuron index (in source layer)
  const id = `weight ${i+1},${j},${k}`;
  // fetch circle elements by id
  const source = document.getElementById(`neuron ${i},${k}`);
  const target = document.getElementById(`neuron ${i+1},${j}`);
  // In case target is a "target N" (i.e. last layer represented with id 'target j')
  const targetAlt = document.getElementById(`target ${j}`);

  if (!source || (!target && !targetAlt)) return null;
  const t = target || targetAlt;

  const x1 = parseFloat(source.getAttribute("cx"));
  const y1 = parseFloat(source.getAttribute("cy"));
  const x2 = parseFloat(t.getAttribute("cx"));
  const y2 = parseFloat(t.getAttribute("cy"));

  const line = createSVG("line", {
    id,
    class: "Weight",
    x1, y1, x2, y2
  });
  // default stroke color
  line.setAttribute("stroke", "#444");
  svg.insertBefore(line, svg.firstChild); // draw weights under neurons
  return line;
}

/* Build the entire diagram */
function DrawNN() {
  DeleteNN();

  const structure = currentNetwork.getStructure();
  const neuronsFlat = currentNetwork.getNeurons();
  const weightsFlat = currentNetwork.getWeights();
  const biasesFlat = currentNetwork.getBiases();

  // compute offsets
  const { neuronOffsets, weightOffsets, biasOffsets } = computeOffsets(structure);
  const coordsPerLayer = computeLayout(structure);

  // Create neurons (or targets for last layer)
  for (let i = 0; i < structure.length; i++){
    const layer = coordsPerLayer[i];
    const isLastLayer = (i === structure.length - 1);
    const visibleCoords = layer.coords;
    for (let p=0;p<visibleCoords.length;p++){
      const { j, x, y } = visibleCoords[p];
      if (isLastLayer && showTargets) {
        CreateTarget(j, x, y);
      } else {
        CreateNeuron(i, j, x, y);
      }
    }
    if (layer.hideInfo) {
      CreateHideBox(i, layer.hideInfo.x, layer.hideInfo.y, layer.hideInfo.countHidden);
    }
  }

  // Create weights (lines)
  // For each inter-layer mapping i -> i+1:
  for (let i = 0; i < structure.length - 1; i++){
    const s0 = structure[i];
    const s1 = structure[i+1];
    const wOffset = weightOffsets[i];
    // For each target neuron j (0..s1-1)
    // For hidden neurons we still create weights only for visible endpoints.
    // We'll follow the same visible set as we used for neurons (first/last VISIBLE_EDGE_COUNT)
    const visibleTargets = coordsPerLayer[i+1].coords.map(c=>c.j);
    const visibleSources = coordsPerLayer[i].coords.map(c=>c.j);
    for (let jIndex = 0; jIndex < visibleTargets.length; jIndex++){
      const j = visibleTargets[jIndex];
      for (let kIndex = 0; kIndex < visibleSources.length; kIndex++){
        const k = visibleSources[kIndex];
        CreateWeight(i, j, k);
      }
    }
  }

  // After creating elements, run an initial color update
  UpdateColor();
}

/* Update color values for neurons, weights, biases, and displayed values */
function UpdateColor() {
  const structure = currentNetwork.getStructure();
  const neuronsFlat = currentNetwork.getNeurons();
  const weightsFlat = currentNetwork.getWeights();
  const biasesFlat = currentNetwork.getBiases();
  const { neuronOffsets, weightOffsets, biasOffsets } = computeOffsets(structure);

  // Determine neuronrange/weightrange/biasrange heuristically if not defined
  // We'll compute max absolute values for neurons/weights/biases if arrays present
  if (neuronsFlat && neuronsFlat.length > 0) {
    let mx = 0;
    for (const v of neuronsFlat) if (Math.abs(v) > mx) mx = Math.abs(v);
    neuronRange = mx || 1;
  }
  if (weightsFlat && weightsFlat.length > 0) {
    let mx = 0;
    for (const v of weightsFlat) if (Math.abs(v) > mx) mx = Math.abs(v);
    weightRange = mx || 1;
  }
  if (biasesFlat && biasesFlat.length > 0) {
    let mx = 0;
    for (const v of biasesFlat) if (Math.abs(v) > mx) mx = Math.abs(v);
    biasRange = mx || 1;
  }

  // update neurons
  for (let i = 0; i < structure.length; i++){
    const offset = neuronOffsets[i];
    const visibleCoords = computeLayout(structure)[i].coords;
    for (let p=0;p<visibleCoords.length;p++){
      const j = visibleCoords[p].j;
      const circle = document.getElementById(`neuron ${i},${j}`);
      const text = document.getElementById(`neuronvalue ${i},${j}`);
      if (!circle) continue;
      const val = (neuronsFlat[offset + j] !== undefined) ? neuronsFlat[offset + j] : 0;
      circle.setAttribute("fill", Color2(val));
      // set border color depending on bias if present
      if (showbiases && i>=1) {
        const bOff = biasOffsets[i];
        const biasVal = biasesFlat[bOff + j];
        circle.setAttribute("stroke", Color(biasVal,"bias"));
      } else {
        circle.setAttribute("stroke", "#fff");
      }
      // text color => black if bright background, white otherwise
      const brightness = parseInt(Color2(val).slice(4, -1).split(",")[0],10);
      text.setAttribute("fill", brightness > 128 ? "#000" : "#fff");
      text.textContent = Number(val).toFixed(2);
    }
  }

  // update targets (last layer) if present (targets share ids 'target N' and 'targetvalue N')
  const lastLayer = structure.length - 1;
  const tOffset = neuronOffsets[lastLayer];
  const targetsVis = computeLayout(structure)[lastLayer].coords;
  for (let p = 0; p < targetsVis.length; p++){
    const j = targetsVis[p].j;
    const circle = document.getElementById(`target ${j}`);
    const text = document.getElementById(`targetvalue ${j}`);
    if (!circle) continue;
    const val = (neuronsFlat[tOffset + j] !== undefined) ? neuronsFlat[tOffset + j] : 0;
    circle.setAttribute("fill", Color2(val));
    const brightness = parseInt(Color2(val).slice(4, -1).split(",")[0],10);
    text.setAttribute("fill", brightness > 128 ? "#000" : "#fff");
    text.textContent = Number(val).toFixed(2);
  }

  // update weights: iterate through created weight elements
  // We'll loop through all svg lines with id starting with "weight "
  const weightElements = svg.querySelectorAll('line[id^="weight "]');
  // We'll find their stored ids to resolve correct index in flattened weight array:
  // weight id format: "weight LAYER,j,k" where LAYER is i+1 in original code (target layer index)
  for (const w of weightElements) {
    const id = w.id; // "weight i+1,j,k"
    const parts = id.replace("weight ","").split(",");
    const layerTarget = parseInt(parts[0],10); // equals i+1
    const j = parseInt(parts[1],10);
    const k = parseInt(parts[2],10);
    const layerIndex = layerTarget - 1; // original source layer index i
    const wOffset = weightOffsets[layerIndex];
    const s0 = structure[layerIndex];
    // flattened table is ordered by target-neuron-major: for each target j, there are s0 source weights
    const indexInWeights = wOffset + j * s0 + k;
    const value = (weightsFlat[indexInWeights] !== undefined) ? weightsFlat[indexInWeights] : 0;
    w.setAttribute("stroke", Color(value, "weight"));
    // optional stroke width mapping:
    const sw = 1 + Math.min(3, Math.abs(value) / Math.max(weightrange,0.0001) * 3);
    w.setAttribute("stroke-width", sw);
  }

  // update hide text boxes values (in case counts changed)
  const coords = computeLayout(structure);
  for (let i = 0; i < coords.length; i++){
    const info = coords[i].hideInfo;
    if (!info) continue;
    const text = document.getElementById(`hidetext ${i}`) || document.getElementById(`hidetextbox ${i}`);
    const textNode = document.getElementById(`hidetext ${i}`);
    if (textNode) textNode.textContent = `${info.countHidden}`;
  }
}


/* Redraw on resize to re-layout coordinates 
window.addEventListener("resize", () => {
  // Keep the viewBox fixed; you may want to change viewBox based on svg.clientWidth/clientHeight
  DrawNN();
});
*/

/* Initial draw */
DrawNN();