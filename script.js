const TRANSITION_TIME_S = 0.5;

const containerElm = document.querySelector('#example-element');

Object.prototype.clone = function () {
  return JSON.parse(JSON.stringify(this));
};

// perspective
let x = 50;
let y = 50;
const update = () => {
  document.querySelector('#default-example').setAttribute('style', `perspective-origin: ${x}% ${y}%;`);
};
document.getElementById('x').oninput = () => {
  x = document.getElementById('x').value;
  update();
};
document.getElementById('y').oninput = () => {
  y = document.getElementById('y').value;
  update();
};

update();

// rotation
let facesDefaults = {
  front: {},
  back: { rotateY: 180 },
  right: { rotateY: 90 },
  left: { rotateY: -90 },
  top: { rotateX: 90 },
  bottom: { rotateX: -90 },
};
let facesCurrent = {
  front: {},
  back: {},
  right: {},
  left: {},
  top: {},
  bottom: {},
};
let facesType = {
  front: 'front',
  back: 'back',
  right: 'right',
  left: 'left',
  top: 'top',
  bottom: 'bottom',
};

const swapXYZ = (value, newXYZ) => {
  return newXYZ['XYZ'.indexOf(value)];
};

let defaultValues = 'translateZ(50px)';
let defaultValuesFakeFace = 'translateZ(16.5px)';

const updateFaces = (isAMove = false) => {
  Object.keys(facesCurrent).forEach((key) => {
    const transforms = facesDefaults[key].clone();
    ['rotateX', 'rotateY', 'rotateZ'].forEach((k) => {
      if (!transforms[k]) {
        transforms[k] = 0;
      }
    });
    Object.entries(facesCurrent[key]).forEach(([k, v]) => {
      const swap = (str) => {
        return swapXYZ(k[k.length - 1], str);
      };
      if (facesType[key] === 'front') {
        transforms[k] += v;
      } else if (facesType[key] === 'back') {
        if (k[k.length - 1] === 'Y') {
          transforms[k] += v;
        } else {
          transforms[k] -= v;
        }
      } else if (facesType[key] === 'left') {
        const swapped = swap('ZYX');
        if (swapped === 'Z') {
          transforms[`rotate${swapped}`] -= v;
        } else {
          transforms[`rotate${swapped}`] += v;
        }
      } else if (facesType[key] === 'right') {
        const swapped = swap('ZYX');
        if (swapped === 'X') {
          transforms[`rotate${swapped}`] -= v;
        } else {
          transforms[`rotate${swapped}`] += v;
        }
      } else if (facesType[key] === 'top') {
        const swapped = swap('XZY');
        if (swapped === 'Z') {
          transforms[`rotate${swapped}`] -= v;
        } else {
          transforms[`rotate${swapped}`] += v;
        }
      } else if (facesType[key] === 'bottom') {
        const swapped = swap('XZY');
        if (swapped === 'Y') {
          transforms[`rotate${swapped}`] -= v;
        } else {
          transforms[`rotate${swapped}`] += v;
        }
      }
    });
    Array.from(document.querySelectorAll(`.${key}`)).forEach((e) => {
      let extraTransforms = defaultValues;
      if (e.classList.contains('fake')) {
        extraTransforms = defaultValuesFakeFace;
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
window.onload = () => {
  updateFaces();
};

// rotate
r = 45;
ry = -30;

document.onkeydown = (e) => {
  if (e.key === 'ArrowLeft') {
    r -= 15;
  } else if (e.key === 'ArrowRight') {
    r += 15;
  } else if (e.key === 'ArrowUp') {
    ry += 15;
  } else if (e.key === 'ArrowDown') {
    ry -= 15;
  }
  containerElm.setAttribute('style', `transform: scale3d(1.5, 1.5, 1.5) rotateX(${ry}deg) rotateY(${r}deg);`);
};

// set up rubik's cube
const initCubeHTML = (middleRows = true, horizontalRows = true) => {
  Array.from(document.querySelectorAll('.face')).forEach((e) => {
    if (e.classList.contains('fake')) {
      return;
    }
    const isRows = e.classList.contains('top') || e.classList.contains('bottom') ? horizontalRows : middleRows;
    e.innerHTML = `<div class="${isRows ? 'row' : 'col'}">${'<div class="cubelet"></div>\n'.repeat(3)}</div>`.repeat(3);
  });
};

initCubeHTML(false);

const resetCube = () => {
  facesCurrent = {
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
  updateFaces();
};

// move
const move = (face, direction = 1) => {
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

  initCubeHTML(moveParts[face].type[0] === 'rows', moveParts[face].type[1] === 'rows');

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
  facesCurrent[face][rotateAxis] = degrees * direction;

  // move parts of existing faces and create duplicate static faces
  Object.keys(moveParts[face]).forEach((k) => {
    const v = moveParts[face][k];
    if (k !== 'type') {
      facesCurrent[k][rotateAxis] = degrees * direction;

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
      containerElm.appendChild(newElm);
    }
  });

  updateFaces(true);

  setTimeout(resetCube, TRANSITION_TIME_S * 1000 + 1);
};
