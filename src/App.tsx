/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Landing from './components/Landing';
import Survey from './components/Survey';
import Result from './components/Result';
import { AnimatePresence, motion } from 'motion/react';

type Screen = 'landing' | 'survey' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);

  const handleStart = (info: { name: string; email: string }) => {
    setUserInfo(info);
    setScreen('survey');
  };

  const handleComplete = (finalAnswers: Record<number, number>) => {
    setAnswers(finalAnswers);
    setScreen('result');
  };

  const handleRestart = () => {
    setAnswers({});
    setUserInfo(null);
    setScreen('landing');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      <AnimatePresence mode="wait">
        {screen === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <Landing onStart={handleStart} />
          </motion.div>
        )}
        {screen === 'survey' && (
          <motion.div
            key="survey"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <Survey onComplete={handleComplete} />
          </motion.div>
        )}
        {screen === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <Result answers={answers} userInfo={userInfo} onRestart={handleRestart} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
