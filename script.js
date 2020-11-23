Object.prototype.clone = function () {
  return JSON.parse(JSON.stringify(this));
};

let cubeContainerElm;
let cubeElm;

// variables

class Cube {
  constructor(transitionTimeS, containerElm) {
    this.cubeContainerElm = document.createElement('div');
    this.cubeContainerElm.classList.add('cube-container');

    this.cubeElm = document.createElement('div');
    this.cubeElm.classList.add('cube');

    this.cubeElm.innerHTML = `
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
    this.currentFacesTransforms = {
      front: {},
      back: {},
      right: {},
      left: {},
      top: {},
      bottom: {},
    };
    this.allFacesDefaultTransforms = 'translateZ(5em)';
    this.allFacesDefaultTransformsFakeFace = 'translateZ(1.65em)';
    this.cameraPosition = [45, -30];

    this.initializeCube();
    this.update3DPositioningOfFaces();
  }

  // initialize cube
  initializeCube(middleRows = true, horizontalRows = true) {
    Array.from(this.cubeElm.querySelectorAll('.face')).forEach((e) => {
      if (e.classList.contains('fake')) {
        return;
      }
      const isRows = e.classList.contains('top') || e.classList.contains('bottom') ? horizontalRows : middleRows;
      e.innerHTML = `<div class="${isRows ? 'row' : 'col'}">${'<div class="cubelet"></div>\n'.repeat(3)}</div>`.repeat(3);
    });
  }

  // reset cube
  resetCube(self) {
    self.currentFacesTransforms = {
      front: {},
      back: {},
      right: {},
      left: {},
      top: {},
      bottom: {},
    };

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
  cube1 = new Cube(0.5, document.querySelector('.cube1'));
  cube2 = new Cube(0.5, document.querySelector('.cube2'));
  cube2.updateCamera(180, 0);
});

document.onkeydown = (e) => {
  if (e.key === 'ArrowUp') {
    cube1.updateCamera(15, 0);
    cube2.updateCamera(15, 0);
  } else if (e.key === 'ArrowDown') {
    cube1.updateCamera(-15, 0);
    cube2.updateCamera(-15, 0);
  } else if (e.key === 'ArrowLeft') {
    cube1.updateCamera(0, -15);
    cube2.updateCamera(0, -15);
  } else if (e.key === 'ArrowRight') {
    cube1.updateCamera(0, 15);
    cube2.updateCamera(0, 15);
  }
};
