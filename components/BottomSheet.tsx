'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, PlusCircle, MessageSquare, MapPin, Calendar, Tag, FileText, ArrowRight, CheckCircle2, ChevronUp, ChevronDown, ZoomIn, ZoomOut, X, RefreshCw } from 'lucide-react';
import { Item, ItemType, ItemStatus, Profile } from '../lib/types';
import { useTranslation } from '../lib/LanguageContext';

interface BottomSheetProps {
  items: Item[];
  activeUser: Profile | null;
  selectedItem: Item | null;
  onSelectItem: (item: Item | null) => void;
  onRegisterItem: (item: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => void;
  onDeleteItem?: (itemId: string) => void;
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  registrationCoords: { lat: number; lng: number } | null;
  registrationAddress: string;
  onStartChat: (item: Item) => void;
  activeTab: 'explore' | 'register' | 'chats';
  setActiveTab: (tab: 'explore' | 'register' | 'chats') => void;
  onSelectChat: (roomId: string) => void;
  chatRooms: any[];
  onStartNavigation?: (coords: { lat: number; lng: number }, address: string) => void;
}

export default function BottomSheet({
  items,
  activeUser,
  selectedItem,
  onSelectItem,
  onRegisterItem,
  onDeleteItem,
  isRegistering,
  setIsRegistering,
  registrationCoords,
  registrationAddress,
  onStartChat,
  activeTab,
  setActiveTab,
  onSelectChat,
  chatRooms,
  onStartNavigation,
}: BottomSheetProps) {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '3days' | 'week'>('all');

  // Registration wizard form state
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regType, setRegType] = useState<ItemType>('lost');
  const [regTitle, setRegTitle] = useState('');
  const [regCategory, setRegCategory] = useState('electronics');
  const [regDetailLoc, setRegDetailLoc] = useState('');
  const [regDesc, setRegDesc] = useState('');
  const [regOccurredAt, setRegOccurredAt] = useState(new Date().toISOString().substring(0, 16));

