import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { 
  Paintbrush, 
  PaintBucket, 
  ZoomIn, 
  Pipette, 
  ArrowRight, 
  Check, 
  Sparkles 
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: '随心涂抹 · 零门槛治愈',
      desc: '内置实心、渐变、水彩、磨砂、荧光、喷枪6大笔触，打破固定色号与强制分区，在线条底稿上自由涂抹。',
      icon: Paintbrush,
      color: 'text-[#4BA3A8]',
      bg: 'bg-[#4BA3A8]/10',
      tag: '自由无界',
    },
    {
      title: '智能填色 · 快速铺满',
      desc: '切换至「区域填色」油漆桶，轻点任意封闭轮廓线，即刻均匀铺色。橡皮擦智能避让黑线底稿，绝不损坏原画！',
      icon: PaintBucket,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      tag: '高光质感',
    },
    {
      title: '双指缩放 · 长按吸色',
      desc: '双指开合可随心平移和放大至400%精雕细琢，双击快速重置画面；长按画布任意色块即可快速吸取该色彩。',
      icon: ZoomIn,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      tag: '触控优化',
    },
  ];

  const current = steps[step];
  const Icon = current.icon;

  const handleNext = () => {
    sound.playTap(520);
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      sound.playComplete();
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center space-y-5 animate-scaleUp">
        {/* Step indicator dots */}
        <div className="flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === i ? 'w-6 bg-[#4BA3A8]' : 'w-2 bg-neutral-200 dark:bg-neutral-700'
              }`}
            />
          ))}
        </div>

        {/* Icon card */}
        <div className={`w-20 h-20 mx-auto rounded-3xl ${current.bg} ${current.color} flex items-center justify-center shadow-inner`}>
          <Icon className="w-10 h-10" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold tracking-widest text-[#4BA3A8] uppercase">
            {current.tag} · 第 {step + 1} / 3 步
          </span>
          <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
            {current.title}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed px-2">
            {current.desc}
          </p>
        </div>

        {/* Button */}
        <div className="pt-2">
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-2xl bg-[#4BA3A8] text-white text-xs font-semibold shadow-md shadow-[#4BA3A8]/30 hover:bg-[#3E8B90] active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            {step === steps.length - 1 ? (
              <>
                <Check className="w-4 h-4" />
                <span>开启涂色创作</span>
              </>
            ) : (
              <>
                <span>下一步</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
