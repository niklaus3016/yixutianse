import React from 'react';

interface AndroidFrameProps {
  children: React.ReactNode;
  theme: 'light' | 'dark' | 'eyecare';
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children, theme }) => {
  return (
    <div
      className={`w-full h-dvh min-h-screen flex flex-col overflow-hidden transition-colors duration-300 select-none ${
        theme === 'dark'
          ? 'bg-neutral-900 text-neutral-100'
          : theme === 'eyecare'
          ? 'bg-[#FAF4EB] text-[#3D322A]'
          : 'bg-[#FAF7F2] text-neutral-800'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Main App Viewport */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};
