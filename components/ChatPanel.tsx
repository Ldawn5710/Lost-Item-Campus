'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, ShieldAlert, ArrowLeft, Navigation, X } from 'lucide-react';
import { ChatRoom, ChatMessage, Profile } from '../lib/types';
import { db } from '../lib/supabase';
import { useTranslation } from '../lib/LanguageContext';

interface ChatPanelProps {
  roomId: string;
  activeUser: Profile | null;
  onBack: () => void;
  onStartNavigation: (meetupCoords: { lat: number; lng: number }, meetupAddress: string) => void;
}

export default function ChatPanel({
  roomId,
  activeUser,
  onBack,
  onStartNavigation,
}: ChatPanelProps) {
  const { t, language } = useTranslation();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showSafetyAlert, setShowSafetyAlert] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleLeaveChat = () => {
    setShowLeaveConfirm(true);
  };

  const handleLeaveChatConfirm = async () => {
    try {
      await db.deleteChatRoom(roomId);
      setShowLeaveConfirm(false);
      onBack();
    } catch (err) {
      console.error("Error leaving chat room:", err);
    }
  };

  // 1. Load Room Details and Messages, and set up Realtime subscription if available
  useEffect(() => {
    if (!activeUser) return;

    let activeChannel: any = null;

    const fetchRoomAndMessages = async () => {
      try {
        const rooms = await db.getChatRooms(activeUser.id);
        const currentRoom = rooms.find(r => r.id === roomId);
        if (currentRoom) {
          setRoom(currentRoom);
          const msgs = await db.getChatMessages(roomId);
          setMessages(msgs);
        }
      } catch (err) {
        console.error("Error loading chat data:", err);
      }
    };

    fetchRoomAndMessages();

    // Set up real-time subscription using Supabase Realtime if configured
    const setupRealtime = async () => {
      try {
        const { isSupabaseConfigured, supabase } = await import('../lib/supabase');
        if (isSupabaseConfigured && supabase) {
          const channel = supabase.channel(`room:${roomId}`);
          if (channel) {
            activeChannel = channel
              .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
                (payload: any) => {
                  const newMsg = payload.new as ChatMessage;
                  setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                  });
                }
              )
              .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'chat_rooms', filter: `id=eq.${roomId}` },
                (payload: any) => {
                  const updatedRoom = payload.new as ChatRoom;
                  setRoom(prev => prev ? {
                    ...prev,
                    meetup_lat: updatedRoom.meetup_lat,
                    meetup_lng: updatedRoom.meetup_lng,
                    meetup_place: updatedRoom.meetup_place
                  } : null);
                }
              )
              .subscribe();
          }
        }
      } catch (err) {
        console.error("Error setting up Realtime subscription:", err);
      }
    };

    setupRealtime();

    return () => {
      if (activeChannel) {
        activeChannel.unsubscribe();
      }
    };
  }, [roomId, activeUser]);

  // 2. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeUser) return;

    const textToSend = inputText;
    setInputText('');

    try {
      const newMsg = await db.sendChatMessage(roomId, activeUser.id, textToSend);
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Simulated Auto-Reply *ONLY* for local demo (when Supabase is NOT configured)
      const { isSupabaseConfigured } = await import('../lib/supabase');
      if (!isSupabaseConfigured) {
        setTimeout(async () => {
          if (!room) return;
          const replies = [
            t('reply.1'),
            t('reply.2'),
            t('reply.3'),
            t('reply.4'),
            t('reply.5')
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          const autoReply = await db.sendChatMessage(roomId, room.opponent?.id || 'opponent', randomReply);
          setMessages(prev => {
            if (prev.some(m => m.id === autoReply.id)) return prev;
            return [...prev, autoReply];
          });
        }, 1500);
      }
    } catch (err) {
      console.error("Error sending chat message:", err);
    }
  };



  if (!room) return null;

  return (
    <div style={styles.container} className="glass-panel">
      {/* A. Header */}
      <div style={styles.header}>
        <button style={styles.iconBtn} onClick={onBack}>
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>
        <div style={styles.headerInfo}>
          <strong style={{ 
            fontSize: '15px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>{room.opponent?.nickname}{language === 'ko' ? ' 님' : ''}</strong>
          <span style={{ 
            fontSize: '11px', 
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>{room.opponent?.university}</span>
        </div>
        <button 
          style={styles.leaveChatBtn} 
          onClick={handleLeaveChat}
          title={t('chat.leave')}
        >
          <span style={{ fontSize: '11px', marginRight: '4px', fontWeight: 600 }}>{t('chat.leave')}</span>
          <X size={14} color="var(--accent-lost)" />
        </button>
      </div>

      {/* B. Associated Item Micro Card */}
      {room.item && (
        <div style={styles.itemCard}>
          <div style={styles.itemThumbnail}>
            {room.item.image_url ? (
              <img
                src={room.item.image_url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
              />
            ) : (
              room.item.type === 'lost' ? '🔴' : '🔵'
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <h4 style={styles.itemTitle}>{room.item.title}</h4>
            <span style={styles.itemPlace}>{room.item.location_detail}</span>
          </div>
        </div>
      )}

      {/* C. Safety Alert Banner (PRD 4.4) */}
      {showSafetyAlert && (() => {
        const isGuestInRoom = activeUser?.is_verified === false || room?.opponent?.is_verified === false;
        return (
          <div style={{
            ...styles.safetyAlert,
            backgroundColor: isGuestInRoom ? 'rgba(255, 74, 107, 0.12)' : 'rgba(255, 74, 107, 0.06)',
            borderBottom: isGuestInRoom ? '1px solid rgba(255, 74, 107, 0.3)' : '1px solid rgba(255, 74, 107, 0.15)',
          }}>
            <ShieldAlert size={18} color="var(--accent-lost)" style={{ flexShrink: 0 }} />
            <div style={{
              ...styles.safetyText,
              color: isGuestInRoom ? '#ffcdd2' : 'var(--text-secondary)',
              fontWeight: isGuestInRoom ? '600' : 'normal',
            }}>
              {isGuestInRoom ? t('chat.safety_guest_warning') : t('chat.safety_alert')}
            </div>
            <button style={styles.alertClose} onClick={() => setShowSafetyAlert(false)}>
              <X size={14} />
            </button>
          </div>
        );
      })()}

      {/* D. Messages List */}
      <div style={styles.messagesList}>
        {messages.map((msg) => {
          const isMe = msg.sender_id === activeUser?.id;
          const isSys = msg.sender_id === 'system' || msg.is_system;

          if (isSys) {
            const isMeetupMsg = msg.message.startsWith('📍');
            return (
              <div key={msg.id} style={styles.systemMsgWrapper}>
                <div style={styles.systemMsg} className="glass-panel">
                  <p style={{ whiteSpace: 'pre-line' }}>{msg.message}</p>
                  
                  {isMeetupMsg && room.meetup_lat && (
                    <button
                      className="glass-button primary"
                      style={styles.systemNavBtn}
                      onClick={() => onStartNavigation(
                        { lat: room.meetup_lat!, lng: room.meetup_lng! },
                        room.meetup_place || t('map.address_default')
                      )}
                    >
                      <Navigation size={14} />
                      <span>{t('chat.start_nav')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              style={{
                ...styles.msgWrapper,
                justifyContent: isMe ? 'flex-end' : 'flex-start',
              }}
            >
              {!isMe && (
                <div style={styles.avatar}>
                  {room.opponent?.nickname?.substring(0, 1)}
                </div>
              )}
              <div
                style={{
                  ...styles.bubble,
                  backgroundColor: isMe ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                  borderTopRightRadius: isMe ? '2px' : '14px',
                  borderTopLeftRadius: isMe ? '14px' : '2px',
                }}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* E. Input Bar */}
      <form onSubmit={handleSendMessage} style={styles.inputBar}>
        <input
          type="text"
          placeholder={t('chat.input_placeholder')}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="glass-input"
          style={styles.input}
        />
        <button type="submit" className="glass-button primary" style={styles.sendBtn}>
          <Send size={16} />
        </button>
      </form>

      {/* F. Custom Leave Confirmation Modal (PRD 4.5 UX Improvement for Mobile WebViews) */}
      {showLeaveConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-panel">
            <div style={styles.modalHeader}>
              <ShieldAlert size={24} color="var(--accent-lost)" style={{ marginBottom: '8px' }} />
              <h3 style={styles.modalTitle}>{t('chat.leave')}</h3>
            </div>
            <p style={styles.modalText}>{t('chat.leave_confirm')}</p>
            <div style={styles.modalActions}>
              <button
                type="button"
                className="glass-button"
                style={styles.modalCancelBtn}
                onClick={() => setShowLeaveConfirm(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="glass-button primary"
                style={styles.modalLeaveBtn}
                onClick={handleLeaveChatConfirm}
              >
                {t('chat.leave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0px',
    border: 'none',
    boxShadow: 'none',
    backgroundColor: '#0a0e1a',
  },
  header: {
    height: '60px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '12px',
    backgroundColor: 'rgba(10, 14, 26, 0.9)',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    touchAction: 'manipulation',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  leaveChatBtn: {
    background: 'rgba(255, 74, 107, 0.08)',
    border: '1px solid rgba(255, 74, 107, 0.2)',
    borderRadius: '16px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '6px 12px',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    touchAction: 'manipulation',
  },
  itemCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    gap: '12px',
  },
  itemThumbnail: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  itemPlace: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  meetupBtn: {
    padding: '6px 10px',
    fontSize: '11px',
    gap: '4px',
  },
  safetyAlert: {
    backgroundColor: 'rgba(255, 74, 107, 0.06)',
    borderBottom: '1px solid rgba(255, 74, 107, 0.15)',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    position: 'relative',
  },
  safetyText: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    paddingRight: '16px',
  },
  alertClose: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  msgWrapper: {
    display: 'flex',
    gap: '10px',
    maxWidth: '85%',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    border: '1px solid rgba(0, 242, 254, 0.2)',
    color: 'var(--accent-found)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '12px',
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: '14px',
    fontSize: '13px',
    lineHeight: '1.5',
    color: 'var(--text-primary)',
    wordBreak: 'break-all',
  },
  systemMsgWrapper: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    margin: '8px 0',
  },
  systemMsg: {
    width: '90%',
    padding: '14px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    backgroundColor: 'rgba(10, 14, 26, 0.8)',
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: '10px',
  },
  systemNavBtn: {
    marginTop: '10px',
    width: '100%',
    gap: '6px',
    height: '32px',
    fontSize: '12px',
  },
  inputBar: {
    height: '60px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(10, 14, 26, 0.9)',
  },
  input: {
    flex: 1,
    height: '38px',
    fontSize: '13px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '20px',
  },
  sendBtn: {
    width: '38px',
    height: '38px',
    padding: 0,
    borderRadius: '50%',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(5, 7, 14, 0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '20px',
    boxSizing: 'border-box',
  },
  modalContent: {
    width: '100%',
    maxWidth: '300px',
    padding: '24px 20px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(10, 14, 26, 0.95)',
  },
  modalHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '12px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '4px 0 0 0',
  },
  modalText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    margin: '0 0 20px 0',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: '38px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
  },
  modalLeaveBtn: {
    flex: 1,
    height: '38px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#ff4a6b',
    border: 'none',
    color: '#ffffff',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(255, 74, 107, 0.3)',
    touchAction: 'manipulation',
  },
};
