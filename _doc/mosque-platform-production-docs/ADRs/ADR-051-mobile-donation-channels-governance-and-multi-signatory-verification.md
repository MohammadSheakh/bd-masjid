# ADR-051: Mobile Mosque Donation Channels Hub, Multi-Signatory Badges, and Financial Governance

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-012 (`F-030`) and ADR-028, the platform instituted verified donation information with two-person multi-signatory consensus and creator provenance to combat financial fraud in mosque fundraising.

In the mobile client (`mobile-app-expo`), `MosqueDetailSheet` previously displayed basic text listings for donation methods without:
1. **Multi-signatory consensus visualization**: Visual proof of leadership endorsement across President, General Secretary, Mutawalli, and Vice President.
2. **Branded financial UX**: Distinct brand styling for Bangladesh's primary mobile financial services (bKash, Nagad, Rocket, Upay) and scheduled commercial banks (Islami Bank, Sonali Bank, etc.).
3. **Safety disclosures**: Explicit warning disclosures separating verified merchant wallets from individual personal numbers.
4. **Creator identity attribution**: Visibility into the specific committee officer who published the account.

---

## Decision

### 1. Extended Donation Channel Contracts (`MosqueDonationMethod`)
We enrich `MosqueDonationMethod` with:
- `creatorName`, `creatorRole`, `creatorImageUrl`
- `bankName`, `branchName`, `routingNumber`
- `verifiedByRoles`: `Array<'PRESIDENT' | 'GENERAL_SECRETARY' | 'VICE_PRESIDENT' | 'MUTAWALLI'>`

### 2. Multi-Signatory Consensus Badges
Each donation item renders an attestation matrix reflecting committee consensus:
- **Active Endorsement**: Rendered with an emerald green checkmark pill (`text-[#059669] bg-[#ecfdf5] border-[#a7f3d0]`), e.g. `✓ President`, `✓ General Secretary`.
- **Pending Attestation**: Rendered in a muted tone (`text-[#9ca3af] bg-[#fafafa] border-[#e8e8ea]`), e.g. `○ Mutawalli (pending)`.

### 3. Financial Brand Palette & Safety Disclosures
- **bKash**: Brand `#e2136e` badge with USSD hint `*247#`.
- **Nagad**: Brand `#f7941d` badge with USSD hint `*167#`.
- **Rocket**: Brand `#8c3494` badge with USSD hint `*322#`.
- **Bank Transfer**: Slate navy `#1e3a8a` with Bank Name, Branch, and Account Title.
- **Account Type Guardrail**: Personal accounts trigger an amber safety banner: `⚠️ Personal Number: Please verify with committee before transferring large amounts`.

### 4. Modular `DonationChannelsCard` Component
We isolate donation display into `DonationChannelsCard.tsx`:
- 1-tap clipboard copying with 2-second visual feedback (`Copied!`).
- Direct telephone / USSD guidance.
- Clean Ferio card layout conforming to `< 65MB` idle memory budget.

---

## Consequences

### Positive
- **ADR-028 Parity**: Full parity with web platform's multi-signatory financial transparency.
- **Anti-Fraud Security**: Worshippers can immediately distinguish between official merchant accounts and individual personal accounts.
- **Ferio Aesthetic**: Clean, responsive brand badges, accessible tap targets ($\ge 44$pt), and bilingual support.

### Negative / Trade-offs
- Multiple donation accounts take vertical space in the detail sheet.
- *Mitigation*: Collapsible layout when a mosque lists more than 3 accounts.
