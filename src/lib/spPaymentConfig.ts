export interface SpPaymentPackage {
  id: string;
  name: string;
  type: 'vip' | 'tokens';
  amount: number; // VIP days (e.g. 7, 30, 90, 9999) or Tokens (e.g. 100000)
  priceBdt: number;
  priceSp: number;
  popular?: boolean;
  badge?: string;
  description: string;
  features: string[];
}

export const SP_GATEWAY_CONFIG = {
  appName: 'NIPA',
  appId: 'CARD_GW_nipa_MUGCHQM0',
  paymentChannel: 'ONLY VIRTUAL CARD (16-Digit Card Debit)',
  merchantSettlementWallet: '0199999999',
  publicClientApiKey: 'sp_card_pub_velora_r1usqx',
  secretServerApiKey: 'sp_card_sec_velora_mugchqm0_46f814fm',
  gatewayBaseUrl: 'https://www.spwalletbd.com',
  cardCheckoutApi: 'https://www.spwalletbd.com/api/checkout/card-pay',
  exchangeRateBdtPerSp: 7.77 // 1 SP = ৳7.77 BDT
};

export const calcSpPrice = (bdt: number): number => {
  return parseFloat((bdt / SP_GATEWAY_CONFIG.exchangeRateBdtPerSp).toFixed(2));
};

export const SP_VIP_PACKAGES: SpPaymentPackage[] = [
  {
    id: 'sp_vip_7d',
    name: '৭ দিন VIP মেম্বারশিপ',
    type: 'vip',
    amount: 7,
    priceBdt: 49,
    priceSp: calcSpPrice(49),
    description: 'ট্রায়াল ও শর্ট টার্ম ব্যবহারের জন্য আদর্শ',
    features: [
      '৭ দিন আনলিমিটেড AI চ্যাট',
      'প্রোফাইল গোল্ডেন VIP ব্যাজ',
      'স্পিডি প্রায়োরিটি রেসপন্স',
      'এক্সক্লুসিভ থিম ও গ্লো কালার'
    ]
  },
  {
    id: 'sp_vip_30d',
    name: '৩০ দিন VIP (মোস্ট পপুলার)',
    type: 'vip',
    amount: 30,
    priceBdt: 149,
    priceSp: calcSpPrice(149),
    popular: true,
    badge: 'জনপ্রিয়',
    description: '১ মাসের জন্য ফুল আনলিমিটেড এক্সেস',
    features: [
      '৩০ দিন আনলিমিটেড AI চ্যাট',
      'প্রোফাইল গোল্ডেন VIP ব্যাজ',
      'সবচেয়ে দ্রুত সুপার-স্পিড রেসপন্স',
      'সকল VIP কাস্টমাইজেশন ও মেমোরি'
    ]
  },
  {
    id: 'sp_vip_90d',
    name: '৯০ দিন VIP (৩ মাস কোয়ার্টারলি)',
    type: 'vip',
    amount: 90,
    priceBdt: 349,
    priceSp: calcSpPrice(349),
    badge: 'সেরা সেভিংস',
    description: '৩ মাসের জন্য নিরবচ্ছিন্ন ব্যবহার',
    features: [
      '৯০ দিন আনলিমিটেড AI চ্যাট',
      'প্রোফাইল গোল্ডেন VIP ব্যাজ',
      'সর্বোচ্চ প্রায়োরিটি ট্রাফিক',
      'স্পেশাল VIP স্ট্যাটাস'
    ]
  },
  {
    id: 'sp_vip_lifetime',
    name: 'লাইফটাইম VIP (আজীবন এক্সেস)',
    type: 'vip',
    amount: 36500, // 100 years
    priceBdt: 799,
    priceSp: calcSpPrice(799),
    badge: 'লাইফটাইম ডিল',
    description: 'একবার পেমেন্ট করে আজীবন কোনো লিমিট ছাড়া ব্যবহার করুন',
    features: [
      'আজীবন ১০০% আনলিমিটেড চ্যাট',
      'কখনো মেয়াদ শেষ হবে না',
      'সর্বোচ্চ রেস্পেক্ট ব্যাজ ও ফিচার',
      'ভবিষ্যতের সকল প্রিমিয়াম সুবিধা ফ্রি'
    ]
  }
];

export const SP_TOKEN_PACKAGES: SpPaymentPackage[] = [
  {
    id: 'sp_token_50k',
    name: '৫০,০০০ (50K) টোকেন',
    type: 'tokens',
    amount: 50000,
    priceBdt: 29,
    priceSp: calcSpPrice(29),
    description: 'ছোট কাজ ও দ্রুত চ্যাটের জন্য অতিরিক্ত ৫০কে টোকেন',
    features: [
      '+৫০,০০০ বোনাস টোকেন ব্যালেন্স',
      'আজীবন মেয়াদ (No Expiration)',
      'ইনস্ট্যান্ট ক্রেডিট'
    ]
  },
  {
    id: 'sp_token_200k',
    name: '২,০০,০০০ (200K) টোকেন',
    type: 'tokens',
    amount: 200000,
    priceBdt: 99,
    priceSp: calcSpPrice(99),
    popular: true,
    badge: 'জনপ্রিয়',
    description: 'নিয়মিত ব্যবহারের জন্য সেরা ডিল',
    features: [
      '+২,০০,০০০ বোনাস টোকেন ব্যালেন্স',
      'আজীবন মেয়াদ (No Expiration)',
      'সকল এআই মডেল সাপোর্ট'
    ]
  },
  {
    id: 'sp_token_500k',
    name: '৫,০০,০০০ (500K) টোকেন',
    type: 'tokens',
    amount: 500000,
    priceBdt: 229,
    priceSp: calcSpPrice(229),
    badge: 'সেরা সেভিংস',
    description: 'লম্বা আর্টিকেল, স্টাডি ও কোডিংয়ের জন্য আদর্শ',
    features: [
      '+৫,০০,০০০ বোনাস টোকেন ব্যালেন্স',
      'লাইফটাইম ভ্যালিডিটি',
      'ছবি বিশ্লেষণ ও কোডিং'
    ]
  },
  {
    id: 'sp_token_1m',
    name: '১০,০০,০০০ (1M) মেগা টোকেন',
    type: 'tokens',
    amount: 1000000,
    priceBdt: 399,
    priceSp: calcSpPrice(399),
    badge: 'মেগা প্যাক',
    description: 'প্রফেশনাল ব্যবহারকারী ও বড় প্রজেক্টের জন্য',
    features: [
      '+১০,০০,০০০ বোনাস টোকেন',
      'কখনো মেয়াদ শেষ হবে না',
      'হাই স্পিড প্রায়োরিটি'
    ]
  },
  {
    id: 'sp_token_2m',
    name: '২০,০০,০০০ (2M) আল্টিমেট টোকেন',
    type: 'tokens',
    amount: 2000000,
    priceBdt: 599,
    priceSp: calcSpPrice(599),
    badge: 'আল্টিমেট ডিল',
    description: 'সর্বোচ্চ সাইজ টোকেন বান্ডেল — দীর্ঘদিনের জন্য নিশ্চিত',
    features: [
      '+২০,০০,০০০ মেগা টোকেন ব্যালেন্স',
      'আজীবন সংরক্ষিত থাকবে',
      'ভিআইপি কাস্টমার সাপোর্ট'
    ]
  }
];
