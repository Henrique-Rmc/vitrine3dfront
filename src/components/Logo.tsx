import logoUrl from '../svg/logo.svg'

interface LogoProps {
  height?: number
  className?: string
  showText?: boolean
}

export default function Logo({ height = 28, className = '', showText = true }: LogoProps) {
  const width = Math.round(height * (846 / 648))
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src={logoUrl} alt="VitreIn" height={height} width={width} style={{ height, width }} />
      {showText && (
        <span className="font-bold tracking-tight" style={{ fontSize: height * 0.7 }}>
          VitreIn
        </span>
      )}
    </span>
  )
}
