export function mapValue(value, start1, stop1, start2, stop2) {
  const outgoing =
    start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))

  return outgoing
}
