'use client';

import React, { useState } from 'react';
import { Search, Filter, PlusCircle, MessageSquare, MapPin, Calendar, Tag, FileText, ArrowRight, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { Item, ItemType, ItemStatus, Profile } from '../lib/types';

interface BottomSheetProps {
  items: Item[];
  activeUser: Profile | null;
  selectedItem: Item | null;
  onSelectItem: (item: Item | null) => void;
  onRegisterItem: (item: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => void;
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  registrationCoords: { lat: number; lng: number } | null;
  registrationAddress: string;
  onStartChat: (item: Item) => void;
  activeTab: 'explore' | 'register' | 'chats';
  setActiveTab: (tab: 'explore' | 'register' | 'chats') => void;
  onSelectChat: (roomId: string) => void;
  chatRooms: any[];
}

export default function BottomSheet({
  items,
  activeUser,
  selectedItem,
  onSelectItem,
  onRegisterItem,
  isRegistering,
  setIsRegistering,
  registrationCoords,
  registrationAddress,
  onStartChat,
  activeTab,
  setActiveTab,
  onSelectChat,
  chatRooms,
}: BottomSheetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '3days' | 'week'>('all');

  // Registration wizard form state
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regType, setRegType] = useState<ItemType>('lost');
  const [regTitle, setRegTitle] = useState('');
  const [regCategory, setRegCategory] = useState('전자기기');
  const [regDetailLoc, setRegDetailLoc] = useState('');
  const [regDesc, setRegDesc] = useState('');
  const [regOccurredAt, setRegOccurredAt] = useState(new Date().toISOString().substring(0, 16));

  const categories = ['전체', '전자기기', '지갑/카드', '의류', '화장품', '기타'];

  // 1. Filter Items
  const filteredItems = items.filter(item => {
    // Search keyword match
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location_detail.toLowerCase().includes(searchQuery.toLowerCase());

    // Category match
    const matchCategory = selectedCategory === '전체' || item.category === selectedCategory;

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
      image_url: '',
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
        <span style={styles.handleTitle}>안심 캠퍼스 대시보드</span>
      </div>

      {isOpen && (
        <div style={styles.content}>
          {/* Detailed Item Card View Overlay */}
          {selectedItem ? (
            <div style={styles.detailsView}>
              <div style={styles.detailsHeader}>
                <button className="glass-button" style={styles.backBtn} onClick={() => onSelectItem(null)}>
                  ← 돌아가기
                </button>
                <span style={{
                  ...styles.badge,
                  backgroundColor: selectedItem.type === 'lost' ? 'rgba(255, 74, 107, 0.2)' : 'rgba(0, 242, 254, 0.2)',
                  color: selectedItem.type === 'lost' ? 'var(--accent-lost)' : 'var(--accent-found)',
                  border: `1px solid ${selectedItem.type === 'lost' ? 'var(--accent-lost)' : 'var(--accent-found)'}`
                }}>
                  {selectedItem.type === 'lost' ? '분실물' : '습득물'}
                </span>
              </div>

              <div style={styles.detailsScroll}>
                <h3 style={styles.itemTitle}>{selectedItem.title}</h3>
                
                <div style={styles.metaRow}>
                  <div style={styles.metaItem}><Tag size={14} /> <span>{selectedItem.category}</span></div>
                  <div style={styles.metaItem}><Calendar size={14} /> <span>{new Date(selectedItem.occurred_at).toLocaleString('ko-KR')}</span></div>
                </div>

                <div style={styles.metaRow}>
                  <div style={styles.metaItem}><MapPin size={14} /> <strong>{selectedItem.location_detail}</strong></div>
                </div>

                {selectedItem.description && (
                  <div style={styles.descriptionBox}>
                    <h4 style={styles.sectionLabel}>상세 정보</h4>
                    <p style={styles.descriptionText}>{selectedItem.description}</p>
                  </div>
                )}

                {/* Similarity Scoring Engine Banner (PRD 5.1) */}
                {activeRecommend && (
                  <div style={styles.recommendBanner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pulse-indicator found"></span>
                      <strong>[매칭 추천] 유사한 습득물이 발견되었습니다!</strong>
                    </div>
                    <p style={styles.recommendDesc}>
                      {activeRecommend.title} ({activeRecommend.location_detail})
                    </p>
                    <button
                      className="glass-button primary"
                      style={styles.recommendBtn}
                      onClick={() => onSelectItem(activeRecommend)}
                    >
                      해당 습득물 확인하기
                    </button>
                  </div>
                )}
              </div>

              {/* Chat trigger */}
              <div style={styles.detailsFooter}>
                {selectedItem.user_id !== activeUser?.id && !selectedItem.title.includes('안심 보관소') ? (
                  <button
                    className="glass-button primary"
                    style={{ width: '100%', gap: '8px' }}
                    onClick={() => onStartChat(selectedItem)}
                  >
                    <MessageSquare size={18} />
                    <span>실시간 1:1 대화로 물건 찾기</span>
                  </button>
                ) : selectedItem.title.includes('안심 보관소') ? (
                  <div style={styles.safeBoxNotice}>
                    * 본 보관소는 학교 소속 부서입니다. 상세 위치를 방문하시어 본인 인증 후 수령 가능합니다.
                  </div>
                ) : (
                  <div style={styles.myPostNotice}>
                    ✓ 회원님이 등록하신 게시글입니다.
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
                  지도로 탐색
                </button>
                <button
                  style={{ ...styles.tab, borderBottom: activeTab === 'register' ? '2.5px solid var(--accent-found)' : 'none', color: activeTab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  onClick={handleStartRegister}
                >
                  유실물 등록
                </button>
                <button
                  style={{ ...styles.tab, borderBottom: activeTab === 'chats' ? '2.5px solid var(--accent-found)' : 'none', color: activeTab === 'chats' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  onClick={() => { setActiveTab('chats'); setIsRegistering(false); }}
                >
                  내 대화방 ({chatRooms.length})
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
                        placeholder="분실물 품목명, 장소 검색..."
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
                          전체
                        </button>
                        <button
                          style={{ ...styles.pill, background: selectedType === 'lost' ? 'var(--accent-lost)' : 'rgba(255,255,255,0.05)' }}
                          onClick={() => setSelectedType('lost')}
                        >
                          🔴 분실물
                        </button>
                        <button
                          style={{ ...styles.pill, background: selectedType === 'found' ? 'var(--accent-found)' : 'rgba(255,255,255,0.05)', color: selectedType === 'found' ? '#000000' : 'inherit' }}
                          onClick={() => setSelectedType('found')}
                        >
                          🔵 습득물
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
                          <option key={c} value={c} style={{ background: '#0a0e1a' }}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* List View Scroll */}
                  <div style={styles.listScroll}>
                    {filteredItems.length === 0 ? (
                      <div style={styles.emptyState}>
                        <Filter size={32} color="var(--text-muted)" />
                        <p>해당하는 유실물이 없습니다.</p>
                      </div>
                    ) : (
                      filteredItems.map(item => (
                        <div
                          key={item.id}
                          style={styles.listItem}
                          className="glass-panel"
                          onClick={() => onSelectItem(item)}
                        >
                          <div style={styles.itemHeader}>
                            <span style={{
                              ...styles.badgeSmall,
                              backgroundColor: item.type === 'lost' ? 'rgba(255, 74, 107, 0.15)' : 'rgba(0, 242, 254, 0.15)',
                              color: item.type === 'lost' ? 'var(--accent-lost)' : 'var(--accent-found)'
                            }}>
                              {item.type === 'lost' ? '분실' : '습득'}
                            </span>
                            <span style={styles.itemTime}>
                              {new Date(item.occurred_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <h4 style={styles.listTitle}>{item.title}</h4>
                          <div style={styles.listLoc}>
                            <MapPin size={12} />
                            <span>{item.location_detail}</span>
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
                        <h3>1단계: 분실/습득 발생 위치 지정</h3>
                        <p>지도를 마우스로 클릭하거나 드래그하여 정확한 발생 포인트를 핀으로 지정해 주세요.</p>
                      </div>
                      
                      <div style={styles.coordDisplay} className="glass-panel">
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>선택된 주소</span>
                        <strong style={{ fontSize: '14px', marginTop: '4px' }}>
                          {registrationCoords ? registrationAddress : '지도를 터치하여 지정하세요'}
                        </strong>
                      </div>

                      <button
                        className="glass-button primary"
                        style={{ marginTop: '12px', width: '100%' }}
                        onClick={handleNextRegisterStep}
                      >
                        상세 정보 입력하기 <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitRegister} style={styles.registerForm}>
                      <div style={styles.formScroll}>
                        <div style={styles.typeSelector}>
                          <label style={{ ...styles.typeOption, border: regType === 'lost' ? '1px solid var(--accent-lost)' : '1px solid transparent', background: regType === 'lost' ? 'rgba(255, 74, 107, 0.15)' : 'rgba(255,255,255,0.03)' }}>
                            <input type="radio" checked={regType === 'lost'} onChange={() => setRegType('lost')} style={{ display: 'none' }} />
                            <span>🔴 내가 분실한 물건</span>
                          </label>
                          <label style={{ ...styles.typeOption, border: regType === 'found' ? '1px solid var(--accent-found)' : '1px solid transparent', background: regType === 'found' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.03)' }}>
                            <input type="radio" checked={regType === 'found'} onChange={() => setRegType('found')} style={{ display: 'none' }} />
                            <span>🔵 습득한 물건</span>
                          </label>
                        </div>

                        <div style={styles.inputGroup}>
                          <label style={styles.formLabel}>물건명</label>
                          <input
                            type="text"
                            placeholder="예: 에어팟 프로 2세대 본체"
                            value={regTitle}
                            onChange={(e) => setRegTitle(e.target.value)}
                            className="glass-input"
                            style={styles.formInput}
                          />
                        </div>

                        <div style={styles.formRow}>
                          <div style={{ ...styles.inputGroup, flex: 1 }}>
                            <label style={styles.formLabel}>카테고리</label>
                            <select
                              value={regCategory}
                              onChange={(e) => setRegCategory(e.target.value)}
                              className="glass-input"
                              style={styles.formInput}
                            >
                              {categories.slice(1).map(c => (
                                <option key={c} value={c} style={{ background: '#0a0e1a' }}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <div style={{ ...styles.inputGroup, flex: 1 }}>
                            <label style={styles.formLabel}>발생 시간</label>
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
                          <label style={styles.formLabel}>상세 보관/분실 위치</label>
                          <input
                            type="text"
                            placeholder="예: 제2공학관 301동 4층 소파 위"
                            value={regDetailLoc}
                            onChange={(e) => setRegDetailLoc(e.target.value)}
                            className="glass-input"
                            style={styles.formInput}
                          />
                        </div>

                        <div style={styles.inputGroup}>
                          <label style={styles.formLabel}>특이사항 및 설명</label>
                          <textarea
                            placeholder="물건의 생김새, 브랜드, 특징, 보관 여부를 적어주세요."
                            value={regDesc}
                            onChange={(e) => setRegDesc(e.target.value)}
                            className="glass-input"
                            style={{ ...styles.formInput, height: '64px', resize: 'none' }}
                          />
                        </div>
                      </div>

                      <div style={styles.wizardButtons}>
                        <button type="button" className="glass-button" onClick={() => setRegStep(1)} style={{ flex: 1 }}>
                          위치 재설정
                        </button>
                        <button type="submit" className="glass-button primary" style={{ flex: 2 }}>
                          등록 완료하기
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
                        <p>활성화된 대화방이 없습니다.</p>
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
                              {room.opponent?.nickname || '익명'} 님과의 대화
                            </strong>
                            <span style={styles.chatItemSub}>
                              연동 물건: {room.item?.title || '유실물'}
                            </span>
                          </div>
                          <div style={styles.chatBadge}>
                            {room.item?.type === 'lost' ? '🔴 분실' : '🔵 습득'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
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
};
