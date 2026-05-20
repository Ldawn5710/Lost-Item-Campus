export type ItemType = 'lost' | 'found';
export type ItemStatus = 'searching' | 'kept' | 'matching' | 'resolved';

export interface Profile {
  id: string;
  email: string;
  nickname: string;
  university: string;
  is_verified: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  type: ItemType;
  title: string;
  category: string;
  description: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  location_detail: string;
  status: ItemStatus;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRoom {
  id: string;
  item_id: string;
  buyer_id: string;   // Person who initiated chat (normally the Lost item owner or interested party)
  seller_id: string;  // Person who registered the item (normally Found item owner)
  created_at: string;
  item?: Item;
  opponent?: Profile;
  meetup_lat?: number; // Optional meetup point
  meetup_lng?: number; // Optional meetup point
  meetup_place?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  is_system?: boolean; // System safety messages, route activations, etc.
}
