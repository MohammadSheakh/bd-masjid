# ADR-067: Mobile Crowdsourced Donation Channel Submission Sheet

## Status
Accepted

## Date
2026-10-10

## Context
Mosques across Bangladesh rely on community contributions for maintenance, electricity bills, Imam/Muazzin honorariums, and Ramadan iftar programs. Currently, `DonationChannelsCard.tsx` renders verified bKash, Nagad, Rocket, and Bank transfer accounts, but users and committee leads have no in-app flow to submit or suggest official payment channels.

The backend exposes a multi-signatory donation channel submission workflow:
- `POST /api/v1/mosques/:id/donations` (`CreateDonationChannelDto`, ADR-028, `F-028`): creates a donation channel draft in `PENDING_VERIFICATION` status.
- `GET /api/v1/mosques/:id/donations`: returns official verified channels for musallis.
- `PATCH /api/v1/donations/:id/verify`: enforces two-person multi-signatory verification before appearing publicly.

The mobile client requires a dedicated Ferio-styled **Donation Channel Submission Sheet (`SuggestDonationMethodModal.tsx`)** allowing committee members and scouts to submit official accounts with brand selection, beneficiary details, purpose tags, and offline outbox queuing.

## Decision
We implement the crowdsourced donation method submission workflow adhering to:

1. **Domain Alignment & DTO Contracts (`types/donation.ts`)**:
   - `DonationChannelType`: `BKASH | NAGAD | ROCKET | UPAY | BANK_TRANSFER`
   - `DonationChannelAccountType`: `PERSONAL | MERCHANT | AGENT`
   - `DonationPurpose`: `GENERAL_FUND | CONSTRUCTION | UTILITIES_MAINTENANCE | ORPHAN_EDUCATION | RAMADAN_IFTAR | ZAKAT`
   - Payload:
     ```ts
     export interface CreateDonationPayload {
       channelType: DonationChannelType;
       accountType?: DonationChannelAccountType;
       purpose?: DonationPurpose;
       accountNumber: string;
       accountTitle: string;
       bankName?: string;
       branchName?: string;
       routingNumber?: string;
       paymentInstructions?: string;
     }
     ```
2. **ApiClient Transport with Offline Outbox Fallback**:
   - `ApiClient.submitDonationChannel(mosqueId: string, payload: CreateDonationPayload)`
   - Calls `POST /api/v1/mosques/:id/donations`.
   - Automatically enqueued into `OfflineOutboxService` when offline.
3. **Ferio Visual Aesthetics (`SuggestDonationMethodModal.tsx`)**:
   - Brand pill selector: bKash (magenta `#d12053`), Nagad (orange `#e15b26`), Rocket (purple `#8c338c`), Upay (blue `#0056b3`), Bank Transfer (emerald `#059669`).
   - Clean account number & title inputs.
   - Dynamic banking fields if `BANK_TRANSFER` selected.
   - Multi-signatory governance advisory banner.
4. **Integration Point**:
   - Triggered via `+ Add Donation Channel / অনুদান মাধ্যম যোগ করুন` on `DonationChannelsCard.tsx` / `MosqueDetailSheet.tsx`.

## Consequences
- **Positive**: Direct parity with backend `CreateDonationChannelDto` and two-person verification invariants.
- **Positive**: Empowers rural and urban mosques to digitize charitable collections safely.
- **Positive**: Strict offline outbox fallback ensures submissions are never lost on flaky connections.
