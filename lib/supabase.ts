import { Profile, Item, ChatRoom, ChatMessage, ItemType, ItemStatus } from './types';

// Detect if Supabase environment variables are available (for production)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

// In-Memory & LocalStorage State Machine for seamless local execution
class SimulatedDatabase {
  private profilesKey = 'safe_campus_profiles';
  private itemsKey = 'safe_campus_items';
  private chatRoomsKey = 'safe_campus_chat_rooms';
  private chatMessagesKey = 'safe_campus_chat_messages';
  private activeUserKey = 'safe_campus_active_user';

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDefaultData();
    }
  }

  private initDefaultData() {
    // 1. Initial Profile
    if (!localStorage.getItem(this.activeUserKey)) {
      const defaultUser: Profile = {
        id: 'user-snu-student-123',
        email: 'hong@snu.ac.kr',
        nickname: '캠퍼스지킴이',
        university: '서울대학교',
        is_verified: true,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(this.activeUserKey, JSON.stringify(defaultUser));
      
      const profiles = [defaultUser];
      localStorage.setItem(this.profilesKey, JSON.stringify(profiles));
    }

    // 2. Pre-populated Campus Items (Centered around SNU for illustration)
    if (!localStorage.getItem(this.itemsKey)) {
      const defaultItems: Item[] = [
        {
          id: 'item-lost-1',
          user_id: 'user-snu-student-abc',
          type: 'lost',
          title: '아이패드 프로 11인치 스페이스 그레이',
          category: 'electronics',
          description: '301동 3층 302호 자습실에서 두고 나왔습니다. 키보드 폴리오 케이스가 끼워져 있고, 뒷면에 라이언 스티커가 붙어 있습니다. 중요한 과제 파일이 있어서 꼭 찾고 싶습니다 ㅜㅜ',
          image_url: '',
          latitude: 37.454950,
          longitude: 126.952540,
          location_detail: '제2공학관 301동 3층 302호 강의실 맨 뒷자리',
          status: 'searching',
          occurred_at: new Date(Date.now() - 4 * 3600000).toISOString(), // 4 hours ago
          created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
          updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        },
        {
          id: 'item-found-1',
          user_id: 'user-snu-student-xyz',
          type: 'found',
          title: '검은색 카드지갑 (현금 포함)',
          category: 'wallet',
          description: '학생회관 앞 벤치 옆 잔디밭에서 발견했습니다. 신한카드랑 학생증(이*우) 들어있고, 현금 만원짜리 한 장 들어있습니다. 습득 후 현재 보관중입니다.',
          image_url: '',
          latitude: 37.459380,
          longitude: 126.953120,
          location_detail: '학생회관 앞 해동학술관 근처 야외 목재 벤치 밑',
          status: 'kept',
          occurred_at: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
          created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
          updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
        },
        {
          id: 'item-safe-1',
          user_id: 'admin-snu-box',
          type: 'found', // Safe Box acts as an active found container
          title: '🔴 안심 보관소 - 학생회관 통합 경비실',
          category: 'others',
          description: '학생회관 1층 메인 복도 안쪽에 위치한 공식 행정/안심 수령소입니다. 야간 이동 및 허위 매칭이 불안할 시 이곳에 보관을 요청하시거나 수령 장소로 약속을 적극 권장합니다. (운영시간: 09:00 ~ 22:00)',
          image_url: '',
          latitude: 37.459200,
          longitude: 126.952200,
          location_detail: '학생회관 1층 중앙 입구 앞 행정초소',
          status: 'kept',
          occurred_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'item-safe-2',
          user_id: 'admin-snu-box',
          type: 'found',
          title: '🔴 안심 보관소 - 인문관 경비데스크',
          category: 'others',
          description: '인문대 해동관 1층 입구 안내데스크입니다. 습득물 보관 대장이 비치되어 있어 안전하게 전달 및 대리 수령이 가능합니다.',
          image_url: '',
          latitude: 37.460950,
          longitude: 126.952800,
          location_detail: '인문대학 14동 1층 로비 출입구 데스크',
          status: 'kept',
          occurred_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'item-lost-2',
          user_id: 'user-snu-student-def',
          type: 'lost',
          title: '노란색 캐릭터 열쇠고리 키링',
          category: 'others',
          description: '관악사 삼거리 길 가다가 흘린 것 같습니다. 노란색 곰돌이 인형 키링이고 에어팟에 달아놓은 것입니다. 소중한 선물이라 꼭 찾고 싶어요.',
          image_url: '',
          latitude: 37.463200,
          longitude: 126.957500,
          location_detail: '관악사 기숙사 삼거리 인도 구역',
          status: 'searching',
          occurred_at: new Date(Date.now() - 24 * 3600000).toISOString(),
          created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
          updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        }
      ];
      localStorage.setItem(this.itemsKey, JSON.stringify(defaultItems));
    }
  }

  // Active User Methods
  getActiveUser(): Profile | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.activeUserKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  setActiveUser(user: Profile | null) {
    if (user === null) {
      localStorage.removeItem(this.activeUserKey);
    } else {
      localStorage.setItem(this.activeUserKey, JSON.stringify(user));
      const profiles = this.getProfiles();
      if (!profiles.some(p => p.id === user.id)) {
        profiles.push(user);
        localStorage.setItem(this.profilesKey, JSON.stringify(profiles));
      }
    }
  }

  getProfiles(): Profile[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(this.profilesKey) || '[]');
  }

  // Items CRUD
  getItems(): Item[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(this.itemsKey) || '[]');
  }

  saveItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Item {
    const items = this.getItems();
    const newItem: Item = {
      ...item,
      id: 'item-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    items.unshift(newItem);
    localStorage.setItem(this.itemsKey, JSON.stringify(items));
    return newItem;
  }

  updateItemStatus(itemId: string, status: ItemStatus): Item | null {
    const items = this.getItems();
    const index = items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      items[index].status = status;
      items[index].updated_at = new Date().toISOString();
      localStorage.setItem(this.itemsKey, JSON.stringify(items));
      return items[index];
    }
    return null;
  }

  // Chat Rooms and Messages
  getChatRooms(userId: string): ChatRoom[] {
    if (typeof window === 'undefined') return [];
    const rooms: ChatRoom[] = JSON.parse(localStorage.getItem(this.chatRoomsKey) || '[]');
    const items = this.getItems();
    const profiles = this.getProfiles();

    return rooms
      .filter(r => r.buyer_id === userId || r.seller_id === userId)
      .map(room => {
        const item = items.find(i => i.id === room.item_id);
        const opponentId = room.buyer_id === userId ? room.seller_id : room.buyer_id;
        let opponent = profiles.find(p => p.id === opponentId);
        
        if (!opponent) {
          opponent = {
            id: opponentId,
            email: 'user@ac.kr',
            nickname: '익명 대학생',
            university: item ? '서울대학교' : '캠퍼스',
            is_verified: true,
            created_at: new Date().toISOString()
          };
        }

        return {
          ...room,
          item,
          opponent
        };
      });
  }

  createChatRoom(itemId: string, buyerId: string, sellerId: string): ChatRoom {
    const rooms: ChatRoom[] = JSON.parse(localStorage.getItem(this.chatRoomsKey) || '[]');
    
    // Check if room already exists
    const existing = rooms.find(r => r.item_id === itemId && r.buyer_id === buyerId && r.seller_id === sellerId);
    if (existing) return existing;

    const newRoom: ChatRoom = {
      id: 'room-' + Math.random().toString(36).substr(2, 9),
      item_id: itemId,
      buyer_id: buyerId,
      seller_id: sellerId,
      created_at: new Date().toISOString()
    };
    rooms.unshift(newRoom);
    localStorage.setItem(this.chatRoomsKey, JSON.stringify(rooms));
    
    // Insert introductory safety messages
    const lang = (typeof window !== 'undefined' ? localStorage.getItem('language') : 'ko') || 'ko';
    let welcomeMsg = '🤝 [안내] 1:1 안전 대화방이 활성화되었습니다.\n' +
      '• 개인 연락처 노출 없이 안전하게 소통하실 수 있습니다.\n' +
      '• 대면 만남 시 가급적 낮 시간대에 유동인구가 많은 교내 공개적인 장소(예: 학생회관 로비, 중앙도서관 입구 등)를 권장합니다.\n' +
      '• 혹시 모를 오해 방지를 위해 습득 당시에 훼손된 흔적이 있다면 미리 상대방에게 알리고 전달해 주시기 바랍니다.';
    if (lang === 'en') {
      welcomeMsg = '🤝 [Guide] 1:1 Safe Chat Room has been activated.\n' +
        '• Communicate safely without exposing personal contact details.\n' +
        '• We recommend meeting in public campus areas during daylight hours (e.g., Student Center Lobby, Library Entrance).\n' +
        '• To prevent misunderstandings, please disclose any damage present when the item was found.';
    } else if (lang === 'vi') {
      welcomeMsg = '🤝 [Hướng dẫn] Kênh trò chuyện an toàn 1:1 đã kích hoạt.\n' +
        '• Liên lạc an toàn không cần lộ số điện thoại cá nhân.\n' +
        '• Khuyến khích gặp nhau ban ngày tại nơi công cộng trong khuôn viên trường (VD: Sảnh hội sinh viên, sảnh thư viện).\n' +
        '• Vui lòng báo trước nếu đồ vật có vết trầy xước từ lúc nhặt được để tránh hiểu lầm.';
    }

    this.sendChatMessage(
      newRoom.id,
      'system',
      welcomeMsg,
      true
    );

    return newRoom;
  }

  updateChatRoomMeetup(roomId: string, lat: number, lng: number, place: string): ChatRoom | null {
    const rooms: ChatRoom[] = JSON.parse(localStorage.getItem(this.chatRoomsKey) || '[]');
    const index = rooms.findIndex(r => r.id === roomId);
    if (index !== -1) {
      rooms[index].meetup_lat = lat;
      rooms[index].meetup_lng = lng;
      rooms[index].meetup_place = place;
      localStorage.setItem(this.chatRoomsKey, JSON.stringify(rooms));
      return rooms[index];
    }
    return null;
  }

  getChatMessages(roomId: string): ChatMessage[] {
    if (typeof window === 'undefined') return [];
    const messages: ChatMessage[] = JSON.parse(localStorage.getItem(this.chatMessagesKey) || '[]');
    return messages.filter(m => m.room_id === roomId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  sendChatMessage(roomId: string, senderId: string, text: string, isSystem = false): ChatMessage {
    const messages: ChatMessage[] = JSON.parse(localStorage.getItem(this.chatMessagesKey) || '[]');
    const newMessage: ChatMessage = {
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      room_id: roomId,
      sender_id: senderId,
      message: text,
      is_read: false,
      created_at: new Date().toISOString(),
      is_system: isSystem
    };
    messages.push(newMessage);
    localStorage.setItem(this.chatMessagesKey, JSON.stringify(messages));
    return newMessage;
  }
}

export const db = new SimulatedDatabase();
