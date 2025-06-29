# Civvy – Product Requirements Document (PRD)

| **Version** | 1.0 |
|-------------|-----|
| **Author**  | Product Team – Civvy |
| **Date**    | 2025-06-29 |

---

## 1. Purpose

Create **Civvy**, a mobile-first, Instagram-style platform that empowers New Yorkers to make informed, bias-safe voting decisions through AI-driven fact-checking and a gamified reward system—all while keeping code churn low, enforcing strong rate-limits, and protecting users with Captcha.

---

## 2. Problem Statement

* Local races suffer from low turnout because voters can’t quickly find clear, non-partisan facts—or see tangible value for doing so.
* Information is fragmented, often contradictory, and buried in partisan feeds.
* Time-pressed and lower-income residents lack incentives to stay engaged.

---

## 3. Goals & Success Metrics

| Goal | KPI / Target |
|------|--------------|
| Deliver bias-safe personalized feed | ≥ 80 % of users rate relevance ≥ 4/5 after onboarding |
| Increase local election turnout | +5 pp turnout in pilot precincts YoY |
| Encourage fact-checking | ≥ 2 contradictions flagged per 100 content views |
| Reward engagement | ≥ 30 % of MetroPoints redeemed within 30 days |
| Maintain performance & security | p95 API latency < 300 ms, zero major data-privacy incidents |

---

## 4. Product Scope

### 4.1 Core Features (MVP)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Issue-First Onboarding** | 4-question survey (issues, format preference, reminders, cadence) → generates bias-safe topic set. |
| 2 | **Feed (“Swipe-Flag-Fact”)** | IG-style Stories/Reels/Carousel; AI overlay surfaces real-time contradictions; user can flag, share, quiz. |
| 3 | **MetroPoints Rewards** | XP → MetroPoints redeemable for OMNY fare & local-merchant perks. |
| 4 | **Town-Hall Live** | Verified candidates answer top-voted questions in live stream. |
| 5 | **Privacy & Trust Layer** | End-to-end encrypted DMs, open moderation log, NO partisan profiling. |

### 4.2 Out-of-Scope (Backlog)

* Candidate fundraising tools  
* In-app public-office voting  
* Nationwide expansion

---

## 5. User Personas

1. **Mission-Minded Millennials** (24-40) – want quick, trustworthy insights.  
2. **Transit-Reliant Voters** (18-55) – motivated by OMNY credits.  
3. **First-Time Student Voters** (18-23) – engage via mock ballots & quizzes.

---

## 6. Functional Requirements

| FR-ID | Requirement |
|-------|-------------|
| FR-1 | System shall present a 4-question onboarding survey and inject at least one “surprise” topic per user session. |
| FR-2 | Feed shall display AI-detected contradictions with confidence score ≥ 0.7 and source links. |
| FR-3 | Users shall earn XP for quizzes, contradiction flags, and vote pledges; XP converts to MetroPoints at a 100:1 ratio. |
| FR-4 | Users shall redeem MetroPoints via secure calls to OMNY and participating merchant APIs. |
| FR-5 | Only verified candidates may host Town-Hall Live sessions (photo-ID + BoE cross-check). |

---

## 7. Non-Functional Requirements

| NFR-ID | Requirement |
|--------|-------------|
| NFR-1 | **Limit code changes to a minimum**—reuse existing UI components and shared services wherever possible. |
| NFR-2 | **Rate-limit all API endpoints** (default: 60 requests / minute / IP; adjustable via env variables). |
| NFR-3 | **Enable Captcha** (hCaptcha or reCAPTCHA v3) on login, signup, and flag-submit flows. |
| NFR-4 | p95 end-to-end latency ≤ 300 ms for feed load on 4G. |
| NFR-5 | WCAG 2.2 AA compliance; support EN, ES, ZH, BN, HT at launch. |
| NFR-6 | Encrypt PII at rest and in transit (AES-256 + TLS 1.3). |

---

## 8. Technical Architecture (High Level)

```mermaid
flowchart LR
    subgraph Client
        A[Mobile App] --> B[Captcha]
    end
    subgraph Backend
        C[API Gateway<br/>Rate-Limiter] --> D[Auth Service]
        C --> E[Feed Service]
        E --> F[IssueMatcher Agent]
        E --> G[FactHunter Agent]
        D --> H[RewardMaster Agent]
        G -->|Validated flags| H
        G --> I[Moderation Queue]
        J[IntegrityGuardian] --> E
    end
    B --> D
    H --> K[OMNY / Merchant APIs]
