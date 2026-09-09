import React, { useState } from 'react';
import { UserSettings } from '../types';
import { 
  getStorageStats, 
  clearAllAppData, 
  getStoredArtworks 
} from '../utils/storage';
import { sound } from '../utils/audio';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  HardDrive, 
  ShieldCheck, 
  Trash2, 
  Download, 
  FileText,
} from 'lucide-react';
import { AgreementDetailModal } from './ConsentGate';
import { APP_CONFIG } from '../constants/appConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onOpenPrivacyPolicy?: () => void;
  onDataCleared?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenPrivacyPolicy,
  onDataCleared,
}) => {
  const [stats, setStats] = useState(getStorageStats());
  const [agreementDoc, setAgreementDoc] = useState<'privacy' | 'agreement' | null>(null);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const nextVal = !settings.soundEnabled;
    sound.enabled = nextVal;
    if (nextVal) sound.playTap(600);
    onUpdateSettings({ ...settings, soundEnabled: nextVal });
  };

  const handleClearData = () => {
    if (window.confirm('⚠️ 警告：这将清空所有本地保存的作品和草稿，此操作不可撤销！确定继续吗？')) {
      clearAllAppData();
      setStats(getStorageStats());
      onDataCleared?.();
      sound.playTap(440);
      alert('本地缓存已全部清理完毕。');
    }
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const artworks = getStoredArtworks();
    const backupData = {
      app: APP_CONFIG.name,
      packageName: APP_CONFIG.packageName,
      version: APP_CONFIG.version,
      timestamp: Date.now(),
      artworks,
      settings,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${APP_CONFIG.name}_备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sound.playTap(620);
  };

  const handleOpenPrivacy = () => {
    sound.playTap(520);
    setAgreementDoc('privacy');
    if (onOpenPrivacyPolicy) {
      onOpenPrivacyPolicy();
    }
  };

  const handleOpenAgreement = () => {
    sound.playTap(520);
    setAgreementDoc('agreement');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900 rounded-3xl p-5 shadow-2xl border border-neutral-800 space-y-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-200 flex items-center justify-center">
                <Settings className="w-4 h-4 text-[#4BA3A8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-100">
                    {APP_CONFIG.name} · 设置
                  </h3>
                  <span className="px-1.5 py-0.5 rounded bg-[#4BA3A8]/20 text-[#4BA3A8] text-[10px] font-mono font-medium">
                    {APP_CONFIG.version}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            >
              ×
            </button>
          </div>

          {/* 1. Sound Feedback & Haptic */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              触感与音效交互
            </label>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/80">
              <div className="flex items-center gap-2.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#4BA3A8]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-neutral-400" />
                )}
                <div>
                  <div className="text-xs font-medium text-neutral-200">
                    治愈手感音效
                  </div>
                  <div className="text-[10px] text-neutral-400">笔触擦拭、水滴填色轻柔提示音</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={handleToggleSound}
                className="w-4 h-4 rounded text-[#4BA3A8] accent-[#4BA3A8] cursor-pointer"
              />
            </div>
          </div>

          {/* 2. Storage & Cache Management */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#4BA3A8]" />
                <span>本地存储空间管理</span>
              </label>
              <span className="text-xs font-mono text-[#4BA3A8] font-semibold">
                已用: {stats.usedFormatted}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/80 space-y-2.5">
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                所有作品全部保存在手机本地。您可随时导出备份，或清理历史无用缓存。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleExportBackup}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-medium text-neutral-200 hover:border-[#4BA3A8] hover:text-[#4BA3A8] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#4BA3A8]" />
                  <span>导出数据备份</span>
                </button>

                <button
                  onClick={handleClearData}
                  className="px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs font-medium hover:bg-rose-900/60 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>清理缓存</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Privacy Policy & Data Security */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-800">
            <div className="flex gap-2.5">
              <button
                onClick={handleOpenPrivacy}
                className="flex-1 py-2.5 rounded-xl border border-neutral-700 hover:border-[#4BA3A8]/60 bg-neutral-800/80 text-xs font-medium text-neutral-200 hover:bg-neutral-800 flex items-center justify-center gap-2 transition-colors group"
              >
                <FileText className="w-3.5 h-3.5 text-[#4BA3A8] group-hover:scale-110 transition-transform" />
                <span>隐私政策</span>
              </button>
              <button
                onClick={handleOpenAgreement}
                className="flex-1 py-2.5 rounded-xl border border-neutral-700 hover:border-[#4BA3A8]/60 bg-neutral-800/80 text-xs font-medium text-neutral-200 hover:bg-neutral-800 flex items-center justify-center gap-2 transition-colors group"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#4BA3A8] group-hover:scale-110 transition-transform" />
                <span>用户协议</span>
              </button>
            </div>

            {/* Privacy statement banner */}
            <div 
              onClick={handleOpenPrivacy}
              className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-start gap-2.5 text-emerald-300 text-[11px] cursor-pointer hover:border-emerald-500/40 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-200 flex items-center gap-1">
                  <span>隐私与本地数据安全保障</span>
                  <span className="text-[10px] underline text-emerald-400 font-normal">点击查阅详情</span>
                </div>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">
                  所有创作与涂色数据均存储于您的设备本地，无第三方数据上传、无广告SDK，全面保护您的创作安全与个人隐私。
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#4BA3A8] text-white text-xs font-semibold hover:bg-[#3E8B90] transition-all shadow-md shadow-[#4BA3A8]/20"
          >
            保存并返回
          </button>

          <div className="text-center pt-1 border-t border-neutral-800/60 mt-1">
            <div className="text-[11px] font-medium text-neutral-400 flex items-center justify-center gap-1.5">
              <span>{APP_CONFIG.name}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-[#4BA3A8] font-mono font-semibold">{APP_CONFIG.version}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 协议全文弹窗（隐私政策 / 用户服务协议） */}
      <AgreementDetailModal
        isOpen={agreementDoc !== null}
        doc={agreementDoc ?? 'privacy'}
        onClose={() => setAgreementDoc(null)}
      />
    </>
  );
};
