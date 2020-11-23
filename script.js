Object.prototype.clone = function () {
  return JSON.parse(JSON.stringify(this));
};

let cubeContainerElm;
let cubeElm;

// variables

class Cube {
  constructor(transitionTimeS, containerElm, cubeData) {
    const directions = ['front', 'back', 'right', 'left', 'top', 'bottom'];

    this.cubeData = cubeData;
    this.cubeContainerElm = document.createElement('div');
    this.cubeContainerElm.classList.add('cube-container');

    this.cubeElm = document.createElement('div');
    this.cubeElm.classList.add('cube');

    this.cubeElm.innerHTML =
      directions.map((e) => `<div class="face ${e}"></div>`).join('') +
      directions.map((e) => `<div class="face fake fake-${e}"></div>`).join('') +
      directions.map((e) => `<div class="face fake ${e}"></div>`).join('');

    this.cubeContainerElm.appendChild(this.cubeElm);
    containerElm.appendChild(this.cubeContainerElm);

    this.TRANSITION_TIME_S = transitionTimeS;

    this.defaultFacesTransforms = {
      front: {},
      back: { rotateY: 180 },
      right: { rotateY: 90 },
      left: { rotateY: -90 },
      top: { rotateX: 90 },
      bottom: { rotateX: -90 },
    };
    this.defaultCurrentFacesTransforms = {
      front: {},
      back: {},
      right: {},
      left: {},
      top: {},
      bottom: {},
    };
    this.currentFacesTransforms = this.defaultCurrentFacesTransforms.clone();
    this.allFacesDefaultTransforms = 'translateZ(5em)';
    this.allFacesDefaultTransformsFakeFace = 'translateZ(1.65em)';
    this.cameraPosition = [45, -30];

    this.initializeCube();
    this.update3DPositioningOfFaces();
  }

  // initialize cube
  initializeCube(middleRows = true, horizontalRows = true) {
    const possibleFaces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    Array.from(this.cubeElm.querySelectorAll('.face')).forEach((e) => {
      if (e.classList.contains('fake')) {
        return;
      }
      const isRows = e.classList.contains('top') || e.classList.contains('bottom') ? horizontalRows : middleRows;
      let newInnerHTML = '';
      possibleFaces.forEach((f) => {
        if (e.classList.contains(f)) {
          if (isRows) {
            for (let row = 0; row < 3; row++) {
              newInnerHTML += "<div class='row'>";
              for (let col = 0; col < 3; col++) {
                newInnerHTML += `<div class='cubelet ${this.cubeData[f][row][col]}'></div>`;
              }
              newInnerHTML += '</div>';
            }
          } else {
            for (let col = 0; col < 3; col++) {
              newInnerHTML += "<div class='col'>";
              for (let row = 0; row < 3; row++) {
                newInnerHTML += `<div class='cubelet ${this.cubeData[f][row][col]}'></div>`;
              }
              newInnerHTML += '</div>';
            }
          }
        }
      });
      e.innerHTML = newInnerHTML;
    });
  }

  // reset cube
  resetCube(self) {
    self.currentFacesTransforms = self.defaultCurrentFacesTransforms.clone();

    self.cubeElm.querySelectorAll('.no-display').forEach((e) => {
      e.classList.remove('no-display');
    });
    self.cubeElm.querySelectorAll('.face').forEach((e) => {
      try {
        e.classList.remove('can-move');
      } catch (err) {}
      if (e.classList.contains('cloned')) {
        e.parentElement.removeChild(e);
      }
    });
    try {
      self.cubeElm.querySelectorAll('.face.fake.active').forEach((e) => e.classList.remove('active'));
    } catch (err) {}
    self.update3DPositioningOfFaces();
  }

