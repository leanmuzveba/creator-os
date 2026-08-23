/**
 * Legal pages served for Meta & TikTok app verification: Privacy Policy and
 * Terms of Service, rendered as standalone HTML documents.
 */
import { Router } from 'express';

export const legalRouter = Router();

legalRouter.get(['/privacy', '/privacy-policy'], (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Privacy Policy - Creator OS</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0d17; color: #e2e8f0; line-height: 1.6; padding: 40px 20px; margin: 0; }
          .container { max-width: 760px; margin: 0 auto; background: #131627; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; }
          h1 { color: #fff; font-size: 28px; margin-top: 0; }
          h2 { color: #f43f5e; font-size: 18px; margin-top: 28px; }
          p, li { color: #94a3b8; font-size: 14px; }
          ul { padding-left: 20px; }
          .badge { display: inline-block; background: rgba(244,63,94,0.15); color: #f43f5e; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
          a { color: #38bdf8; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">Legal Document</div>
          <h1>Privacy Policy</h1>
          <p><strong>Effective Date:</strong> January 1, 2026 | <strong>Last Updated:</strong> August 15, 2026</p>

          <p>Creator OS ("we", "our", or "us") operates the Creator OS content creation and scheduling platform. This Privacy Policy describes how we collect, use, and protect your information when you authenticate through social media platforms including Meta (Facebook and Instagram) and TikTok.</p>

          <h2>1. Information We Collect</h2>
          <p>When you connect your social media accounts via OAuth, we only collect the minimum information required to display your creator stats and manage content:</p>
          <ul>
            <li><strong>Public Profile Information:</strong> Display name, username/handle, and avatar image.</li>
            <li><strong>Creator Analytics:</strong> Follower counts, video/post performance statistics, views, likes, and engagement figures.</li>
            <li><strong>Authorization Tokens:</strong> Secure OAuth access tokens used strictly on your behalf to fetch analytics or schedule posts.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information exclusively to provide and enhance Creator OS services:</p>
          <ul>
            <li>Displaying unified multi-platform analytics on your creator dashboard.</li>
            <li>Enabling content scheduling and automated publishing to your linked accounts.</li>
            <li>Generating AI-assisted video scripts and hooks tailored to your content niche.</li>
          </ul>

          <h2>3. Data Storage & Security</h2>
          <p>We implement industry-standard encryption protocols. We never sell, trade, or rent your personal data or social media tokens to third parties.</p>

          <h2>4. User Rights & Data Deletion</h2>
          <p>You can revoke access to your connected accounts at any time through the <strong>Connected Accounts</strong> settings modal in Creator OS or through your account settings on Facebook, Instagram, or TikTok. Upon disconnection, stored authorization tokens are immediately purged.</p>

          <h2>5. Contact Us</h2>
          <p>If you have any questions regarding this Privacy Policy, please contact our support team at <a href="mailto:leanne1mu@gmail.com">leanne1mu@gmail.com</a>.</p>
        </div>
      </body>
    </html>
  `);
});

legalRouter.get(['/terms', '/terms-of-service'], (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Terms of Service - Creator OS</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0d17; color: #e2e8f0; line-height: 1.6; padding: 40px 20px; margin: 0; }
          .container { max-width: 760px; margin: 0 auto; background: #131627; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; }
          h1 { color: #fff; font-size: 28px; margin-top: 0; }
          h2 { color: #38bdf8; font-size: 18px; margin-top: 28px; }
          p, li { color: #94a3b8; font-size: 14px; }
          ul { padding-left: 20px; }
          .badge { display: inline-block; background: rgba(56,189,248,0.15); color: #38bdf8; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">Terms & Conditions</div>
          <h1>Terms of Service</h1>
          <p><strong>Effective Date:</strong> January 1, 2026</p>
          <p>By using Creator OS, you agree to comply with these terms, as well as the platform terms and developer policies of Meta (Facebook, Instagram) and TikTok.</p>
          <h2>1. Use of Services</h2>
          <p>You agree to use Creator OS solely for lawful creator workflow management, scheduling, and analytics tracking.</p>
          <h2>2. Intellectual Property</h2>
          <p>You retain full ownership of all scripts, video assets, and content created or scheduled via Creator OS.</p>
        </div>
      </body>
    </html>
  `);
});
