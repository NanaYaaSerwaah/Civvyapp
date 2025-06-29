# Civvy – Sprint Plan (v1.0)  
*Environment: [Bolt.new](https://bolt.new) — assume 2-week iterations, GitHub + Linear for tracking.*

---

## Sprint 0 — Project Setup & Guardrails  *(1 week)*  
| Goal | Tasks | Acceptance Criteria |
|------|-------|---------------------|
| Lay secure foundation with minimal code churn. | • Fork Bolt boilerplate; scaffold **User**, **Issue**, **Reward** micro-services reusing existing models.<br>• Add global **rate-limit middleware** (60 req/min/IP, env-tunable).<br>• Integrate **Captcha** (hCaptcha) on `/signup`, `/login`, `/flag` endpoints.<br>• CI/CD pipeline + lint/test hooks. | ✔ All three services compile & deploy to staging.<br>✔ Rate-limit returns `429` on flood test.<br>✔ Captcha token verified on protected routes.<br>✔ Tests pass in CI. |

---

## Sprint 1 — Issue-First Onboarding *(2 weeks)*  
| Goal | Tasks | Acceptance Criteria |
|------|-------|---------------------|
| Ship bias-safe personalization flow. | • Build `POST /onboarding` (stores 4 answers + ZIP).<br>• Implement **IssueMatcher** algorithm w/ surprise-topic injection.<br>• Reuse Bolt UI form components; **limit new CSS**.<br>• Unit tests for topic diversity check. | ✔ 95 % of onboarding sessions complete < 45 s.<br>✔ Feed API returns ≥ 1 surprise topic per user seed.<br>✔ Code coverage ≥ 80 % for IssueMatcher. |

---

## Sprint 2 — Swipe-Flag-Fact Feed *(2 weeks)*  
| Goal | Tasks | Acceptance Criteria |
|------|-------|---------------------|
| Deliver IG-style feed with AI contradiction overlay. | • Create `GET /feed` (stories, reels, carousel).<br>• Integrate **FactHunter** NLP micro-service (Python) via gRPC.<br>• Build `POST /flag` with Captcha + rate-limit.<br>• UI overlay for contradiction confidence & sources.<br>• Human moderation queue MVP. | ✔ Feed p95 latency < 300 ms on 4G.<br>✔ Contradiction overlay shows on ≥ 70 % of candidate clips.<br>✔ Flag → moderation workflow round-trip < 5 min.<br>✔ All endpoints respect rate-limits. |

---

## Sprint 3 — MetroPoints Rewards *(2 weeks)*  
| Goal | Tasks | Acceptance Criteria |
|------|-------|---------------------|
| Gamify civic actions with tangible perks. | • Implement **RewardMaster**: XP→MetroPoints conversion (100:1).<br>• Create `POST /quiz_attempt`, `POST /vote_pledge` events.<br>• Stub integration with OMNY sandbox & Merchant API mock.<br>• Wallet UI; redemption flow with Captcha. | ✔ XP updates in real time; MetroPoints ledger consistent.<br>✔ Redemption deducts balance & records `METRO_TXN`.<br>✔ Fraud check blocks duplicate pledges within 24 h. |

---

## Sprint 4 — Trust & Audit Layer *(2 weeks)*  
| Goal | Tasks | Acceptance Criteria |
|------|-------|---------------------|
| Strengthen transparency and security. | • Ship **IntegrityGuardian** reputation scoring.<br>• Append hashed entries to `AUDIT_LOG` on moderation actions.<br>• Build read-only audit feed endpoint for watchdogs.<br>• Security review & pen-test remediation. | ✔ Moderation decisions appear in audit feed within 60 s.<br>✔ Reputation score adjusts flag weight (unit test).<br>✔ Zero high-severity vulns in pen-test report. |

---

## Sprint 5 — Pilot & Analytics *(2 weeks)*  
| Goal | Tasks | Acceptance Criteria |
|------|-------|---------------------|
| Prepare for limited rollout and gather insights. | • Feature flag precinct pilot cohort.<br>• Instrument KPIs (Mixpanel): onboarding completion, contradictions/100 views, MetroPoints redemption.<br>• Build simple **campaign analytics dashboard** (read-only).<br>• UXR feedback loop. | ✔ Real-time dashboard shows pilot metrics.<br>✔ Pilot DAU/MAU ≥ 45 %.<br>✔ MetroPoints redemption rate ≥ 20 % first 7 days. |

---

### Definition of Done (per Sprint)
1. All **NFRs met**: Captcha active, endpoints rate-limited, code reuse > 70 % existing libs.  
2. **Unit & integration tests** ≥ 80 % coverage.  
3. **WCAG 2.2 AA** accessibility checked on new UI.  
4. Deployed to staging; smoke tests pass; release notes published.

*End of Sprint Plan*
