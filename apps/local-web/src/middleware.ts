import { NextResponse, type NextRequest } from 'next/server'
import { FILE_LIMITS } from '@private-pdf/shared-types'

export function middleware(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > FILE_LIMITS.maxTotalInputSizeBytes) {
    return NextResponse.json(
      { error: 'The selected files are too large. Try fewer or smaller files.' },
      { status: 413 },
    )
  }
  return NextResponse.next()
}

export const config = { matcher: '/api/:path*' }
