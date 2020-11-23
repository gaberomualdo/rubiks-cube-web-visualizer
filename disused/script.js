Object.prototype.clone = function () {
  return JSON.parse(JSON.stringify(this));
};

let cubeContainerElm;
let cubeElm;

// variables
const TRANSITION_TIME_S = 0.5;

let defaultFacesTransforms = {
  front: {},
  back: { rotateY: 180 },
  right: { rotateY: 90 },
  left: { rotateY: -90 },
  top: { rotateX: 90 },
  bottom: { rotateX: -90 },
};
let currentFacesTransforms = {
  front: {},
  back: {},
  right: {},
  left: {},
  top: {},
  bottom: {},
};

let allFacesDefaultTransforms = 'translateZ(5em)';
let allFacesDefaultTransformsFakeFace = 'translateZ(1.65em)';

// create cube inside container
const createCubeInsideContainer = (containerElm) => {
  cubeContainerElm = document.createElement('div');
  cubeContainerElm.classList.add('cube-container');

  cubeElm = document.createElement('div');
  cubeElm.classList.add('cube');

  cubeElm.innerHTML = `
  <div class="face front"></div>
  <div class="face back"></div>
  <div class="face right"></div>
  <div class="face left"></div>
  <div class="face top"></div>
  <div class="face bottom"></div>

  <div class="face fake fake-front"></div>
  <div class="face fake fake-back"></div>
  <div class="face fake fake-right"></div>
  <div class="face fake fake-left"></div>
  <div class="face fake fake-top"></div>
  <div class="face fake fake-bottom"></div>

  <div class="face fake front"></div>
  <div class="face fake back"></div>
  <div class="face fake right"></div>
  <div class="face fake left"></div>
  <div class="face fake top"></div>
  <div class="face fake bottom"></div>
  `;

  cubeContainerElm.appendChild(cubeElm);

  containerElm.appendChild(cubeContainerElm);
};

// initialize cube
const initializeCube = (middleRows = true, horizontalRows = true) => {
  Array.from(document.querySelectorAll('.face')).forEach((e) => {
    if (e.classList.contains('fake')) {
      return;
    }
    const isRows = e.classList.contains('top') || e.classList.contains('bottom') ? horizontalRows : middleRows;
    e.innerHTML = `<div class="${isRows ? 'row' : 'col'}">${'<div class="cubelet"></div>\n'.repeat(3)}</div>`.repeat(3);
  });
};

// reset cube
const resetCube = () => {
  currentFacesTransforms = {
    front: {},
    back: {},
    right: {},
    left: {},
    top: {},
    bottom: {},
  };
  document.querySelectorAll('.no-display').forEach((e) => {
    e.classList.remove('no-display');
  });
  document.querySelectorAll('.face').forEach((e) => {
    try {
      e.classList.remove('can-move');
    } catch (err) {}
    if (e.classList.contains('cloned')) {
      e.parentElement.removeChild(e);
    }
  });
  try {
    document.querySelectorAll('.face.fake.active').forEach((e) => e.classList.remove('active'));
  } catch (err) {}
  update3DPositioningOfFaces();
};

// update 3D positioning of faces
const update3DPositioningOfFaces = (isAMove = false) => {
  const swapXYZ = (value, newXYZ) => {
    return newXYZ['XYZ'.indexOf(value)];
  };

  Object.keys(currentFacesTransforms).forEach((key) => {
    const transforms = defaultFacesTransforms[key].clone();
    ['rotateX', 'rotateY', 'rotateZ'].forEach((k) => {
      if (!transforms[k]) {
        transforms[k] = 0;
      }
    });
    Object.entries(currentFacesTransforms[key]).forEach(([k, v]) => {
      const swap = (str) => {
        return swapXYZ(k[k.length - 1], str);
      };
      if (key === 'front') {
        transforms[k] += v;
      } else if (key === 'back') {
        if (k[k.length - 1] === 'Y') {
          transforms[k] += v;
        } else {
          transforms[k] -= v;
        }
      } else if (key === 'left') {
        const swapped = swap('ZYX');
        if (swapped === 'Z') {
          transforms[`rotate${swapped}`] -= v;
        } else {
          transforms[`rotate${swapped}`] += v;
        }
      } else if (key === 'right') {
        const swapped = swap('ZYX');
        if (swapped === 'X') {
          transforms[`rotate${swapped}`] -= v;
        } else {
          transforms[`rotate${swapped}`] += v;
        }
      } else if (key === 'top') {
        const swapped = swap('XZY');
        if (swapped === 'Z') {
          transforms[`rotate${swapped}`] -= v;
        } else {
          transforms[`rotate${swapped}`] += v;
        }
      } else if (key === 'bottom') {
        const swapped = swap('XZY');
        if (swapped === 'Y') {
          transforms[`rotate${swapped}`] -= v;
        } else {
          transforms[`rotate${swapped}`] += v;
        }
      }
    });
    Array.from(document.querySelectorAll(`.${key}`)).forEach((e) => {
      let extraTransforms = allFacesDefaultTransforms;
      if (e.classList.contains('fake')) {
        extraTransforms = allFacesDefaultTransformsFakeFace;
      }
      if (!isAMove || e.classList.contains('can-move')) {
        e.setAttribute(
          'style',
          `transform: ${Object.entries(transforms)
            .map(([a, b]) => `${a}(${b}deg)`)
            .join(' ')} ${extraTransforms}; transition: transform ${isAMove ? TRANSITION_TIME_S.toString() : '0'}s ease`
        );
      }
    });
  });
};

