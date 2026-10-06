const DEFAULTS = {
  maxIterations: 50,
  damping: 0.01,
  tolerance: 1e-3,
  epsilon: 1e-6,
  positionWeight: 1,
  rotationWeight: 0.3,
};

export function fitJointAngleToRange(value, minimum, maximum) {
  const fullTurn = Math.PI * 2;
  const minimumTurns = Math.ceil((minimum - value) / fullTurn);
  const maximumTurns = Math.floor((maximum - value) / fullTurn);
  if (minimumTurns <= maximumTurns) {
    const turns = Math.max(minimumTurns, Math.min(maximumTurns, 0));
    return value + turns * fullTurn;
  }
  return Math.max(minimum, Math.min(maximum, value));
}

function quaternionToMatrix(quaternion) {
  const { x, y, z, w } = quaternion;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const xy = x * y;
  const xz = x * z;
  const yz = y * z;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;
  return new Float64Array([
    1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy),
    2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx),
    2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy),
  ]);
}

function relativeRotation(from, to) {
  const matrix = new Float64Array(9);
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      let value = 0;
      for (let k = 0; k < 3; k += 1) {
        value += to[row * 3 + k] * from[column * 3 + k];
      }
      matrix[row * 3 + column] = value;
    }
  }
  return matrix;
}

function rotationVector(from, to) {
  const matrix = relativeRotation(from, to);
  const cosine = Math.max(-1, Math.min(1, (matrix[0] + matrix[4] + matrix[8] - 1) / 2));
  const angle = Math.acos(cosine);
  const skew = [matrix[7] - matrix[5], matrix[2] - matrix[6], matrix[3] - matrix[1]];
  if (angle < 1e-6 || angle > Math.PI - 1e-6) {
    return skew.map((value) => value * 0.5);
  }
  const scale = angle / (2 * Math.sin(angle));
  return skew.map((value) => value * scale);
}

function solveSixBySix(matrix, rightHandSide) {
  const size = 6;
  const a = new Float64Array(matrix);
  const b = new Float64Array(rightHandSide);

  for (let column = 0; column < size; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(a[row * size + column]) > Math.abs(a[pivotRow * size + column])) {
        pivotRow = row;
      }
    }
    if (pivotRow !== column) {
      for (let index = 0; index < size; index += 1) {
        const value = a[column * size + index];
        a[column * size + index] = a[pivotRow * size + index];
        a[pivotRow * size + index] = value;
      }
      const value = b[column];
      b[column] = b[pivotRow];
      b[pivotRow] = value;
    }

    const pivot = a[column * size + column];
    if (Math.abs(pivot) < 1e-12) return new Float64Array(size);
    for (let row = column + 1; row < size; row += 1) {
      const factor = a[row * size + column] / pivot;
      for (let index = column; index < size; index += 1) {
        a[row * size + index] -= factor * a[column * size + index];
      }
      b[row] -= factor * b[column];
    }
  }

  const result = new Float64Array(size);
  for (let row = size - 1; row >= 0; row -= 1) {
    let value = b[row];
    for (let column = row + 1; column < size; column += 1) {
      value -= a[row * size + column] * result[column];
    }
    result[row] = value / a[row * size + row];
  }
  return result;
}

export function solveSelectedIk({
  mujoco,
  model,
  data,
  siteId,
  qposAddresses,
  currentQ,
  targetPosition,
  targetQuaternion,
  maxIterations = DEFAULTS.maxIterations,
  damping = DEFAULTS.damping,
  tolerance = DEFAULTS.tolerance,
  epsilon = DEFAULTS.epsilon,
  positionWeight = DEFAULTS.positionWeight,
  rotationWeight = DEFAULTS.rotationWeight,
  jointRanges,
}) {
  if (siteId < 0 || qposAddresses.length === 0 || qposAddresses.length !== currentQ.length) {
    return null;
  }

  const jointCount = qposAddresses.length;
  const savedQpos = new Float64Array(data.qpos);
  const targetRotation = quaternionToMatrix(targetQuaternion);
  const joints = new Float64Array(currentQ);
  const jacobian = new Float64Array(6 * jointCount);
  const basePosition = new Float64Array(3);
  const baseRotation = new Float64Array(9);
  const perturbedPosition = new Float64Array(3);
  const perturbedRotation = new Float64Array(9);
  let bestSolution = null;
  let bestError = Number.POSITIVE_INFINITY;

  try {
    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      for (let joint = 0; joint < jointCount; joint += 1) {
        data.qpos[qposAddresses[joint]] = joints[joint];
      }
      mujoco.mj_forward(model, data);

      const positionOffset = siteId * 3;
      const rotationOffset = siteId * 9;
      for (let index = 0; index < 3; index += 1) {
        basePosition[index] = data.site_xpos[positionOffset + index];
      }
      for (let index = 0; index < 9; index += 1) {
        baseRotation[index] = data.site_xmat[rotationOffset + index];
      }

      const rotationError = rotationVector(baseRotation, targetRotation);
      const error = new Float64Array([
        (targetPosition.x - basePosition[0]) * positionWeight,
        (targetPosition.y - basePosition[1]) * positionWeight,
        (targetPosition.z - basePosition[2]) * positionWeight,
        rotationError[0] * rotationWeight,
        rotationError[1] * rotationWeight,
        rotationError[2] * rotationWeight,
      ]);
      const errorNorm = Math.hypot(...error);
      if (errorNorm < bestError) {
        bestError = errorNorm;
        bestSolution = Array.from(joints);
      }
      if (errorNorm < tolerance) break;

      for (let joint = 0; joint < jointCount; joint += 1) {
        const address = qposAddresses[joint];
        data.qpos[address] = joints[joint] + epsilon;
        mujoco.mj_forward(model, data);
        for (let index = 0; index < 3; index += 1) {
          perturbedPosition[index] = data.site_xpos[positionOffset + index];
          jacobian[index * jointCount + joint] =
            ((perturbedPosition[index] - basePosition[index]) / epsilon) * positionWeight;
        }
        for (let index = 0; index < 9; index += 1) {
          perturbedRotation[index] = data.site_xmat[rotationOffset + index];
        }
        const rotationDelta = rotationVector(baseRotation, perturbedRotation);
        for (let index = 0; index < 3; index += 1) {
          jacobian[(index + 3) * jointCount + joint] =
            (rotationDelta[index] / epsilon) * rotationWeight;
        }
        data.qpos[address] = joints[joint];
      }

      const normalMatrix = new Float64Array(36);
      for (let row = 0; row < 6; row += 1) {
        for (let column = 0; column < 6; column += 1) {
          let value = row === column ? damping : 0;
          for (let joint = 0; joint < jointCount; joint += 1) {
            value += jacobian[row * jointCount + joint] * jacobian[column * jointCount + joint];
          }
          normalMatrix[row * 6 + column] = value;
        }
      }

      const solvedError = solveSixBySix(normalMatrix, error);
      for (let joint = 0; joint < jointCount; joint += 1) {
        let delta = 0;
        for (let row = 0; row < 6; row += 1) {
          delta += jacobian[row * jointCount + joint] * solvedError[row];
        }
        joints[joint] += jointRanges ? Math.max(-.15,Math.min(.15,delta)) : delta;
        if (jointRanges) joints[joint]=Math.max(jointRanges[joint][0],Math.min(jointRanges[joint][1],joints[joint]));
      }
    }
  } finally {
    data.qpos.set(savedQpos);
    mujoco.mj_forward(model, data);
  }

  return bestSolution;
}
