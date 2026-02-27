# GL365 Loops — Full Product Specification

Brainstorming Document
Status: Draft — Internal Only
Created: 2026-02-26
Author: Jared Tucker (Creator, GL365)
File: docs/brainstorming/loops-brainstorming.md

---

## IMPORTANT CONTEXT

GL365 is NOT a bank. GL365 does NOT process payments. The QR Shield system charges a per-scan transaction fee to the business. The business passes that cost along to the consumer however they choose. GL365 never touches the actual payment between consumer and business.

## SPONSORSHIP MODEL — KEY DECISION (2026-02-27)

**All Lifestyle Loops and Competitive League experiences are SPONSORED BY GL365.** These are not directly monetized products that businesses or users pay for. GL365 funds and operates these engines as platform-level engagement tools. They drive foot traffic to directory businesses, keep users on the platform, and build the community flywheel. The revenue engine is the Directory (listings, subscriptions, Command Center, Home Ledger) — Loops and Leagues are the magnets that feed it.

---

## ARCHITECTURE: TWO SEPARATE ENGINES

Loops is categorized into two distinct engines. The technical architecture for Social Discovery (Lifestyle) must NOT get tangled with the Competitive Infrastructure (Leagues). Treat these as two separate microservices that share a common Identity & Media Vault.

| Aspect | Engine 1: Lifestyle & Entertainment | Engine 2: Competitive Leagues |
|--------|-------------------------------------|-------------------------------|
| Description | "Social Discovery" engine | "Sports Management" engine |
| Purpose | High-frequency, low-friction engagement | Professional-grade amateur competition |
| Primary User | Individual Consumer / Tourist | League Commissioner |
| Billed To | The Individual User | The League Creator |
| Subscription | $4.99 (Plus) or $9.99 (Pro) /mo | $228 Annual Value per Season |
| Discount | Standard annual discount | 20% off upfront ($182.40) |
| AI Role | Navigation & Storytelling | Refereeing & Stats |
| Revenue Model | Recurring SaaS | Installment-based Seasonal Fee |
| Tech Focus | GPS, Geofencing, "Fog of War" map logic | Vision Parser (Scoreboard OCR), Manual Ledger |

---

## ENGINE 1: LIFESTYLE & ENTERTAINMENT LOOPS

### Description

This is the "Social Discovery" engine. Designed for high-frequency, low-friction engagement. Its goal is to keep users inside the Greenline365 ecosystem by providing utility (coupons), entertainment (games), and memory-making (AI recaps). This is the primary driver for mass-market subscriptions.

### How It Works

**Step 1 — The Entry Point:**
A user meets friends at a "Starting Point" (Airport, Home, or Bar). They "Handshake" by scanning each other's permanent QR codes to mesh their phones.

**Step 2 — The Identity Gate:**
If they haven't already, they take a one-time Identity Selfie. The Memory Weaver (Gemini 3.1 Pro) creates a face vector to "follow" them through the loop.

**Step 3 — The Fog of War:**
The loop is a series of hidden pins on a map. The next destination is only revealed when the squad scans the QR code at the current location. Users cannot see ahead — they discover each stop as they go.

**Step 4 — Self-Healing Logic:**
The Local Scout (SambaNova Sonic) monitors weather/traffic in real-time. If it rains, the agent automatically "heals" the loop by swapping an outdoor park for an indoor cafe. No manual intervention needed.

**Step 5 — The Viral Output:**
At the end, the AI generates a "Powered by Greenline365" video collage of the squad's best moments, identified automatically by their faces.

### Loop Types (Lifestyle)

| Type | Description |
|------|-------------|
| **Treasure / Scavenger Hunts** | Urban exploration with riddle-based reveals |
| **Special Events** | Bridesmaid "Blind Planning," Birthday surprises, Bachelor loops |
| **Wellness Loops** | "Self-Healing" resets (Gym -> Juice Bar -> Park) |

---

## ENGINE 2: COMPETITIVE LEAGUE LOOPS

### Description

This is the "Sports Management" engine. It functions as professional-grade infrastructure for amateur competition. It turns any recurring social game into a formal league with a "Digital Front Office." This is a separate business entity within the app that targets "Commissioners" who want to lead their community.

