'use client';

import React, { useState, useEffect } from 'react';
import { Navigation, ShieldAlert, Award, Compass, XCircle, CheckCircle } from 'lucide-react';

interface RouteNavigatorProps {
  destinationName: string;
  destinationCoords: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
  onUpdateUserLocation: (coords: { lat: number; lng: number }) => void;
  onCancelNavigation: () => void;
  onConfirmReceipt: () => void;
}

export default function RouteNavigator({
  destinationName,
  destinationCoords,
  userLocation,
  onUpdateUserLocation,
  onCancelNavigation,
  onConfirmReceipt,
}: RouteNavigatorProps) {
  const [distance, setDistance] = useState(240); // Initial meters remaining
  const [eta, setEta] = useState(4); // Initial minutes remaining
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // 1. Calculate distance (Haversine approximation) and update states
  useEffect(() => {
    if (!userLocation) return;

    // Calculate approximate distance between user coordinates and destination
    const lat1 = userLocation.lat;
    const lng1 = userLocation.lng;
    const lat2 = destinationCoords.lat;
    const lng2 = destinationCoords.lng;

    const R = 6371e3; // metres
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distMeters = Math.round(R * c);
    setDistance(distMeters);

    // Calculate ETA (average walking speed is ~1.2 m/s, i.e., ~70m per minute)
    const minutes = Math.max(1, Math.round(distMeters / 70));
    setEta(minutes);

    // 2. Arrival Detection: Proximity < 15 meters (PRD 5.2.3 / 6.2 [Page 4])
    if (distMeters <= 15 && !showArrivalModal) {
      setShowArrivalModal(true);
      setIsSimulating(false);
      // Trigger haptic vibration feedback if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [userLocation, destinationCoords]);

  // 3. Real Geolocation watcher
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // Only update if not currently simulating steps
        if (!isSimulating) {
          onUpdateUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        }
      },
      (err) => console.warn('GPS location tracking error:', err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSimulating]);

  // 4. Simulate User Moving Step-by-Step towards destination (Premium UX Sim)
  const handleSimulateStep = () => {
    if (!userLocation) return;
    setIsSimulating(true);

    // Interpolate next coordinate 30% closer to destination
    const stepRatio = 0.3;
    const nextLat = userLocation.lat + (destinationCoords.lat - userLocation.lat) * stepRatio;
    const nextLng = userLocation.lng + (destinationCoords.lng - userLocation.lng) * stepRatio;

    onUpdateUserLocation({ lat: nextLat, lng: nextLng });
  };

  return (
    <>
      <div style={styles.navigatorPanel} className="glass-panel">
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass className="pulse-indicator found" size={18} style={{ animation: 'pulseGlow 2.5s infinite' }} />
            <strong style={{ fontSize: '13px', color: 'var(--accent-found)' }}>실시간 안전 도보 네비게이션</strong>
          </div>
          <button style={styles.cancelBtn} onClick={onCancelNavigation}>
            <XCircle size={18} color="var(--text-muted)" />
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.metrics}>
            <div style={styles.metricItem}>
              <span style={styles.metricVal}>{eta}분</span>
              <span style={styles.metricLabel}>예상 시간</span>
            </div>
            <div style={styles.divider}></div>
            <div style={styles.metricItem}>
              <span style={styles.metricVal}>{distance}m</span>
              <span style={styles.metricLabel}>남은 거리</span>
            </div>
          </div>

          <div style={styles.destName}>
            📍 목적지: <strong>{destinationName}</strong>
          </div>

          <div style={styles.advisory}>
            <ShieldAlert size={14} color="var(--accent-safe)" />
            <span>가로등이 켜진 교내 주요 안전 보행로 위주로 동선이 매핑되었습니다.</span>
          </div>

          <div style={styles.actions}>
            <button
              className="glass-button"
              style={{ ...styles.actionBtn, flex: 1 }}
              onClick={handleSimulateStep}
            >
              🏃 이동 시뮬레이션
            </button>
            <button
              className="glass-button primary"
              style={{ ...styles.actionBtn, flex: 1.2 }}
              onClick={() => setShowArrivalModal(true)}
            >
              <CheckCircle size={16} />
              <span>수령 완료</span>
            </button>
          </div>
        </div>
      </div>

      {/* Arrival Success Modal */}
      {showArrivalModal && (
        <div style={styles.modalBackdrop}>
          <div className="glass-panel" style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={styles.iconContainer}>
                <Award size={36} color="var(--accent-safe)" />
              </div>
              <h3 style={styles.modalTitle}>목적지 인근 도달 완료!</h3>
              <p style={styles.modalSubtitle}>약속 장소 15m 이내 지역에 안전하게 진입하였습니다.</p>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.questionBox}>
                물건을 상대방에게서 무사히 건네받으셨거나 보관함에서 수령하셨나요?
              </div>
              <p style={styles.modalHelp}>
                [수령 완료]를 누르면 게시글 상태가 해결(Resolved)로 처리되어 지도에서 보관 상태가 자동으로 아카이빙 처리됩니다.
              </p>
            </div>

            <div style={styles.modalButtons}>
              <button
                className="glass-button"
                style={{ flex: 1 }}
                onClick={() => setShowArrivalModal(false)}
              >
                닫기
              </button>
              <button
                className="glass-button primary"
                style={{ flex: 2 }}
                onClick={onConfirmReceipt}
              >
                수령 완료 처리하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  navigatorPanel: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '380px',
    zIndex: 1001,
    padding: '16px',
    border: '1px solid rgba(0, 242, 254, 0.25)',
    boxShadow: '0 8px 32px rgba(0, 242, 254, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '8px',
    marginBottom: '12px',
  },
  cancelBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  metrics: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: '10px 0',
    borderRadius: '10px',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: '22px',
    fontWeight: '800',
    fontFamily: 'var(--font-accent)',
    color: 'var(--text-primary)',
  },
  metricLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    marginTop: '2px',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  destName: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  advisory: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(5, 243, 162, 0.04)',
    border: '1px solid rgba(5, 243, 162, 0.15)',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px',
  },
  actionBtn: {
    padding: '10px 0',
    fontSize: '12px',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: '380px',
    padding: '24px',
    border: '1px solid rgba(5, 243, 162, 0.2)',
    boxShadow: 'var(--box-shadow-emerald)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalHeader: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  iconContainer: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: 'rgba(5, 243, 162, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '6px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  questionBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: '1.4',
  },
  modalHelp: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
    textAlign: 'center',
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
  },
};
