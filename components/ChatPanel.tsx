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
  onSelectMeetupMode: () => void;
  meetupCoords: { lat: number; lng: number } | null;
  meetupAddress: string;
  onStartNavigation: (meetupCoords: { lat: number; lng: number }, meetupAddress: string) => void;
}

export default function ChatPanel({
  roomId,
  activeUser,
  onBack,
  onSelectMeetupMode,
  meetupCoords,
  meetupAddress,
  onStartNavigation,
}: ChatPanelProps) {
  const { t, language } = useTranslation();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showSafetyAlert, setShowSafetyAlert] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load Room Details and Messages
  useEffect(() => {
    if (!activeUser) return;
    const rooms = db.getChatRooms(activeUser.id);
    const currentRoom = rooms.find(r => r.id === roomId);
    if (currentRoom) {
      setRoom(currentRoom);
      setMessages(db.getChatMessages(roomId));
    }
  }, [roomId, activeUser]);

  // 2. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Send Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeUser) return;

    const newMsg = db.sendChatMessage(roomId, activeUser.id, inputText);
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulated Auto-Reply for dynamic experience!
    // Since it's a simulated environment, having the other person reply immediately makes the app feel "real" and premium!
    setTimeout(() => {
      if (!room) return;
      const replies = [
        t('reply.1'),
        t('reply.2'),
        t('reply.3'),
        t('reply.4'),
        t('reply.5')
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const autoReply = db.sendChatMessage(roomId, room.opponent?.id || 'opponent', randomReply);
      setMessages(prev => [...prev, autoReply]);
    }, 1500);
  };

  // 4. Set Meetup Point (Sends a system message with Navigation button)
  useEffect(() => {
    if (!meetupCoords || !room || !activeUser) return;

    // Trigger meetup creation in database
    db.updateChatRoomMeetup(roomId, meetupCoords.lat, meetupCoords.lng, meetupAddress);
    
    // Send system message
    const msgText = t('sys.meetup_set', { meetupAddress });
    const systemMsg = db.sendChatMessage(roomId, 'system', msgText, true);
    
    setMessages(prev => [...prev, systemMsg]);

    // Force updates to room state
    setRoom(prev => prev ? { ...prev, meetup_lat: meetupCoords.lat, meetup_lng: meetupCoords.lng, meetup_place: meetupAddress } : null);
  }, [meetupCoords]);

  if (!room) return null;

  return (
    <div style={styles.container} className="glass-panel">
      {/* A. Header */}
      <div style={styles.header}>
        <button style={styles.iconBtn} onClick={onBack}>
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>
        <div style={styles.headerInfo}>
          <strong style={{ fontSize: '15px' }}>{room.opponent?.nickname}{language === 'ko' ? ' 님' : ''}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{room.opponent?.university}</span>
        </div>
      </div>

      {/* B. Associated Item Micro Card */}
      {room.item && (
        <div style={styles.itemCard}>
          <div style={styles.itemThumbnail}>
            {room.item.type === 'lost' ? '🔴' : '🔵'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <h4 style={styles.itemTitle}>{room.item.title}</h4>
            <span style={styles.itemPlace}>{room.item.location_detail}</span>
          </div>
          <button
            className="glass-button primary"
            style={styles.meetupBtn}
            onClick={onSelectMeetupMode}
          >
            <MapPin size={14} />
            <span>{t('chat.meetup_btn')}</span>
          </button>
        </div>
      )}

      {/* C. Safety Alert Banner (PRD 4.4) */}
      {showSafetyAlert && (
        <div style={styles.safetyAlert}>
          <ShieldAlert size={16} color="var(--accent-lost)" style={{ flexShrink: 0 }} />
          <div style={styles.safetyText}>
            {t('chat.safety_alert')}
          </div>
          <button style={styles.alertClose} onClick={() => setShowSafetyAlert(false)}>
            <X size={14} />
          </button>
        </div>
      )}

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
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
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
};
