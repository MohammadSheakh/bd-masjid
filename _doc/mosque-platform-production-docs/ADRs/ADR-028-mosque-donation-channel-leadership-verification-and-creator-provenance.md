# ADR-028: Mosque Donation Channel Leadership Verification and Creator Provenance Governance

## Status
**Accepted**

## Date
2026-10-04

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-012 (`F-030`), the platform instituted verified donation information with two-person verification to prevent financial fraud. However, two operational frictions emerged:
1. **Central Platform Bottleneck**: Requiring central platform administrators to approve local mosque financial accounts created delays and conflicted with the autonomous governance of mosque committees in Bangladesh.
2. **Lack of Visual Creator Provenance**: Worshippers and donors donating via mobile banking or bank transfer need to know precisely which trusted mosque official established the account, their role in that mosque, and visual identity (photo).
3. **Absence of Multi-Role Leadership Attestation**: A single verification flag does not reflect whether all key committee stakeholders (President, General Secretary, Vice President, Mutawalli) endorse the account. Donors need visual proof of consensus: if the President created or verified the channel, it should display a distinct green tick for President while other positions indicate pending attestation until endorsed.
4. **Committee Multiplicity**: Mosque committees in Bangladesh routinely comprise multiple Vice Presidents and multiple Committee Members.

---

## Decision

### 1. Restricted Executive Channel Creation (No Platform Admin Bottleneck)
- Only verified mosque committee executives can create donation channels:
  - `MUTAWALLI` (Mutawalli)
  - `COMMITTEE_PRESIDENT` (President)
  - `COMMITTEE_VICE_PRESIDENT` (Vice President)
  - `COMMITTEE_SECRETARY` (General Secretary)
  - `MOSQUE_ADMIN` (Mosque Administrator)
- General community members, khadems, or unauthorized users are forbidden from creating donation channels.
- When an authorized executive creates a channel, it is immediately active and public—no platform administrator approval is required.

### 2. Public Creator Provenance Display
- Every donation channel captures and publicly presents:
  - **Creator Name** (`creatorName`): Full name of the committee officer.
  - **Mosque Position** (`creatorRole`): Canonical position (e.g. *President*, *General Secretary*, *Vice President*, *Mutawalli*).
  - **Creator Image** (`creatorImageUrl`): Verified staff portrait or profile photo.

### 3. Multi-Signatory Leadership Verification Status
- Each channel tracks leadership verification across key governance pillars:
  - **President** (`COMMITTEE_PRESIDENT`)
  - **General Secretary** (`COMMITTEE_SECRETARY`)
  - **Vice President** (`COMMITTEE_VICE_PRESIDENT`)
  - **Mutawalli** (`MUTAWALLI`)
- **Visual Status Rules**:
  - The creator's leadership role receives an automatic **green tick mark** (`✓ President` in active green).
  - Other executive positions appear in a **dull / muted** state until endorsed.
  - When another verified officer holding a pending role verifies the channel, their role transitions to the active green tick mark.

### 4. Committee Taxonomy Clarification
- Multiple Vice Presidents (`COMMITTEE_VICE_PRESIDENT`) and multiple Committee Members (`COMMITTEE_MEMBER`) are explicitly supported without uniqueness constraints.
- Display labels are standardized to "President", "General Secretary", "Vice President", "Committee Member", and "Mutawalli".

---

## Consequences

### Positive
- **Immediate Deployment**: Mosque committees can deploy donation channels without waiting for central platform administrative intervention.
- **Maximum Public Transparency**: Worshippers see the exact leader responsible for the channel with photo and role.
- **Trust Consensus**: Multi-role green tick indicators provide clear, intuitive visual proof of executive committee agreement.
- **Anti-Fraud Integrity**: Channel creation remains strictly guarded by verified mosque staff credentials in PostgreSQL.

### Negative / Trade-offs
- A compromised committee account could theoretically publish an unverified personal account.
- *Mitigation*: Community fraud reporting (`DonationReport` with 3-strike auto-flagging) and public creator identity attribution discourage malicious conduct.
