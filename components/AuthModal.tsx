'use client';

import React, { useState } from 'react';
import { Mail, ShieldCheck, AlertCircle, ArrowRight, Check, Globe, ChevronDown } from 'lucide-react';
import { Profile } from '../lib/types';
import { db } from '../lib/supabase';
import { useTranslation } from '../lib/LanguageContext';

interface AuthModalProps {
  onAuthSuccess: (user: Profile, centerCoords: { lat: number; lng: number }) => void;
}

export default function AuthModal({ onAuthSuccess }: AuthModalProps) {
  const { t, language, setLanguage } = useTranslation();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const getUniversityName = (emailStr: string): { name: string; lat: number; lng: number } => {
    const domain = emailStr.split('@')[1]?.toLowerCase() || '';
    if (domain.includes('daegu.ac.kr')) {
      return { name: t('univ.daegu'), lat: 35.9038, lng: 128.8504 };
    } else if (domain.includes('snu.ac.kr')) {
      return { name: t('univ.snu'), lat: 37.459882, lng: 126.951905 };
    } else if (domain.includes('kaist.ac.kr')) {
      return { name: t('univ.kaist'), lat: 36.3721, lng: 127.3604 };
    } else if (domain.includes('korea.ac.kr')) {
      return { name: t('univ.korea'), lat: 37.5894, lng: 127.0326 };
    } else if (domain.includes('yonsei.ac.kr')) {
      return { name: t('univ.yonsei'), lat: 37.5657, lng: 126.9385 };
    }
    // Default fallback
    return { name: t('univ.fallback'), lat: 35.9038, lng: 128.8504 };
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!nickname.trim()) {
      setError(t('auth.err_nickname'));
      return;
    }

    const domain = email.split('@')[1];
    if (!domain || (!domain.endsWith('.ac.kr') && !domain.endsWith('.edu'))) {
      setError(t('auth.err_email'));
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
      alert(t('auth.dev_alert', { code }));
    }, 1200);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp !== generatedOtp) {
      setError(t('auth.err_otp'));
      return;
    }

    setLoading(true);

    try {
      const { name: univName, lat, lng } = getUniversityName(email);
      const newUser: Profile = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        email,
        nickname,
        university: univName,
        is_verified: true,
        created_at: new Date().toISOString()
      };

      await db.setActiveUser(newUser);
      onAuthSuccess(newUser, { lat, lng });
    } catch (err) {
      console.error(err);
      setError('인증 완료 과정에서 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.backdrop}>
      <div className="glass-panel" style={styles.modal}>
        {/* Language Selector Dropdown */}
        <div style={styles.langSelectContainer}>
          <button
            type="button"
            style={styles.langSelectBtn}
            onClick={() => setShowLangMenu(!showLangMenu)}
          >
            <Globe size={14} style={{ marginRight: '4px' }} />
            <span>{language === 'ko' ? 'KO' : language === 'en' ? 'EN' : 'VI'}</span>
            <ChevronDown size={12} style={{ marginLeft: '4px' }} />
          </button>
          {showLangMenu && (
            <div style={styles.langDropdown} className="glass-panel">
              <button
                type="button"
                style={styles.langItem}
                onClick={() => { setLanguage('ko'); setShowLangMenu(false); }}
              >
                한국어
              </button>
              <button
                type="button"
                style={styles.langItem}
                onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
              >
                English
              </button>
              <button
                type="button"
                style={styles.langItem}
                onClick={() => { setLanguage('vi'); setShowLangMenu(false); }}
              >
                Tiếng Việt
              </button>
            </div>
          )}
        </div>

        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <ShieldCheck size={32} color="var(--accent-found)" />
          </div>
          <h2 style={styles.title}>{t('auth.title')}</h2>
          <p style={styles.subtitle}>{t('auth.subtitle')}</p>
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
              <label style={styles.label}>{t('auth.nickname')}</label>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder={t('auth.nickname_placeholder')}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="glass-input"
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('auth.email')}</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder={t('auth.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  style={{ ...styles.input, paddingLeft: '40px' }}
                  disabled={loading}
                />
              </div>
              <p style={styles.helperText}>{t('auth.email_helper')}</p>
            </div>

            <button
              type="submit"
              className="glass-button primary"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? t('auth.sending_otp') : t('auth.get_otp')}
              {!loading && <ArrowRight size={18} style={{ marginLeft: '4px' }} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <div style={styles.infoBanner}>
              <Mail size={16} color="var(--accent-found)" />
              <div style={styles.infoText}>
                {t('auth.otp_banner', { email })}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('auth.otp_label')}</label>
              <input
                type="text"
                placeholder={t('auth.otp_placeholder')}
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
                {t('auth.btn_back')}
              </button>
              <button
                type="submit"
                className="glass-button primary"
                style={{ flex: 2 }}
                disabled={loading}
              >
                {loading ? t('auth.verifying') : t('auth.btn_verify')}
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
    position: 'relative',
  },
  langSelectContainer: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 10,
  },
  langSelectBtn: {
    background: 'transparent',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    padding: '6px 10px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  langDropdown: {
    position: 'absolute',
    top: '32px',
    right: 0,
    backgroundColor: 'rgba(10, 14, 26, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '90px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
  langItem: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500',
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
    color: '#ffffff',
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
