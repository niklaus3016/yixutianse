import React, { useState } from 'react';
import { ShieldCheck, ShieldX, X } from 'lucide-react';
import { APP_CONFIG } from '../constants/appConfig';
import { getStoredSettings, saveStoredSettings } from '../utils/storage';
import { PrivacyPolicyContent, UserAgreementContent } from './AgreementDocuments';

type DocType = 'privacy' | 'agreement';

/** 协议全文详情弹窗（启动同意流程与设置页共用） */
export const AgreementDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  doc: DocType;
}> = ({ isOpen, onClose, doc }) => {
  if (!isOpen) return null;
  const title = doc === 'privacy' ? '隐私政策' : '用户服务协议';
  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-lg h-[85vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/80 bg-neutral-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#4BA3A8]/20 border border-[#4BA3A8]/30 flex items-center justify-center text-[#4BA3A8]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-neutral-100">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-neutral-950/50 px-5 py-5">
          {doc === 'privacy' ? <PrivacyPolicyContent /> : <UserAgreementContent />}
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-neutral-800/80 bg-neutral-900/95 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#4BA3A8] text-white text-xs font-semibold hover:bg-[#3E8B90] transition-colors"
          >
            我已阅读
          </button>
        </div>
      </div>
    </div>
  );
};

/** 调用 Android 原生壳退出应用（Web 环境下不存在时静默忽略） */
function exitNativeApp() {
  try {
    const w = window as unknown as { AndroidApp?: { exitApp?: () => void } };
    w.AndroidApp?.exitApp?.();
  } catch {
    /* Web 环境无原生接口，忽略 */
  }
}

/**
 * 启动门控：用户同意《用户服务协议》和《隐私政策》前不渲染应用。
 * 同意状态按协议版本号持久化，政策更新后会自动重新征求同意。
 */
const ConsentGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agreed, setAgreed] = useState<boolean>(() => {
    const s = getStoredSettings();
    return !!s.agreementAccepted && s.agreementVersion === APP_CONFIG.agreementVersion;
  });
  const [detailDoc, setDetailDoc] = useState<DocType | null>(null);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const handleAccept = () => {
    const current = getStoredSettings();
    const updated = {
      ...current,
      agreementAccepted: true,
      agreementVersion: APP_CONFIG.agreementVersion,
      agreementAcceptedAt: Date.now(),
    };
    saveStoredSettings(updated);
    setAgreed(true);
  };

  const handleDeclineConfirm = () => {
    setShowDeclineConfirm(false);
    setBlocked(true);
    // Android 壳中直接退出应用；Web 环境则展示阻断页
    exitNativeApp();
  };

  if (agreed) return <>{children}</>;

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* 同意弹窗 */}
      {!blocked && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#4BA3A8]/20 border border-[#4BA3A8]/30 flex items-center justify-center text-[#4BA3A8]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-neutral-100 mb-5 text-center">
                用户协议与隐私政策
              </h3>

              <div className="space-y-3 mb-5">
                <p className="text-[13px] leading-relaxed text-neutral-300">
                  (1)《隐私政策》向您说明：本应用不注册账号、不接入第三方 SDK，
                  <strong className="text-neutral-100">您的所有创作数据仅保存在设备本地，不上传、不收集个人信息</strong>。
                </p>
                <p className="text-[13px] leading-relaxed text-neutral-300">
                  (2) 当您主动<strong className="text-neutral-100">从相册导入图片提取线稿</strong>或
                  <strong className="text-neutral-100">导出保存作品到相册</strong>时，应用才会访问相册权限，相关图片仅在本地处理，不会上传服务器。
                </p>
              </div>

              <div className="bg-neutral-800/50 rounded-2xl p-3.5">
                <p className="text-[12px] text-neutral-400 mb-1">用户协议和隐私政策说明：</p>
                <p className="text-[12px] leading-relaxed text-neutral-300">
                  阅读完整的
                  <button
                    onClick={() => setDetailDoc('agreement')}
                    className="text-[#4BA3A8] hover:underline font-medium mx-0.5"
                  >
                    《用户服务协议》
                  </button>
                  和
                  <button
                    onClick={() => setDetailDoc('privacy')}
                    className="text-[#4BA3A8] hover:underline font-medium mx-0.5"
                  >
                    《隐私政策》
                  </button>
                  了解详细内容。
                </p>
              </div>
            </div>

            <div className="flex border-t border-neutral-800">
              <button
                onClick={() => setShowDeclineConfirm(true)}
                className="flex-1 py-4 text-sm font-medium text-neutral-300 bg-neutral-900 border-r border-neutral-800 hover:bg-neutral-800/70 transition-colors"
              >
                不同意
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-4 text-sm font-semibold text-white bg-[#4BA3A8] hover:bg-[#3E8B90] transition-colors"
              >
                同意并继续
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 协议全文弹窗 */}
      <AgreementDetailModal
        isOpen={detailDoc !== null}
        doc={detailDoc ?? 'privacy'}
        onClose={() => setDetailDoc(null)}
      />

      {/* 拒绝确认弹窗 */}
      {showDeclineConfirm && (
        <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6">
              <h2 className="text-base font-bold text-neutral-100 mb-3">确认拒绝</h2>
              <p className="text-[13px] leading-relaxed text-neutral-400">
                您确定要拒绝《用户服务协议》和《隐私政策》吗？拒绝后将无法使用「{APP_CONFIG.name}」。
              </p>
            </div>
            <div className="flex border-t border-neutral-800">
              <button
                onClick={() => setShowDeclineConfirm(false)}
                className="flex-1 py-4 text-sm font-medium text-neutral-300 border-r border-neutral-800 hover:bg-neutral-800/70 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeclineConfirm}
                className="flex-1 py-4 text-sm font-semibold text-[#4BA3A8] hover:bg-neutral-800/70 transition-colors"
              >
                确定拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 拒绝后的阻断页（Web 环境；Android 端已退出应用） */}
      {blocked && (
        <div className="fixed inset-0 z-[90] bg-neutral-950 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-5">
            <ShieldX className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-neutral-100 mb-2">暂无法使用「{APP_CONFIG.name}」</h2>
          <p className="text-[13px] leading-relaxed text-neutral-400 mb-6 max-w-xs">
            您需要同意《用户服务协议》和《隐私政策》后才能使用本应用。我们承诺您的创作数据仅保存在设备本地，不会上传或收集。
          </p>
          <button
            onClick={() => setBlocked(false)}
            className="px-6 py-3 rounded-2xl bg-[#4BA3A8] text-white text-sm font-semibold hover:bg-[#3E8B90] transition-colors shadow-md shadow-[#4BA3A8]/20"
          >
            重新阅读并同意
          </button>
        </div>
      )}
    </div>
  );
};

export default ConsentGate;
