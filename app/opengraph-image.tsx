import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export const alt = 'CYBERVEST - Cyber Risk Quantification'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #064e3b, #022c22)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#059669',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              marginRight: '24px',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: '80px',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            CYBERVEST
          </h1>
        </div>
        <p
          style={{
            fontSize: '36px',
            fontWeight: 500,
            color: '#a7f3d0',
            margin: 0,
            letterSpacing: '0.01em',
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          AI-Powered Continuous Cyber Risk Quantification
        </p>
      </div>
    ),
    {
      ...size,
    }
  )
}
