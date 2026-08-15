# SEND is airplane-mode plaintext, JSON, and QR

The JESIP app emails or SMS-es a completed report. The demo is offline, so SEND must not depend on a network.

Boxes stay editable; editing a box sets that Slot to Confirmed. Confirm and SEND does not rewrite other tags. The emit is JESIP-ordered plaintext (SMS body), Message JSON on screen, and a QR of the plaintext only. No live SMS, email, or JESIP API. Missing Access is hardcoded UI copy, not a second model.
