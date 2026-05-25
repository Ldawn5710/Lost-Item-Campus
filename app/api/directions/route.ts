import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');       // Format: "lng,lat"
  const destination = searchParams.get('destination'); // Format: "lng,lat"

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Origin and destination coordinates are required.' },
      { status: 400 }
    );
  }

  // Safely read KAKAO_REST_API_KEY from .env.local on the server side
  const REST_API_KEY = process.env.KAKAO_REST_API_KEY;

  if (!REST_API_KEY) {
    console.error('Environment variable KAKAO_REST_API_KEY is not defined in .env.local');
    return NextResponse.json(
      { error: 'Server configuration error: REST API key is missing.' },
      { status: 500 }
    );
  }

  const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}&priority=RECOMMEND`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${REST_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Kakao API responded with status ${response.status}:`, errorText);
      return NextResponse.json(
        { error: `Kakao API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying Kakao directions request:', error);
    return NextResponse.json(
      { error: 'Failed to connect to directions service.' },
      { status: 500 }
    );
  }
}
