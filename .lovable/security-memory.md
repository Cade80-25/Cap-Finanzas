# Security Memory — Cap Finanzas

## App overview
Offline-first personal finance PWA + Electron app. All user financial data is stored locally in `localStorage` (never sent to backend). Supabase is used only for:
- License purchase/activation (orders + licenses tables, service-role only)
- Profile photo uploads (public bucket, CDN-served)
- Calendar reminder emails/SMS (server-side queue)
- Referral codes
- Email queue (pgmq wrappers)

## Must-never-happen
- Never expose `orders`, `licenses`, or `email_*` tables to anon/authenticated. All access is via edge functions with service-role.
- Never allow client-side privilege escalation (no admin flags in localStorage trusted by backend).
- Never store user financial data in Supabase.

## Scanner guidance — ignored / accepted
- **Public storage buckets (`profile-photos`, `email-assets`)**: Intentionally public for CDN delivery (avatars in app, images in transactional emails opened in external mail clients). Contents are non-sensitive (user-chosen avatars and brand assets). Bucket listing is an accepted trade-off; if listing must be blocked, switch to signed URLs and update the avatar + email-template pipelines.
- **`update_updated_at_column` SECURITY DEFINER trigger function**: Standard timestamp trigger; safe by design with fixed `search_path = public`.
- **pgmq wrapper functions (`enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`)**: SECURITY DEFINER is required to access the `pgmq` schema. EXECUTE has been revoked from PUBLIC/anon/authenticated; only `service_role` (edge functions) can call them. Do NOT re-flag.

## Out of scope for scanners
- Rate limiting / brute-force protection on edge functions (handled at edge function layer or accepted).
- Timing-safe equality concerns on license/PIN comparisons.
- Client-side license gating — accepted trade-off for offline operation.
