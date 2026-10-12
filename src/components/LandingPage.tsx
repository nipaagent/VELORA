import React, { useState } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Coins, 
  Crown, 
  Code2, 
  Smartphone, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Check, 
  LogIn, 
  HelpCircle,
  FileText,
  Lock,
  Zap,
  X,
  CreditCard,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SP_TOKEN_PACKAGES, SP_VIP_PACKAGES } from '../lib/spPaymentConfig';

interface LandingPageProps {
  onOpenAuth: (isSignUp?: boolean) => void;
  onOpenSharedSession?: () => void;
  isLoggedIn?: boolean;
  onSelectPurchasePackage?: (packageId: string, type: 'vip' | 'tokens') => void;
}

export default function LandingPage({ onOpenAuth, isLoggedIn = false, onSelectPurchasePackage }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [pendingPurchaseItem, setPendingPurchaseItem] = useState<{
    id: string;
    name: string;
    price: string;
    type: 'vip' | 'tokens';
  } | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(prev => prev === idx ? null : idx);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: 'ফ্রি টোকেন কীভাবে পাবো?',
      a: 'প্রতিদিন লগইন করলেই ফ্রি টোকেন জমা হয় — আলাদা করে কিছু করতে হয় না। প্রতিদিন রাত ১২টায় কোটা রিসেট হয়ে নতুন টোকেন যোগ হয়। ফ্রি টোকেন শেষ হয়ে গেলে ওই দিনের জন্য অপেক্ষা করতে পারো, অথবা টোকেন প্যাক কিনে সাথে সাথে চালিয়ে যেতে পারো।'
    },
    {
      q: 'পেমেন্ট কীভাবে করবো?',
      a: 'SP Wallet BD দিয়ে নিরাপদে পেমেন্ট করা যায় — ১ SP = ৳৭.৭৭। প্ল্যান বা প্যাক বেছে নিয়ে পেমেন্ট সম্পন্ন করলেই টোকেন/প্ল্যান সাথে সাথে তোমার অ্যাকাউন্টে সক্রিয় হয়ে যায়। পেমেন্ট ব্যর্থ হলে টাকা কাটা হয় না; কেটে গেলে সাপোর্টে জানালে যাচাই করে ফেরত বা ব্যালেন্স সমন্বয় করা হয়।'
    },
    {
      q: 'আমার চ্যাট কি নিরাপদ?',
      a: 'তোমার কথোপকথন এনক্রিপ্টেড ক্লাউডে সংরক্ষিত থাকে, যাতে শুধু তুমিই যেকোনো ডিভাইস থেকে সেগুলো দেখতে পারো। আমরা তোমার ব্যক্তিগত ডেটা কোনো তৃতীয় পক্ষের কাছে বিক্রি করি না। বিস্তারিত জানতে Privacy Policy পড়ো।'
    },
    {
      q: 'টোকেন আসলে কী, কীভাবে হিসাব হয়?',
      a: 'টোকেন হলো AI-এর লেখা মাপার একক — মোটামুটি কয়েকটা শব্দ মিলে এক টোকেন ধরা হয়। ছোট প্রশ্নে কম, বড় উত্তরে তুলনামূলক বেশি টোকেন খরচ হয়। প্রতিটা উত্তরের নিচে ঠিক কত টোকেন গেল তা দেখিয়ে দেওয়া হয়, আর সাইডবারের মিটারে দিনের মোট ব্যবহার সবসময় দেখা যায়।'
    },
    {
      q: 'VIP প্ল্যান কিনলে আগের টোকেনের কী হবে?',
      a: 'কিছুই হারাবে না। তোমার কেনা টোকেন প্যাকের ব্যালেন্স আলাদাভাবে সংরক্ষিত থাকে; VIP প্ল্যানের দৈনিক কোটা শেষ হলেই কেবল সেখান থেকে খরচ হয়। প্ল্যানের মেয়াদ শেষ হলে অ্যাকাউন্ট আবার ফ্রি কোটায় ফিরে যায়, কেনা টোকেন থেকেই যায়।'
    },
    {
      q: 'একই অ্যাকাউন্ট কি মোবাইল ও কম্পিউটারে চলবে?',
      a: 'হ্যাঁ। একই ইউজারনেম-পাসওয়ার্ড দিয়ে যেকোনো ডিভাইস থেকে লগইন করা যায়, আর চ্যাট হিস্ট্রি সব জায়গায় একই দেখায় — কারণ সবকিছু ক্লাউডে সিঙ্ক থাকে।'
    },
    {
      q: 'সমস্যা হলে সাহায্য পাবো কোথায়?',
      a: 'সাধারণ সমস্যায় এই FAQ-ই যথেষ্ট। তার বাইরে কিছু হলে সাপোর্টে মেসেজ পাঠাও — VIP সদস্যরা অগ্রাধিকার ভিত্তিতে দ্রুত উত্তর পায়। পেমেন্ট-সংক্রান্ত সমস্যায় ট্রানজেকশন নম্বরটা সাথে রাখলে যাচাই দ্রুত হয়।'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white relative overflow-x-hidden">
      {/* Background radial gradients for subtle modern depth */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-zinc-800/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[350px] bg-zinc-700/10 rounded-full blur-[100px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/85 border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-600 flex items-center justify-center text-black font-extrabold text-lg shadow-md font-mono">
              N
            </div>
            <div>
              <div className="font-bold text-base tracking-tight flex items-center gap-1.5 text-white">
                NIPA <span className="text-[11px] font-mono text-zinc-400 font-normal px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">NETWORK V2.7</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-none">বাংলাদেশের নিজস্ব AI প্ল্যাটফর্ম</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400 font-medium">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">ফিচার</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer">কীভাবে কাজ করে</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors cursor-pointer">প্রাইসিং</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors cursor-pointer">জিজ্ঞাসা</button>
            <button onClick={() => scrollToSection('terms')} className="hover:text-white transition-colors cursor-pointer">শর্তাবলি</button>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenAuth(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন</span>
            </button>
            <button
              onClick={() => onOpenAuth(true)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-black bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-300 hover:brightness-105 active:scale-95 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>রেজিস্ট্রেশন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>বাংলাদেশের নিজস্ব দ্রুতগতির AI প্ল্যাটফর্ম</span>
          </span>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.2] mb-6">
            বাংলায় কথা বলা <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">স্মার্ট AI</span>,<br className="hidden sm:inline" /> পকেট-বান্ধব দামে
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            লেখালেখি, পড়াশোনা, ছবি বিশ্লেষণ ও ব্যবসার কাজ — NIPA তোমার পাশে। ফেসবুক পোস্ট, ক্যাপশন, অ্যাসাইনমেন্ট কিংবা জটিল কোডিং — যা-ই দরকার, বাংলায় বললেই গুছিয়ে দেবে। প্রতিদিন ফ্রি টোকেন দিয়ে শুরু করো!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={() => onOpenAuth(true)}
              className="px-6 py-3.5 text-sm sm:text-base font-bold text-black bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-300 hover:brightness-105 active:scale-95 rounded-xl transition-all shadow-lg cursor-pointer flex items-center gap-2"
            >
              <span>ফ্রি চ্যাট শুরু করো</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="px-6 py-3.5 text-sm sm:text-base font-semibold text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              প্রাইসিং দেখো
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-14">
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
              <b className="block text-2xl font-bold font-mono text-white">18+</b>
              <span className="text-xs text-zinc-400">মোট অ্যাক্টিভ ইউজার</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
              <b className="block text-2xl font-bold font-mono text-white">VIP / Pro</b>
              <span className="text-xs text-zinc-400">সাশ্রয়ী প্ল্যান সুবিধা</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
              <b className="block text-2xl font-bold font-mono text-white">&lt; 1s</b>
              <span className="text-xs text-zinc-400">আল্ট্রা-ফাস্ট রেসপন্স</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
              <b className="block text-2xl font-bold font-mono text-white">SP Wallet</b>
              <span className="text-xs text-zinc-400">ভার্চুয়াল কার্ড পেমেন্ট</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <motion.section 
        id="features" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 py-16 px-4 max-w-6xl mx-auto"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">কেন NIPA ব্যবহার করবে?</h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            সহজ ইন্টারফেস, শক্তিশালী AI মডেল এবং বাংলা ভাষার গভীর বোঝাপড়া নিয়ে NIPA তৈরি করা হয়েছে।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">নিখুঁত বাংলা সাপোর্ট</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              বাংলায় প্রশ্ন করো, বাংলায় উত্তর পাও — ফন্ট আর রেন্ডারিং একদম পরিষ্কার। বাংলিশ লিখলেও NIPA ঠিকঠাক বুঝে নেয় এবং সঠিক ব্যাকরণে উত্তর দেয়।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-4">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">স্বচ্ছ টোকেন সিস্টেম</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              কত টোকেন খরচ হলো, কত বাকি — সবসময় চোখের সামনে। লুকানো কোনো চার্জ নেই। লিমিটের কাছাকাছি গেলে আগে থেকেই সতর্ক করে দেয়।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-4">
              <Crown className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">VIP পাওয়ার</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              বেশি টোকেন, দ্রুত রেসপন্স, প্রায়োরিটি সাপোর্ট — মাত্র ৳৪৯ থেকে শুরু। ব্যস্ত সময়েও সবার আগে উত্তর পাওয়ার নিশ্চয়তা।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-4">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">ডেভেলপার API সুবিধা</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              নিজের অ্যাপ বা ওয়েবসাইটে NIPA-র AI যুক্ত করো। সহজ REST API, OpenAI কম্প্যাটিবল এন্ডপয়েন্ট এবং স্বচ্ছ ব্যবহারের রিপোর্ট।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">মোবাইল-ফার্স্ট ডিজাইন</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              ছোট স্ক্রিনেও স্পষ্ট লেখা ও বাটন। এক হাতে ফোন চালিয়ে যেকোনো সময় নির্বিঘ্নে চ্যাট এবং কাজ সেরে নেওয়ার চমৎকার সুবিধা।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">নিরাপদ ক্লাউড ডেটা</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              তোমার কথোপকথন এনক্রিপ্টেড ক্লাউডে সংরক্ষিত থাকে। যেকোনো ডিভাইস থেকে আগের চ্যাটে ফিরে যাওয়া যায় নিরাপদে।
            </p>
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section 
        id="how-it-works" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 py-16 px-4 max-w-4xl mx-auto"
      >
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">কীভাবে কাজ করে</h2>
          <p className="text-zinc-400 text-sm">তিনটা সহজ ধাপেই শুরু — দুই মিনিটের বেশি লাগবে না</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-black font-extrabold text-sm font-mono flex items-center justify-center mb-3">
              1
            </div>
            <h3 className="font-bold text-white mb-1.5">অ্যাকাউন্ট খোলো</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              ইউজারনেম আর পাসওয়ার্ড দিয়ে রেজিস্টার করো — জটিল ভেরিফিকেশনের ঝামেলা নেই। প্রতিদিনের ফ্রি টোকেন সাথে সাথেই চালু হয়ে যাবে।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-black font-extrabold text-sm font-mono flex items-center justify-center mb-3">
              2
            </div>
            <h3 className="font-bold text-white mb-1.5">প্রশ্ন করো, উত্তর নাও</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              চ্যাটে বাংলায় বা ইংরেজিতে যা জানতে চাও লিখে পাঠাও। ছবি বিশ্লেষণ করতে চাইলে ছবি আপলোড করো — তাৎক্ষণিক উত্তর চলে আসবে।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-black font-extrabold text-sm font-mono flex items-center justify-center mb-3">
              3
            </div>
            <h3 className="font-bold text-white mb-1.5">দরকার হলে আপগ্রেড</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              ফ্রি টোকেন শেষ হলে টোকেন প্যাক কেনা যাবে অথবা VIP প্ল্যান নেওয়া যাবে। SP Wallet ভার্চুয়াল কার্ড দিয়ে সাথে সাথে ইনস্ট্যান্ট পেমেন্ট।
            </p>
          </div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section 
        id="pricing" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 py-16 px-4 max-w-6xl mx-auto"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">VIP প্ল্যান ও প্রাইসিং</h2>
          <p className="text-zinc-400 text-sm">SP Wallet BD দিয়ে সহজ পেমেন্ট · ১ SP = ৳৭.৭৭</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Starter */}
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-zinc-300">Starter</div>
              <div className="text-3xl font-bold font-mono text-white mt-2">৳৪৯</div>
              <div className="text-xs text-zinc-500 mb-4">/ ৭ দিন (~6.31 SP)</div>
              <ul className="space-y-2 text-xs text-zinc-300 mb-6">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> দৈনিক ১ লাখ টোকেন</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> স্ট্যান্ডার্ড স্পিড</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> চ্যাট হিস্ট্রি সংরক্ষণ</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> বাংলা + ইংরেজি সাপোর্ট</li>
              </ul>
            </div>
            <button
              onClick={() => {
                if (isLoggedIn && onSelectPurchasePackage) {
                  onSelectPurchasePackage('sp_vip_7d', 'vip');
                } else {
                  setPendingPurchaseItem({ id: 'sp_vip_7d', name: 'Starter VIP (৭ দিন)', price: '৳৪৯', type: 'vip' });
                }
              }}
              className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              কিনুন
            </button>
          </div>

          {/* Pro (Highlighted) */}
          <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-zinc-600 flex flex-col justify-between relative shadow-xl">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-zinc-100 to-zinc-300 text-black text-[10px] font-black uppercase px-3 py-0.5 rounded-full tracking-wider shadow">
              সবচেয়ে জনপ্রিয়
            </span>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Pro</span>
                <Crown className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-white mt-2">৳১৪৯</div>
              <div className="text-xs text-zinc-400 mb-4">/ ৩০ দিন (~19.18 SP)</div>
              <ul className="space-y-2 text-xs text-zinc-200 mb-6">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white shrink-0" /> দৈনিক ৫ লাখ টোকেন</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white shrink-0" /> আল্ট্রা-ফাস্ট রেসপন্স</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white shrink-0" /> প্রায়োরিটি সাপোর্ট</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white shrink-0" /> পিক আওয়ারে অগ্রাধিকার</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white shrink-0" /> নতুন ফিচারে আগে অ্যাক্সেস</li>
              </ul>
            </div>
            <button
              onClick={() => {
                if (isLoggedIn && onSelectPurchasePackage) {
                  onSelectPurchasePackage('sp_vip_30d', 'vip');
                } else {
                  setPendingPurchaseItem({ id: 'sp_vip_30d', name: 'Pro VIP (৩০ দিন)', price: '৳১৪৯', type: 'vip' });
                }
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-300 text-black font-bold text-xs hover:brightness-105 transition-all shadow cursor-pointer"
            >
              কিনুন
            </button>
          </div>

          {/* Business */}
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-zinc-300">Business</div>
              <div className="text-3xl font-bold font-mono text-white mt-2">৳৩৪৯</div>
              <div className="text-xs text-zinc-500 mb-4">/ ৯০ দিন (~44.92 SP)</div>
              <ul className="space-y-2 text-xs text-zinc-300 mb-6">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> দৈনিক ১৫ লাখ টোকেন</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> ডেভেলপার API অ্যাক্সেস</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> ব্যবসায়িক কনটেন্ট টেমপ্লেট</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> ব্যবহারের বিস্তারিত রিপোর্ট</li>
              </ul>
            </div>
            <button
              onClick={() => {
                if (isLoggedIn && onSelectPurchasePackage) {
                  onSelectPurchasePackage('sp_vip_90d', 'vip');
                } else {
                  setPendingPurchaseItem({ id: 'sp_vip_90d', name: 'Business VIP (৯০ দিন)', price: '৳৩৪৯', type: 'vip' });
                }
              }}
              className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              কিনুন
            </button>
          </div>

          {/* Ultimate */}
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-zinc-300">Ultimate</div>
              <div className="text-3xl font-bold font-mono text-white mt-2">৳৭৯৯</div>
              <div className="text-xs text-zinc-500 mb-4">/ আজীবন এক্সেস (~102.83 SP)</div>
              <ul className="space-y-2 text-xs text-zinc-300 mb-6">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> আনলিমিটেড ফেয়ার-ইউজ</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> সব ফিচার আনলক</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> ডেডিকেটেড সাপোর্ট</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> অগ্রাধিকার ফিচার রিকোয়েস্ট</li>
              </ul>
            </div>
            <button
              onClick={() => {
                if (isLoggedIn && onSelectPurchasePackage) {
                  onSelectPurchasePackage('sp_vip_lifetime', 'vip');
                } else {
                  setPendingPurchaseItem({ id: 'sp_vip_lifetime', name: 'Ultimate VIP (আজীবন)', price: '৳৭৯৯', type: 'vip' });
                }
              }}
              className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              কিনুন
            </button>
          </div>
        </div>

        {/* Token Packs with Real Buy Buttons */}
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>টোকেন প্যাক (আলাদা ক্রয়)</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">নির্দিষ্ট মেয়াদের বাইরে আজীবন টোকেন ব্যালেন্স</h3>
          <p className="text-zinc-400 text-xs mb-8 max-w-xl mx-auto">
            প্ল্যান ছাড়াও সরাসরি টোকেন কিনতে পারেন — প্যাকের টোকেনের কোনো মেয়াদ নেই, সারাজীবন আপনার অ্যাকাউন্টে জমা থাকবে।
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {SP_TOKEN_PACKAGES.map((pack) => (
              <div 
                key={pack.id}
                className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between text-left group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black font-mono text-white">{pack.name}</span>
                    {pack.badge && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {pack.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold font-mono text-white my-1">
                    ৳{pack.priceBdt}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 mb-3">
                    ~{pack.priceSp} SP Coins
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                    {pack.description}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (isLoggedIn && onSelectPurchasePackage) {
                      onSelectPurchasePackage(pack.id, 'tokens');
                    } else {
                      setPendingPurchaseItem({ id: pack.id, name: pack.name, price: `৳${pack.priceBdt}`, type: 'tokens' });
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs group-hover:bg-indigo-600"
                >
                  <CreditCard className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                  <span>কিনুন</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Logged-out Buy Explanation Modal */}
        <AnimatePresence>
          {pendingPurchaseItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative text-left"
              >
                <button
                  onClick={() => setPendingPurchaseItem(null)}
                  className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  কেনার জন্য প্রথমে অ্যাকাউন্ট খুলুন / লগইন করুন
                </h3>
                
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4">
                  আপনি <strong className="text-white font-semibold">{pendingPurchaseItem.name}</strong> ({pendingPurchaseItem.price}) বেছে নিয়েছেন। পেমেন্ট সম্পন্ন করার পর এই প্যাকেজটি স্বয়ংক্রিয়ভাবে আপনার অ্যাকাউন্টে ক্রেডিট করার জন্য লগইন থাকা প্রয়োজন।
                </p>

                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 mb-6 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">নির্বাচিত প্যাকেজ</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{pendingPurchaseItem.price} · SP Wallet BD</span>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => {
                      sessionStorage.setItem('nipa_pending_purchase', JSON.stringify(pendingPurchaseItem));
                      setPendingPurchaseItem(null);
                      onOpenAuth(false);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>লগইন করুন (Sign In)</span>
                  </button>

                  <button
                    onClick={() => {
                      sessionStorage.setItem('nipa_pending_purchase', JSON.stringify(pendingPurchaseItem));
                      setPendingPurchaseItem(null);
                      onOpenAuth(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>নতুন অ্যাকাউন্ট খুলুন (Create Account)</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        id="faq" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 py-16 px-4 max-w-3xl mx-auto"
      >
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">সাধারণ জিজ্ঞাসা (FAQ)</h2>
          <p className="text-zinc-400 text-sm">NIPA সম্পর্কে আপনার যেকোনো প্রশ্নের উত্তর এখানে পেয়ে যাবেন</p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="rounded-2xl bg-zinc-900/50 border border-zinc-800/80 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-zinc-200 hover:text-white cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-4 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-2"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Terms & Privacy Summary */}
      <motion.section 
        id="terms" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 py-12 px-4 max-w-4xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span>শর্তাবলি (Terms of Service) — সারাংশ</span>
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              NIPA ব্যবহার মানেই তুমি এই শর্তগুলো মেনে নিচ্ছো। প্রতিদিনের ফ্রি টোকেন ব্যক্তিগত ব্যবহারের জন্য; অপব্যবহার ধরা পড়লে অ্যাকাউন্ট স্থগিত হতে পারে। AI-এর উত্তরের সঠিকতা যাচাই করে ব্যবহার করা ব্যবহারকারীর দায়িত্ব।
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-zinc-400" />
              <span>গোপনীয়তা (Privacy Policy) — সারাংশ</span>
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              আমরা শুধু সার্ভিস চালানোর জন্য প্রয়োজনীয় তথ্যই রাখি — ইউজারনেম ও চ্যাট ইতিহাস। তোমার ব্যক্তিগত ডেটা কোনো তৃতীয় পক্ষের কাছে বিক্রি করা হয় না। যেকোনো সময় অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলার অনুরোধ করা যাবে।
            </p>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/80 py-8 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 NIPA SOLUTIONS · বাংলাদেশের নিজস্ব AI প্ল্যাটফর্ম
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <button onClick={() => onOpenAuth(false)} className="hover:text-white transition-colors cursor-pointer">লগইন</button>
            <button onClick={() => onOpenAuth(true)} className="hover:text-white transition-colors cursor-pointer">রেজিস্ট্রেশন</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors cursor-pointer">প্রাইসিং</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors cursor-pointer">জিজ্ঞাসা</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
