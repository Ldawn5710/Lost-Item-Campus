import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, code, nickname, isStudent } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required.' },
        { status: 400 }
      );
    }

    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (!SMTP_USER || !SMTP_PASS) {
      console.warn('⚠️ SMTP credentials are not configured in .env.local!');
      console.log(`[DEV ONLY - Verification Code for ${email}]: ${code}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'SMTP_CONFIG_MISSING',
          message: '서버에 SMTP 설정이 되어 있지 않습니다. .env.local 파일에 SMTP_USER와 SMTP_PASS를 등록해 주세요.',
          devCode: code // Return the code for local dev fallback if SMTP is not configured
        },
        { status: 200 }
      );
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const isKo = true; // Default to Korean

    // Beautiful premium dark glassmorphism email design
    const mailOptions = {
      from: `"안심 캠퍼스 맵 (Safe Campus Map)" <${SMTP_USER}>`,
      to: email,
      subject: `[안심 캠퍼스 맵] 로그인 인증번호 [${code}]`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>안심 캠퍼스 맵 인증번호</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
              background-color: #05070f;
              color: #ffffff;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              width: 100%;
              table-layout: fixed;
              background-color: #05070f;
              padding: 40px 20px;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: rgba(10, 14, 26, 0.75);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 20px;
              padding: 40px 30px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 242, 254, 0.05);
              text-align: center;
            }
            .logo {
              display: inline-block;
              width: 56px;
              height: 56px;
              background: rgba(0, 242, 254, 0.1);
              border: 1.5px solid rgba(0, 242, 254, 0.35);
              border-radius: 16px;
              line-height: 56px;
              margin-bottom: 24px;
              color: #00f2fe;
              font-size: 28px;
              font-weight: bold;
              text-align: center;
            }
            h1 {
              font-size: 22px;
              font-weight: 700;
              margin: 0 0 10px 0;
              color: #ffffff;
              letter-spacing: -0.5px;
            }
            p.subtitle {
              font-size: 14px;
              color: #8f9cae;
              margin: 0 0 30px 0;
              line-height: 1.5;
            }
            .code-box {
              background: linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(79, 172, 254, 0.08) 100%);
              border: 1.5px dashed rgba(0, 242, 254, 0.3);
              border-radius: 12px;
              padding: 24px;
              margin: 30px 0;
              letter-spacing: 6px;
              font-size: 36px;
              font-weight: 800;
              color: #00f2fe;
              text-shadow: 0 0 15px rgba(0, 242, 254, 0.4);
            }
            .greeting {
              font-size: 15px;
              color: #ffffff;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .description {
              font-size: 13px;
              color: #a0aec0;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .footer {
              border-top: 1px solid rgba(255, 255, 255, 0.06);
              padding-top: 20px;
              font-size: 11px;
              color: #4a5568;
              line-height: 1.5;
              text-align: left;
            }
            .warning {
              color: #ff4a6b;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="logo">🛡️</div>
              <h1>안심 캠퍼스 맵 인증번호</h1>
              <p class="subtitle">Safe Campus Map Verification</p>
              
              <div class="greeting">${nickname ? `<strong>${nickname}</strong>님, 반갑습니다.` : '반갑습니다.'}</div>
              <div class="description">
                요청하신 안심 캠퍼스 가입/로그인을 완료하기 위해<br>
                아래 6자리 인증번호를 인증 화면에 입력해 주세요.
              </div>

              <div class="code-box">${code}</div>

              <div class="description" style="color: #8f9cae; font-size: 12px;">
                인증번호는 <strong>5분</strong> 동안 유효합니다.<br>
                본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.
              </div>

              <div class="footer">
                본 메일은 발신전용 메일입니다. 문의사항은 안심 캠퍼스 지원센터 또는 시스템 관리자에게 연락 바랍니다.<br>
                <span class="warning">안전 안내:</span> 타인에게 인증 코드를 절대 공유하지 마십시오.
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send verification code.' },
      { status: 500 }
    );
  }
}
