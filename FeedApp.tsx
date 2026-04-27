import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import CCALinkInBio from './pages/CCALinkInBio';
import FeedLayout from './pages/feed/FeedLayout';

// ═══════════════════════════════════════════════
// 피드 도메인 전용 독립 라우팅 애플리케이션
// 메인 사이트(jtvstar.com)와 완전히 분리된 프론트 영역
// 어드민 페이지는 메인 사이트에서만 접근 가능
// ═══════════════════════════════════════════════

// username 파라미터가 실제 CCA 프로필인지 피드 라우트인지 판단
const ProfileOrFeed: React.FC = () => {
  const { username } = useParams();
  
  // 피드 앱 내부 라우트 목록 — 이 경로들은 CCA 프로필이 아님
  const feedRoutes = ['feed', 'explore', 'search', 'messages', 'membership', 'settings', 'login', 'register', 'ranking'];
  
  if (feedRoutes.includes(username?.toLowerCase() || '')) {
    return <FeedLayout />;
  }
  
  return <CCALinkInBio />;
};

const FeedApp: React.FC = () => {
  return (
    <Routes>
      {/* CCA 프로필 페이지 (명시적 경로) */}
      <Route path="/p/:username" element={<CCALinkInBio />} />
      
      {/* 피드 앱 기본 경로들 */}
      <Route path="/feed" element={<FeedLayout />} />
      <Route path="/explore" element={<FeedLayout />} />
      <Route path="/search" element={<FeedLayout />} />
      <Route path="/messages" element={<FeedLayout />} />
      <Route path="/membership" element={<FeedLayout />} />
      <Route path="/settings" element={<FeedLayout />} />
      
      {/* 루트 → 피드 홈 */}
      <Route path="/" element={<FeedLayout />} />
      
      {/* /:username → CCA 프로필 or 피드 라우트 판별 */}
      <Route path="/:username" element={<ProfileOrFeed />} />
      
      {/* Fallback */}
      <Route path="*" element={<FeedLayout />} />
    </Routes>
  );
};

export default FeedApp;
