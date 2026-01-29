
# Production Readiness Roadmap for Keystone Analytics

## Executive Summary

Keystone Analytics is a well-architected stock trading intelligence platform with a solid foundation including authentication, subscription billing (Stripe), charting (lightweight-charts), AI-powered analysis, and an educational academy. This roadmap outlines the remaining work to achieve a fully functional production model.

---

## Current State Assessment

### What's Already Built ✅

| Category | Status | Details |
|----------|--------|---------|
| **Authentication** | Complete | Email/password signup, password reset, session management |
| **Subscription Billing** | Complete | Stripe integration, Pro/Elite tiers, webhook handling, customer portal |
| **Market Data** | Functional | FMP, Finnhub, Alpha Vantage integrations for quotes and charts |
| **Charting** | Functional | Candlestick, volume, RSI, MACD, SMA, EMA, Bollinger Bands |
| **AI Features** | Functional | Stock Coach chat, Decision Engine, AI Tutor |
| **Academy** | Complete | 4-level learning path, quizzes, progress tracking |
| **Watchlists** | Complete | CRUD operations with subscription-based limits |
| **News Feed** | Functional | Real-time financial news integration |
| **Settings** | Complete | Profile, notifications, theme, password change |

---

## Priority 1: Critical Security Fixes (Must Have Before Launch)

### 1.1 Email Endpoint Authentication
**Severity: HIGH** | **Effort: 2-3 hours**

Three edge functions accept requests without authentication:
- `send-welcome-email`
- `send-subscription-email`
- `send-trial-expiry`

```text
Impact: Anyone can trigger email sends, enabling spam/phishing attacks
Fix: Add JWT token verification to all email edge functions
```

### 1.2 Fix AI Tutor Authentication Token
**Severity: HIGH** | **Effort: 30 minutes**

The `KeystoneTutorChat` component sends the Supabase publishable key instead of the user's JWT:
```text
Current: Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
Should be: Authorization: `Bearer ${session.access_token}`
```

### 1.3 Email Input Validation
**Severity: MEDIUM** | **Effort: 1 hour**

Add email format validation and HTML sanitization for display names in email templates to prevent injection attacks.

### 1.4 Academy Quizzes RLS Policy
**Severity: LOW** | **Effort: 15 minutes**

Add explicit anonymous blocking policy to `academy_quizzes` table:
```sql
CREATE POLICY "Block anonymous reads on academy_quizzes"
ON public.academy_quizzes FOR SELECT
USING (auth.uid() IS NOT NULL);
```

---

## Priority 2: Core Functionality Gaps

### 2.1 Price Alerts System
**Status: Not Implemented** | **Effort: 1-2 days**

Currently shown in pricing but not functional. Requires:
- Database table for user alerts
- Background job/cron to check price conditions
- Push notification delivery (web push or email)
- UI for managing alerts in Settings

### 2.2 Intraday Chart Data
**Status: Limited** | **Effort: 4-6 hours**

FMP free tier restricts intraday data. Options:
1. **Upgrade FMP plan** to premium tier for 1H/4H data
2. **Alternative provider**: Polygon.io, Twelve Data, or Yahoo Finance API
3. **Hybrid approach**: Use free EOD data + premium for intraday during market hours

### 2.3 Chart Drawing Tools
**Status: Not Implemented** | **Effort: 2-3 days**

Production trading platforms need:
- Trend lines
- Fibonacci retracements
- Horizontal support/resistance levels
- Annotations/notes
- Drawing persistence (save to database)

### 2.4 Mobile Responsiveness Audit
**Status: Partial** | **Effort: 1-2 days**

Full responsive testing needed for:
- Chart touch interactions
- Sidebar collapse behavior
- Analysis page layout on tablets
- Modal/dialog sizing on small screens

---

## Priority 3: Performance & Reliability

### 3.1 Rate Limiting
**Effort: 2-4 hours**

Implement rate limiting on edge functions to prevent abuse:
- API key-based limits for market data functions
- User-based limits for AI features
- IP-based limits for unauthenticated endpoints

### 3.2 Error Monitoring
**Effort: 2-3 hours**

The `app_metrics` table exists but needs:
- Frontend integration to capture errors systematically
- Dashboard/admin view for monitoring
- Alert triggers for error spikes

