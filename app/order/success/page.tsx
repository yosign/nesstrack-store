'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function SuccessContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setFetchError(true)
      setLoading(false)
      return
    }

    supabase
      .from('orders')
      .select('order_number')
      .eq('dealer_token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setFetchError(true)
        } else {
          setOrderNumber(data.order_number)
        }
        setLoading(false)
      })
  }, [token])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#080808',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: 'rgba(255,255,255,0.3)',
            fontFamily: 'var(--font-bebas)',
            letterSpacing: '0.15em',
            fontSize: '0.9rem',
          }}
        >
          LOADING...
        </div>
      </div>
    )
  }

  if (!token || fetchError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#080808',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            maxWidth: 448,
            width: '100%',
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '2.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" stroke="rgba(255,80,80,0.3)" strokeWidth="1" />
              <line
                x1="16"
                y1="16"
                x2="32"
                y2="32"
                stroke="rgba(255,80,80,0.9)"
                strokeWidth="2.5"
                strokeLinecap="square"
              />
              <line
                x1="32"
                y1="16"
                x2="16"
                y2="32"
                stroke="rgba(255,80,80,0.9)"
                strokeWidth="2.5"
                strokeLinecap="square"
              />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '2.5rem',
              letterSpacing: '0.05em',
              marginBottom: 12,
            }}
          >
            ORDER NOT FOUND
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.875rem',
              marginBottom: 32,
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Invalid order link. Please place a new order.
          </p>
          <Link
            href="/"
            style={{
              display: 'block',
              background: '#00B4D8',
              color: '#000',
              padding: '14px 0',
              fontFamily: 'var(--font-bebas)',
              fontSize: '1rem',
              letterSpacing: '0.12em',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            BACK TO HOME
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080808',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          maxWidth: 448,
          width: '100%',
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '2.5rem',
          textAlign: 'center',
        }}
      >
        {/* Checkmark */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" stroke="rgba(0,180,216,0.3)" strokeWidth="1" />
            <polyline
              points="12,24 20,32 36,16"
              stroke="#00B4D8"
              strokeWidth="2.5"
              strokeLinecap="square"
            />
          </svg>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: '2.5rem',
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}
        >
          ORDER CONFIRMED
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.875rem',
            marginBottom: 28,
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          We&apos;ll start production shortly.
        </p>

        {orderNumber && (
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid rgba(0,180,216,0.2)',
              padding: '16px 20px',
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: 6,
              }}
            >
              ORDER NUMBER
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                color: '#fff',
                letterSpacing: '0.05em',
              }}
            >
              {orderNumber}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link
            href={`/track?token=${token}`}
            style={{
              display: 'block',
              background: '#00B4D8',
              color: '#000',
              padding: '14px 0',
              fontFamily: 'var(--font-bebas)',
              fontSize: '1rem',
              letterSpacing: '0.12em',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            TRACK ORDER →
          </Link>
          <Link
            href="/"
            style={{
              display: 'block',
              border: '1px solid rgba(0,180,216,0.5)',
              color: 'rgba(255,255,255,0.7)',
              padding: '14px 0',
              fontFamily: 'var(--font-bebas)',
              fontSize: '1rem',
              letterSpacing: '0.12em',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: '#080808',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-bebas)',
              letterSpacing: '0.15em',
              fontSize: '0.9rem',
            }}
          >
            LOADING...
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
