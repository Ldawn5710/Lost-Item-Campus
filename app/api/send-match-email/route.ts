import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { recipientEmail, recipientName, lostItemTitle, foundItemTitle, foundItemDesc, itemId } = await request.json();

    if (!recipientEmail || !lostItemTitle || !foundItemTitle) {
      return NextResponse.json(
        { error: 'Recipient email, lost item title, and found item title are required.' },
        { status: 400 }
      );
    }

    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (!SMTP_USER || !SMTP_PASS) {
      console.warn('⚠️ SMTP credentials are not configured in .env.local!');
      return NextResponse.json(
        { 
          success: false, 
          error: 'SMTP_CONFIG_MISSING',
          message: 'SMTP settings missing. Match email simulation active.' 
        },
        { status: 200 }
      );
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lost-item-campus.vercel.app';

    // Beautiful premium dark glassmorphism transactional matching email design
    const mailOptions = {
      from: `"안심 캠퍼스 맵 (Safe Campus Map)" <${SMTP_USER}>`,
      to: recipientEmail,
      subject: `🛡️ [안심 캠퍼스 맵] 분실물 매칭 알림: '${lostItemTitle}' 유사 물품 등록!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>안심 캠퍼스 맵 매칭 알림</title>
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
              max-width: 520px;
              margin: 0 auto;
              background: rgba(10, 14, 26, 0.75);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 24px;
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
            .match-container {
              background: linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(79, 172, 254, 0.05) 100%);
              border: 1px solid rgba(0, 242, 254, 0.15);
              border-radius: 16px;
              padding: 24px;
              margin: 30px 0;
              text-align: left;
            }
            .match-row {
              display: flex;
              margin-bottom: 12px;
              font-size: 14px;
            }
            .match-label {
              width: 90px;
              color: #8f9cae;
              font-weight: 600;
            }
            .match-val {
              flex: 1;
              color: #ffffff;
              font-weight: 700;
            }
            .match-val.found {
              color: #00f2fe;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
              color: #05070f !important;
              font-weight: 700;
              font-size: 14px;
              text-decoration: none;
              padding: 14px 30px;
              border-radius: 12px;
              margin: 10px 0 30px 0;
              box-shadow: 0 8px 20px rgba(0, 242, 254, 0.3);
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
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="logo">🛡️</div>
              <h1>유사 분실물 매칭 발견!</h1>
              <p class="subtitle">Safe Campus Smart Matching System</p>
              
              <div class="description" style="text-align: left; font-size: 14px; color: #ffffff;">
                안녕하세요, <strong>${recipientName || '사용자'}</strong>님!<br>
                안심 캠퍼스 스마트 매칭 엔진이 등록하신 분실물과 매우 일치도가 높은 습득물 게시글을 실시간으로 감지하여 안내해 드립니다.
              </div>

              <div class="match-container">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 95px; padding: 6px 0; color: #8f9cae; font-size: 13px; font-weight: bold; vertical-align: top;">내 분실물</td>
                    <td style="padding: 6px 0; color: #ffffff; font-size: 14px; font-weight: bold;">${lostItemTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #8f9cae; font-size: 13px; font-weight: bold; vertical-align: top;">매칭 습득물</td>
                    <td style="padding: 6px 0; color: #00f2fe; font-size: 14px; font-weight: bold;">${foundItemTitle}</td>
                  </tr>
                  ${foundItemDesc ? `
                  <tr>
                    <td style="padding: 6px 0; color: #8f9cae; font-size: 13px; font-weight: bold; vertical-align: top;">습득 설명</td>
                    <td style="padding: 6px 0; color: #a0aec0; font-size: 13px; line-height: 1.5;">${foundItemDesc}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <a href="${appUrl}" class="button" target="_blank">안심 캠퍼스에서 확인하기</a>

              <div class="description" style="color: #8f9cae; font-size: 12px; text-align: left;">
                습득자와 연락을 원하시는 경우 앱에 접속해 <strong>실시간 1:1 대화방</strong>을 열고 조율하거나, 지도 상의 **안전 보도 최단 경로(Kakao Navigation)**를 통해 접선 장소로 이동해 주시기 바랍니다.
              </div>

              <div class="footer">
                본 메일은 안심 캠퍼스 스마트 매칭에 동의하신 회원에게 실시간 자동 발송되는 메일입니다.<br>
                유실물 습득 시 안전을 위해 반드시 가로등 밑이나 사람이 많은 공용 공간에서 만나시길 권고합니다.
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
    console.error('Error sending match notification email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send match notification email.' },
      { status: 500 }
    );
  }
}
