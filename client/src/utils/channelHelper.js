/**
 * utils/channelHelper.js - Quản lý cấu hình, nhận diện & chuẩn hóa liên kết nhanh theo kênh tiếp nhận
 * Tuân thủ quy định AGENTS.md: Chỉ dùng icon từ lucide-react, không dùng emoji.
 */
import {
  MessageSquare,
  MessageCircle,
  Camera,
  AtSign,
  Phone,
  Store,
  ExternalLink,
  Globe
} from 'lucide-react';

/**
 * Cấu hình hiển thị theo từng kênh (màu sắc, icon Lucide, label)
 */
export function getChannelConfig(channel) {
  const norm = (channel || '').trim().toLowerCase();

  if (norm.includes('zalo')) {
    return {
      key: 'zalo',
      label: 'Zalo',
      color: '#0068ff',
      bg: 'rgba(0, 104, 255, 0.09)',
      border: 'rgba(0, 104, 255, 0.28)',
      icon: MessageSquare
    };
  }

  if (norm.includes('face') || norm.includes('fb') || norm.includes('messenger')) {
    return {
      key: 'facebook',
      label: 'Messenger',
      color: '#0084ff',
      bg: 'rgba(0, 132, 255, 0.09)',
      border: 'rgba(0, 132, 255, 0.28)',
      icon: MessageCircle
    };
  }

  if (norm.includes('insta') || norm.includes('ig')) {
    return {
      key: 'instagram',
      label: 'Instagram',
      color: '#e1306c',
      bg: 'rgba(225, 48, 108, 0.09)',
      border: 'rgba(225, 48, 108, 0.28)',
      icon: Camera
    };
  }

  if (norm.includes('thread')) {
    return {
      key: 'thread',
      label: 'Thread',
      color: '#475569',
      bg: 'rgba(71, 85, 105, 0.09)',
      border: 'rgba(71, 85, 105, 0.28)',
      icon: AtSign
    };
  }

  if (norm.includes('thoại') || norm.includes('hotline') || norm.includes('phone') || norm.includes('gọi')) {
    return {
      key: 'phone',
      label: 'Điện thoại',
      color: '#059669',
      bg: 'rgba(5, 150, 105, 0.09)',
      border: 'rgba(5, 150, 105, 0.28)',
      icon: Phone
    };
  }

  if (norm.includes('tiệm') || norm.includes('cửa hàng') || norm.includes('trực tiếp')) {
    return {
      key: 'store',
      label: 'Tại tiệm',
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.09)',
      border: 'rgba(124, 58, 237, 0.28)',
      icon: Store
    };
  }

  return {
    key: 'other',
    label: channel || 'Kênh khác',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.09)',
    border: 'rgba(100, 116, 139, 0.28)',
    icon: Globe
  };
}

/**
 * Lọc số điện thoại thuần ký tự số cho Zalo & Call
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

/**
 * Phân tích và chuyển đổi mọi định dạng link/username Facebook thành link Messenger trực tiếp
 * Hỗ trợ:
 * - m.me/username hoặc m.me/id
 * - facebook.com/messages/t/id
 * - business.facebook.com/latest/inbox/messenger...
 * - facebook.com/profile.php?id=1000...
 * - facebook.com/username
 * - username hoặc @username hoặc chuỗi ID
 */
export function resolveMessengerUrl(input) {
  if (!input) return '';
  let str = String(input).trim();
  if (!str) return '';

  // Đã có tiền tố protocol
  if (!str.startsWith('http://') && !str.startsWith('https://')) {
    // Nếu bắt đầu bằng m.me hoặc facebook.com
    if (str.startsWith('m.me/') || str.startsWith('facebook.com/') || str.startsWith('www.facebook.com/')) {
      str = 'https://' + str;
    }
  }

  // 1. Link m.me trực tiếp
  if (str.includes('m.me/')) {
    return str.startsWith('http') ? str : `https://${str}`;
  }

  // 2. Link tin nhắn Facebook hoặc Meta Business Suite
  if (str.includes('facebook.com/messages/') || str.includes('business.facebook.com/')) {
    return str.startsWith('http') ? str : `https://${str}`;
  }

  // 3. Link profile Facebook dạng profile.php?id=1000...
  const profileIdMatch = str.match(/profile\.php\?id=(\d+)/i);
  if (profileIdMatch && profileIdMatch[1]) {
    return `https://m.me/${profileIdMatch[1]}`;
  }

  // 4. Link profile Facebook dạng facebook.com/username
  const fbUrlMatch = str.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9\._\-]+)\/?$/i);
  if (fbUrlMatch && fbUrlMatch[1]) {
    const slug = fbUrlMatch[1];
    // Loại trừ các đường dẫn hệ thống
    const ignored = ['messages', 'profile', 'groups', 'pages', 'share', 'help', 'marketplace'];
    if (!ignored.includes(slug.toLowerCase())) {
      return `https://m.me/${slug}`;
    }
  }

  // 5. Nếu là URL khác
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }

  // 6. Nhập username thô hoặc ID thô (ví dụ: @nguyenvana hoặc 1000123...)
  const cleanId = str.replace(/^@/, '').trim();
  if (cleanId) {
    return `https://m.me/${cleanId}`;
  }

  return '';
}

/**
 * Chuẩn hóa link trang cá nhân Instagram
 */
export function resolveInstagramUrl(input) {
  if (!input) return '';
  const str = String(input).trim();
  if (!str) return '';

  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }
  if (str.startsWith('instagram.com/') || str.startsWith('www.instagram.com/')) {
    return `https://${str}`;
  }
  const handle = str.replace(/^@/, '').trim();
  return handle ? `https://instagram.com/${handle}` : '';
}

