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
    id: 'sp_token_100k',
    name: '১,০০,০০০ বোনাস টোকেন',
    type: 'tokens',
    amount: 100000,
    priceBdt: 29,
    priceSp: calcSpPrice(29),
    description: 'দৈনিক ফ্রি লিমিটের বাইরে অতিরিক্ত ১০০কে টোকেন',
    features: [
      '+১,০০,০০০ বোনাস টোকেন ব্যালেন্স',
      'কোনো মেয়াদ নেই (No Expiration)',
      'যখন খুশি ব্যবহার করুন'
    ]
  },
  {
    id: 'sp_token_500k',
    name: '৫,০০,০০০ বোনাস টোকেন',
    type: 'tokens',
    amount: 500000,
    priceBdt: 99,
    priceSp: calcSpPrice(99),
    popular: true,
    badge: 'বেস্ট সেলার',
    description: 'বড় প্রজেক্ট এবং লম্বা চ্যাটের জন্য আদর্শ',
    features: [
      '+৫,০০,০০০ বোনাস টোকেন ব্যালেন্স',
      'লাইফটাইম ভ্যালিডিটি',
      'সরাসরি একাউন্টে যুক্ত হবে'
    ]
  },
  {
    id: 'sp_token_2m',
    name: '২,০০,০০,০০ (২ মিলিয়ন) টোকেন',
    type: 'tokens',
    amount: 2000000,
    priceBdt: 299,
    priceSp: calcSpPrice(299),
    badge: 'মেগা প্যাক',
    description: 'প্রফেশনাল ও ডেভেলপারদের জন্য বিশাল টোকেন প্যাক',
    features: [
      '+২,০০,০০,০০ বোনাস টোকেন',
      'কখনো মেয়াদ উত্তীর্ণ হবে না',
      'হাই স্পিড এআই সাপোর্ট'
    ]
  },
  {
    id: 'sp_token_5m',
    name: '৫,০০,০০,০০ (৫ মিলিয়ন) টোকেন',
    type: 'tokens',
    amount: 5000000,
    priceBdt: 599,
    priceSp: calcSpPrice(599),
    badge: 'আলটিমেট প্যাক',
    description: 'সর্বোচ্চ সাইজ টোকেন বান্ডেল',
    features: [
      '+৫,০০,০০,০০ মেগা টোকেন ব্যালেন্স',
      'একবার কিনে দীর্ঘ সময় নিশ্চিন্ত',
      'ভিআইপি কাস্টমার সাপোর্ট'
    ]
  }
];
