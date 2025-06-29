# Civvy – Data Model (v1.0)

_All identifiers are UUIDs unless noted. Timestamps use `UTC ISO-8601`._

---

## 1. High-Level Entity Map
```mermaid
erDiagram
    USER ||--o{ USER_ISSUE_PREFERENCE : follows
    USER ||--o{ FLAG                : creates
    USER ||--o{ QUIZ_ATTEMPT        : takes
    USER ||--o{ METRO_TXN           : earns_spends
    USER ||--o{ REWARD_REDEMPTION   : redeems
    USER ||--o{ VOTE_PLEDGE         : pledges
    USER ||--o{ RATE_LIMIT_LOG      : hits
    USER ||--o{ CAPTCHA_LOG         : passes

    ISSUE ||--o{ USER_ISSUE_PREFERENCE : categorises
    ISSUE ||--o{ QUIZ               : tests

    CANDIDATE ||--o{ CONTENT_ITEM    : owns
    CANDIDATE ||--o{ CONTRADICTION   : involved_in
    CANDIDATE ||--o{ LIVE_SESSION    : hosts

    CONTENT_ITEM ||--o{ CONTRADICTION : compared_with
    CONTRADICTION ||--o{ FLAG        : receives

    QUIZ ||--o{ QUIZ_ATTEMPT        : has

    REWARD ||--o{ REWARD_REDEMPTION  : consumed_by
    MERCHANT ||--o{ REWARD           : offers

    LIVE_SESSION ||--|{ QUESTION     : contains
