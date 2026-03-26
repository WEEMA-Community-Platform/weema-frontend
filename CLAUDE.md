## Design Context

### Users
Primary users are internal program teams across three operational roles:
- Admin (web): full-system governance, survey design, analytics, and assignment oversight
- Cluster Admin (web): assigned-cluster operations, SHG/member upkeep, facilitator assignment
- Facilitator (mobile primary, web fallback): field data collection and member registration

Core jobs to be done:
- Monitor program progress and submission health
- Create and maintain member/community data
- Collaborate through role-scoped operations across cluster structures

The interface should optimize for sustained daily use, low cognitive load, role clarity, and reliable task flow in both office and field contexts.

### Brand Personality
The brand voice is modern, minimal, and premium.
It should feel calm, competent, and focused rather than playful or loud.
The product should communicate trust through consistency, precision, and visual restraint.

### Aesthetic Direction
Visual direction is minimal-clean with a soft edge: simple structure, generous spacing, and refined hierarchy.
Theme support should include both light and dark modes from the start.
Color strategy should anchor in blue hues, avoid neon saturation, and avoid heavy red-led palettes.
Reference feel: Stripe-like modern technical polish (crisp typography, clean composition, subtle depth/motion).
Anti-direction: anything visually noisy, novelty-heavy, or aggressively colorful.

### Product and Platform Context
The WEEMA Community Platform is role-based and split by context:
- Admin: web-only, broad control surfaces
- Cluster Admin: web-only, scoped control surfaces
- Facilitator: mobile-first execution with web fallback

Community model is hierarchy-aware but supports partial states:
- Region -> Zone -> Woreda -> Cluster -> SHG -> Members
- SHGs may exist before cluster linkage
- Clusters may exist before federation linkage

MVP scope to preserve in design decisions:
- In: hierarchy management, member profiles, dynamic survey builder, mobile collection, basic dashboards, Superset link-out
- Out: deep nested conditional logic, external integrations, workflow automation, broad admin mobile features

### Core Interaction Patterns
- Dashboard-first web landing for Admin and Cluster Admin with clear status at a glance.
- Hierarchy-aware navigation and drill-down for community structures.
- Base data workflow is list-first: users should see existing records in a table before creating or editing.
- Create and edit actions for base data open in a modal/sheet surface, not inline in the list.
- Filters for base data are hidden behind a dedicated Filter action and opened in a filter dialog/sheet.
- Survey lifecycle clarity: Draft vs Active (locked after responses begin).
- One-click survey cloning for safe versioning.
- Facilitator mobile flows limited to survey submission and member registration.
- Stepwise survey progression with visible progress and conditional question reveal/hide.

### Design Principles
1. Role-scoped simplicity: each role only sees capabilities needed for its responsibility and context.
2. Dashboard-first clarity: surface key metrics, progress, and bottlenecks before deep workflows.
3. Mobile field efficiency: prioritize large tap targets, low typing burden, and uninterrupted step-by-step task completion.
4. Hierarchy resilience: design for linked and partially linked community states without blocking operations.
5. Survey integrity: clearly communicate survey state, lock behavior, conditional logic outcomes, and versioning path.
6. Calm premium execution: maintain minimal visual language with precise spacing, strong hierarchy, and restrained motion.
7. Accessibility by default: enforce strong contrast, touch-friendly controls, scalable text/layout, and reduced-motion-safe interactions.
8. Base data clarity first: prioritize readable tables, explicit action buttons, and modal forms with progressive disclosure for filters.
