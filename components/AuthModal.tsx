'use client';

import React, { useState } from 'react';
import { Mail, ShieldCheck, BookOpen, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { Profile } from '../lib/types';
import { db } from '../lib/supabase';

interface AuthModalProps {
  onAuthSuccess: (user: Profile, centerCoords: { lat: number; lng: number }) => void;
}

export default function AuthModal({ onAuthSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getUniversityName = (emailStr: string): { name: string; lat: number; lng: number } => {
    const domain = emailStr.split('@')[1]?.toLowerCase() || '';
    if (domain.includes('snu.ac.kr')) {
      return { name: '서울대학교', lat: 37.459882, lng: 126.951905 };
    } else if (domain.includes('kaist.ac.kr')) {
      return { name: '카이스트 (KAIST)', lat: 36.3721, lng: 127.3604 };
    } else if (domain.includes('korea.ac.kr')) {
      return { name: '고려대학교', lat: 37.5894, lng: 127.0326 };
    } else if (domain.includes('yonsei.ac.kr')) {
      return { name: '연세대학교', lat: 37.5657, lng: 126.9385 };
    }
    // Default fallback (Seoul National University center)
    return { name: '캠퍼스 통합맵', lat: 37.459882, lng: 126.951905 };
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    const domain = email.split('@')[1];
    if (!domain || (!domain.endsWith('.ac.kr') && !domain.endsWith('.edu'))) {
      setError('대학 메일 주소(*.ac.kr 또는 *.edu)를 입력해 주세요.');
      return;
    }

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setStep(2);
      setLoading(false);
      
      // Auto-alerting the OTP in development environment for easy use!
      alert(`[개발 테스트용] 인증 메일이 발송되었습니다.\n인증 코드: ${code}`);
    }, 1200);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp !== generatedOtp) {
      setError('인증 번호가 일치하지 않습니다. 다시 확인해주세요.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const { name: univName, lat, lng } = getUniversityName(email);
      const newUser: Profile = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        email,
        nickname,
        university: univName,
        is_verified: true,
        created_at: new Date().toISOString()
      };

      db.setActiveUser(newUser);
      onAuthSuccess(newUser, { lat, lng });
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={styles.backdrop}>
      <div className="glass-panel" style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <ShieldCheck size={32} color="var(--accent-found)" />
          </div>
          <h2 style={styles.title}>안심 캠퍼스 가입</h2>
          <p style={styles.subtitle}>대학 구성원 전용 유실물 매칭 & 도보 안내 서비스</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>닉네임</label>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="예: 길잃은아기사자"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="glass-input"
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>학교 이메일</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="your-email@univ.ac.kr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  style={{ ...styles.input, paddingLeft: '40px' }}
                  disabled={loading}
                />
              </div>
              <p style={styles.helperText}>* .ac.kr 또는 .edu 도메인의 이메일 주소만 지원합니다.</p>
            </div>

            <button
              type="submit"
              className="glass-button primary"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? '인증 코드 발송 중...' : '인증번호 받기'}
              {!loading && <ArrowRight size={18} style={{ marginLeft: '4px' }} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <div style={styles.infoBanner}>
              <Mail size={16} color="var(--accent-found)" />
              <div style={styles.infoText}>
                <strong>{email}</strong> 주소로<br />인증번호 6자리가 발송되었습니다.
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>인증 코드 입력</label>
              <input
                type="text"
                placeholder="6자리 코드 입력"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="glass-input"
                style={{ ...styles.input, letterSpacing: '4px', textAlign: 'center', fontSize: '18px' }}
                disabled={loading}
              />
            </div>

            <div style={styles.buttonRow}>
              <button
                type="button"
                className="glass-button"
                style={{ flex: 1 }}
                onClick={() => setStep(1)}
                disabled={loading}
              >
                이전으로
              </button>
              <button
                type="submit"
                className="glass-button primary"
                style={{ flex: 2 }}
                disabled={loading}
              >
                {loading ? '인증 중...' : '인증 완료하기'}
                {!loading && <Check size={18} style={{ marginLeft: '4px' }} />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: '420px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  logoContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    background: 'rgba(0, 242, 254, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    border: '1px solid rgba(0, 242, 254, 0.2)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    fontFamily: 'var(--font-accent)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  errorAlert: {
    backgroundColor: 'rgba(255, 74, 107, 0.1)',
    border: '1px solid rgba(255, 74, 107, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    color: 'var(--accent-lost)',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  helperText: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '15px',
  },
  infoBanner: {
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    border: '1px solid rgba(0, 242, 254, 0.1)',
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  infoText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
};
