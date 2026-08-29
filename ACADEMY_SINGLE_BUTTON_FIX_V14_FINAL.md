# v14 FINAL — Tina Academy Single Button Fix

The Superadmin home card already contains `#saAcademy`.
`ensureSuperadminHomeAccessButtons()` previously searched only for data-route attributes,
so it failed to recognize the existing button and appended a second one.

The closure now recognizes the existing owner-card button, reuses it, and attaches
the Superadmin route binding instead of creating a duplicate.
