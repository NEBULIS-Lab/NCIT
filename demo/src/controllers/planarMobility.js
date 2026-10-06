/** Convert local forward/turn commands into world-frame velocity actuator targets. */
export function computePlanarVelocity({
  forward,
  turn,
  yaw,
  linearSpeed,
  turnSpeed,
}) {
  const speed = forward * linearSpeed;
  return [
    speed * Math.cos(yaw),
    speed * Math.sin(yaw),
    turn * turnSpeed,
  ];
}