### 3.3 API Key Fallback Strategy
**Effort: 1-2 hours**

Current implementation has fallback chains but could be more robust:
- Retry logic with exponential backoff
- Circuit breaker pattern for failing providers
- Graceful degradation UI messaging

### 3.4 Database Query Optimization
**Effort: 2-4 hours**

- Review indexes on frequently queried tables
- Analyze slow queries in Supabase logs
- Add composite indexes for common filter patterns

---

## Priority 4: Feature Completion

### 4.1 Two-Factor Authentication
**Status: Placeholder** | **Effort: 4-6 hours**

Currently shows "Coming Soon" toast. Implement using:
- Supabase MFA with TOTP
- Backup codes
- Recovery flow

### 4.2 Chart Sharing
**Status: Partial** | **Effort: 4-6 hours**

`ChartShareButton` exists but needs:
- Server-side image generation for social previews
- Shareable URL with chart configuration
- Public chart view page

### 4.3 Portfolio Tracking
**Status: Not Implemented** | **Effort: 2-3 days**

Add ability to:
- Track owned positions
- Calculate P&L
- Performance visualization over time

### 4.4 Earnings Calendar
**Status: Listed but not visible** | **Effort: 1 day**

Add earnings calendar widget showing:
- Upcoming earnings for watchlist stocks
- Earnings surprises history
- Estimates vs actuals

---

## Priority 5: Pre-Launch Checklist

### 5.1 Legal & Compliance
- [ ] Financial disclaimer on all analysis pages (exists but verify coverage)
- [ ] Terms of Service review for investment advice disclaimers
- [ ] Privacy policy GDPR compliance audit
- [ ] Cookie consent banner if needed

### 5.2 SEO & Marketing
- [ ] Meta tags on all public pages
- [ ] OG images for social sharing
- [ ] Sitemap.xml (exists at `/sitemap.xml`)
- [ ] robots.txt optimization

### 5.3 Analytics
- [ ] Page view tracking
- [ ] Conversion funnel: Landing → Signup → Dashboard → Upgrade
- [ ] Feature usage analytics

### 5.4 Testing
- [ ] E2E tests for critical flows (auth, checkout, core features)
- [ ] Load testing for market data endpoints
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility audit (WCAG 2.1 AA)

### 5.5 Infrastructure
- [ ] Custom domain SSL verification
- [ ] CDN caching headers for static assets
- [ ] Database backup strategy confirmation
- [ ] Uptime monitoring (Pingdom, UptimeRobot, etc.)

---

## Implementation Roadmap

### Phase 1: Security Hardening (Week 1)
| Task | Estimated Time |
|------|----------------|
| Fix email endpoint authentication | 3 hours |
| Fix AI tutor token issue | 30 minutes |
| Add email input validation | 1 hour |
| Add academy_quizzes RLS policy | 15 minutes |
| Add rate limiting to edge functions | 4 hours |

### Phase 2: Core Features (Weeks 2-3)
| Task | Estimated Time |
|------|----------------|
| Implement price alerts system | 2 days |
| Resolve intraday data provider | 6 hours |
| Mobile responsiveness audit | 2 days |
| Error monitoring integration | 3 hours |

### Phase 3: Polish & Enhancement (Weeks 4-5)
| Task | Estimated Time |
|------|----------------|
| Chart drawing tools | 3 days |
| Two-factor authentication | 6 hours |
| Chart sharing completion | 6 hours |
| Performance optimization | 4 hours |

### Phase 4: Launch Preparation (Week 6)
| Task | Estimated Time |
|------|----------------|
| E2E testing suite | 2 days |
| Legal/compliance review | 1 day |
| Analytics integration | 4 hours |
| Load testing | 4 hours |
| Cross-browser/accessibility audit | 1 day |

---

## Summary

**Minimum Viable Production (MVP)**: Complete Priority 1 (security fixes) + Priority 5 (pre-launch checklist). This is approximately **1-2 weeks** of focused work.

**Full Production Release**: Complete all priorities. This is approximately **5-6 weeks** of development time.

The application has a strong foundation with authentication, billing, and core features already working. The primary gaps are security hardening, price alerts implementation, and comprehensive testing.
