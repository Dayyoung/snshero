/**
 * RedditPolicyModal.tsx
 * SNSHero 커뮤니티 가이드라인, 운영 규칙 및 개인정보처리방침 안내 모달
 */

import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface RedditPolicyModalProps {
  type: 'rules' | 'privacy';
  isDark: boolean;
  isKo?: boolean;
  onClose: () => void;
}

export const RedditPolicyModal: React.FC<RedditPolicyModalProps> = ({
  type,
  isDark,
  isKo = true,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className={`relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-[#181C1F] border-[#2E363E] text-gray-200' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-inherit/10">
          <div className="flex items-center gap-2">
            {type === 'rules' ? (
              <ShieldCheck className="w-5 h-5 text-[#FF4500]" />
            ) : (
              <FileText className="w-5 h-5 text-sky-400" />
            )}
            <h2 className="font-extrabold text-base">
              {type === 'rules'
                ? (isKo ? 'SNSHero 커뮤니티 운영 가이드라인' : 'Community Guidelines')
                : (isKo ? '개인정보처리방침 및 데이터 보안' : 'Privacy & Security Policy')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-4 text-xs leading-relaxed">
          {type === 'rules' ? (
            <>
              <p className="opacity-80">
                {isKo 
                  ? 'SNSHero 커뮤니티는 모든 사용자가 자유롭고 건전하게 지식을 나누고 토론할 수 있는 열린 공간입니다.' 
                  : 'SNSHero Community is an open space for everyone to share knowledge and discuss civilly.'}
              </p>

              <div className="space-y-3">
                <div className={`p-3 rounded-xl border ${isDark ? 'border-[#2E363E] bg-[#0E1113]' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="font-bold flex items-center gap-1.5 text-sm mb-1 text-[#FF4500]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isKo ? '1. 상호 존중과 비방 금지' : '1. Respect and Civility'}</span>
                  </div>
                  <p className="opacity-75">
                    {isKo 
                      ? '타인에 대한 혐오 표현, 개인정보 유출, 괴롭힘 및 인신공격을 엄격히 금지합니다.' 
                      : 'Hate speech, doxxing, harassment, and personal attacks are strictly forbidden.'}
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'border-[#2E363E] bg-[#0E1113]' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="font-bold flex items-center gap-1.5 text-sm mb-1 text-[#FF4500]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isKo ? '2. 무비용 정적 커뮤니티 원칙' : '2. Zero-Cost Open Access'}</span>
                  </div>
                  <p className="opacity-75">
                    {isKo 
                      ? '모든 게시물과 댓글 열람은 100% 무료이며, 불필요한 결제 유도나 유료 구독 장벽이 없습니다.' 
                      : 'All posts and comments are 100% free with no paywalls or required subscriptions.'}
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'border-[#2E363E] bg-[#0E1113]' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="font-bold flex items-center gap-1.5 text-sm mb-1 text-[#FF4500]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isKo ? '3. 스팸 및 영리 목적 도배 제한' : '3. No Spam or Self-Promotion'}</span>
                  </div>
                  <p className="opacity-75">
                    {isKo 
                      ? '무분별한 광고성 링크 도배, 어뷰징 봇 및 사기성 유도 행위는 즉시 차단됩니다.' 
                      : 'Automated spam bots and fraudulent schemes will be banned permanently.'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="opacity-80">
                {isKo 
                  ? 'SNSHero 커뮤니티는 사용자 프라이버시를 최우선으로 보호하며 최신 Zero-DB 클라이언트 아키텍처를 따릅니다.' 
                  : 'SNSHero Community prioritizes user privacy using a Zero-DB client architecture.'}
              </p>

              <div className="space-y-3">
                <div className={`p-3 rounded-xl border ${isDark ? 'border-[#2E363E] bg-[#0E1113]' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="font-bold flex items-center gap-1.5 text-sm mb-1 text-sky-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isKo ? '로컬스토리지 기반 데이터 보존' : 'LocalStorage Persistence'}</span>
                  </div>
                  <p className="opacity-75">
                    {isKo 
                      ? '사용자가 작성한 글, 댓글, 북마크, 추천 기록은 브라우저 로컬스토리지에 안전하게 보존되며 외부 중앙 서버로 불필요하게 전송되지 않습니다.' 
                      : 'Your created posts, comments, bookmarks, and votes are stored securely in browser LocalStorage.'}
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'border-[#2E363E] bg-[#0E1113]' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="font-bold flex items-center gap-1.5 text-sm mb-1 text-sky-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isKo ? '구글 애드센스 광고 규정 준수' : 'AdSense Privacy Standard'}</span>
                  </div>
                  <p className="opacity-75">
                    {isKo 
                      ? '표시되는 광고는 Google AdSense 공식 인증 파트너 네트워크를 통해 안전하고 비침해적으로 서빙됩니다.' 
                      : 'Advertisements are served through the Google Certified Partner Network.'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 모달 하단 버튼 */}
        <div className="flex justify-end p-4 border-t border-inherit/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#FF4500] hover:bg-[#FF5414] text-white font-bold text-xs cursor-pointer transition-colors"
          >
            {isKo ? '확인 및 닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
