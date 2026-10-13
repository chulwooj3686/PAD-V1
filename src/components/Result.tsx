import { useMemo, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { categories, questions, type Category } from '../data/questions';
import { convertCaratScores } from '../data/caratConversion';
import { motion } from 'motion/react';
import { RefreshCw, Database, Settings, Share2, Award, Sparkles, Shield, BarChart3 } from 'lucide-react';

interface ResultProps {
  answers: Record<number, number>;
  userInfo: { name: string; email: string } | null;
  onRestart: () => void;
}

interface ItemMeta {
  original: Category;
  domain: "조직영역" | "밝음영역" | "어둠영역";
  code: string;
  displayTitle: string;
}

const itemMetaList: ItemMeta[] = [
  { original: "조직기반 자긍심", domain: "조직영역", code: "OBSE", displayTitle: "조직기반자긍심" },
  { original: "형평 민감성", domain: "조직영역", code: "ES", displayTitle: "형평민감성" },
  { original: "자기성장 마인드셋", domain: "밝음영역", code: "GS", displayTitle: "자기성장마인드셋" },
  { original: "자기효능감", domain: "밝음영역", code: "E", displayTitle: "자기효능감" },
  { original: "회복탄력성", domain: "밝음영역", code: "R", displayTitle: "회복탄력성" },
  { original: "타인성장 마인드셋", domain: "밝음영역", code: "GO", displayTitle: "타인성장마인드셋" },
  { original: "원만성", domain: "밝음영역", code: "A", displayTitle: "원만성" },
  { original: "조직신뢰", domain: "밝음영역", code: "T", displayTitle: "조직신뢰" },
  { original: "나르시시즘", domain: "어둠영역", code: "Na", displayTitle: "자아도취 (나르시시즘)" },
  { original: "신경증", domain: "어둠영역", code: "N", displayTitle: "신경증성" },
  { original: "마키아벨리즘", domain: "어둠영역", code: "M", displayTitle: "권모술수 (마키아벨리즘)" },
  { original: "사이코패스", domain: "어둠영역", code: "P", displayTitle: "공감결핍 (사이코패스)" },
];

export default function Result({ answers, userInfo, onRestart }: ResultProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [filterDomain, setFilterDomain] = useState<'all' | '조직영역' | '밝음영역' | '어둠영역'>('all');

  // Default URL provided by user
  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzdrRLrKRuYigujgplZUOPwP0aAxeRr1E0sUg-OS-weF6PubORF5o0jePLwu7H6jeXD/exec';
  const [webAppUrl, setWebAppUrl] = useState(() => localStorage.getItem('gas_webapp_url_v5') || DEFAULT_GAS_URL);

  // Calculate raw score and percentile for all 12 categories based on CARAT conversion table
  // Both tScore and percentile fields are set to percentile so that any DB/GAS receiving either field saves percentile.
  const scores = useMemo(() => {
    const categoryScores: Record<string, { raw: number; tScore: number; percentile: number }> = {};
    
    categories.forEach((category) => {
      const categoryQuestions = questions.filter((q) => q.category === category);
      if (categoryQuestions.length === 0) return;
      const totalScore = categoryQuestions.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
      const rawScore = Math.round((totalScore / categoryQuestions.length) * 10) / 10;
      const { percentile } = convertCaratScores(category, rawScore);
      categoryScores[category] = {
        raw: rawScore,
        tScore: percentile, // Ensures GAS scripts looking for tScore receive percentile
        percentile,
      };
    });

    return categoryScores;
  }, [answers]);

  const chartData = itemMetaList.map(({ original, code, displayTitle }) => ({
    subject: `${displayTitle} (${code})`,
    shortCode: code,
    raw: scores[original]?.raw || 0,
    percentile: scores[original]?.percentile || 0,
    chartVal: scores[original]?.percentile || 0,
    fullMark: 100,
  }));

  const filteredItems = itemMetaList.filter(
    (item) => filterDomain === 'all' || item.domain === filterDomain
  );

  const handleSaveToGoogleSheets = async () => {
    if (!webAppUrl) {
      setShowUrlInput(true);
      return;
    }

    setIsSaving(true);
    try {
      const payload = JSON.stringify({
        sessionId: new Date().getTime().toString(),
        userInfo,
        scores,
        answers,
      });

      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: payload,
      });
      
      const resultText = await response.text();
      let result;
      try {
        result = JSON.parse(resultText);
      } catch (e) {
        // Extract exact error message from Google Apps Script HTML error page if present
        const match = resultText.match(/monospace[^>]*>([\s\S]*?)<\/div>/i)
          || resultText.match(/class="errorMessage"[^>]*>([\s\S]*?)<\/div>/i);
        const errorDetail = match ? match[1].replace(/<[^>]+>/g, '').trim() : '';
        if (errorDetail) {
          throw new Error(`구글 스크립트 실행 오류: ${errorDetail}`);
        }
        throw new Error('서버에서 올바른 응답을 받지 못했습니다. 구글 앱스 스크립트 배포 설정을 확인해주세요. (액세스 권한: 모든 사용자)');
      }
      
      if (result.result === 'success') {
        alert('데이터 전송을 완료했습니다.\n구글 스프레드시트의 "Responses" 시트에 백분위 점수가 저장되었습니다.');
        localStorage.setItem('gas_webapp_url_v5', webAppUrl);
        setShowUrlInput(false);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('데이터 전송 중 오류가 발생했습니다.\n\n오류 내용: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSaving(false);
    }
  };

  const getDomainBadge = (domain: string) => {
    switch (domain) {
      case '조직영역':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-100 text-blue-800">조직영역</span>;
      case '밝음영역':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800">밝음영역</span>;
      case '어둠영역':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-100 text-purple-800">어둠영역</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold tracking-wider uppercase mb-2">
            CARAT 핵심성격모형
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 relative z-10">P.A.D 진단 결과 리포트</h1>
          <p className="text-indigo-100 text-sm sm:text-base relative z-10">
            원점수(5점 만점) · 백분위(%) 통합 분석표
          </p>
          <p className="text-indigo-200/90 text-xs mt-1 relative z-10 font-mono">
            ※ CARAT 핵심성격모형 기준 원점수(1.0~5.0) → 백분위(0.10% ~ 99.90%) 공식 변환표 적용
          </p>
          {userInfo && (
            <div className="mt-4 inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs sm:text-sm text-indigo-100">
              <span><strong>성명:</strong> {userInfo.name}</span>
              <span className="text-indigo-300">|</span>
              <span><strong>이메일:</strong> {userInfo.email}</span>
            </div>
          )}
        </div>

        {/* Visual Chart Section */}
        <div className="p-6 sm:p-8 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              종합 방사형 분석 차트
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              백분위 기준 (%)
            </span>
          </div>

          <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl p-4 border border-gray-100">
            <div className="w-full h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar
                    name="CARAT 백분위"
                    dataKey="chartVal"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fill="#6366f1"
                    fillOpacity={0.35}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '13px'
                    }}
                    formatter={(value: any, name: string, props: any) => {
                      const p = props.payload;
                      return [
                        `원점수: ${p.raw.toFixed(1)}점 | 백분위: ${p.percentile.toFixed(2)}%`,
                        p.subject
                      ];
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              * 차트의 각 꼭짓점 위에 마우스를 올리거나 터치하시면 원점수와 백분위 상세 수치를 확인하실 수 있습니다.
            </p>
          </div>
        </div>

        {/* 2-Core Scores Table Section (Raw Score & Percentile) */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-indigo-600" />
                항목별 원점수 · 백분위 변환 일람표
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                공식 CARAT 핵심성격모형 변환표를 기준으로 환산된 백분위 점수입니다.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: '전체 (12)' },
                { id: '조직영역', label: '조직영역 (2)' },
                { id: '밝음영역', label: '밝음영역 (6)' },
                { id: '어둠영역', label: '어둠영역 (4)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterDomain(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filterDomain === f.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-xs font-bold border-b border-gray-200">
                  <th className="py-3.5 px-4">영역</th>
                  <th className="py-3.5 px-4">진단 항목명</th>
                  <th className="py-3.5 px-3 text-center">코드</th>
                  <th className="py-3.5 px-4 text-center bg-gray-50">원점수 (5점 만점)</th>
                  <th className="py-3.5 px-4 text-center bg-indigo-50/50 text-indigo-900">백분위 (%)</th>
                  <th className="py-3.5 px-4 text-center">수준 게이지</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredItems.map(({ original, domain, code, displayTitle }) => {
                  const s = scores[original] || { raw: 0, percentile: 0 };
                  const percentWidth = Math.max(0, Math.min(100, s.percentile));
                  
                  return (
                    <tr key={original} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="py-3 px-4">{getDomainBadge(domain)}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{displayTitle}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700 bg-gray-50/60">
                        {s.raw.toFixed(1)} <span className="text-xs text-gray-400 font-normal">/ 5.0</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600 bg-indigo-50/30">
                        {s.percentile.toFixed(2)} <span className="text-xs text-indigo-400 font-normal">%</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-28 bg-gray-200 h-2.5 rounded-full overflow-hidden mx-auto">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" 
                            style={{ width: `${percentWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredItems.map(({ original, domain, code, displayTitle }) => {
              const s = scores[original] || { raw: 0, percentile: 0 };
              const percentWidth = Math.max(0, Math.min(100, s.percentile));
              
              return (
                <div key={original} className="p-4 bg-gray-50 rounded-2xl border border-gray-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDomainBadge(domain)}
                      <span className="font-bold text-gray-800 text-sm">{displayTitle}</span>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded">
                      {code}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-gray-100 text-center">
                    <div>
                      <div className="text-[11px] text-gray-400 font-medium">원점수</div>
                      <div className="text-sm font-bold text-gray-800">{s.raw.toFixed(1)}</div>
                    </div>
                    <div className="border-l border-gray-100">
                      <div className="text-[11px] text-indigo-500 font-medium">백분위</div>
                      <div className="text-sm font-bold text-indigo-600">{s.percentile.toFixed(2)}%</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" 
                      style={{ width: `${percentWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* URL Input for GAS - Only shown if explicitly toggled */}
        {showUrlInput && (
          <div className="px-6 sm:px-10 py-4 bg-amber-50 border-t border-amber-200">
            <label className="block text-sm font-bold text-amber-900 mb-1">
              Google Apps Script Web App URL 설정
            </label>
            <p className="text-xs text-amber-700 mb-2">
              구글 시트에 연결된 배포 웹 앱 URL입니다. 변경이 필요할 때만 입력해주세요.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 p-2.5 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm bg-white"
              />
              <button
                onClick={() => setShowUrlInput(false)}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-amber-700"
              >
                적용
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-gray-50 p-6 flex flex-wrap justify-center gap-4 border-t border-gray-100">
          <button 
            onClick={onRestart}
            className="flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-sm text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 진단하기
          </button>
          
          <div className="relative flex items-center">
            <button 
              onClick={handleSaveToGoogleSheets}
              disabled={isSaving}
              className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Database className="w-4 h-4 mr-2" />
              {isSaving ? '시트에 저장 중...' : 'DB에 저장하기'}
            </button>
            <button 
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="ml-2 p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-full transition-colors"
              title="Google Sheet Web App URL 설정"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'CARAT P.A.D 진단 결과',
                  text: '나의 CARAT 핵심성격모형 진단 결과를 확인해보세요.',
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('진단 링크가 클립보드에 복사되었습니다.');
              }
            }}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg text-sm"
          >
            <Share2 className="w-4 h-4 mr-2" />
            결과 공유하기
          </button>
        </div>
      </motion.div>

      {/* Guide & Domain Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold">
            <Shield className="w-5 h-5" />
            조직영역 (2개 지표)
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>조직기반자긍심(OBSE)</strong>과 <strong>형평민감성(ES)</strong>으로 구성되며, 조직 내 구성원의 소속감과 공정성 인식을 진단합니다.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold">
            <Sparkles className="w-5 h-5" />
            밝음영역 (6개 지표)
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>자기성장, 자기효능감, 회복탄력성, 타인성장, 원만성, 조직신뢰</strong>를 통해 긍정적인 심리적 자본과 상호작용 역량을 평가합니다.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold">
            <Award className="w-5 h-5" />
            어둠영역 (4개 지표)
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>자아도취(Na), 신경증성(N), 권모술수(M), 공감결핍(P)</strong>을 분석하여 스트레스 상황이나 갈등 시 발현될 수 있는 위험 요인을 점검합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
