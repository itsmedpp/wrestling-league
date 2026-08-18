/** Longest edge of a stored logo, in pixels. Keeps the save file small enough to commit. */
const MAX_SIZE = 256

/**
 * Reads an image file and returns it as a downscaled PNG data URL, so logos travel
 * with the league in `localStorage` and in the GitHub save file.
 */
export async function readLogoFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Pick an image file.')

  const source = await loadImage(URL.createObjectURL(file))
  const scale = Math.min(1, MAX_SIZE / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not read that image.')
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(source.src)

  return canvas.toDataURL('image/png')
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    image.src = url
  })
}
