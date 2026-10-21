import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const storefrontUrl = process.env.STOREFRONT_URL || 'http://localhost:2000';
    const secret = process.env.REVALIDATION_TOKEN || 'my-super-secret-token';

    const res = await fetch(`${storefrontUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret,
        tag: body.tag,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to revalidate storefront', details: data },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, storefront: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error during storefront revalidation', message: error?.message },
      { status: 500 }
    );
  }
}