// move face
const moveCubeFace = (face, direction = 1) => {
  const degrees = 90;
  const moveParts = {
    front: {
      type: ['cols', 'rows'],
      right: 'first',
      left: 'last',
      top: 'last',
      bottom: 'first',
    },
    right: {
      type: ['cols', 'cols'],
      front: 'last',
      back: 'first',
      top: 'last',
      bottom: 'last',
    },
    left: {
      type: ['cols', 'cols'],
      front: 'first',
      back: 'last',
      top: 'first',
      bottom: 'first',
    },
    back: {
      type: ['cols', 'rows'],
      right: 'last',
      left: 'first',
      top: 'first',
      bottom: 'last',
    },
    bottom: {
      type: ['rows', 'rows'], // second type is irrelevant
      front: 'last',
      back: 'last',
      left: 'last',
      right: 'last',
    },
    top: {
      type: ['rows', 'rows'], // second type is irrelevant
      front: 'first',
      back: 'first',
      left: 'first',
      right: 'first',
    },
  };

  initializeCube(moveParts[face].type[0] === 'rows', moveParts[face].type[1] === 'rows');

  let rotateAxis = 'rotateZ';
  if (face === 'left' || face === 'right') {
    rotateAxis = 'rotateX';
  }
  if (face === 'top' || face === 'bottom') {
    rotateAxis = 'rotateY';
  }

  document.querySelectorAll(`.${face}`).forEach((e) => e.classList.add('can-move'));

  // black fake faces
  document.querySelector(`.fake-${face}`).classList.add('active');
  document.querySelector(`.fake.${face}`).classList.add('active');

  // move main face
  currentFacesTransforms[face][rotateAxis] = degrees * direction;

  // move parts of existing faces and create duplicate static faces
  Object.keys(moveParts[face]).forEach((k) => {
    const v = moveParts[face][k];
    if (k !== 'type') {
      currentFacesTransforms[k][rotateAxis] = degrees * direction;

      const oldElm = document.querySelector(`.${k}`);
      const newElm = oldElm.cloneNode(true);

      const oldParts = Array.from(oldElm.querySelectorAll('div.row, div.col'));
      const newParts = Array.from(newElm.querySelectorAll('div.row, div.col'));
      oldParts.forEach((e, i) => {
        if (v === 'first') {
          if (i !== 0) {
            e.classList.add('no-display');
          } else {
            newParts[i].classList.add('no-display');
          }
        } else if (v === 'last') {
          if (i !== 2) {
            e.classList.add('no-display');
          } else {
            newParts[i].classList.add('no-display');
          }
        }
      });
      newElm.classList.add('cloned');
      oldElm.classList.add('can-move');
      cubeElm.appendChild(newElm);
    }
  });

  update3DPositioningOfFaces(true);

  setTimeout(resetCube, TRANSITION_TIME_S * 1000 + 1);
};

// rotate camera
let cameraPosition = [45, -30];

document.onkeydown = (e) => {
  if (e.key === 'ArrowLeft') {
    cameraPosition[0] -= 15;
  } else if (e.key === 'ArrowRight') {
    cameraPosition[0] += 15;
  } else if (e.key === 'ArrowUp') {
    cameraPosition[1] += 15;
  } else if (e.key === 'ArrowDown') {
    cameraPosition[1] -= 15;
  }
  cubeElm.setAttribute('style', `transform: rotateX(${cameraPosition[1]}deg) rotateY(${cameraPosition[0]}deg);`);
};

window.addEventListener('load', () => {
  createCubeInsideContainer(document.querySelector('.container'));
  initializeCube();
  update3DPositioningOfFaces();
});