/**
 * Chuẩn hóa link trang cá nhân Threads
 */
export function resolveThreadUrl(input) {
  if (!input) return '';
  const str = String(input).trim();
  if (!str) return '';

  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }
  if (str.startsWith('threads.net/') || str.startsWith('www.threads.net/')) {
    return `https://${str}`;
  }
  const handle = str.replace(/^@/, '').trim();
  return handle ? `https://threads.net/@${handle}` : '';
}

/**
 * Tổng hợp thông tin hành động liên hệ nhanh theo đơn hàng
 * @param {Object} order - Đơn hàng ({ channel, phone, customerChannelInfo, customerName })
 * @returns {Object} { hasAction, url, label, icon, isAppDeepLink, tooltip, cleanIdentifier }
 */
export function getChannelAction(order) {
  if (!order) return { hasAction: false };

  const channel = order.channel || '';
  const cfg = getChannelConfig(channel);
  const info = (order.customerChannelInfo || '').trim();
  const phone = (order.phone || '').trim();
  const cleanPhone = cleanPhoneNumber(phone);

  switch (cfg.key) {
    case 'zalo': {
      // Ưu tiên số điện thoại của đơn hàng để mở Zalo profile
      if (cleanPhone) {
        return {
          hasAction: true,
          type: 'zalo',
          url: `https://zalo.me/${cleanPhone}`,
          label: 'Zalo',
          icon: MessageSquare,
          tooltip: `Bấm để mở chat/profile Zalo khách (${phone})`,
          isAppDeepLink: true,
          identifier: info ? `${phone} (${info})` : phone,
          cfg
        };
      }
      // Nếu không có SĐT nhưng có nhập link/thông tin Zalo ở trường kênh
      if (info) {
        const cleanInfoPhone = cleanPhoneNumber(info);
        const url = cleanInfoPhone ? `https://zalo.me/${cleanInfoPhone}` : (info.startsWith('http') ? info : `https://zalo.me/${info}`);
        return {
          hasAction: true,
          type: 'zalo',
          url,
          label: 'Zalo',
          icon: MessageSquare,
          tooltip: `Mở Zalo: ${info}`,
          isAppDeepLink: true,
          identifier: info,
          cfg
        };
      }
      return {
        hasAction: false,
        type: 'zalo',
        tooltip: 'Chưa có số điện thoại khách hàng để mở profile Zalo',
        cfg
      };
    }

    case 'facebook': {
      const messengerUrl = resolveMessengerUrl(info);
      if (messengerUrl) {
        return {
          hasAction: true,
          type: 'facebook',
          url: messengerUrl,
          label: 'Messenger',
          icon: MessageCircle,
          tooltip: `Bấm để mở chat Messenger với khách (${info})`,
          isAppDeepLink: true,
          identifier: info.replace(/^https?:\/\/(?:www\.)?(?:m\.me\/|facebook\.com\/messages\/t\/)?/, '').replace(/\/$/, ''),
          cfg
        };
      }
      return {
        hasAction: false,
        type: 'facebook',
        tooltip: 'Chưa có thông tin Messenger / Facebook của khách',
        cfg
      };
    }

    case 'instagram': {
      const igUrl = resolveInstagramUrl(info || (order.customerName && order.customerName.startsWith('_') ? order.customerName : ''));
      if (igUrl) {
        const handle = info || (order.customerName && order.customerName.startsWith('_') ? order.customerName : '');
        return {
          hasAction: true,
          type: 'instagram',
          url: igUrl,
          label: 'Instagram',
          icon: Camera,
          tooltip: `Bấm để mở profile Instagram của khách (${handle})`,
          isAppDeepLink: false,
          identifier: handle.replace(/^@/, ''),
          cfg
        };
      }
      return {
        hasAction: false,
        type: 'instagram',
        tooltip: 'Chưa có tài khoản Instagram của khách',
        cfg
      };
    }

    case 'thread': {
      const threadUrl = resolveThreadUrl(info);
      if (threadUrl) {
        return {
          hasAction: true,
          type: 'thread',
          url: threadUrl,
          label: 'Thread',
          icon: AtSign,
          tooltip: `Bấm để mở profile Threads của khách (@${info.replace(/^@/, '')})`,
          isAppDeepLink: false,
          identifier: info.replace(/^@/, ''),
          cfg
        };
      }
      return {
        hasAction: false,
        type: 'thread',
        tooltip: 'Chưa có tài khoản Thread của khách',
        cfg
      };
    }

    case 'phone': {
      if (cleanPhone) {
        return {
          hasAction: true,
          type: 'phone',
          url: `tel:${cleanPhone}`,
          label: 'Gọi điện',
          icon: Phone,
          tooltip: `Gọi điện trực tiếp cho khách (${phone})`,
          isAppDeepLink: true,
          identifier: phone,
          cfg
        };
      }
      return {
        hasAction: false,
        type: 'phone',
        tooltip: 'Chưa có số điện thoại',
        cfg
      };
    }

    case 'store': {
      return {
        hasAction: false,
        type: 'store',
        tooltip: 'Khách mua trực tiếp tại cửa hàng',
        identifier: 'Tại tiệm',
        cfg
      };
    }

    default: {
      if (info && (info.startsWith('http://') || info.startsWith('https://'))) {
        return {
          hasAction: true,
          type: 'other',
          url: info,
          label: 'Mở liên kết',
          icon: ExternalLink,
          tooltip: `Mở liên kết kênh khách hàng: ${info}`,
          isAppDeepLink: false,
          identifier: info,
          cfg
        };
      }
      return {
        hasAction: false,
        type: 'other',
        identifier: info,
        cfg
      };
    }
  }
}