  // update 3D positioning of faces
  update3DPositioningOfFaces(isAMove = false) {
    const swapXYZ = (value, newXYZ) => {
      return newXYZ['XYZ'.indexOf(value)];
    };

    Object.keys(this.currentFacesTransforms).forEach((key) => {
      const transforms = this.defaultFacesTransforms[key].clone();
      ['rotateX', 'rotateY', 'rotateZ'].forEach((k) => {
        if (!transforms[k]) {
          transforms[k] = 0;
        }
      });
      Object.entries(this.currentFacesTransforms[key]).forEach(([k, v]) => {
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
      Array.from(this.cubeElm.querySelectorAll(`.${key}`)).forEach((e) => {
        let extraTransforms = this.allFacesDefaultTransforms;
        if (e.classList.contains('fake')) {
          extraTransforms = this.allFacesDefaultTransformsFakeFace;
        }
        if (!isAMove || e.classList.contains('can-move')) {
          e.setAttribute(
            'style',
            `transform: ${Object.entries(transforms)
              .map(([a, b]) => `${a}(${b}deg)`)
              .join(' ')} ${extraTransforms}; transition: transform ${isAMove ? this.TRANSITION_TIME_S.toString() : '0'}s ease`
          );
        }
      });
    });
  }

  // move face
  moveCubeFace(face, direction = 1) {
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

    this.initializeCube(moveParts[face].type[0] === 'rows', moveParts[face].type[1] === 'rows');

    let rotateAxis = 'rotateZ';
    if (face === 'left' || face === 'right') {
      rotateAxis = 'rotateX';
    }
    if (face === 'top' || face === 'bottom') {
      rotateAxis = 'rotateY';
    }

    this.cubeElm.querySelectorAll(`.${face}`).forEach((e) => e.classList.add('can-move'));

    // black fake faces
    this.cubeElm.querySelector(`.fake-${face}`).classList.add('active');
    this.cubeElm.querySelector(`.fake.${face}`).classList.add('active');

    // move main face
    this.currentFacesTransforms[face][rotateAxis] = degrees * direction;

    // move parts of existing faces and create duplicate static faces
    Object.keys(moveParts[face]).forEach((k) => {
      const v = moveParts[face][k];
      if (k !== 'type') {
        this.currentFacesTransforms[k][rotateAxis] = degrees * direction;

        const oldElm = this.cubeElm.querySelector(`.${k}`);
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
        this.cubeElm.appendChild(newElm);
      }
    });

    this.update3DPositioningOfFaces(true);

    setTimeout(() => {
      this.resetCube(this);
      this.initializeCube();
    }, this.TRANSITION_TIME_S * 1000 + 1);
  }
  updateCamera(changeX, changeY) {
    this.cameraPosition[1] += changeX;
    this.cameraPosition[0] += changeY;
    this.cubeElm.setAttribute('style', `transform: rotateX(${this.cameraPosition[1]}deg) rotateY(${this.cameraPosition[0]}deg);`);
  }
}

let cube1;
let cube2;

window.addEventListener('load', () => {
  const cubeData = {
    front: [
      ['green', 'green', 'green'],
      ['green', 'green', 'green'],
      ['green', 'green', 'green'],
    ],
    back: [
      ['blue', 'blue', 'blue'],
      ['blue', 'blue', 'blue'],
      ['blue', 'blue', 'blue'],
    ],
    left: [
      ['orange', 'orange', 'orange'],
      ['orange', 'orange', 'orange'],
      ['orange', 'orange', 'orange'],
    ],
    right: [
      ['red', 'red', 'red'],
      ['red', 'red', 'red'],
      ['red', 'red', 'red'],
    ],
    top: [
      ['white', 'white', 'white'],
      ['white', 'white', 'white'],
      ['white', 'white', 'white'],
    ],
    bottom: [
      ['yellow', 'yellow', 'yellow'],
      ['yellow', 'yellow', 'yellow'],
      ['yellow', 'yellow', 'yellow'],
    ],
  };

  cube1 = new Cube(0.5, document.querySelector('.cube1'), cubeData.clone());
  cube2 = new Cube(0.5, document.querySelector('.cube2'), cubeData.clone());
  cube2.updateCamera(180, 0);
});

document.onkeydown = (e) => {
  const updates = {
    ArrowUp: [15, 0],
    ArrowDown: [-15, 0],
    ArrowLeft: [0, -15],
    ArrowRight: [0, 15],
  };
  const change = updates[e.key];
  if (change) {
    [cube1, cube2].forEach((e) => e.updateCamera(change[0], change[1]));
  }
};
