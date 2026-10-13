import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Brain, BarChart2, Users, Lock, Mail, User } from 'lucide-react';

interface LandingProps {
  onStart: (info: { name: string; email: string }) => void;
}

export default function Landing({ onStart }: LandingProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode !== '0000') {
      setError('입장 코드가 올바르지 않습니다.');
      return;
    }
    if (!name.trim() || !email.trim()) {
        setError('이름과 이메일을 모두 입력해주세요.');
        return;
    }
    onStart({ name, email });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 flex flex-col items-center justify-center min-h-[80vh] text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6 w-full max-w-lg"
      >
        <div className="inline-flex items-center justify-center p-4 bg-indigo-50 rounded-full mb-4">
          <Brain className="w-12 h-12 text-indigo-600" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-4">
          P.A.D <span className="text-indigo-600">진단 도구</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
          Personality & Attitude Diagnosis<br className="hidden md:block" />
          조직기반 자긍심, 형평 민감성, 신경증 등 12가지 핵심 지표를 통해<br className="hidden md:block" />
          당신의 성격과 태도를 심층적으로 분석해보세요.
        </p>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-left space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="홍길동"
                        required
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="example@email.com"
                        required
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입장 코드</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="password" 
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="코드를 입력하세요"
                        required
                    />
                </div>
            </div>

            {error && (
                <p className="text-red-500 text-sm font-medium">{error}</p>
            )}

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full flex items-center justify-center px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors group mt-6"
            >
                진단 시작하기
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left text-xs text-gray-500">
            <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-500" />
                <span>정밀한 데이터 분석 (60문항)</span>
            </div>
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                <span>조직 적합성 진단</span>
            </div>
            <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span>성장 가이드 제공</span>
            </div>
        </div>
      </motion.div>
      
      <div className="mt-16 text-sm text-gray-400">
        © 2024 P.A.D. All rights reserved.
      </div>
    </div>
  );
}