### How It Works

**Step 1 — The Commish Setup:**
A user (The Commissioner) pays the seasonal platform fee ($228 base). They define the sport, the season length, and the "Banker" rules (how they will physically collect cash).

**Step 2 — The Sign-In:**
On game night, players scan the Community QR at the venue. Their Identity Passport verifies their presence on the court/lane.

**Step 3 — The Universal Referee:**
Instead of manual entry, players snap a photo of the final scoreboard (LED, Chalk, or Paper). Gemini 3.1 Pro extracts the data; Claude 4.6 updates the league standings. No typing. No arguing.

**Step 4 — The League Hub:**
Each league gets a dynamic landing page (`/leagues/key-west-darts`) featuring a live leaderboard, trash-talk threads, and a "Wall of Fame" of match-day reels.

**Step 5 — The Banker Model:**
Greenline365 has ZERO liability for prize money. The Commissioner manages the physical "Pot" of cash. The app provides the "Source of Truth" for who won. GL365 never touches the money.

### League Types (Competitive)

| Category | Examples |
|----------|----------|
| **Traditional Sports** | Bowling, Darts, Billiards, Flag Football, Pickleball |
| **Hobby Leagues** | Esports, Trivia, Cornhole, Axe Throwing |

---

## SHARED INFRASTRUCTURE

Both engines share:

1. **Identity & Media Vault** — Face vectors, QR wallet, media storage
2. **QR Wallet System** — Permanent personal QR code for handshakes + venue scanning
3. **Transaction Fee Model** — $0.60 per scan to business (passed to consumer)

### AI Model Assignments

| Task Type | Model | Use Case |
|-----------|-------|----------|
| **Reflex Tasks** (instant) | SambaNova Sonic (via OpenRouter) | Instant leaderboards, transit updates, weather rerouting |
| **Creative Tasks** (rich) | Gemini 3.1 Pro | Video reels, scoreboard OCR, face recognition, Memory Weaver |
| **Logic Tasks** (reasoning) | Claude 4.6 | League standings updates, rule interpretation, stat calculations |

---

## PRICING SUMMARY

| Feature | Lifestyle/Entertainment | Competitive League |
|---------|------------------------|-------------------|
| Primary User | Individual Consumer/Tourist | League Commissioner |
| Billed To | The Individual User | The League Creator |
| Subscription | $4.99 (Plus) or $9.99 (Pro) /mo | $228 Annual Value per Season |
| Discount | Standard annual discount | 20% off upfront ($182.40) |
| AI Role | Navigation & Storytelling | Refereeing & Stats |
| Revenue Model | Recurring SaaS | Installment-based Seasonal Fee |

---

## STATUS

**This is NOT the current priority.** The GL365 Business Directory is the primary focus. Loops is documented here for future development. The directory must be revenue-ready before Loops development begins.

---

## OPEN QUESTIONS

- Who creates Lifestyle Loops? GL365 curators? Business owners? AI-generated?
- How does the "Handshake" QR mesh technically work? Bluetooth? NFC? Pure QR?
- What's the minimum squad size for a Lifestyle Loop?
- How does the Commissioner handle disputes in League Loops?
- Can a Commissioner run multiple leagues simultaneously?
- What happens if a business on a Lifestyle Loop closes or has bad reviews?
- How does the Self-Healing Logic choose replacement venues?
- What's the Identity Selfie privacy model? On-device only? Cloud storage?
- How do we handle the face vector GDPR/privacy implications?
- What's the revenue split if a business pays to be featured on popular Loops?

---

## NOTES FROM BRAINSTORMING SESSIONS

**Session 1 — Feb 26, 2026 (Jared Tucker)**

Core principles established:
- GL365 is NOT a bank and NOT a payment processor
- Two-engine architecture: Lifestyle (social discovery) vs. Leagues (sports management)
- Fog of War mechanic for Lifestyle Loops (hidden pins, reveal on arrival)
- Self-Healing Logic via Local Scout for weather/traffic rerouting
- Universal Referee via Scoreboard OCR for League Loops
- Banker Model: GL365 has zero liability for prize money
- AI video collage as viral output mechanism
- Commissioner as the paying customer for League Loops

---
