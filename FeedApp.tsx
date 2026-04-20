import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CCAFeed from './pages/CCAFeed';
import CCALinkInBio from './pages/CCALinkInBio';
import Ranking from './pages/Ranking';

// 별도 도메인용 독립 라우팅 애플리케이션
// 피드 도메인 (예: ccafeed.com 또는 feed.jtvstar.com) 접속 시 이 라우터가 활성화됩니다.
const FeedApp: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 메인 피드 */}
        <Route path="/" element={<CCAFeed />} />
        
        {/* 기존 @username 라우팅 뿐만 아니라 더 명시적인 프로필 라우트 지원 */}
        <Route path="/@:username" element={<CCALinkInBio />} />
        <Route path="/p/:username" element={<CCALinkInBio />} />
        <Route path="/ranking" element={<Ranking />} />
        
        {/* 기존에 /#/@username 과 같이 넘어오는 경우 처리 */}
        <Route path="*" element={<HashRedirector />} />
      </Routes>
    </Router>
  );
};

// 해시 기반 우회 라우팅을 처리하는 유틸리티
const HashRedirector: React.FC = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#/@') || hash.startsWith('#/%40')) {
    const username = hash.replace(/^#\/(%40|@)/, '').split('/')[0].split('?')[0];
    if (username) {
      return <Navigate to={`/@${username}`} replace />;
    }
  }
  return <Navigate to="/" replace />;
};

export default FeedApp;