  // Premium Photo capturing & Canvas compression states
  const [regImage, setRegImage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Zoom modal states
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  const handleImageClick = () => {
    setIsZoomOpen(true);
    setZoomScale(1);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale(prev => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale(1);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up camera on tab change or drawer close
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'register' || !isRegistering) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    }
  }, [activeTab, isRegistering]);

  const categories = ['all', 'electronics', 'wallet', 'bag', 'clothing', 'cosmetics', 'others'];

  const getLocaleString = (dateStr: string) => {
    const localeMap = { ko: 'ko-KR', en: 'en-US', vi: 'vi-VN' };
    return new Date(dateStr).toLocaleString(localeMap[language] || 'ko-KR');
  };

  const getLocaleDateString = (dateStr: string) => {
    const localeMap = { ko: 'ko-KR', en: 'en-US', vi: 'vi-VN' };
    return new Date(dateStr).toLocaleDateString(localeMap[language] || 'ko-KR', { month: 'short', day: 'numeric' });
  };

  // 1. Filter Items
  const filteredItems = items.filter(item => {
    // Search keyword match
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location_detail.toLowerCase().includes(searchQuery.toLowerCase());

    // Category match
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;

    // Type match
    const matchType =
      selectedType === 'all' ||
      (selectedType === 'lost' && item.type === 'lost') ||
      (selectedType === 'found' && item.type === 'found');

    // Time filter
    let matchTime = true;
    const occurredTime = new Date(item.occurred_at).getTime();
    const now = Date.now();
    if (timeFilter === 'today') {
      matchTime = now - occurredTime <= 24 * 3600000;
    } else if (timeFilter === '3days') {
      matchTime = now - occurredTime <= 3 * 24 * 3600000;
    } else if (timeFilter === 'week') {
      matchTime = now - occurredTime <= 7 * 24 * 3600000;
    }

    return matchSearch && matchCategory && matchType && matchTime;
  });

  // Check for similar items (Matching engine recommendation)
  const getRecommendation = (currentItem: Item) => {
    if (currentItem.type !== 'lost') return null;

    // Suggest found items with same category, occurred within 3 days, and near this location
    return items.find(
      item =>
        item.type === 'found' &&
        item.category === currentItem.category &&
        item.id !== currentItem.id &&
        item.status === 'kept'
    );
  };

  const handleStartRegister = () => {
    setIsRegistering(true);
    setRegStep(1);
    setActiveTab('register');
    onSelectItem(null);
  };

  const handleNextRegisterStep = () => {
    if (!registrationCoords) {
      alert('지도를 터치하여 분실/습득 발생 위치를 먼저 지정해주세요.');
      return;
    }
    setRegStep(2);
  };

  // 1. Camera streams & Canvas Compression Logic
  const startCamera = async () => {
    setCameraActive(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(t('reg.camera_err'));
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      // Resize to max 800px to avoid localStorage overflow
      const max_width = 800;
      let targetWidth = width;
      let targetHeight = height;
      if (width > max_width) {
        targetHeight = Math.round((height * max_width) / width);
        targetWidth = max_width;
      }

      const resizeCanvas = document.createElement('canvas');
      resizeCanvas.width = targetWidth;
      resizeCanvas.height = targetHeight;
      const resizeCtx = resizeCanvas.getContext('2d');
      if (resizeCtx) {
        resizeCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
        const dataUrl = resizeCanvas.toDataURL('image/jpeg', 0.6);
        setRegImage(dataUrl);
      } else {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setRegImage(dataUrl);
      }
    }
    stopCamera();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max_width = 800;
        let width = img.width;
        let height = img.height;

        if (width > max_width) {
          height = Math.round((height * max_width) / width);
          width = max_width;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setRegImage(dataUrl);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!regTitle.trim()) {
      alert('물건명을 입력해 주세요.');
      return;
    }

    if (!registrationCoords) return;

    onRegisterItem({
      user_id: activeUser?.id || 'anonymous',
      type: regType,
      title: regTitle,
      category: regCategory,
      description: regDesc,
      image_url: regImage,
      latitude: registrationCoords.lat,
      longitude: registrationCoords.lng,
      location_detail: regDetailLoc || registrationAddress,
      status: regType === 'lost' ? 'searching' : 'kept',
      occurred_at: new Date(regOccurredAt).toISOString(),
    });

    // Reset Form
    setRegTitle('');
    setRegDetailLoc('');
    setRegDesc('');
    setRegImage('');
    setIsRegistering(false);
    setRegStep(1);
    setActiveTab('explore');
  };

  const activeRecommend = selectedItem ? getRecommendation(selectedItem) : null;

  return (
    <div style={{
      ...styles.container,
      height: isOpen ? '420px' : '64px',
    }} className="glass-panel">
      {/* 1. Header Drag Handle */}
      <div style={styles.dragHandle} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <ChevronDown size={22} color="var(--text-secondary)" /> : <ChevronUp size={22} color="var(--text-secondary)" />}
        <span style={styles.handleTitle}>{t('tabs.dashboard')}</span>
      </div>

      {isOpen && (
        <div style={styles.content}>
          {/* Detailed Item Card View Overlay */}
          {selectedItem ? (
            <div style={styles.detailsView}>
              <div style={styles.detailsHeader}>
                <button className="glass-button" style={styles.backBtn} onClick={() => onSelectItem(null)}>
                  {t('common.back')}
                </button>
                <span style={{
                  ...styles.badge,
                  backgroundColor: selectedItem.type === 'lost' ? 'rgba(255, 74, 107, 0.2)' : 'rgba(0, 242, 254, 0.2)',
                  color: selectedItem.type === 'lost' ? 'var(--accent-lost)' : 'var(--accent-found)',
                  border: `1px solid ${selectedItem.type === 'lost' ? 'var(--accent-lost)' : 'var(--accent-found)'}`
                }}>
                  {selectedItem.type === 'lost' ? t('details.lost_badge') : t('details.found_badge')}
                </span>
              </div>

              <div style={styles.detailsScroll}>
                {selectedItem.image_url ? (
                  <div style={styles.detailsSplitBody}>
                    <div style={styles.detailsLeftCol}>
                      <h3 style={styles.itemTitle}>{selectedItem.title}</h3>
                      <div style={styles.metaRow}>
                        <div style={styles.metaItem}><Tag size={14} /> <span>{t(`category.${selectedItem.category}`)}</span></div>
                        <div style={styles.metaItem}><Calendar size={14} /> <span>{getLocaleString(selectedItem.occurred_at)}</span></div>
                      </div>
                      <div style={styles.metaRow}>
                        <div style={styles.metaItem}><MapPin size={14} /> <strong>{selectedItem.location_detail}</strong></div>
                      </div>
                      {selectedItem.description && (
                        <div style={styles.descriptionBox}>
                          <h4 style={styles.sectionLabel}>{t('details.section_label')}</h4>
                          <p style={styles.descriptionText}>{selectedItem.description}</p>
                        </div>
                      )}
                    </div>
                    <div style={styles.detailsRightCol}>
                      <div style={styles.detailsImageWrapper}>
                        <img
                          src={selectedItem.image_url}
                          alt={selectedItem.title}
                          style={styles.detailsImage}
                          onClick={handleImageClick}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 style={styles.itemTitle}>{selectedItem.title}</h3>
                    <div style={styles.metaRow}>
                      <div style={styles.metaItem}><Tag size={14} /> <span>{t(`category.${selectedItem.category}`)}</span></div>
                      <div style={styles.metaItem}><Calendar size={14} /> <span>{getLocaleString(selectedItem.occurred_at)}</span></div>
                    </div>
                    <div style={styles.metaRow}>
                      <div style={styles.metaItem}><MapPin size={14} /> <strong>{selectedItem.location_detail}</strong></div>
                    </div>
                    {selectedItem.description && (
                      <div style={styles.descriptionBox}>
                        <h4 style={styles.sectionLabel}>{t('details.section_label')}</h4>
                        <p style={styles.descriptionText}>{selectedItem.description}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Similarity Scoring Engine Banner (PRD 5.1) */}
                {activeRecommend && (
                  <div style={styles.recommendBanner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pulse-indicator found"></span>
                      <strong>{t('details.matching_recommend')}</strong>
                    </div>
                    <p style={styles.recommendDesc}>
                      {activeRecommend.title} ({activeRecommend.location_detail})
                    </p>
                    <button
                      className="glass-button primary"
                      style={styles.recommendBtn}
                      onClick={() => onSelectItem(activeRecommend)}
                    >
                      {t('details.matching_view')}
                    </button>
                  </div>
                )}
              </div>

              {/* Chat & Navigation Trigger */}
              <div style={styles.detailsFooter}>
                {selectedItem.user_id !== activeUser?.id && !selectedItem.title.includes('안심 보관소') ? (
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    {selectedItem.type === 'found' && onStartNavigation ? (
                      <>
                        <button
                          className="glass-button"
                          style={{ flex: 1, gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', padding: '8px 12px' }}
                          onClick={() => onStartChat(selectedItem)}
                        >
                          <MessageSquare size={16} />
                          <span>{t('details.chat_btn')}</span>
                        </button>
                        <button
                          className="glass-button primary"
                          style={{ flex: 1, gap: '6px', padding: '8px 12px' }}
                          onClick={() => onStartNavigation({ lat: selectedItem.latitude, lng: selectedItem.longitude }, selectedItem.location_detail || selectedItem.title)}
                        >
                          <MapPin size={16} />
                          <span>길찾기</span>
                        </button>
                      </>
                    ) : (
                      <button
                        className="glass-button primary"
                        style={{ width: '100%', gap: '8px' }}
                        onClick={() => onStartChat(selectedItem)}
                      >
                        <MessageSquare size={18} />
                        <span>{t('details.chat_btn')}</span>
                      </button>
                    )}
                  </div>
                ) : selectedItem.title.includes('안심 보관소') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px', alignItems: 'center' }}>
                    <div style={styles.safeBoxNotice}>
                      {t('details.safebox_notice')}
                    </div>
                    {onStartNavigation && (
                      <button
                        className="glass-button primary"
                        style={{ width: '100%', gap: '6px', padding: '8px 16px' }}
                        onClick={() => onStartNavigation({ lat: selectedItem.latitude, lng: selectedItem.longitude }, selectedItem.location_detail || selectedItem.title)}
                      >
                        <MapPin size={16} />
                        <span>보관소 길찾기</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px', alignItems: 'center' }}>
                    <div style={styles.myPostNotice}>
                      {t('details.mypost_notice')}
                    </div>
                    <button
                      className="glass-button"
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 74, 107, 0.1)',
                        border: '1px solid rgba(255, 74, 107, 0.3)',
                        color: 'var(--accent-lost)',
                        fontSize: '13px',
                        fontWeight: '600',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => {
                        if (confirm(t('details.delete_confirm'))) {
                          onDeleteItem?.(selectedItem.id);
                        }
                      }}
                    >
                      <PlusCircle size={16} style={{ transform: 'rotate(45deg)' }} />
                      <span>{t('details.delete_btn')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Tabs and Lists Views
            <>
              {/* Navigation Tabs */}
              <div style={styles.tabs}>
                <button
                  style={{ ...styles.tab, borderBottom: activeTab === 'explore' ? '2.5px solid var(--accent-found)' : 'none', color: activeTab === 'explore' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  onClick={() => { setActiveTab('explore'); setIsRegistering(false); }}
                >
                  {t('tabs.explore')}
                </button>
                <button
                  style={{ ...styles.tab, borderBottom: activeTab === 'register' ? '2.5px solid var(--accent-found)' : 'none', color: activeTab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  onClick={handleStartRegister}
                >
                  {t('tabs.register')}
                </button>
                <button
                  style={{ ...styles.tab, borderBottom: activeTab === 'chats' ? '2.5px solid var(--accent-found)' : 'none', color: activeTab === 'chats' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  onClick={() => { setActiveTab('chats'); setIsRegistering(false); }}
                >
                  {t('tabs.chats', { count: chatRooms.length })}
                </button>
              </div>

              {/* TAB 1: Explore Lists */}
              {activeTab === 'explore' && (
                <div style={styles.tabContent}>
                  {/* Filters Bar */}
                  <div style={styles.filtersBar}>
                    <div style={styles.searchWrapper}>
                      <Search size={16} style={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder={t('explore.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glass-input"
                        style={styles.searchInput}
                      />
                    </div>

                    <div style={styles.filterOptions}>
                      {/* Type Pill Filter */}
                      <div style={styles.pills}>
                        <button
                          style={{ ...styles.pill, background: selectedType === 'all' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)' }}
                          onClick={() => setSelectedType('all')}
                        >
                          {t('common.all')}
                        </button>
                        <button
                          style={{ ...styles.pill, background: selectedType === 'lost' ? 'var(--accent-lost)' : 'rgba(255,255,255,0.05)' }}
                          onClick={() => setSelectedType('lost')}
                        >
                          {t('explore.pill_lost')}
                        </button>
                        <button
                          style={{ ...styles.pill, background: selectedType === 'found' ? 'var(--accent-found)' : 'rgba(255,255,255,0.05)', color: selectedType === 'found' ? '#000000' : 'inherit' }}
                          onClick={() => setSelectedType('found')}
                        >
                          {t('explore.pill_found')}
                        </button>
                      </div>

                      {/* Category select */}
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="glass-input"
                        style={styles.selectFilter}
                      >
                        {categories.map(c => (
                          <option key={c} value={c} style={{ background: '#0a0e1a' }}>
                            {c === 'all' ? t('common.all') : t(`category.${c}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* List View Scroll */}
                  <div style={styles.listScroll}>
                    {filteredItems.length === 0 ? (
                      <div style={styles.emptyState}>
                        <Filter size={32} color="var(--text-muted)" />
                        <p>{t('explore.no_items')}</p>
                      </div>
                    ) : (
                      filteredItems.map(item => (
                        <div
                          key={item.id}
                          style={styles.listItem}
                          className="glass-panel"
                          onClick={() => onSelectItem(item)}
                        >
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            {/* Left: Info + Photo directly to the right of text */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                              {/* Text Info */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    ...styles.badgeSmall,
                                    backgroundColor: item.type === 'lost' ? 'rgba(255, 74, 107, 0.15)' : 'rgba(0, 242, 254, 0.15)',
                                    color: item.type === 'lost' ? 'var(--accent-lost)' : 'var(--accent-found)'
                                  }}>
                                    {item.type === 'lost' ? t('explore.badge_lost') : t('explore.badge_found')}
                                  </span>
                                </div>
                                <h4 style={{ ...styles.listTitle, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', margin: 0 }}>{item.title}</h4>
                                <div style={{ ...styles.listLoc, margin: 0 }}>
                                  <MapPin size={12} />
                                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.location_detail}</span>
                                </div>
                              </div>

                              {/* Photo directly next to the text */}
                              {item.image_url && (
                                <img src={item.image_url} alt="" style={styles.listThumbnail} />
                              )}
                            </div>

                            {/* Right: Date (at the very far right end) */}
                            <div style={{ flexShrink: 0, marginLeft: '12px' }}>
                              <span style={styles.itemTime}>
                                {getLocaleDateString(item.occurred_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Registration Wizard (PRD 4.2) */}
              {activeTab === 'register' && (
                <div style={styles.tabContent}>
                  {regStep === 1 ? (
                    <div style={styles.wizardStep}>
                      <div style={styles.wizardGuide}>
                        <MapPin size={28} color="var(--accent-found)" />
                        <h3>{t('reg.step1_title')}</h3>
                        <p>{t('reg.step1_guide')}</p>
                      </div>

                      <div style={styles.coordDisplay} className="glass-panel">
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('reg.selected_address')}</span>
                        <strong style={{ fontSize: '14px', marginTop: '4px' }}>
                          {registrationCoords ? registrationAddress : t('reg.tap_map_helper')}
                        </strong>
                      </div>

                      <button
                        className="glass-button primary"
                        style={{ marginTop: '12px', width: '100%' }}
                        onClick={handleNextRegisterStep}
                      >
                        {t('reg.next_btn')} <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitRegister} style={styles.registerForm}>
                      <div style={styles.formScroll}>
                        <div style={styles.typeSelector}>
                          <label style={{ ...styles.typeOption, border: regType === 'lost' ? '1px solid var(--accent-lost)' : '1px solid transparent', background: regType === 'lost' ? 'rgba(255, 74, 107, 0.15)' : 'rgba(255,255,255,0.03)' }}>
                            <input type="radio" checked={regType === 'lost'} onChange={() => setRegType('lost')} style={{ display: 'none' }} />
                            <span>{t('reg.radio_lost')}</span>
                          </label>
                          <label style={{ ...styles.typeOption, border: regType === 'found' ? '1px solid var(--accent-found)' : '1px solid transparent', background: regType === 'found' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.03)' }}>
                            <input type="radio" checked={regType === 'found'} onChange={() => setRegType('found')} style={{ display: 'none' }} />
                            <span>{t('reg.radio_found')}</span>
                          </label>
                        </div>

                        <div style={styles.inputGroup}>
                          <label style={styles.formLabel}>{t('reg.title_label')}</label>
                          <input
                            type="text"
                            placeholder={t('reg.title_placeholder')}
                            value={regTitle}
                            onChange={(e) => setRegTitle(e.target.value)}
                            className="glass-input"
                            style={styles.formInput}
                          />
                        </div>

                        <div style={styles.formRow}>
                          <div style={{ ...styles.inputGroup, flex: 1 }}>
                            <label style={styles.formLabel}>{t('reg.category_label')}</label>
                            <select
                              value={regCategory}
                              onChange={(e) => setRegCategory(e.target.value)}
                              className="glass-input"
                              style={styles.formInput}
                            >
                              {categories.slice(1).map(c => (
                                <option key={c} value={c} style={{ background: '#0a0e1a' }}>{t(`category.${c}`)}</option>
                              ))}
                            </select>
                          </div>

                          <div style={{ ...styles.inputGroup, flex: 1 }}>
                            <label style={styles.formLabel}>{t('reg.time_label')}</label>
                            <input
                              type="datetime-local"
                              value={regOccurredAt}
                              onChange={(e) => setRegOccurredAt(e.target.value)}
                              className="glass-input"
                              style={styles.formInput}
                            />
                          </div>
                        </div>

                        <div style={styles.inputGroup}>
                          <label style={styles.formLabel}>{t('reg.detail_loc_label')}</label>
                          <input
                            type="text"
                            placeholder={t('reg.detail_loc_placeholder')}
                            value={regDetailLoc}
                            onChange={(e) => setRegDetailLoc(e.target.value)}
                            className="glass-input"
                            style={styles.formInput}
                          />
                        </div>

                        <div style={styles.inputGroup}>
                          <label style={styles.formLabel}>{t('reg.desc_label')}</label>
                          <textarea
                            placeholder={t('reg.desc_placeholder')}
                            value={regDesc}
                            onChange={(e) => setRegDesc(e.target.value)}
                            className="glass-input"
                            style={{ ...styles.formInput, height: '64px', resize: 'none' }}
                          />
                        </div>

                        {/* Premium Live Camera & File Upload Integration Section */}
                        <div style={styles.inputGroup}>
                          <label style={styles.formLabel}>{t('reg.image_label')}</label>
                          <div style={styles.cameraContainer}>
                            {regImage ? (
                              <div style={styles.imagePreviewContainer}>
                                <img src={regImage} alt="Preview" style={styles.imagePreview} />
                                <button type="button" onClick={() => setRegImage('')} style={styles.deleteImageBtn}>
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div style={styles.cameraPlaceholder}>
                                <label style={{ ...styles.cameraBtn, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment" 
                                    onChange={handleImageChange} 
                                    style={{ display: 'none' }} 
                                  />
                                  {t('reg.camera_start')}
                                </label>
                                <label style={{ ...styles.fileUploadLabel, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageChange} 
                                    style={{ display: 'none' }} 
                                  />
                                  📁 {language === 'ko' ? '앨범에서 선택' : language === 'vi' ? 'Chọn từ thư viện' : 'Choose from Gallery'}
                                </label>
                              </div>
                            )}
                            {cameraError && <div style={styles.cameraErrorText}>{cameraError}</div>}
                          </div>
                        </div>
                      </div>

                      <div style={styles.wizardButtons}>
                        <button type="button" className="glass-button" onClick={() => setRegStep(1)} style={{ flex: 1 }}>
                          {t('reg.reset_coords')}
                        </button>
                        <button type="submit" className="glass-button primary" style={{ flex: 2 }}>
                          {t('reg.submit_btn')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: Chats List */}
              {activeTab === 'chats' && (
                <div style={styles.tabContent}>
                  <div style={styles.listScroll}>
                    {chatRooms.length === 0 ? (
                      <div style={styles.emptyState}>
                        <MessageSquare size={32} color="var(--text-muted)" />
                        <p>{t('chats.empty')}</p>
                      </div>
                    ) : (
                      chatRooms.map(room => (
                        <div
                          key={room.id}
                          style={styles.chatListItem}
                          className="glass-panel"
                          onClick={() => onSelectChat(room.id)}
                        >
                          <div style={styles.chatInfo}>
                            <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                              {t('chats.with_user', { nickname: room.opponent?.nickname || '익명' })}
                            </strong>
                            <span style={styles.chatItemSub}>
                              {t('chats.item_linked', { title: room.item?.title || '유실물' })}
                            </span>
                          </div>
                          <div style={styles.chatBadge}>
                            {room.item?.type === 'lost' ? `🔴 ${t('explore.badge_lost')}` : `🔵 ${t('explore.badge_found')}`}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
      {isZoomOpen && selectedItem && selectedItem.image_url && typeof document !== 'undefined' && createPortal(
        <div style={styles.zoomOverlay} onClick={() => setIsZoomOpen(false)}>
          {/* Top Close Button */}
          <button 
            style={styles.zoomCloseBtn} 
            onClick={() => setIsZoomOpen(false)}
            title="닫기"
          >
            <X size={24} color="#ffffff" />
          </button>

          {/* Image Container */}
          <div style={styles.zoomImageContainer}>
            <img 
              src={selectedItem.image_url} 
              alt={selectedItem.title} 
              style={{
                ...styles.zoomImage,
                transform: `scale(${zoomScale})`,
              }} 
              onClick={(e) => {
                e.stopPropagation(); // Prevent closing overlay when clicking image
                // Toggle zoom scale between 1 and 2
                setZoomScale(prev => prev === 1 ? 2 : 1);
              }}
            />
          </div>

          {/* Zoom Control Bar */}
          <div style={styles.zoomControls} onClick={(e) => e.stopPropagation()}>
            <button style={styles.zoomBtn} onClick={handleZoomOut} disabled={zoomScale <= 0.5}>
              <ZoomOut size={18} />
            </button>
            <span style={styles.zoomScaleText}>{Math.round(zoomScale * 100)}%</span>
            <button style={styles.zoomBtn} onClick={handleZoomIn} disabled={zoomScale >= 4}>
              <ZoomIn size={18} />
            </button>
            <button style={styles.zoomBtn} onClick={handleResetZoom}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>,
        document.body
      )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    borderBottomLeftRadius: '0px',
    borderBottomRightRadius: '0px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderBottom: 'none',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  dragHandle: {
    height: '64px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  handleTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginTop: '2px',
    fontFamily: 'var(--font-accent)',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 64px)',
  },
  tabs: {
    display: 'flex',
    height: '44px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  tab: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'var(--font-primary)',
    transition: 'color 0.2s ease',
  },
  tabContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    height: 'calc(100% - 44px)',
    overflow: 'hidden',
  },
  filtersBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    width: '100%',
    paddingLeft: '36px',
    height: '36px',
    fontSize: '13px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#ffffff',
  },
  filterOptions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  pills: {
    display: 'flex',
    gap: '6px',
  },
  pill: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: 'none',
    fontSize: '11px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
  },
  selectFilter: {
    height: '32px',
    fontSize: '12px',
    padding: '0 8px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
  },
  listScroll: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  listItem: {
    padding: '14px',
    cursor: 'pointer',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  badgeSmall: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
  },
  itemTime: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  listTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  listLoc: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  detailsView: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '16px',
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  backBtn: {
    padding: '6px 12px',
    fontSize: '12px',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  detailsScroll: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingBottom: '12px',
  },
  itemTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  metaRow: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  descriptionBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    padding: '12px',
  },
  sectionLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    marginBottom: '4px',
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  recommendBanner: {
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    border: '1px dashed var(--accent-found)',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '4px',
  },
  recommendDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  recommendBtn: {
    alignSelf: 'flex-start',
    padding: '4px 8px',
    fontSize: '10px',
    background: 'rgba(0, 242, 254, 0.1)',
  },
  detailsFooter: {
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: '12px',
    display: 'flex',
    justifyContent: 'center',
  },
  myPostNotice: {
    color: 'var(--accent-safe)',
    fontSize: '13px',
    fontWeight: '600',
  },
  safeBoxNotice: {
    color: 'var(--text-secondary)',
    fontSize: '11px',
    textAlign: 'center',
  },
  wizardStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    textAlign: 'center',
    height: '100%',
  },
  wizardGuide: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    maxWidth: '300px',
  },
  coordDisplay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  registerForm: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  formScroll: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '4px',
  },
  typeSelector: {
    display: 'flex',
    gap: '10px',
  },
  typeOption: {
    flex: 1,
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  formLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    marginBottom: '4px',
  },
  formInput: {
    width: '100%',
    height: '36px',
    fontSize: '13px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#ffffff',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  wizardButtons: {
    display: 'flex',
    gap: '12px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: '12px',
    marginTop: '6px',
  },
  chatListItem: {
    padding: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  chatInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  chatItemSub: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  chatBadge: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  detailsSplitBody: {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
    width: '100%',
    alignItems: 'stretch',
  },
  detailsLeftCol: {
    flex: '1.2',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: 0,
  },
  detailsRightCol: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  detailsImageWrapper: {
    width: '100%',
    height: '100%',
    minHeight: '140px',
    maxHeight: '200px',
    marginBottom: '4px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsImage: {
    maxWidth: '100%',
    maxHeight: '200px',
    objectFit: 'contain',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    transition: 'transform 0.3s ease',
    cursor: 'zoom-in',
  },
  listThumbnail: {
    width: '56px',
    height: '56px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    flexShrink: 0,
  },
  cameraContainer: {
    width: '100%',
    minHeight: '80px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: '10px',
    border: '1px dashed rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '8px',
  },
  cameraPlaceholder: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '70px',
  },
  cameraBtn: {
    padding: '8px 14px',
    fontSize: '12px',
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    border: '1px solid var(--accent-found)',
    color: 'var(--accent-found)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
  },
  fileUploadLabel: {
    padding: '8px 14px',
    fontSize: '12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text-secondary)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
  },
  videoWrapper: {
    position: 'relative',
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  videoStream: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
  },
  videoControls: {
    position: 'absolute',
    bottom: '10px',
    display: 'flex',
    gap: '10px',
  },
  captureBtn: {
    backgroundColor: 'var(--accent-found)',
    color: '#000000',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,242,254,0.3)',
  },
  stopCameraBtn: {
    backgroundColor: 'rgba(255, 74, 107, 0.8)',
    color: '#ffffff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    overflow: 'hidden',
    padding: '4px',
  },
  imagePreview: {
    maxWidth: '100%',
    maxHeight: '140px',
    borderRadius: '6px',
    objectFit: 'contain',
  },
  deleteImageBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 74, 107, 0.9)',
    border: 'none',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '700',
  },
  cameraErrorText: {
    fontSize: '11px',
    color: 'var(--accent-lost)',
    marginTop: '6px',
    textAlign: 'center',
  },
  zoomOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(5, 8, 20, 0.9)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'zoom-out',
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    zIndex: 100000,
  },
  zoomImageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: '40px',
  },
  zoomImage: {
    maxWidth: '90%',
    maxHeight: '80%',
    objectFit: 'contain',
    borderRadius: '12px',
    boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'zoom-in',
  },
  zoomControls: {
    position: 'absolute',
    bottom: '40px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(10, 14, 26, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '8px 16px',
    borderRadius: '30px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  zoomBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  zoomScaleText: {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    minWidth: '48px',
    textAlign: 'center',
    fontFamily: 'var(--font-accent)',
  },
};
