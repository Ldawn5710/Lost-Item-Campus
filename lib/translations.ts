export type Language = 'ko' | 'en' | 'vi';

export const translations: Record<Language, Record<string, string>> = {
  ko: {
    // Meta / Common
    'app.title': '안심 캠퍼스 맵 - 실시간 대학 유실물 매칭 & 안전 동선 안내 서비스',
    'app.name': '안심 캠퍼스 맵',
    'common.logout': '로그아웃',
    'common.hi': '{nickname} 님',
    'common.back': '← 돌아가기',
    'common.all': '전체',
    'common.cancel': '취소',
    'chat.leave': '채팅방 나가기',
    'chat.leave_confirm': '정말 이 채팅방을 나가시겠습니까? 대화 내용이 모두 삭제됩니다.',
    
    // AuthModal
    'auth.role_title': '사용자 유형 선택',
    'auth.role_subtitle': '서비스 이용을 위해 회원 유형을 선택해 주세요.',
    'auth.role_student': '교내 구성원 (학생/교직원)',
    'auth.role_student_desc': '학교 이메일(.ac.kr / .edu) 인증을 통해 모든 기능을 제한 없이 이용할 수 있습니다.',
    'auth.role_guest': '일반 방문자 / 외부인',
    'auth.role_guest_desc': '일반 이메일로 가입하며, 물품 등록 제한(24시간 내 최대 2개) 및 채팅 시 안전 주의 경고가 표시됩니다.',
    'auth.email_guest_placeholder': '이메일 주소 또는 전화번호 입력',
    'auth.email_guest_helper': '* 일반 이메일(Gmail, Naver 등) 또는 휴대전화 번호를 입력해 주세요.',
    'auth.title': '안심 캠퍼스 가입',
    'auth.subtitle': '대학 구성원 전용 유실물 매칭 & 도보 안내 서비스',
    'auth.nickname': '닉네임',
    'auth.nickname_placeholder': '예: 길잃은아기사자',
    'auth.email': '학교 이메일',
    'auth.email_placeholder': 'your-email@univ.ac.kr',
    'auth.email_helper': '* .ac.kr 또는 .edu 도메인의 이메일 주소만 지원합니다.',
    'auth.get_otp': '인증번호 받기',
    'auth.sending_otp': '인증 코드 발송 중...',
    'auth.otp_banner': '{email}(으)로 인증번호 6자리가 발송되었습니다.',
    'auth.otp_label': '인증 코드 입력',
    'auth.otp_placeholder': '6자리 코드 입력',
    'auth.btn_back': '이전으로',
    'auth.btn_verify': '인증 완료하기',
    'auth.verifying': '인증 중...',
    'auth.err_nickname': '닉네임을 입력해주세요.',
    'auth.err_email': '대학 메일 주소(*.ac.kr 또는 *.edu)를 입력해 주세요.',
    'auth.err_otp': '인증 번호가 일치하지 않습니다. 다시 확인해주세요.',
    'auth.dev_alert': '[개발 테스트용] 인증 메일이 발송되었습니다.\n인증 코드: {code}',
    
    // Fallback univ
    'univ.fallback': '캠퍼스 통합맵',
    'univ.snu': '서울대학교',
    'univ.daegu': '대구대학교',
    'univ.kaist': '카이스트 (KAIST)',
    'univ.korea': '고려대학교',
    'univ.yonsei': '연세대학교',

    // Map Prompt
    'map.meetup_prompt': '지도를 탭하여 약속 장소(위치)를 지정하세요...',
    'map.gps_tooltip': '내 위치로 이동',
    'map.loading': '카카오 지도 서비스 동기화 중...',
    'map.address_unspecified': '캠퍼스 내 미지정 구역',
    'map.address_daegu_center': '대구대학교 성산홀 본관 앞 광장',
    'map.address_daegu_eng': '대구대학교 웅지관 앞 학생 광장',
    'map.address_fallback': '캠퍼스 내 도보 구역',
    'map.address_default': '캠퍼스 내 지정 구역',

    // BottomSheet - Tabs
    'tabs.explore': '지도로 탐색',
    'tabs.register': '분실물/습득물 등록',
    'tabs.chats': '내 대화방 ({count})',
    'tabs.dashboard': '안심 캠퍼스 대시보드',

    // BottomSheet - Explore
    'explore.search_placeholder': '분실물 품목명, 장소 검색...',
    'explore.pill_all': '전체',
    'explore.pill_lost': '🔴 분실물',
    'explore.pill_found': '🔵 습득물',
    'explore.badge_lost': '분실',
    'explore.badge_found': '습득',
    'explore.no_items': '해당하는 유실물이 없습니다.',

    // BottomSheet - Details
    'details.lost_badge': '분실물',
    'details.found_badge': '습득물',
    'details.section_label': '상세 정보',
    'details.chat_btn': '실시간 1:1 대화로 물건 찾기',
    'details.safebox_notice': '* 본 보관소는 학교 소속 부서입니다. 상세 위치를 방문하시어 본인 인증 후 수령 가능합니다.',
    'details.mypost_notice': '✓ 회원님이 등록하신 게시글입니다.',
    'details.delete_btn': '게시글 삭제하기',
    'details.delete_confirm': '정말 이 게시글을 삭제하시겠습니까?',
    'details.matching_recommend': '[매칭 추천] 유사한 습득물이 발견되었습니다!',
    'details.matching_view': '해당 습득물 확인하기',

    // BottomSheet - Registration Wizard
    'reg.step1_title': '1단계: 분실/습득 발생 위치 지정',
    'reg.step1_guide': '지도를 마우스로 클릭하거나 드래그하여 정확한 발생 포인트를 핀으로 지정해 주세요.',
    'reg.selected_address': '선택된 주소',
    'reg.tap_map_helper': '지도를 터치하여 지정하세요',
    'reg.next_btn': '상세 정보 입력하기',
    'reg.err_coords': '지도를 터치하여 분실/습득 발생 위치를 먼저 지정해주세요.',
    'reg.radio_lost': '🔴 내가 분실한 물건',
    'reg.radio_found': '🔵 습득한 물건',
    'reg.title_label': '물건명',
    'reg.title_placeholder': '예: 에어팟 프로 2세대 본체',
    'reg.category_label': '카테고리',
    'reg.time_label': '발생 시간',
    'reg.detail_loc_label': '상세 보관/분실 위치',
    'reg.detail_loc_placeholder': '예: 제2공학관 301동 4층 소파 위',
    'reg.desc_label': '특이사항 및 설명',
    'reg.desc_placeholder': '물건의 생김새, 브랜드, 특징, 보관 여부를 적어주세요.',
    'reg.reset_coords': '위치 재설정',
    'reg.submit_btn': '등록 완료하기',
    'reg.err_title': '물건명을 입력해 주세요.',
    'reg.image_label': '사진 첨부 (실시간 촬영 / 파일 선택)',
    'reg.camera_start': '📸 실시간 카메라 촬영',
    'reg.camera_stop': '✕ 카메라 종료',
    'reg.camera_snap': '● 사진 촬영하기',
    'reg.camera_err': '실시간 카메라를 시작할 수 없습니다. 파일 선택을 이용해 주세요.',
    'reg.image_preview': '사진 미리보기',

    // BottomSheet - Chats
    'chats.empty': '활성화된 대화방이 없습니다.',
    'chats.with_user': '{nickname} 님과의 대화',
    'chats.item_linked': '연동 물건: {title}',
    
    // ChatPanel
    'chat.meetup_btn': '약속 장소 지정',
    'chat.safety_alert': '상호 예의를 지켜주세요. 대면 전달 시 가급적 학교 내 유동 인구가 많은 장소(예: 중앙도서관 로비, 학생회관 앞 등)를 적극 권장합니다.',
    'chat.input_placeholder': '메시지를 입력하세요...',
    'chat.start_nav': '동선 안내 시작',
    
    // RouteNavigator
    'nav.title': '실시간 안전 도보 네비게이션',
    'nav.eta_label': '예상 시간',
    'nav.eta_val': '{eta}분',
    'nav.dist_label': '남은 거리',
    'nav.dist_val': '{distance}m',
    'nav.destination': '📍 목적지: {address}',
    'nav.advisory': '가로등이 켜진 교내 주요 안전 보행로 위주로 동선이 매핑되었습니다.',
    'nav.simulate_btn': '🏃 이동 시뮬레이션',
    'nav.receipt_btn': '수령 완료',
    
    // RouteNavigator - Arrival Modal
    'nav.modal_title': '목적지 인근 도달 완료!',
    'nav.modal_subtitle': '약속 장소 15m 이내 지역에 안전하게 진입하였습니다.',
    'nav.modal_body': '물건을 상대방에게서 무사히 건네받으셨거나 보관함에서 수령하셨나요?',
    'nav.modal_help': '[수령 완료]를 누르면 게시글 상태가 해결(Resolved)로 처리되어 지도에서 보관 상태가 자동으로 아카이빙 처리됩니다.',
    'nav.modal_close': '닫기',
    'nav.modal_confirm': '수령 완료 처리하기',

    // Categories
    'category.electronics': '전자기기',
    'category.wallet': '지갑/카드',
    'category.bag': '가방',
    'category.clothing': '의류',
    'category.cosmetics': '화장품',
    'category.others': '기타',

    // System Messages in Chat
    'sys.welcome': '🤝 [안내] 1:1 안전 대화방이 활성화되었습니다.\n' +
      '• 개인 연락처 노출 없이 안전하게 소통하실 수 있습니다.\n' +
      '• 대면 만남 시 가급적 낮 시간대에 유동인구가 많은 교내 공개적인 장소(예: 학생회관 로비, 중앙도서관 입구 등)를 권장합니다.\n' +
      '• 혹시 모를 오해 방지를 위해 습득 당시에 훼손된 흔적이 있다면 미리 상대방에게 알리고 전달해 주시기 바랍니다.',
    'sys.meetup_set': '📍 만남의 장소가 지정되었습니다:\n"{meetupAddress}"\n아래 [동선 안내 시작] 버튼을 눌러 도보 길찾기를 진행하세요.',
    'sys.completed': '🎉 [완료] 물건이 성공적으로 전달 및 수령 완료되었습니다!\n이용해 주셔서 대단히 감사합니다. 본 유실물 핀이 아카이빙 처리되었습니다.',

    // Simulated Replies
    'reply.1': '안녕하세요! 물건 주워주셔서 정말 감사합니다 ㅠㅠ',
    'reply.2': '혹시 지금 어디서 만날 수 있을까요? 제가 거기로 가겠습니다.',
    'reply.3': '감사합니다! 학생회관 쪽에서 만나면 좋을 것 같아요.',
    'reply.4': '도착하시면 말씀 부탁드려요!',
    'reply.5': '우와 정말 다행이네요! 안전하게 만나서 받겠습니다.',
  },
  en: {
    // Meta / Common
    'app.title': 'Safe Campus Map - Real-time College Lost & Found & Safe Walking Guide',
    'app.name': 'Safe Campus Map',
    'common.logout': 'Logout',
    'common.hi': 'Hi, {nickname}',
    'common.back': '← Back',
    'common.all': 'All',
    'common.cancel': 'Cancel',
    'chat.leave': 'Leave Chat',
    'chat.leave_confirm': 'Are you sure you want to leave this chat? All message history will be deleted.',

    // AuthModal
    'auth.title': 'Join Safe Campus',
    'auth.subtitle': 'Exclusively for college students - Lost & Found matching & walking navigation',
    'auth.nickname': 'Nickname',
    'auth.nickname_placeholder': 'e.g., LostBabyLion',
    'auth.email': 'School Email',
    'auth.email_placeholder': 'your-email@univ.ac.kr',
    'auth.email_helper': '* Only emails ending with .ac.kr or .edu are supported.',
    'auth.get_otp': 'Get Verification Code',
    'auth.sending_otp': 'Sending code...',
    'auth.otp_banner': 'A 6-digit verification code has been sent to {email}.',
    'auth.otp_label': 'Enter Verification Code',
    'auth.otp_placeholder': 'Enter 6-digit code',
    'auth.btn_back': 'Back',
    'auth.btn_verify': 'Verify & Join',
    'auth.verifying': 'Verifying...',
    'auth.err_nickname': 'Please enter a nickname.',
    'auth.err_email': 'Please enter a valid university email (*.ac.kr or *.edu).',
    'auth.err_otp': 'Verification code does not match. Please try again.',
    'auth.dev_alert': '[Dev Test] Verification email sent.\nCode: {code}',

    // Fallback univ
    'univ.fallback': 'Integrated Campus Map',
    'univ.snu': 'Seoul National University',
    'univ.daegu': 'Daegu University',
    'univ.kaist': 'KAIST',
    'univ.korea': 'Korea University',
    'univ.yonsei': 'Yonsei University',

    // Map Prompt
    'map.meetup_prompt': 'Tap on the map to choose a meetup location...',
    'map.gps_tooltip': 'Move to my location',
    'map.loading': 'Syncing Kakao Map...',
    'map.address_unspecified': 'Unspecified area on campus',
    'map.address_daegu_center': 'Daegu Univ Seongsan Hall Square',
    'map.address_daegu_eng': 'Daegu Univ Woongji Hall Plaza',
    'map.address_fallback': 'Walking path on campus',
    'map.address_default': 'Designated area on campus',

    // BottomSheet - Tabs
    'tabs.explore': 'Explore Map',
    'tabs.register': 'Report Lost/Found',
    'tabs.chats': 'My Chats ({count})',
    'tabs.dashboard': 'Safe Campus Dashboard',

    // BottomSheet - Explore
    'explore.search_placeholder': 'Search item name, location...',
    'explore.pill_all': 'All',
    'explore.pill_lost': '🔴 Lost',
    'explore.pill_found': '🔵 Found',
    'explore.badge_lost': 'Lost',
    'explore.badge_found': 'Found',
    'explore.no_items': 'No matching lost/found items found.',

    // BottomSheet - Details
    'details.lost_badge': 'Lost',
    'details.found_badge': 'Found',
    'details.section_label': 'Description',
    'details.chat_btn': 'Start 1:1 Chat to Find Item',
    'details.safebox_notice': '* This storage box is an official university facility. Please visit in person with verification to claim.',
    'details.mypost_notice': '✓ This is your post.',
    'details.delete_btn': 'Delete Post',
    'details.delete_confirm': 'Are you sure you want to delete this post?',
    'details.matching_recommend': '[Matching Recommendation] A similar item was found!',
    'details.matching_view': 'Check similar item',

    // BottomSheet - Registration Wizard
    'reg.step1_title': 'Step 1: Mark location on map',
    'reg.step1_guide': 'Click or drag the map to place a pin at the location where the item was lost or found.',
    'reg.selected_address': 'Selected Address',
    'reg.tap_map_helper': 'Tap on map to designate location',
    'reg.next_btn': 'Enter Details',
    'reg.err_coords': 'Please tap the map to designate the location first.',
    'reg.radio_lost': '🔴 Something I lost',
    'reg.radio_found': '🔵 Something I found',
    'reg.title_label': 'Item Name',
    'reg.title_placeholder': 'e.g., AirPods Pro 2 case',
    'reg.category_label': 'Category',
    'reg.time_label': 'Time Occurred',
    'reg.detail_loc_label': 'Detailed Location',
    'reg.detail_loc_placeholder': 'e.g., 4th floor sofa in Engineering Bldg 301',
    'reg.desc_label': 'Description & Special Notes',
    'reg.desc_placeholder': 'Describe the appearance, brand, special features, or storage location.',
    'reg.reset_coords': 'Reset Location',
    'reg.submit_btn': 'Complete Registration',
    'reg.err_title': 'Please enter the item name.',
    'reg.image_label': 'Attach Photo (Take Live / Choose File)',
    'reg.camera_start': '📸 Take Live Photo',
    'reg.camera_stop': '✕ Turn Off Camera',
    'reg.camera_snap': '● Capture Photo',
    'reg.camera_err': 'Could not start live camera. Please use file upload instead.',
    'reg.image_preview': 'Photo Preview',

    // BottomSheet - Chats
    'chats.empty': 'No active chat rooms.',
    'chats.with_user': 'Chat with {nickname}',
    'chats.item_linked': 'Item: {title}',

    // ChatPanel
    'chat.meetup_btn': 'Set Meetup',
    'chat.safety_alert': 'Please remain respectful. For face-to-face handovers, we highly recommend public campus locations with high foot traffic (e.g., Student Center Lobby, in front of the Central Library).',
    'chat.input_placeholder': 'Type a message...',
    'chat.start_nav': 'Start Navigation',

    // RouteNavigator
    'nav.title': 'Real-time Safe Walk Navigation',
    'nav.eta_label': 'Est. Time',
    'nav.eta_val': '{eta} min',
    'nav.dist_label': 'Distance Left',
    'nav.dist_val': '{distance}m',
    'nav.destination': '📍 Destination: {address}',
    'nav.advisory': 'Route mapped along well-lit campus paths with streetlights for your safety.',
    'nav.simulate_btn': '🏃 Simulate Steps',
    'nav.receipt_btn': 'Received',

    // RouteNavigator - Arrival Modal
    'nav.modal_title': 'Arrived Near Destination!',
    'nav.modal_subtitle': 'You have safely entered within 15 meters of the meetup point.',
    'nav.modal_body': 'Did you successfully retrieve/receive the item from the other party?',
    'nav.modal_help': 'Clicking [Confirm Receipt] marks the item status as Resolved and archives it from the map.',
    'nav.modal_close': 'Close',
    'nav.modal_confirm': 'Confirm Receipt',

    // Categories
    'category.electronics': 'Electronics',
    'category.wallet': 'Wallet/Card',
    'category.bag': 'Bag',
    'category.clothing': 'Clothing',
    'category.cosmetics': 'Cosmetics',
    'category.others': 'Others',

    // System Messages in Chat
    'sys.welcome': '🤝 [Guide] 1:1 Safe Chat Room has been activated.\n' +
      '• Communicate safely without exposing personal contact details.\n' +
      '• We recommend meeting in public campus areas during daylight hours (e.g., Student Center Lobby, Library Entrance).\n' +
      '• To prevent misunderstandings, please disclose any damage present when the item was found.',
    'sys.meetup_set': '📍 Meetup location set:\n"{meetupAddress}"\nPress the [Start Navigation] button below to get walking directions.',
    'sys.completed': '🎉 [Completed] The item has been successfully returned and received!\nThank you very much. This lost & found pin has been archived.',

    // Simulated Replies
    'reply.1': 'Hello! Thank you so much for finding my item T_T',
    'reply.2': 'Where can we meet? I can go there.',
    'reply.3': 'Thank you! It would be great to meet near the Student Center.',
    'reply.4': 'Please let me know when you arrive!',
    'reply.5': 'Wow, that is such a relief! I will meet you safely.',
  },
  vi: {
    // Meta / Common
    'app.title': 'Bản đồ Campus An tâm - Tìm đồ thất lạc đại học & Chỉ đường đi bộ an toàn',
    'app.name': 'Bản đồ Campus An tâm',
    'common.logout': 'Đăng xuất',
    'common.hi': 'Chào {nickname}',
    'common.back': '← Quay lại',
    'common.all': 'Tất cả',
    'common.cancel': 'Hủy',
    'chat.leave': 'Rời khỏi trò chuyện',
    'chat.leave_confirm': 'Bạn có chắc muốn rời khỏi cuộc trò chuyện? Lịch sử tin nhắn sẽ bị xóa.',

    // AuthModal
    'auth.title': 'Đăng ký Safe Campus',
    'auth.subtitle': 'Dịch vụ đối chiếu đồ thất lạc & chỉ đường đi bộ dành riêng cho sinh viên',
    'auth.nickname': 'Biệt danh',
    'auth.nickname_placeholder': 'VD: SuTuConLac',
    'auth.email': 'Email trường',
    'auth.email_placeholder': 'your-email@univ.ac.kr',
    'auth.email_helper': '* Chỉ hỗ trợ email có đuôi .ac.kr hoặc .edu.',
    'auth.get_otp': 'Nhận mã xác nhận',
    'auth.sending_otp': 'Đang gửi mã...',
    'auth.otp_banner': 'Mã xác nhận 6 chữ số đã được gửi đến {email}.',
    'auth.otp_label': 'Nhập mã xác nhận',
    'auth.otp_placeholder': 'Nhập mã 6 chữ số',
    'auth.btn_back': 'Quay lại',
    'auth.btn_verify': 'Xác nhận & Tham gia',
    'auth.verifying': 'Đang xác nhận...',
    'auth.err_nickname': 'Vui lòng nhập biệt danh.',
    'auth.err_email': 'Vui lòng nhập email trường hợp lệ (*.ac.kr hoặc *.edu).',
    'auth.err_otp': 'Mã xác nhận không khớp. Vui lòng thử lại.',
    'auth.dev_alert': '[Thử nghiệm] Email xác nhận đã gửi.\nMã: {code}',

    // Fallback univ
    'univ.fallback': 'Bản đồ Campus Liên kết',
    'univ.snu': 'Đại học Quốc gia Seoul',
    'univ.daegu': 'Đại học Daegu',
    'univ.kaist': 'KAIST',
    'univ.korea': 'Đại học Korea',
    'univ.yonsei': 'Đại học Yonsei',

    // Map Prompt
    'map.meetup_prompt': 'Chạm vào bản đồ để chọn địa điểm hẹn...',
    'map.gps_tooltip': 'Di chuyển đến vị trí của tôi',
    'map.loading': 'Đang đồng bộ bản đồ Kakao...',
    'map.address_unspecified': 'Khu vực chưa xác định trong campus',
    'map.address_daegu_center': 'Quảng trường Tòa nhà Seongsan Đại học Daegu',
    'map.address_daegu_eng': 'Quảng trường Tòa nhà Woongji Đại học Daegu',
    'map.address_fallback': 'Lối đi bộ trong campus',
    'map.address_default': 'Khu vực đã chọn trong campus',

    // BottomSheet - Tabs
    'tabs.explore': 'Khám phá Bản đồ',
    'tabs.register': 'Đăng ký Đồ mất/Đồ nhặt',
    'tabs.chats': 'Hộp thoại ({count})',
    'tabs.dashboard': 'Bảng điều khiển',

    // BottomSheet - Explore
    'explore.search_placeholder': 'Tìm tên đồ vật, địa điểm...',
    'explore.pill_all': 'Tất cả',
    'explore.pill_lost': '🔴 Đồ mất',
    'explore.pill_found': '🔵 Đồ nhặt được',
    'explore.badge_lost': 'Thất lạc',
    'explore.badge_found': 'Nhặt được',
    'explore.no_items': 'Không tìm thấy đồ thất lạc phù hợp.',

    // BottomSheet - Details
    'details.lost_badge': 'Đồ mất',
    'details.found_badge': 'Nhặt được',
    'details.section_label': 'Mô tả chi tiết',
    'details.chat_btn': 'Trò chuyện 1:1 để nhận lại đồ',
    'details.safebox_notice': '* Tủ bảo quản này là cơ sở chính thức của trường. Vui lòng mang giấy tờ xác minh đến nhận trực tiếp.',
    'details.mypost_notice': '✓ Đây là bài đăng của bạn.',
    'details.delete_btn': 'Xóa bài viết',
    'details.delete_confirm': 'Bạn có chắc chắn muốn xóa bài viết này?',
    'details.matching_recommend': '[Gợi ý đối chiếu] Tìm thấy một đồ vật tương tự!',
    'details.matching_view': 'Xem đồ vật tương tự',

    // BottomSheet - Registration Wizard
    'reg.step1_title': 'Bước 1: Chọn vị trí trên bản đồ',
    'reg.step1_guide': 'Nhấp hoặc kéo trên bản đồ để ghim vị trí nơi đồ vật bị mất hoặc được nhặt.',
    'reg.selected_address': 'Địa chỉ đã chọn',
    'reg.tap_map_helper': 'Chạm vào bản đồ để chỉ định vị trí',
    'reg.next_btn': 'Nhập thông tin chi tiết',
    'reg.err_coords': 'Vui lòng chạm vào bản đồ để chỉ định vị trí trước.',
    'reg.radio_lost': '🔴 Đồ tôi làm mất',
    'reg.radio_found': '🔵 Đồ tôi nhặt được',
    'reg.title_label': 'Tên đồ vật',
    'reg.title_placeholder': 'VD: Hộp sạc AirPods Pro 2',
    'reg.category_label': 'Danh mục',
    'reg.time_label': 'Thời gian xảy ra',
    'reg.detail_loc_label': 'Vị trí chi tiết',
    'reg.detail_loc_placeholder': 'VD: Trên sofa tầng 4 tòa nhà Kỹ thuật 301',
    'reg.desc_label': 'Đặc điểm & Mô tả thêm',
    'reg.desc_placeholder': 'Mô tả hình dáng, nhãn hiệu, đặc điểm nổi bật hoặc nơi đang cất giữ.',
    'reg.reset_coords': 'Đặt lại vị trí',
    'reg.submit_btn': 'Hoàn tất đăng ký',
    'reg.err_title': 'Vui lòng nhập tên đồ vật.',
    'reg.image_label': 'Đính kèm ảnh (Chụp trực tiếp / Chọn tệp)',
    'reg.camera_start': '📸 Chụp ảnh trực tiếp',
    'reg.camera_stop': '✕ Tắt camera',
    'reg.camera_snap': '● Chụp ảnh',
    'reg.camera_err': 'Không thể khởi động camera. Vui lòng chọn ảnh từ thiết bị.',
    'reg.image_preview': 'Xem trước ảnh',

    // BottomSheet - Chats
    'chats.empty': 'Không có cuộc trò chuyện nào đang hoạt động.',
    'chats.with_user': 'Trò chuyện với {nickname}',
    'chats.item_linked': 'Đồ vật liên kết: {title}',

    // ChatPanel
    'chat.meetup_btn': 'Đặt điểm hẹn',
    'chat.safety_alert': 'Vui lòng lịch sự tôn trọng nhau. Khi gặp mặt trực tiếp, chúng tôi khuyên bạn nên chọn những địa điểm công cộng đông người qua lại trong trường (VD: Sảnh Nhà văn hóa sinh viên, trước Thư viện trung tâm).',
    'chat.input_placeholder': 'Nhập tin nhắn...',
    'chat.start_nav': 'Bắt đầu hướng dẫn',

    // RouteNavigator
    'nav.title': 'Chỉ đường đi bộ an toàn thời gian thực',
    'nav.eta_label': 'Thời gian ước tính',
    'nav.eta_val': '{eta} phút',
    'nav.dist_label': 'Khoảng cách còn',
    'nav.dist_val': '{distance}m',
    'nav.destination': '📍 Điểm đến: {address}',
    'nav.advisory': 'Lộ trình được thiết lập dọc theo các lối đi chính có đèn đường để đảm bảo an toàn cho bạn.',
    'nav.simulate_btn': '🏃 Chạy mô phỏng',
    'nav.receipt_btn': 'Đã nhận đồ',

    // RouteNavigator - Arrival Modal
    'nav.modal_title': 'Đã đến gần điểm hẹn!',
    'nav.modal_subtitle': 'Bạn đã đi vào phạm vi 15 mét xung quanh điểm hẹn an toàn.',
    'nav.modal_body': 'Bạn đã nhận lại đồ vật thành công từ đối phương hoặc từ tủ bảo quản chưa?',
    'nav.modal_help': 'Nhấn [Xác nhận đã nhận đồ] sẽ chuyển trạng thái bài viết thành Hoàn thành và lưu trữ nó trên bản đồ.',
    'nav.modal_close': 'Đóng',
    'nav.modal_confirm': 'Xác nhận đã nhận đồ',

    // Categories
    'category.electronics': 'Thiết bị điện tử',
    'category.wallet': 'Ví/Thẻ',
    'category.bag': 'Túi xách/Ba lô',
    'category.clothing': 'Quần áo',
    'category.cosmetics': 'Mỹ phẩm',
    'category.others': 'Khác',

    // System Messages in Chat
    'sys.welcome': '🤝 [Hướng dẫn] Kênh trò chuyện an toàn 1:1 đã kích hoạt.\n' +
      '• Liên lạc an toàn không cần lộ số điện thoại cá nhân.\n' +
      '• Khuyến khích gặp nhau ban ngày tại nơi công cộng trong khuôn viên trường (VD: Sảnh hội sinh viên, sảnh thư viện).\n' +
      '• Vui lòng báo trước nếu đồ vật có vết trầy xước từ lúc nhặt được để tránh hiểu lầm.',
    'sys.meetup_set': '📍 Đã chọn địa điểm hẹn:\n"{meetupAddress}"\nNhấn nút [Bắt đầu hướng dẫn] bên dưới để tìm đường đi bộ.',
    'sys.completed': '🎉 [Hoàn thành] Đồ vật đã được bàn giao và nhận lại thành công!\nCảm ơn bạn rất nhiều. Ghim đồ thất lạc này đã được lưu trữ.',

    // Simulated Replies
    'reply.1': 'Xin chào! Cảm ơn bạn rất nhiều vì đã nhặt được đồ giúp mình T_T',
    'reply.2': 'Mình có thể gặp nhau ở đâu được ạ? Mình sẽ đi qua đó.',
    'reply.3': 'Cảm ơn bạn! Gặp nhau ở khu vực sảnh hội sinh viên được không ạ.',
    'reply.4': 'Khi nào đến nơi bạn nhắn mình nhé!',
    'reply.5': 'Trời ơi may quá! Mình sẽ hẹn gặp nhận đồ an toàn.',
  },
};
