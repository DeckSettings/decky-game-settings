import type { SVGProps } from 'react'

export type DeckSettingsIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string
}

const DeckSettingsIcon = ({ size = '1em', style, ...rest }: DeckSettingsIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 128 128'
    xmlns='http://www.w3.org/2000/svg'
    style={{ display: 'block', ...style }}
    {...rest}
  >
    <path
      d='M42 48v30h28l2-2h1l4-4v-1l2-2V58l-1-1v-1l-2-2v-1l-2-2h-1l-2-2h-2l-1-1zM3 0v48h34V26l1-1h20l1 1h2l1 1h4l1 1h1l1 1h2l2 2h1l1 1h1l7 7v1l2 2v2l2 2v2l1 1v3l1 1v3l1 1v13l-1 1v3l-1 1v2l-1 1v3l-2 2v2l-2 2v1l-1 1h-1l-4 4h-1l-2 2h-1l-2 2h-2l-1 1h-1l-1 1h-4l-1 1h-2l-1 1H38l-1-1V79l-1-1H3v49h63l1-1h4l1-1h6l1-1h2l1-1h3l1-1h1l1-1h2l1-1h1l1-1h1l1-1h1l2-2h1l5-5h1v-1l1-1h1v-1l4-4v-1l3-3v-1l1-1v-1l1-1v-1l1-1v-2l1-1v-1l1-1v-5l1-1v-2l1-1V50l-1-1v-3l-1-1v-4l-1-1v-1l-1-1v-2l-1-1v-1l-1-1v-1l-3-3v-1l-4-4v-1h-1l-1-1v-1h-1l-5-5h-1l-2-2h-1l-1-1h-1l-1-1h-1l-1-1h-2l-1-1h-1l-1-1h-3l-1-1h-2l-1-1h-6l-1-1h-4l-1-1z'
      fill='currentColor'
    />
  </svg>
)

export default DeckSettingsIcon
