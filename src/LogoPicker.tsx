import { useRef, useState } from 'react'
import { readLogoFile } from './logo'

interface Props {
  logo: string
  alt: string
  onChange: (logo: string) => void
}

export default function LogoPicker({ logo, alt, onChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const pick = async (file: File) => {
    setError('')
    try {
      onChange(await readLogoFile(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.')
    }
  }

  return (
    <div className="row">
      {logo ? <img className="logo" src={logo} alt={alt} /> : <span className="muted">No logo yet.</span>}
      <button className="secondary" onClick={() => fileInput.current?.click()}>
        {logo ? 'Replace logo' : 'Upload logo'}
      </button>
      {logo && (
        <button className="danger" onClick={() => onChange('')}>
          Remove logo
        </button>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void pick(file)
        }}
      />
      {error && <span className="muted">{error}</span>}
    </div>
  )
}
