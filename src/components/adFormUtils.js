export const CONDITIONS = [
  { id: 'like-new', label: 'Like New', desc: 'Used a few times, no wear.' },
  { id: 'good', label: 'Good', desc: 'Minor signs of use.' },
  { id: 'fair', label: 'Fair', desc: 'Visible wear but fully functional.' },
  { id: 'parts', label: 'For Parts', desc: 'Not working, sold for parts.' },
]

export const MAX_TITLE = 70
export const MAX_DESC = 4096
export const MAX_PHOTOS = 5

export function conditionLabelToId(label) {
  if (!label) return 'good'
  const byId = CONDITIONS.find((c) => c.id === label)
  if (byId) return byId.id
  const byLabel = CONDITIONS.find(
    (c) => c.label.toLowerCase() === String(label).toLowerCase()
  )
  return byLabel?.id || 'good'
}

export function conditionIdToLabel(id) {
  return CONDITIONS.find((c) => c.id === id)?.label || 'Good'
}

export function resizeImage(file, maxDim = 1024, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        const scale = Math.min(1, maxDim / Math.max(width, height))
        width = Math.round(width * scale)
        height = Math.round(height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        try {
          resolve(canvas.toDataURL('image/jpeg', quality))
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
