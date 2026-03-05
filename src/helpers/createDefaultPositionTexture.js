import {
  NearestFilter,
  RGBAFormat,
  FloatType,
  DataTexture,

} from 'three'
const TEXTURE_WIDTH = 512
const TEXTURE_HEIGHT = 1024
const AMOUNT = TEXTURE_WIDTH * TEXTURE_HEIGHT

const dim = 220;

export function createDefaultPositionTexture() {
  const data = new Float32Array(AMOUNT * 4)
  for (let x = 0; x < TEXTURE_WIDTH; x++) {
    for (let z = 0; z < TEXTURE_HEIGHT; z++) {
      data[x * TEXTURE_HEIGHT * 4 + z * 4] = dim / 2 - dim * (x / TEXTURE_WIDTH)
      data[x * TEXTURE_HEIGHT * 4 + z * 4 + 1] = 0
      data[x * TEXTURE_HEIGHT * 4 + z * 4 + 2] = dim / 2 - dim * (z / TEXTURE_HEIGHT)
    }
  }

  const tmp = {}
  tmp.texture = new DataTexture(data, TEXTURE_HEIGHT, TEXTURE_WIDTH, RGBAFormat, FloatType)
  tmp.texture.minFilter = NearestFilter
  tmp.texture.magFilter = NearestFilter
  tmp.texture.needsUpdate = true
  tmp.texture.generateMipmaps = false
  tmp.texture.flipY = false

  return tmp
}
