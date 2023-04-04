import useStore from '@/helpers/store'

export default function Play() {
  const stopPlaying = useStore((state) => state.stopPlaying)

  return (
    <div
      style={{ paddingLeft: '10px' }}
      onClick={() => {
        useStore.setState({ stopPlaying: !stopPlaying })
      }}
    >
      {stopPlaying ? (
        <svg
          width='14'
          height='14'
          viewBox='0 0 14 14'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M0 1.93075C0 0.442857 1.80111 -0.484188 3.23528 0.265515L12.9327 5.33481C14.3558 6.07867 14.3558 7.92131 12.9327 8.66527L3.23528 13.7345C1.80111 14.4842 0 13.5572 0 12.0693V1.93075ZM11.8487 6.99999L2.15131 1.93075V12.0693L11.8487 6.99999Z'
            fill='white'
          />
        </svg>
      ) : (
        <svg
          fill='none'
          height='14'
          viewBox='0 0 24 24'
          width='14'
          xmlns='http://www.w3.org/2000/svg'
          xmlnsXlink='http://www.w3.org/1999/xlink'
        >
          <mask
            id='a'
            height='12'
            maskUnits='userSpaceOnUse'
            width='8'
            x='8'
            y='6'
          >
            <path
              clipRule='evenodd'
              d='m10 6h-2v12h2zm6 0h-2v12h2z'
              fill='#fff'
              fillRule='evenodd'
            />
          </mask>
          <path
            clipRule='evenodd'
            d='m10 6h-2v12h2zm6 0h-2v12h2z'
            fill='#fff'
            fillRule='evenodd'
          />
          <g mask='url(#a)'>
            <path d='m0 0h24v24h-24z' fill='#fff' />
          </g>
        </svg>
      )}
    </div>
  )
}
