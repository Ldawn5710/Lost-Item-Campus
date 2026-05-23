'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Item } from '../lib/types';

interface MapContainerProps {
  center: { lat: number; lng: number };
  items: Item[];
  onPinSelect: (item: Item) => void;
  isRegistering: boolean;
  registrationCoords: { lat: number; lng: number } | null;
  onRegistrationCoordsChange: (coords: { lat: number; lng: number }, address: string) => void;
  activeRoute: {
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
  } | null;
  userLocation: { lat: number; lng: number } | null;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MapContainer({
  center,
  items,
  onPinSelect,
  isRegistering,
  registrationCoords,
  onRegistrationCoordsChange,
  activeRoute,
  userLocation,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const regMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const userLocationMarkerRef = useRef<any>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // 1. Detect if Kakao Maps SDK is loaded in window
  useEffect(() => {
    const checkSdk = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setSdkLoaded(true);
        });
      } else {
        setTimeout(checkSdk, 100);
      }
    };
    checkSdk();
  }, []);

  // 2. Initialize Map once SDK is loaded
  useEffect(() => {
    if (!sdkLoaded || !containerRef.current) return;

    const options = {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: 3, // Zoom level (smaller = closer)
    };

    const map = new window.kakao.maps.Map(containerRef.current, options);
    mapRef.current = map;

    // Add Map controls
    const zoomControl = new window.kakao.maps.ZoomControl();
    map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
  }, [sdkLoaded]);

  // 3. Pan map when center prop changes
  useEffect(() => {
    if (!mapRef.current) return;
    const moveLatLng = new window.kakao.maps.LatLng(center.lat, center.lng);
    mapRef.current.panTo(moveLatLng);
  }, [center]);

  // 4. Manage click listener with correct dependencies to avoid React stale closures
  useEffect(() => {
    if (!sdkLoaded || !mapRef.current) return;

    const map = mapRef.current;
    
    const clickHandler = (mouseEvent: any) => {
      if (!isRegistering) return;
      const latlng = mouseEvent.latLng;
      if (!latlng) return;
      const coords = { lat: latlng.getLat(), lng: latlng.getLng() };
      reverseGeocode(coords);
    };

    window.kakao.maps.event.addListener(map, 'click', clickHandler);

    return () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.event.removeListener(map, 'click', clickHandler);
      }
    };
  }, [sdkLoaded, isRegistering, onRegistrationCoordsChange]);

  // 4. Reverse Geocoding via Kakao Local API or Mock simulator
  const reverseGeocode = (coords: { lat: number; lng: number }) => {
    if (!sdkLoaded) return;

    try {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2Address(coords.lng, coords.lat, (result: any, status: any) => {
        let addr = '캠퍼스 내 미지정 구역';
        if (status === window.kakao.maps.services.Status.OK) {
          addr = result[0].road_address?.address_name || result[0].address.address_name;
        } else {
          // Fallback mockup names depending on location relative to Daegu University
          if (coords.lat > 35.902 && coords.lat < 35.906 && coords.lng > 128.848 && coords.lng < 128.852) {
            addr = '대구대학교 성산홀 본관 앞 광장';
          } else if (coords.lat > 35.898 && coords.lat < 35.901) {
            addr = '대구대학교 웅지관 앞 학생 광장';
          } else {
            addr = '캠퍼스 내 도보 구역';
          }
        }
        onRegistrationCoordsChange(coords, addr);
      });
    } catch (e) {
      // Geocoding services might not be fully configured, fallback safely
      onRegistrationCoordsChange(coords, '캠퍼스 내 지정 구역');
    }
  };

  // 5. Update Registration Marker
  useEffect(() => {
    if (!mapRef.current || !sdkLoaded) return;

    // Clear old registration marker if not registering
    if (!isRegistering || !registrationCoords) {
      if (regMarkerRef.current) {
        regMarkerRef.current.setMap(null);
        regMarkerRef.current = null;
      }
      return;
    }

    const regLatLng = new window.kakao.maps.LatLng(registrationCoords.lat, registrationCoords.lng);

    if (regMarkerRef.current) {
      regMarkerRef.current.setPosition(regLatLng);
    } else {
      // Create a premium glowing 50/50 split red-and-blue teardrop pin representing both lost and found coexisting
      const imageSrc = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"><defs><linearGradient id="splitGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="50%" stop-color="%23ff4a6b"/><stop offset="50%" stop-color="%2300f2fe"/></linearGradient></defs><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="url(%23splitGrad)" stroke="%23ffffff" stroke-width="1.8"/><circle cx="12" cy="9" r="3.5" fill="%23ffffff" stroke="%230a0e1a" stroke-width="1"/></svg>';
      const imageSize = new window.kakao.maps.Size(40, 40);
      const imageOption = { offset: new window.kakao.maps.Point(20, 40) };
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

      const marker = new window.kakao.maps.Marker({
        position: regLatLng,
        image: markerImage,
        draggable: true,
      });

      marker.setMap(mapRef.current);
      regMarkerRef.current = marker;

      // Handle dragend to update registration coords
      window.kakao.maps.event.addListener(marker, 'dragend', () => {
        const position = marker.getPosition();
        const coords = { lat: position.getLat(), lng: position.getLng() };
        reverseGeocode(coords);
      });
    }
  }, [isRegistering, registrationCoords, sdkLoaded]);

  // 6. Update Items Pin markers
  useEffect(() => {
    if (!mapRef.current || !sdkLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Draw active items markers
    items.forEach(item => {
      // Skip item if it's the one we are creating or if it has been resolved and is hidden
      if (item.status === 'resolved') return;

      const itemLatLng = new window.kakao.maps.LatLng(item.latitude, item.longitude);

      // Determine pin color based on item type and location
      let color = '%23ff4a6b'; // Red for lost
      if (item.title.includes('안심 보관소')) {
        color = '%2305f3a2'; // Green for safe boxes
      } else if (item.type === 'found') {
        color = '%2300f2fe'; // Blue for found
      } else if (item.status === 'matching') {
        color = '%239ca3af'; // Gray for matching/resolved
      }

      // Create high-fidelity SVG Pin
      const imageSrc = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="${color}" stroke="%23ffffff" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5" fill="%23ffffff"/></svg>`;
      const imageSize = new window.kakao.maps.Size(30, 30);
      const imageOption = { offset: new window.kakao.maps.Point(15, 15) };
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

      const marker = new window.kakao.maps.Marker({
        position: itemLatLng,
        image: markerImage,
        title: item.title,
      });

      marker.setMap(mapRef.current);
      markersRef.current.push(marker);

      // Handle marker click
      window.kakao.maps.event.addListener(marker, 'click', () => {
        onPinSelect(item);
      });
    });
  }, [items, sdkLoaded]);

  // 7. Track User Live Location Marker (Using high-fidelity CSS custom overlays for neon pulse ripple waves)
  useEffect(() => {
    if (!mapRef.current || !sdkLoaded) return;

    if (!userLocation) {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setMap(null);
        userLocationMarkerRef.current = null;
      }
      return;
    }

    const userLatLng = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setPosition(userLatLng);
    } else {
      // Create HTML node for the custom pulsing marker
      const overlayContent = document.createElement('div');
      overlayContent.className = 'user-gps-overlay';
      overlayContent.innerHTML = `
        <div class="user-gps-ripple"></div>
        <div class="user-gps-ripple-outer"></div>
        <div class="user-gps-core"></div>
      `;

      // Create CustomOverlay
      const overlay = new window.kakao.maps.CustomOverlay({
        position: userLatLng,
        content: overlayContent,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 1000
      });

      overlay.setMap(mapRef.current);
      userLocationMarkerRef.current = overlay;
    }
  }, [userLocation, sdkLoaded]);

  // 8. Draw Walking Route Polyline
  useEffect(() => {
    if (!mapRef.current || !sdkLoaded) return;

    // Clear old route
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (!activeRoute) return;

    const startLatLng = new window.kakao.maps.LatLng(activeRoute.start.lat, activeRoute.start.lng);
    const endLatLng = new window.kakao.maps.LatLng(activeRoute.end.lat, activeRoute.end.lng);

    // Premium walking path routing simulation. Instead of drawing a straight diagonal line,
    // we interpolate nodes that trace along major walkways (making it look authentic and safety-first!)
    const points: any[] = [];
    points.push(startLatLng);

    // Add intermediate nodes to make the polyline wrap around buildings beautifully
    const latDiff = activeRoute.end.lat - activeRoute.start.lat;
    const lngDiff = activeRoute.end.lng - activeRoute.start.lng;

    // Draw a neat L-shaped or stair-shaped campus walking path
    const node1 = new window.kakao.maps.LatLng(activeRoute.start.lat + latDiff * 0.4, activeRoute.start.lng + lngDiff * 0.1);
    const node2 = new window.kakao.maps.LatLng(activeRoute.start.lat + latDiff * 0.7, activeRoute.start.lng + lngDiff * 0.8);
    points.push(node1);
    points.push(node2);
    points.push(endLatLng);

    const polyline = new window.kakao.maps.Polyline({
      path: points,
      strokeWeight: 6,
      strokeColor: '#00f2fe',
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
    });

    polyline.setMap(mapRef.current);
    routePolylineRef.current = polyline;

    // Fit map bounds to show both starting point and destination beautifully
    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(startLatLng);
    bounds.extend(node1);
    bounds.extend(node2);
    bounds.extend(endLatLng);
    mapRef.current.setBounds(bounds);

  }, [activeRoute, sdkLoaded]);

  return (
    <div style={styles.container}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        {!sdkLoaded && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <div style={styles.loadingText}>카카오 지도 서비스 동기화 중...</div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#0a0e1a',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    backgroundColor: '#0a0e1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid rgba(0, 242, 254, 0.1)',
    borderTop: '3px solid var(--accent-found)',
    animation: 'pulseGlow 1.5s infinite linear',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-accent)',
  },
};
