'use client';

import React, { useState, useEffect } from 'react';
import { Compass, LogOut, MapPin, User, ShieldCheck, Globe, ChevronDown, Bell } from 'lucide-react';
import { Profile, Item, ChatRoom, Notification } from '../lib/types';
import { db, supabase, isSupabaseConfigured } from '../lib/supabase';
import { useTranslation } from '../lib/LanguageContext';

// Component imports
import AuthModal from '../components/AuthModal';
import MapContainer from '../components/MapContainer';
import BottomSheet from '../components/BottomSheet';
import ChatPanel from '../components/ChatPanel';
import RouteNavigator from '../components/RouteNavigator';

export default function Home() {
  const { t, language, setLanguage } = useTranslation();

  // 1. Core States
  const [activeUser, setActiveUser] = useState<Profile | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 35.9038, lng: 128.8504 });
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // 2. Tab Navigation States
  const [activeTab, setActiveTab] = useState<'explore' | 'register' | 'chats'>('explore');

  // 3. Registration Wizard States
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationCoords, setRegistrationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [registrationAddress, setRegistrationAddress] = useState(t('reg.tap_map_helper'));

  // 4. Chat Panel States
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // 4b. Notification States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // 5. Walking Route Navigation States
  const [navigationTarget, setNavigationTarget] = useState<{
    coords: { lat: number; lng: number };
    address: string;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Update document title when language changes
  useEffect(() => {
    document.title = t('app.title');
  }, [language, t]);

  // Load User session & Initial Items on Mount
  useEffect(() => {
    const initSession = async () => {
      const user = db.getActiveUser();
      if (user) {
        let lat = 35.9038;
        let lng = 128.8504;
        if (user.university.includes('서울') || user.university.includes('Seoul') || user.email.includes('snu.ac.kr')) {
          lat = 37.459882;
          lng = 126.951905;
        } else if (user.university.includes('KAIST') || user.email.includes('kaist.ac.kr')) {
          lat = 36.3721;
          lng = 127.3604;
        } else if (user.university.includes('고려') || user.university.includes('Korea') || user.email.includes('korea.ac.kr')) {
          lat = 37.5894;
          lng = 127.0326;
        } else if (user.university.includes('연세') || user.university.includes('Yonsei') || user.email.includes('yonsei.ac.kr')) {
          lat = 37.5657;
          lng = 126.9385;
        }
        handleAuthSuccess(user, { lat, lng });
      }
    };
    initSession();
  }, []);

  // Real-time Notification listener hook
  useEffect(() => {
    if (!activeUser) return;

    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<Notification>;
      const notif = customEvent.detail;
      
      // Make sure the notification is intended for the logged-in user
      if (notif.user_id === activeUser.id) {
        // Update notification list
        setNotifications(prev => [notif, ...prev]);
        
        // Show real-time slide-down Toast Alert
        setActiveToast(notif);
        setToastVisible(true);
        
        // Automatically hide toast after 6 seconds
        const timer = setTimeout(() => {
          setToastVisible(false);
        }, 6000);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('safe_campus_new_notification', handleNewNotification);
    return () => {
      window.removeEventListener('safe_campus_new_notification', handleNewNotification);
    };
  }, [activeUser]);

  // Track items list changes to trigger match notifications in real time for newly added items
  const [prevItems, setPrevItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!activeUser || items.length === 0) {
      if (items.length > 0 && prevItems.length === 0) {
        setPrevItems(items);
      }
      return;
    }

    if (prevItems.length === 0) {
      setPrevItems(items);
      return;
    }

    // Find items that are in the new list but were NOT in the previous list
    const newItems = items.filter(newItem => !prevItems.some(prevItem => prevItem.id === newItem.id));

    if (newItems.length > 0) {
      // For each new item, check if it matches the current user's items
      newItems.forEach(newItem => {
        // Only run matches for items created by others
        if (newItem.user_id !== activeUser.id) {
          db.checkAndGenerateMatches(newItem);
        }
      });
    }

    setPrevItems(items);
  }, [items, activeUser, prevItems]);

  // Sync database periodically (every 4 seconds) for real-time multiplayer experience
  useEffect(() => {
    if (!activeUser) return;

    const interval = setInterval(() => {
      syncDatabaseState(activeUser.id);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeUser]);

  // Real-time Supabase postgres subscription fallback to sync database state instantly
  useEffect(() => {
    if (!activeUser || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('realtime-items-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        async (payload) => {
          console.log('Real-time database items change detected:', payload);
          await syncDatabaseState(activeUser.id);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeUser]);

  // Sync active items, chat rooms, and notifications periodically or after mutations
  const syncDatabaseState = async (userId: string) => {
    try {
      const [fetchedItems, fetchedRooms, fetchedNotifs] = await Promise.all([
        db.getItems(),
        db.getChatRooms(userId),
        db.getNotifications(userId)
      ]);
      setItems(fetchedItems);
      setChatRooms(fetchedRooms);
      setNotifications(fetchedNotifs);
    } catch (err) {
      console.error("Error syncing database state:", err);
    }
  };

  const handleAuthSuccess = (user: Profile, coords?: { lat: number; lng: number }) => {
    setActiveUser(user);

    // Centering coordinates (default university fallback)
    const center = coords || { lat: 35.9038, lng: 128.8504 };
    setMapCenter(center);
    setUserLocation(center);

    // Automatically detect and center on the user's actual live GPS location
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      const startGps = (highAccuracy: boolean) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const liveCoords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            console.log(`Real-time live location detected (HighAccuracy: ${highAccuracy}):`, liveCoords);
            setMapCenter(liveCoords);
            setUserLocation(liveCoords);
          },
          (error) => {
            console.warn(`Geolocation failed (HighAccuracy: ${highAccuracy}):`, error);
            if (highAccuracy) {
              console.log("Attempting low accuracy fallback for PC/Laptop...");
              startGps(false); // Fallback to low accuracy
            }
          },
          { 
            enableHighAccuracy: highAccuracy, 
            timeout: highAccuracy ? 4000 : 10000, 
            maximumAge: 0 
          }
        );
      };

      startGps(true); // Start with high accuracy
    }

    syncDatabaseState(user.id);
  };

  const handleLogout = async () => {
    await db.setActiveUser(null);
    setActiveUser(null);
    setSelectedItem(null);
    setActiveChatRoomId(null);
    setNavigationTarget(null);
    setIsRegistering(false);
    setRegistrationAddress(t('reg.tap_map_helper'));
  };

  // 6. Registration Callback
  const handleRegisterItem = async (newItemData: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const createdItem = await db.saveItem(newItemData);
      await syncDatabaseState(activeUser?.id || 'anonymous');
      setMapCenter({ lat: createdItem.latitude, lng: createdItem.longitude });
      setSelectedItem(createdItem);
      setIsRegistering(false);
      setRegistrationCoords(null);
      setRegistrationAddress(t('reg.tap_map_helper'));
    } catch (err) {
      console.error("Error registering item:", err);
    }
  };

  const handlePinSelect = (item: Item) => {
    setSelectedItem(item);
    setMapCenter({ lat: item.latitude, lng: item.longitude });
  };

  // 7. Interactive Map Coordinates selection handler
  const handleRegistrationCoordsChange = (coords: { lat: number; lng: number }, address: string) => {
    if (isRegistering) {
      setRegistrationCoords(coords);
      setRegistrationAddress(address);
    }
  };

  // 8. Chat Room Activation
  const handleStartChat = async (item: Item) => {
    if (!activeUser) return;

    try {
      // Create or locate chat room
      const room = await db.createChatRoom(item.id, activeUser.id, item.user_id);
      await syncDatabaseState(activeUser.id);
      setActiveChatRoomId(room.id);
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  // 9. Meetup Navigation Activation
  const handleStartNavigation = (coords: { lat: number; lng: number }, address: string) => {
    setNavigationTarget({ coords, address });
    setActiveChatRoomId(null); // Minimize Chat Panel to reveal route
  };

  // 10. receipt confirmation (resolved state transaction)
  const handleConfirmReceipt = async () => {
    try {
      if (selectedItem) {
        await db.updateItemStatus(selectedItem.id, 'resolved');
      }

      // Send auto system finish message to the active chat
      if (activeChatRoomId) {
        await db.sendChatMessage(
          activeChatRoomId,
          'system',
          t('sys.completed'),
          true
        );
      }

      await syncDatabaseState(activeUser?.id || 'anonymous');
      setNavigationTarget(null);
      setSelectedItem(null);
    } catch (err) {
      console.error("Error confirming receipt:", err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await db.deleteItem(itemId);
      await syncDatabaseState(activeUser?.id || 'anonymous');
      setSelectedItem(null);
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    await db.markNotificationAsRead(notif.id);
    if (activeUser) {
      await syncDatabaseState(activeUser.id);
    }
    
    const matched = items.find(i => i.id === notif.item_id);
    if (matched) {
      setMapCenter({ lat: matched.latitude, lng: matched.longitude });
      setSelectedItem(matched);
      setActiveTab('explore');
    }
    
    setShowNotifMenu(false);
    setToastVisible(false);
  };

  const handleClearNotifications = async () => {
    if (!activeUser) return;
    await db.clearNotifications(activeUser.id);
    await syncDatabaseState(activeUser.id);
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

  const getLocalizedUniv = (univ: string) => {
    if (univ === '대구대학교' || univ === 'Daegu University' || univ === 'Đại học Daegu') return t('univ.daegu');
    if (univ === '서울대학교' || univ === 'Seoul National University' || univ === 'Đại học Quốc gia Seoul') return t('univ.snu');
    if (univ === '카이스트 (KAIST)' || univ === 'KAIST') return t('univ.kaist');
    if (univ === '고려대학교' || univ === 'Korea University' || univ === 'Đại học Korea') return t('univ.korea');
    if (univ === '연세대학교' || univ === 'Yonsei University' || univ === 'Đại học Yonsei') return t('univ.yonsei');
    if (univ === '캠퍼스 통합맵' || univ === 'Integrated Campus Map' || univ === 'Bản đồ Campus Liên kết') return t('univ.fallback');
    return univ;
  };

  return (
    <main style={styles.main}>
      {/* Real-time Slide-down Toast Match Notification (WOW factor!) */}
      {activeToast && (
        <div
          className={`glass-panel match-toast ${toastVisible ? 'toast-show' : 'toast-hide'}`}
          style={styles.toastContainer}
          onClick={() => handleNotificationClick(activeToast)}
        >
          <div style={styles.toastGlowBadge}>
            <Bell size={20} color="var(--accent-found)" className="bell-ringing" />
          </div>
          <div style={styles.toastContent}>
            <div style={styles.toastHeader}>
              <span style={styles.toastTitle}>{t('notification.title')}</span>
              <span style={styles.toastTime}>방금 전</span>
            </div>
            <p style={styles.toastMessage}>{activeToast.message}</p>
          </div>
          <button style={styles.toastButton}>
            {t('notification.toast_click')}
          </button>
        </div>
      )}

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
              <h1 style={styles.bannerTitle}>{getLocalizedUniv(activeUser.university)}</h1>
              <span style={styles.bannerSubtitle}>{t('app.name')}</span>
            </div>
          </div>
          <div style={styles.bannerRight}>
            <div style={styles.profileBadge}>
              <User size={14} />
              <span>{t('common.hi', { nickname: activeUser.nickname })}</span>
            </div>

            {/* Notification Bell Center in Banner */}
            <div style={styles.notifContainer}>
              <button
                style={{
                  ...styles.langSelectBtn,
                  position: 'relative',
                  backgroundColor: showNotifMenu ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: showNotifMenu ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                }}
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowLangMenu(false); // Close language menu if open
                }}
                title={t('common.notifications')}
                className={notifications.some(n => !n.is_read) ? 'bell-pulsing' : ''}
              >
                <Bell size={15} color={notifications.some(n => !n.is_read) ? 'var(--accent-found)' : 'var(--text-secondary)'} />
                {notifications.some(n => !n.is_read) && (
                  <span style={styles.notifBadge}>
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>
              
              {showNotifMenu && (
                <div style={styles.notifDropdown} className="glass-panel notif-dropdown-mobile">
                  <div style={styles.notifHeader}>
                    <span style={styles.notifTitle}>{t('notification.title')}</span>
                    {notifications.length > 0 && (
                      <button style={styles.notifClearBtn} onClick={handleClearNotifications}>
                        {t('notification.clear')}
                      </button>
                    )}
                  </div>
                  
                  <div style={styles.notifList}>
                    {notifications.length === 0 ? (
                      <div style={styles.notifEmpty}>
                        {t('notification.empty')}
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          style={{
                            ...styles.notifItem,
                            backgroundColor: notif.is_read ? 'transparent' : 'rgba(0, 242, 254, 0.04)',
                            borderLeft: notif.is_read ? '3px solid transparent' : '3px solid var(--accent-found)'
                          }}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div style={styles.notifItemTitle}>
                            <span>🔔 {t('notification.title')}</span>
                            <span style={styles.notifItemTime}>
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={styles.notifItemMsg}>{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Language Selector Dropdown in Banner */}
            <div style={styles.langSelectContainer}>
              <button
                style={styles.langSelectBtn}
                onClick={() => setShowLangMenu(!showLangMenu)}
                title="Language"
              >
                <Globe size={15} />
                <span style={{ fontSize: '11px', fontWeight: '600' }}>
                  {language === 'ko' ? 'KO' : language === 'en' ? 'EN' : 'VI'}
                </span>
                <ChevronDown size={11} />
              </button>
              {showLangMenu && (
                <div style={styles.langDropdown} className="glass-panel">
                  <button
                    type="button"
                    style={styles.langItem}
                    onClick={() => { setLanguage('ko'); setShowLangMenu(false); }}
                  >
                    한국어
                  </button>
                  <button
                    type="button"
                    style={styles.langItem}
                    onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    style={styles.langItem}
                    onClick={() => { setLanguage('vi'); setShowLangMenu(false); }}
                  >
                    Tiếng Việt
                  </button>
                </div>
              )}
            </div>

            <button style={styles.logoutBtn} onClick={handleLogout} title={t('common.logout')}>
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
        isRegistering={isRegistering}
        registrationCoords={registrationCoords}
        onRegistrationCoordsChange={handleRegistrationCoordsChange}
        activeRoute={navigationTarget ? { start: userLocation || mapCenter, end: navigationTarget.coords } : null}
        userLocation={userLocation}
      />

      {/* Registration Location Pinned prompt (PRD UX enhancement) */}
      {isRegistering && !registrationCoords && (
        <div style={styles.meetupPrompt} className="glass-panel">
          <MapPin size={18} color="var(--accent-lost)" className="pulse-indicator lost" />
          <span>지도를 클릭하여 분실/습득 위치를 지정해주세요.</span>
        </div>
      )}

      {/* Floating Centering GPS target */}
      {activeUser && !navigationTarget && (
        <button style={styles.gpsFloatBtn} className="glass-panel" onClick={handlePanToUserLocation} title={t('map.gps_tooltip')}>
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
          onDeleteItem={handleDeleteItem}
          isRegistering={isRegistering}
          setIsRegistering={setIsRegistering}
          registrationCoords={registrationCoords}
          registrationAddress={registrationAddress}
          onStartChat={handleStartChat}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSelectChat={(roomId) => {
            setActiveChatRoomId(roomId);
          }}
          chatRooms={chatRooms}
          onStartNavigation={handleStartNavigation}
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
    maxWidth: '460px',
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
  langSelectContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  langSelectBtn: {
    background: 'transparent',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    padding: '6px 8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.2s ease',
  },
  langDropdown: {
    position: 'absolute',
    top: '34px',
    right: 0,
    backgroundColor: 'rgba(10, 14, 26, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '95px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
  langItem: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500',
  },
  logoutBtn: {
    background: 'transparent',
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
  cancelMeetupBtn: {
    background: 'rgba(255, 74, 107, 0.15)',
    border: '1px solid rgba(255, 74, 107, 0.3)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '4px 10px',
    fontSize: '11px',
    marginLeft: '10px',
    transition: 'all 0.2s ease',
  },
  notifContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  notifBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ff4a6b',
    color: '#ffffff',
    fontSize: '9px',
    fontWeight: '700',
    borderRadius: '10px',
    padding: '1px 5px',
    minWidth: '14px',
    textAlign: 'center',
    border: '1px solid #101422',
    boxShadow: '0 0 8px rgba(255, 74, 107, 0.6)',
  },
  notifDropdown: {
    position: 'absolute',
    top: '34px',
    right: 0,
    backgroundColor: 'rgba(10, 14, 26, 0.96)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '320px',
    maxHeight: '380px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
    overflow: 'hidden',
  },
  notifHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  notifTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  notifClearBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent-found)',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  notifList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    overflowY: 'auto',
    maxHeight: '300px',
    paddingRight: '2px',
  },
  notifEmpty: {
    padding: '30px 10px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '12px',
  },
  notifItem: {
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  notifItemTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  notifItemTime: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  notifItemMsg: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    margin: 0,
  },
  toastContainer: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10000,
    width: 'calc(100% - 40px)',
    maxWidth: '440px',
    backgroundColor: 'rgba(10, 14, 26, 0.95)',
    border: '1px solid rgba(0, 242, 254, 0.3)',
    borderRadius: '16px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 12px 40px rgba(0, 242, 254, 0.25)',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  toastGlowBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(0, 242, 254, 0.25)',
    flexShrink: 0,
  },
  toastContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  toastHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toastTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  toastTime: {
    fontSize: '10px',
    color: 'var(--accent-found)',
    fontWeight: '600',
  },
  toastMessage: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    margin: 0,
  },
  toastButton: {
    backgroundColor: 'var(--accent-found)',
    border: 'none',
    color: '#0a0e1a',
    fontSize: '11px',
    fontWeight: '700',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 0 10px rgba(0, 242, 254, 0.3)',
  },
};
