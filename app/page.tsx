'use client';

import React, { useState, useEffect } from 'react';
import { Compass, LogOut, MessageCircle, MapPin, User, ShieldCheck } from 'lucide-react';
import { Profile, Item, ChatRoom } from '../lib/types';
import { db } from '../lib/supabase';

// Component imports
import AuthModal from '../components/AuthModal';
import MapContainer from '../components/MapContainer';
import BottomSheet from '../components/BottomSheet';
import ChatPanel from '../components/ChatPanel';
import RouteNavigator from '../components/RouteNavigator';

export default function Home() {
  // 1. Core States
  const [activeUser, setActiveUser] = useState<Profile | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 37.459882, lng: 126.951905 });
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // 2. Tab Navigation States
  const [activeTab, setActiveTab] = useState<'explore' | 'register' | 'chats'>('explore');

  // 3. Registration Wizard States
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationCoords, setRegistrationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [registrationAddress, setRegistrationAddress] = useState('지도를 클릭해 위치를 지정하세요');

  // 4. Chat Panel States
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [meetupSelectionMode, setMeetupSelectionMode] = useState(false);
  const [tempMeetupCoords, setTempMeetupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tempMeetupAddress, setTempMeetupAddress] = useState('');

  // 5. Walking Route Navigation States
  const [navigationTarget, setNavigationTarget] = useState<{
    coords: { lat: number; lng: number };
    address: string;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Load User session & Initial Items on Mount
  useEffect(() => {
    const user = db.getActiveUser();
    if (user) {
      handleAuthSuccess(user);
    } else {
      // Load public item pins anyway to show background map previews
      setItems(db.getItems());
    }
  }, []);

  // Sync active items and chat rooms periodically or after mutations
  const syncDatabaseState = (userId: string) => {
    setItems(db.getItems());
    setChatRooms(db.getChatRooms(userId));
  };

  const handleAuthSuccess = (user: Profile, coords?: { lat: number; lng: number }) => {
    setActiveUser(user);
    
    // Centering coordinates
    const center = coords || { lat: 37.459882, lng: 126.951905 };
    setMapCenter(center);
    setUserLocation(center);
    
    syncDatabaseState(user.id);
  };

  const handleLogout = () => {
    db.setActiveUser(null);
    setActiveUser(null);
    setSelectedItem(null);
    setActiveChatRoomId(null);
    setNavigationTarget(null);
    setIsRegistering(false);
  };

  // 6. Registration Callback
  const handleRegisterItem = (newItemData: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => {
    const createdItem = db.saveItem(newItemData);
    syncDatabaseState(activeUser?.id || 'anonymous');
    setMapCenter({ lat: createdItem.latitude, lng: createdItem.longitude });
    setSelectedItem(createdItem);
    setIsRegistering(false);
    setRegistrationCoords(null);
    setRegistrationAddress('지도를 클릭해 위치를 지정하세요');
  };

  const handlePinSelect = (item: Item) => {
    // Check if we are selecting meetup location for chat
    if (meetupSelectionMode) {
      setTempMeetupCoords({ lat: item.latitude, lng: item.longitude });
      setTempMeetupAddress(item.location_detail || item.title);
      setMeetupSelectionMode(false);
      return;
    }

    setSelectedItem(item);
    setMapCenter({ lat: item.latitude, lng: item.longitude });
  };

  // 7. Interactive Map Coordinates selection handler
  const handleRegistrationCoordsChange = (coords: { lat: number; lng: number }, address: string) => {
    if (meetupSelectionMode) {
      setTempMeetupCoords(coords);
      setTempMeetupAddress(address);
      setMeetupSelectionMode(false);
      return;
    }

    if (isRegistering) {
      setRegistrationCoords(coords);
      setRegistrationAddress(address);
    }
  };

  // 8. Chat Room Activation
  const handleStartChat = (item: Item) => {
    if (!activeUser) return;
    
    // Create or locate chat room
    const room = db.createChatRoom(item.id, activeUser.id, item.user_id);
    syncDatabaseState(activeUser.id);
    setActiveChatRoomId(room.id);
  };

  // 9. Meetup Navigation Activation
  const handleStartNavigation = (coords: { lat: number; lng: number }, address: string) => {
    setNavigationTarget({ coords, address });
    setActiveChatRoomId(null); // Minimize Chat Panel to reveal route
  };

  // 10. receipt confirmation (resolved state transaction)
  const handleConfirmReceipt = () => {
    if (selectedItem) {
      db.updateItemStatus(selectedItem.id, 'resolved');
    }
    
    // Send auto system finish message to the active chat
    if (activeChatRoomId) {
      db.sendChatMessage(
        activeChatRoomId,
        'system',
        '🎉 [완료] 물건이 성공적으로 전달 및 수령 완료되었습니다!\n이용해 주셔서 대단히 감사합니다. 본 유실물 핀이 아카이빙 처리되었습니다.',
        true
      );
    }

    syncDatabaseState(activeUser?.id || 'anonymous');
    setNavigationTarget(null);
    setSelectedItem(null);
  };

  // Floating button to reset map to user live location
  const handlePanToUserLocation = () => {
    if (userLocation) {
      setMapCenter({ ...userLocation });
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setMapCenter(coords);
      });
    }
  };

  return (
    <main style={styles.main}>
      {/* Dynamic Security Verification Portal (Auth Shield) */}
      {!activeUser && <AuthModal onAuthSuccess={handleAuthSuccess} />}

      {/* Top Banner overlay */}
      {activeUser && (
        <div style={styles.topBanner} className="glass-panel">
          <div style={styles.bannerLeft}>
            <div style={styles.badgeGlow}>
              <ShieldCheck size={18} color="var(--accent-found)" />
            </div>
            <div>
              <h1 style={styles.bannerTitle}>{activeUser.university}</h1>
              <span style={styles.bannerSubtitle}>안심 캠퍼스 맵</span>
            </div>
          </div>
          <div style={styles.bannerRight}>
            <div style={styles.profileBadge}>
              <User size={14} />
              <span>{activeUser.nickname} 님</span>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout} title="로그아웃">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Map Layer Canvas */}
      <MapContainer
        center={mapCenter}
        items={items}
        onPinSelect={handlePinSelect}
        isRegistering={isRegistering || meetupSelectionMode}
        registrationCoords={isRegistering ? registrationCoords : tempMeetupCoords}
        onRegistrationCoordsChange={handleRegistrationCoordsChange}
        activeRoute={navigationTarget ? { start: userLocation || mapCenter, end: navigationTarget.coords } : null}
        userLocation={userLocation}
      />

      {/* Meetup Selector Prompt Layer */}
      {meetupSelectionMode && (
        <div style={styles.meetupPrompt} className="glass-panel">
          <MapPin size={18} color="var(--accent-found)" className="pulse-indicator found" />
          <span>지도를 탭하여 약속 장소(위치)를 지정하세요...</span>
        </div>
      )}

      {/* Floating Centering GPS target */}
      {activeUser && !navigationTarget && (
        <button style={styles.gpsFloatBtn} className="glass-panel" onClick={handlePanToUserLocation} title="내 위치로 이동">
          <Compass size={22} color="var(--accent-found)" />
        </button>
      )}

      {/* Route Navigator floating panel (ETA, safety warnings, distance meters) */}
      {navigationTarget && (
        <RouteNavigator
          destinationName={navigationTarget.address}
          destinationCoords={navigationTarget.coords}
          userLocation={userLocation}
          onUpdateUserLocation={(coords) => setUserLocation(coords)}
          onCancelNavigation={() => setNavigationTarget(null)}
          onConfirmReceipt={handleConfirmReceipt}
        />
      )}

      {/* Bottom Sheet Sidebar Dashboard (Filters, item lists, register wizard) */}
      {activeUser && !navigationTarget && (
        <BottomSheet
          items={items}
          activeUser={activeUser}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          onRegisterItem={handleRegisterItem}
          isRegistering={isRegistering}
          setIsRegistering={setIsRegistering}
          registrationCoords={registrationCoords}
          registrationAddress={registrationAddress}
          onStartChat={handleStartChat}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSelectChat={(roomId) => setActiveChatRoomId(roomId)}
          chatRooms={chatRooms}
        />
      )}

      {/* 1:1 real-time messaging layer overlay (glowing borders, details tab) */}
      {activeChatRoomId && activeUser && (
        <ChatPanel
          roomId={activeChatRoomId}
          activeUser={activeUser}
          onBack={() => {
            setActiveChatRoomId(null);
            syncDatabaseState(activeUser.id);
          }}
          onSelectMeetupMode={() => {
            setMeetupSelectionMode(true);
            setTempMeetupCoords(null);
          }}
          meetupCoords={tempMeetupCoords}
          meetupAddress={tempMeetupAddress}
          onStartNavigation={handleStartNavigation}
        />
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0a0e1a',
  },
  topBanner: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 998,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 18px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 14, 26, 0.75)',
    boxShadow: 'var(--box-shadow-glow)',
    width: 'calc(100% - 40px)',
    maxWidth: '420px',
  },
  bannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  badgeGlow: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(0, 242, 254, 0.2)',
  },
  bannerTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-accent)',
  },
  bannerSubtitle: {
    fontSize: '10px',
    color: 'var(--accent-found)',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  bannerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '6px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 74, 107, 0.05)',
    border: '1px solid rgba(255, 74, 107, 0.1)',
    transition: 'all 0.2s ease',
  },
  gpsFloatBtn: {
    position: 'absolute',
    right: '20px',
    bottom: '440px', // Floating neatly above the open bottom drawer
    zIndex: 997,
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'var(--bg-glass)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--box-shadow-glow)',
    transition: 'all 0.2s ease',
  },
  meetupPrompt: {
    position: 'absolute',
    top: '90px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 998,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 20px',
    borderRadius: '20px',
    border: '1px solid rgba(0, 242, 254, 0.3)',
    backgroundColor: 'rgba(10, 14, 26, 0.9)',
    fontSize: '12px',
    color: 'var(--text-primary)',
    fontWeight: '600',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
};
