import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 22, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const ResetIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 4v6h6" />
    <path d="M5.6 15a7 7 0 1 0 1.6-7.3L4 10" />
  </Icon>
)

export const SkipIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 5l9 7-9 7z" />
    <path d="M18 5v14" />
  </Icon>
)

export const PlayIcon = (p: IconProps) => (
  <Icon {...p} fill="currentColor" stroke="none">
    <path d="M8 5l11 7-11 7z" />
  </Icon>
)

export const PauseIcon = (p: IconProps) => (
  <Icon {...p} strokeWidth={2.4}>
    <path d="M9 5v14M15 5v14" />
  </Icon>
)

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Icon>
)

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)

export const BellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </Icon>
)

/** Small rhombus used as a bullet */
export const Diamond = ({ color }: { color: string }) => (
  <svg width="8" height="10" viewBox="0 0 8 10" aria-hidden="true">
    <path d="M4 0L8 5L4 10L0 5Z" fill={color} />
  </svg>
)
