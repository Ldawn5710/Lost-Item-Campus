import { Profile, Item, ChatRoom, ChatMessage, ItemType, ItemStatus } from './types';

// Detect if Supabase environment variables are available (for production)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

// In-Memory & LocalStorage State Machine for seamless local execution
class SimulatedDatabase {
  private profilesKey = 'safe_campus_profiles';
  private itemsKey = 'safe_campus_items_v3';
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
        id: 'user-daegu-student-123',
        email: 'hong@daegu.ac.kr',
        nickname: '캠퍼스지킴이',
        university: '대구대학교',
        is_verified: true,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(this.activeUserKey, JSON.stringify(defaultUser));
      
      const profiles = [defaultUser];
      localStorage.setItem(this.profilesKey, JSON.stringify(profiles));
    }

    if (!localStorage.getItem(this.itemsKey) || JSON.parse(localStorage.getItem(this.itemsKey) || '[]').length === 0) {
      const defaultItems: Item[] = [
        {
          id: 'mock-item-1',
          user_id: 'user-another-student-1',
          type: 'found',
          title: '갤럭시 버즈2 프로 (화이트)',
          category: 'electronics',
          latitude: 35.9015,
          longitude: 128.8492,
          location_detail: '대구대학교 웅지관 2층 학생 식당 입구 탁자 위',
          description: '식사를 하던 중 탁자 위에 덩그러니 놓여 있는 화이트 색상 갤럭시 버즈2 프로 케이스를 발견하고 습득했습니다. 본체 안에 양쪽 유닛 모두 들어있는 상태입니다. 분실하신 분은 1:1 대화 주시거나 교내 센터에 문의 바래요!',
          status: 'kept',
          occurred_at: new Date(Date.now() - 2 * 3600000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'mock-item-2',
          user_id: 'user-another-student-2',
          type: 'lost',
          title: '브라운 가죽 가로형 지갑',
          category: 'wallet',
          latitude: 35.9048,
          longitude: 128.8512,
          location_detail: '대구대학교 성산홀 본관 앞 잔디밭 벤치 부근',
          description: '성산홀 앞 잔디광장을 걷다가 지갑을 떨어뜨린 것 같습니다. 갈색 가죽 재질이며 내부에 학생증(이름: 김다구)과 체크카드가 들어있습니다. 습득하신 분은 제발 연락 주시면 사례하겠습니다 ㅠㅠ',
          status: 'searching',
          occurred_at: new Date(Date.now() - 12 * 3600000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'mock-item-safe-1',
          user_id: 'system',
          type: 'found',
          title: '🏫 안전 습득물 안심 보관소 (종합민원센터)',
          category: 'others',
          latitude: 35.9028,
          longitude: 128.8475,
          location_detail: '대구대학교 종합민원센터 안심 보관함 3호',
          description: '교내 안심 보관소에 위탁된 물품 목록이 보관되어 있습니다. 본 보관소에 물품이 보관된 경우 종합민원센터 데스크를 방문해 주시기 바랍니다.',
          status: 'kept',
          occurred_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

  deleteItem(itemId: string): boolean {
    const items = this.getItems();
    const filtered = items.filter(i => i.id !== itemId);
    if (filtered.length !== items.length) {
      localStorage.setItem(this.itemsKey, JSON.stringify(filtered));
      
      // Clean up linked chat rooms & messages
      const rooms: ChatRoom[] = JSON.parse(localStorage.getItem(this.chatRoomsKey) || '[]');
      const filteredRooms = rooms.filter(r => r.item_id !== itemId);
      localStorage.setItem(this.chatRoomsKey, JSON.stringify(filteredRooms));
      
      const deletedRoomIds = rooms.filter(r => r.item_id === itemId).map(r => r.id);
      if (deletedRoomIds.length > 0) {
        const messages: ChatMessage[] = JSON.parse(localStorage.getItem(this.chatMessagesKey) || '[]');
        const filteredMessages = messages.filter(m => !deletedRoomIds.includes(m.room_id));
        localStorage.setItem(this.chatMessagesKey, JSON.stringify(filteredMessages));
      }
      return true;
    }
    return false;
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
            university: item ? '대구대학교' : '캠퍼스',
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
