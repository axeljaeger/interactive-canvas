import './style.css'

import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Mesh } from '@babylonjs/core/Meshes/mesh';

import '@babylonjs/core/Meshes/thinInstanceMesh';

import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ExecuteCodeAction, WebGPUEngine } from '@babylonjs/core';

const myDataModel = [-2, 0, 2];

let sphere : Mesh;
let hoveredIndex = -1;
let movingIndex = -1;

const transducerVertexShaderCode = /* wgsl */`
  #include<sceneUboDeclaration>
  #include<meshUboDeclaration>
  #include<instancesDeclaration>

  attribute position : vec3<f32>;
  attribute hovered : f32;

  varying vUV : vec2<f32>;
  varying vHovered : f32;

  @vertex
  fn main(input : VertexInputs) -> FragmentInputs {
  #include<instancesVertex>
    vertexOutputs.position = scene.viewProjection * finalWorld * vec4<f32>(vertexInputs.position, 1.0);
    vertexOutputs.vHovered = vertexInputs.hovered;
  }
`;

const transducerFragmentShaderCode = /* wgsl*/`
  varying vHovered : f32;
  const regularColor = vec4<f32>(0.8, 0.8, 0.8, 1.0);
  const hoverColor = vec4<f32>(1.0, 0.8, 0.8, 1.0);

  @fragment
  fn main(input : FragmentInputs) -> FragmentOutputs {
    fragmentOutputs.color = select(regularColor, hoverColor, input.vHovered > 0.5);
  }
`;

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement; // Get the canvas element
const engine = new WebGPUEngine(canvas, {
  adaptToDeviceRatio: true,
});
await engine.initAsync();

const scene = new Scene(engine);

const updateMatrixBuffer = () => {
  const { matrixBuffer, hoveredBuffer } = myDataModel.reduce((acc, item, index) => {
      const matrix = Matrix.Translation(item, 0, 0);
      matrix.copyToArray(acc.matrixBuffer, index * 16);
      acc.hoveredBuffer[index] = hoveredIndex === index ? 1 : 0;
      return acc;
  }, { 
      matrixBuffer: new Float32Array(myDataModel.length * 16),
      hoveredBuffer: new Float32Array(myDataModel.length * 1)     
  });

  sphere.thinInstanceSetBuffer('matrix', matrixBuffer);
  sphere.thinInstanceSetBuffer('hovered', hoveredBuffer, 1);

  engine.beginFrame();
  scene.render();
  engine.endFrame();
};

const createScene = () => {
  // Creates a basic Babylon Scene object
  // Creates and positions a free camera
  const camera = new FreeCamera("camera1",
    new Vector3(0, 5, -10), scene);
  // Targets the camera to scene origin
  camera.setTarget(Vector3.Zero());
  // Creates a light, aiming 0,1,0 - to the sky
  const light = new HemisphericLight("light",
    new Vector3(0, 1, 0), scene);
  // Dim the light a small amount - 0 to 1
  light.intensity = 0.7;
  // Built-in 'sphere' shape.
  sphere = CreateSphere("sphere",
    { diameter: 1, segments: 32 }, scene);

    const material = new ShaderMaterial('myMaterial', scene, {
      vertexSource: transducerVertexShaderCode,
      fragmentSource: transducerFragmentShaderCode
  },
  {
  attributes: [
    "position",
    "normal",
    "hovered"
  ],
  uniformBuffers: ["Scene", "Mesh"],
  needAlphaBlending: true,
  shaderLanguage: ShaderLanguage.WGSL,
  });

  sphere.material = material;
  sphere.thinInstanceEnablePicking = true;

  const dragBehavior = new PointerDragBehavior();
  dragBehavior.moveAttached = false;
  dragBehavior.onDragStartObservable.add(drag => {
      if (drag.pointerInfo?.pickInfo) {
        movingIndex = drag.pointerInfo.pickInfo.thinInstanceIndex;
      }
  });
  
  dragBehavior.onDragObservable.add(drag => {
      // Update data model
      myDataModel[movingIndex] = drag.dragPlanePoint.x;
      // Update matrix buffer
      updateMatrixBuffer();
  });
  sphere.addBehavior(dragBehavior);

  const actionManager = new ActionManager(scene);
  actionManager.registerAction(new ExecuteCodeAction(
      { trigger: ActionManager.OnPointerOverTrigger }, 
      (event) => {
          hoveredIndex = event.additionalData.pickResult.thinInstanceIndex;
          updateMatrixBuffer();
      }
  ));

  actionManager.registerAction(new ExecuteCodeAction(
      { trigger: ActionManager.OnPointerOutTrigger }, 
      () => {
          hoveredIndex = -1;
          updateMatrixBuffer();
      }
  ));
  sphere.actionManager = actionManager;
  updateMatrixBuffer();  
  return;
};

createScene();
// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
  engine.resize();
});