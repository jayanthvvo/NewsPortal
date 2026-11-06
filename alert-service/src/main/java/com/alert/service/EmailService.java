package com.alert.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:newsportal-admin@example.com}")
    private String senderEmail;

    /**
     * Backward-compatible plain text breaking news dispatch.
     */
    public void sendBreakingNews(String toEmail, String subject, String message) {
        sendBreakingNews(toEmail, subject, message, null, null, "BREAKING");
    }

    /**
     * Modern rich HTML breaking news dispatch with linked article CTA button.
     */
    public void sendBreakingNews(String toEmail, String subject, String message, Long articleId, String articleTitle, String priority) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String fromAddress = (senderEmail != null && !senderEmail.isBlank()) ? senderEmail : "newsportal-admin@example.com";
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);

            String priorityLabel = (priority != null && !priority.isBlank()) ? priority.toUpperCase() : "BREAKING";
            helper.setSubject("🚨 " + priorityLabel + ": " + subject);

            String articleUrl = (articleId != null) 
                    ? "http://localhost:5173/article/" + articleId 
                    : "http://localhost:5173/articles";
            String ctaLabel = (articleId != null) ? "Read Full Story on NewsPortal →" : "Open NewsPortal Feed →";

            String html = buildRichBreakingNewsHtml(subject, message, articleTitle, articleUrl, ctaLabel, priorityLabel);
            helper.setText(html, true);

            mailSender.send(mimeMessage);
            System.out.println("✅ SUCCESS: Rich Breaking News HTML email sent to " + toEmail);
        } catch (Exception e) {
            System.err.println("⚠️ Warning: Failed to send HTML email to " + toEmail + ", falling back to text. Error: " + e.getMessage());
            try {
                // Fallback to simple mail message
                SimpleMailMessage fallback = new SimpleMailMessage();
                fallback.setTo(toEmail);
                fallback.setSubject("BREAKING NEWS: " + subject);
                fallback.setText(message + (articleId != null ? "\n\nRead full coverage: http://localhost:5173/article/" + articleId : ""));
                fallback.setFrom(senderEmail != null && !senderEmail.isBlank() ? senderEmail : "newsportal-admin@example.com");
                mailSender.send(fallback);
            } catch (Exception ex) {
                System.err.println("❌ ERROR: Both HTML and plain email failed for " + toEmail + ": " + ex.getMessage());
            }
        }
    }

    public void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail != null && !senderEmail.isBlank() ? senderEmail : "newsportal-admin@example.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            System.out.println("✅ SUCCESS: Email sent to " + to);
        } catch (Exception e) {
            System.err.println("❌ ERROR: Failed to send email to " + to);
            e.printStackTrace();
            throw new RuntimeException("Email failed to send", e);
        }
    }

    private String buildRichBreakingNewsHtml(String headline, String message, String articleTitle, String articleUrl, String ctaLabel, String priorityLabel) {
        String displayHeadline = (headline != null && !headline.isBlank()) ? headline : "Developing Breaking News";
        String displayMessage = (message != null && !message.isBlank()) ? message : "Our editorial team is monitoring this breaking development.";
        String referencedStory = (articleTitle != null && !articleTitle.isBlank()) ? articleTitle : displayHeadline;

        return "<!DOCTYPE html>"
                + "<html lang=\"en\">"
                + "<head>"
                + "<meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<title>Breaking News Alert</title>"
                + "<style>"
                + "  body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }"
                + "  .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 30px 10px; }"
                + "  .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); }"
                + "  .banner { background: linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #991b1b 100%); padding: 24px 28px; color: #ffffff; }"
                + "  .badge { display: inline-block; background: rgba(255, 255, 255, 0.95); color: #dc2626; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 999px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }"
                + "  .portal-name { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; margin-bottom: 4px; font-weight: 600; }"
                + "  .banner-title { font-size: 22px; font-weight: 800; line-height: 1.25; margin: 0; color: #ffffff; }"
                + "  .content { padding: 32px 28px; }"
                + "  .flash-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px; }"
                + "  .flash-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #991b1b; letter-spacing: 0.5px; margin-bottom: 6px; }"
                + "  .flash-text { font-size: 15px; line-height: 1.6; color: #1e293b; margin: 0; white-space: pre-wrap; }"
                + "  .story-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 28px; }"
                + "  .story-tag { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }"
                + "  .story-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; line-height: 1.4; }"
                + "  .cta-button { display: inline-block; background: #dc2626; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35); text-align: center; transition: all 0.2s; }"
                + "  .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class=\"wrapper\">"
                + "  <div class=\"card\">"
                + "    <div class=\"banner\">"
                + "      <div class=\"portal-name\">NewsPortal • Editorial Dispatch</div>"
                + "      <span class=\"badge\">🚨 " + priorityLabel + " ALERT</span>"
                + "      <h1 class=\"banner-title\">" + displayHeadline + "</h1>"
                + "    </div>"
                + "    <div class=\"content\">"
                + "      <div class=\"flash-box\">"
                + "        <div class=\"flash-label\">Urgent Editorial Bulletin</div>"
                + "        <p class=\"flash-text\">" + displayMessage + "</p>"
                + "      </div>"
                + "      <div class=\"story-card\">"
                + "        <div class=\"story-tag\">Verified Coverage</div>"
                + "        <h2 class=\"story-title\">" + referencedStory + "</h2>"
                + "        <div style=\"font-size: 12px; color: #64748b; margin-top: 6px;\">Stay informed with verified journalism, investigative updates, and global analysis.</div>"
                + "      </div>"
                + "      <div style=\"text-align: center; margin: 10px 0 20px 0;\">"
                + "        <a href=\"" + articleUrl + "\" class=\"cta-button\" target=\"_blank\">" + ctaLabel + "</a>"
                + "      </div>"
                + "    </div>"
                + "    <div class=\"footer\">"
                + "      You are receiving this critical broadcast because you are a registered reader of <strong>NewsPortal</strong>.<br>"
                + "      © 2026 NewsPortal Digital Inc. All rights reserved."
                + "    </div>"
                + "  </div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }
}
