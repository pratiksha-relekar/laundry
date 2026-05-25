import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from './Icons'

// Image gallery used on the product details page.
//   - Main image area with prev / next arrows
//   - Strip of thumbnails underneath
//   - Active thumbnail mirrors the main image
//   - Left / Right arrow keys advance the carousel when focused
//   - Wraps around at the ends
export default function ImageCarousel({ images = [], alt = '' }) {
  const [index, setIndex] = useState(0)
  const total = images.length

  useEffect(() => {
    setIndex(0)
  }, [images])

  if (total === 0) return null

  const goPrev = () => setIndex((i) => (i - 1 + total) % total)
  const goNext = () => setIndex((i) => (i + 1) % total)

  return (
    <div
      className="carousel"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          goPrev()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          goNext()
        }
      }}
      aria-roledescription="carousel"
    >
      <div className="carousel-stage">
        <img
          src={images[index]}
          alt={alt}
          className="carousel-img"
          key={index}
        />

        {total > 1 && (
          <>
            <button
              type="button"
              className="carousel-arrow carousel-arrow-prev"
              aria-label="Previous image"
              onClick={goPrev}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              className="carousel-arrow carousel-arrow-next"
              aria-label="Next image"
              onClick={goNext}
            >
              <ChevronRight size={24} />
            </button>

            <span className="carousel-counter" aria-live="polite">
              {index + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="carousel-thumbs" role="tablist">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`carousel-thumb ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
