export function isPassiveRetainingContactGeom(name) {
  return name.startsWith('cross_member_grip_lower_guard_')
    || name.startsWith('cross_member_grip_upper_guard_')
    || name.startsWith('robotwin_hammer_grip_guard_');
}

/**
 * Read the scalar fields needed from an embind mjContact and immediately free
 * its temporary handle. `MjContactVec.get()` returns an owned JS wrapper; if
 * that wrapper is retained every physics tick, the MuJoCo WASM heap eventually
 * reaches its fixed 2 GiB ceiling and aborts the whole simulation.
 */
export function consumeMujocoContact(getContactAt, index) {
  const contact = getContactAt(index);
  if (!contact) return null;
  try {
    return { geom1: contact.geom1, geom2: contact.geom2, distance: contact.dist };
  } finally {
    contact.delete?.();
  }
}

/** Read all active contacts and release the embind vector wrapper as well. */
export function consumeMujocoContacts(contactVector, count) {
  try {
    const pairs = [];
    for (let index = 0; index < count; index += 1) {
      const pair = consumeMujocoContact(
        (contactIndex) => contactVector.get(contactIndex),
        index,
      );
      if (pair) pairs.push(pair);
    }
    return pairs;
  } finally {
    contactVector.delete?.();
  }
}
