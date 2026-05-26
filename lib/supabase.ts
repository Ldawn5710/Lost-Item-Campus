import { createClient } from '@supabase/supabase-js';
import { Profile, Item, ChatRoom, ChatMessage, ItemType, ItemStatus, Notification } from './types';

// Detect if Supabase environment variables are available (for production)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const isSupabaseConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

// Create actual Supabase client if configured
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Simulated/Local database utilizing LocalStorage (for fallback/development mode)
class SimulatedDatabase {
  private profilesKey = 'safe_campus_profiles';
  private itemsKey = 'safe_campus_items_v3';
  private chatRoomsKey = 'safe_campus_chat_rooms';
  private chatMessagesKey = 'safe_campus_chat_messages';
  private activeUserKey = 'safe_campus_active_user';
  private notificationsKey = 'safe_campus_notifications';

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

  async setActiveUser(user: Profile | null): Promise<void> {
    if (user === null) {
      localStorage.removeItem(this.activeUserKey);
    } else {
      localStorage.setItem(this.activeUserKey, JSON.stringify(user));
      
      if (isSupabaseConfigured && supabase) {
        await supabase.from('profiles').upsert(user);
      } else {
        const profiles = this.getProfilesSync();
        if (!profiles.some(p => p.id === user.id)) {
          profiles.push(user);
          localStorage.setItem(this.profilesKey, JSON.stringify(profiles));
        }
      }
    }
  }

  getProfilesSync(): Profile[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(this.profilesKey) || '[]');
  }

  // Asynchronous API Definitions (supporting both modes)
  async getProfiles(): Promise<Profile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) console.error("Error fetching profiles:", error);
      return data || [];
    }
    return this.getProfilesSync();
  }

  // Items CRUD
  async getItems(): Promise<Item[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) console.error("Error fetching items:", error);
      return data || [];
    }
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(this.itemsKey) || '[]');
  }

  async saveItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item> {
    const newItem: Item = {
      ...item,
      id: 'item-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let savedItem = newItem;

    if (isSupabaseConfigured && supabase) {
      // Ensure active user's profile exists in Supabase to avoid foreign key violations!
      const activeUser = this.getActiveUser();
      if (activeUser) {
        await supabase.from('profiles').upsert(activeUser);
      }

      const { data, error } = await supabase
        .from('items')
        .insert(newItem)
        .select()
        .single();
      if (error) {
        console.error("Error saving item in Supabase, saving locally...", error);
      } else if (data) {
        savedItem = data as Item;
      }
    }

    if (savedItem === newItem) {
      // Local Fallback
      const items = await this.getItems();
      items.unshift(newItem);
      localStorage.setItem(this.itemsKey, JSON.stringify(items));
    }

    // Trigger match checker asynchronously
    this.checkAndGenerateMatches(savedItem);

    return savedItem;
  }

  async updateItemStatus(itemId: string, status: ItemStatus): Promise<Item | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('items')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select()
        .single();
      if (error) {
        console.error("Error updating item status in Supabase, using local...", error);
      } else if (data) {
        return data as Item;
      }
    }

    const items = await this.getItems();
    const index = items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      items[index].status = status;
      items[index].updated_at = new Date().toISOString();
      localStorage.setItem(this.itemsKey, JSON.stringify(items));
      return items[index];
    }
    return null;
  }

  async deleteItem(itemId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);
      if (error) {
        console.error("Error deleting item from Supabase:", error);
      } else {
        return true;
      }
    }

    const items = await this.getItems();
    const filtered = items.filter(i => i.id !== itemId);
    if (filtered.length !== items.length) {
      localStorage.setItem(this.itemsKey, JSON.stringify(filtered));
      
      // Clean up linked chat rooms & messages
      const roomsStr = localStorage.getItem(this.chatRoomsKey) || '[]';
      const rooms: ChatRoom[] = JSON.parse(roomsStr);
      const filteredRooms = rooms.filter(r => r.item_id !== itemId);
      localStorage.setItem(this.chatRoomsKey, JSON.stringify(filteredRooms));
      
      const deletedRoomIds = rooms.filter(r => r.item_id === itemId).map(r => r.id);
      if (deletedRoomIds.length > 0) {
        const messagesStr = localStorage.getItem(this.chatMessagesKey) || '[]';
        const messages: ChatMessage[] = JSON.parse(messagesStr);
        const filteredMessages = messages.filter(m => !deletedRoomIds.includes(m.room_id));
        localStorage.setItem(this.chatMessagesKey, JSON.stringify(filteredMessages));
      }
      return true;
    }
    return false;
  }

  async deleteChatRoom(roomId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);
      if (error) {
        console.error("Error deleting chat room in Supabase:", error);
        return false;
      }
      return true;
    }

    // Local fallback
    if (typeof window === 'undefined') return false;
    const roomsStr = localStorage.getItem(this.chatRoomsKey) || '[]';
    const rooms: ChatRoom[] = JSON.parse(roomsStr);
    const filteredRooms = rooms.filter(r => r.id !== roomId);
    localStorage.setItem(this.chatRoomsKey, JSON.stringify(filteredRooms));

    const messagesStr = localStorage.getItem(this.chatMessagesKey) || '[]';
    const messages: ChatMessage[] = JSON.parse(messagesStr);
    const filteredMessages = messages.filter(m => m.room_id !== roomId);
    localStorage.setItem(this.chatMessagesKey, JSON.stringify(filteredMessages));

    return true;
  }

  // Chat Rooms and Messages
  async getChatRooms(userId: string): Promise<ChatRoom[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error || !rooms) {
        console.error("Error fetching chat rooms from Supabase:", error);
        return [];
      }

      // Fetch related items and opponent profiles in a batch to avoid database join complexities
      const itemIds = Array.from(new Set(rooms.map(r => r.item_id)));
      const profileIds = Array.from(new Set(rooms.flatMap(r => [r.buyer_id, r.seller_id])));

      const [itemsRes, profilesRes] = await Promise.all([
        supabase.from('items').select('*').in('id', itemIds),
        supabase.from('profiles').select('*').in('id', profileIds)
      ]);

      const itemsMap = new Map((itemsRes.data || []).map(i => [i.id, i]));
      const profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p]));

      return rooms.map(room => {
        const item = itemsMap.get(room.item_id);
        const opponentId = room.buyer_id === userId ? room.seller_id : room.buyer_id;
        let opponent = profilesMap.get(opponentId);
        
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

    // Local fallback
    if (typeof window === 'undefined') return [];
    const rooms: ChatRoom[] = JSON.parse(localStorage.getItem(this.chatRoomsKey) || '[]');
    const items = await this.getItems();
    const profiles = this.getProfilesSync();

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

  async createChatRoom(itemId: string, buyerId: string, sellerId: string): Promise<ChatRoom> {
    if (isSupabaseConfigured && supabase) {
      // Ensure buyer and seller profiles exist in Supabase to avoid foreign key violations!
      const profilesList = this.getProfilesSync();
      const buyer = profilesList.find(p => p.id === buyerId) || this.getActiveUser();
      if (buyer) {
        await supabase.from('profiles').upsert(buyer);
      }
      const seller = profilesList.find(p => p.id === sellerId) || {
        id: sellerId,
        email: 'seller@daegu.ac.kr',
        nickname: '상대방 대학생',
        university: '대구대학교',
        is_verified: true,
        created_at: new Date().toISOString()
      };
      await supabase.from('profiles').upsert(seller);

      // Check if room already exists
      const { data: existing, error: findError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('item_id', itemId)
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId);
      
      if (!findError && existing && existing.length > 0) {
        return existing[0] as ChatRoom;
      }

      const newRoom: ChatRoom = {
        id: 'room-' + Math.random().toString(36).substr(2, 9),
        item_id: itemId,
        buyer_id: buyerId,
        seller_id: sellerId,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('chat_rooms')
        .insert(newRoom);

      if (insertError) {
        console.error("Error creating chat room in Supabase:", insertError);
      } else {
        // Insert introductory safety messages
        const lang = (typeof window !== 'undefined' ? localStorage.getItem('language') : 'ko') || 'ko';
        const welcomeMsg = this.getWelcomeMessage(lang);

        await supabase.from('chat_messages').insert({
          id: 'msg-' + Math.random().toString(36).substr(2, 9),
          room_id: newRoom.id,
          sender_id: 'system',
          message: welcomeMsg,
          is_read: false,
          is_system: true,
          created_at: new Date().toISOString()
        });

        return newRoom;
      }
    }

    // Local Database logic
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
    
    const lang = (typeof window !== 'undefined' ? localStorage.getItem('language') : 'ko') || 'ko';
    const welcomeMsg = this.getWelcomeMessage(lang);

    await this.sendChatMessage(
      newRoom.id,
      'system',
      welcomeMsg,
      true
    );

    return newRoom;
  }

  private getWelcomeMessage(lang: string): string {
    if (lang === 'en') {
      return '🤝 [Guide] 1:1 Safe Chat Room has been activated.\n' +
        '• Communicate safely without exposing personal contact details.\n' +
        '• We recommend meeting in public campus areas during daylight hours (e.g., Student Center Lobby, Library Entrance).\n' +
        '• To prevent misunderstandings, please disclose any damage present when the item was found.';
    } else if (lang === 'vi') {
      return '🤝 [Hướng dẫn] Kênh trò chuyện an toàn 1:1 đã kích hoạt.\n' +
        '• Liên lạc an toàn không cần lộ số điện thoại cá nhân.\n' +
        '• Khuyến khích gặp nhau ban ngày tại nơi công cộng trong khuôn viên trường (VD: Sảnh hội sinh viên, sảnh thư viện).\n' +
        '• Vui lòng báo trước nếu đồ vật có vết trầy xước từ lúc nhặt được để tránh hiểu lầm.';
    }
    return '🤝 [안내] 1:1 안전 대화방이 활성화되었습니다.\n' +
      '• 개인 연락처 노출 없이 안전하게 소통하실 수 있습니다.\n' +
      '• 대면 만남 시 가급적 낮 시간대에 유동인구가 많은 교내 공개적인 장소(예: 학생회관 로비, 중앙도서관 입구 등)를 권장합니다.\n' +
      '• 혹시 모를 오해 방지를 위해 습득 당시에 훼손된 흔적이 있다면 미리 상대방에게 알리고 전달해 주시기 바랍니다.';
  }

  async updateChatRoomMeetup(roomId: string, lat: number, lng: number, place: string): Promise<ChatRoom | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('chat_rooms')
        .update({ meetup_lat: lat, meetup_lng: lng, meetup_place: place })
        .eq('id', roomId)
        .select()
        .single();
      if (error) {
        console.error("Error updating meetup point in Supabase:", error);
      } else if (data) {
        return data as ChatRoom;
      }
    }

    const roomsStr = localStorage.getItem(this.chatRoomsKey) || '[]';
    const rooms: ChatRoom[] = JSON.parse(roomsStr);
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

  async getChatMessages(roomId: string): Promise<ChatMessage[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (error) {
        console.error("Error fetching messages from Supabase:", error);
        return [];
      }
      return data || [];
    }

    if (typeof window === 'undefined') return [];
    const messagesStr = localStorage.getItem(this.chatMessagesKey) || '[]';
    const messages: ChatMessage[] = JSON.parse(messagesStr);
    return messages
      .filter(m => m.room_id === roomId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async sendChatMessage(roomId: string, senderId: string, text: string, isSystem = false): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      room_id: roomId,
      sender_id: senderId,
      message: text,
      is_read: false,
      created_at: new Date().toISOString(),
      is_system: isSystem
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('chat_messages')
        .insert(newMessage);
      if (error) {
        console.error("Error sending message to Supabase:", error);
      } else {
        return newMessage;
      }
    }

    const messagesStr = localStorage.getItem(this.chatMessagesKey) || '[]';
    const messages: ChatMessage[] = JSON.parse(messagesStr);
    messages.push(newMessage);
    localStorage.setItem(this.chatMessagesKey, JSON.stringify(messages));
    return newMessage;
  }

  // Notifications Storage & Retrievals
  async getNotifications(userId: string): Promise<Notification[]> {
    if (typeof window === 'undefined') return [];
    const notifsStr = localStorage.getItem(this.notificationsKey) || '[]';
    const notifs: Notification[] = JSON.parse(notifsStr);
    return notifs
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async saveNotification(notif: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const newNotif: Notification = {
      ...notif,
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    if (typeof window !== 'undefined') {
      const notifsStr = localStorage.getItem(this.notificationsKey) || '[]';
      const notifs: Notification[] = JSON.parse(notifsStr);
      notifs.unshift(newNotif);
      localStorage.setItem(this.notificationsKey, JSON.stringify(notifs));
      
      // Dispatch custom real-time window event for page live listeners
      window.dispatchEvent(new CustomEvent('safe_campus_new_notification', { detail: newNotif }));
    }
    return newNotif;
  }

  async markNotificationAsRead(notifId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const notifsStr = localStorage.getItem(this.notificationsKey) || '[]';
    const notifs: Notification[] = JSON.parse(notifsStr);
    const index = notifs.findIndex(n => n.id === notifId);
    if (index !== -1) {
      notifs[index].is_read = true;
      localStorage.setItem(this.notificationsKey, JSON.stringify(notifs));
    }
  }

  async clearNotifications(userId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const notifsStr = localStorage.getItem(this.notificationsKey) || '[]';
    const notifs: Notification[] = JSON.parse(notifsStr);
    const filtered = notifs.filter(n => n.user_id !== userId);
    localStorage.setItem(this.notificationsKey, JSON.stringify(filtered));
  }

  // Similar item smart matcher engine
  async checkAndGenerateMatches(newItem: Item): Promise<void> {
    try {
      const allItems = await this.getItems();
      
      const wordsOf = (text: string) => {
        return text.toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
          .split(/\s+/)
          .filter(word => word.length >= 2);
      };

      const newWords = wordsOf(newItem.title);
      if (newWords.length === 0) return;

      for (const otherItem of allItems) {
        if (otherItem.id === newItem.id) continue;
        if (otherItem.status === 'resolved') continue;
        if (otherItem.type === newItem.type) continue; // Opposite types only
        if (otherItem.category !== newItem.category) continue; // Same category only
        if (otherItem.user_id === newItem.user_id) continue; // Different owners

        const otherWords = wordsOf(otherItem.title);
        // Check if there is a common keyword (e.g. "버즈", "아이폰", "지갑")
        const hasKeywordOverlap = newWords.some(w => otherWords.includes(w));
        
        if (hasKeywordOverlap) {
          if (newItem.type === 'lost') {
            // New item is lost -> matching is an existing found item -> notify owner of lost (active user)
            await this.saveNotification({
              user_id: newItem.user_id,
              type: 'match',
              title: '유사 물품 매칭 알림',
              message: `등록하신 분실물 '${newItem.title}'과(와) 유사한 습득물 '${otherItem.title}'이(가) 등록되어 있습니다. 확인해 보세요!`,
              item_id: otherItem.id,
              is_read: false
            });
          } else {
            // New item is found -> matching is an existing lost item -> notify owner of the lost item
            await this.saveNotification({
              user_id: otherItem.user_id,
              type: 'match',
              title: '유사 물품 매칭 알림',
              message: `등록하신 분실물 '${otherItem.title}'과(와) 유사한 습득물 '${newItem.title}'이(가) 방금 등록되었습니다!`,
              item_id: newItem.id,
              is_read: false
            });
          }
        }
      }
    } catch (err) {
      console.error("Error in checkAndGenerateMatches:", err);
    }
  }
}

export const db = new SimulatedDatabase();
