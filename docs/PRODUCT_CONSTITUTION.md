# PlayRank India — Product Constitution

**Status:** Active  
**Version:** 1.0  
**Effective date:** 24 July 2026  
**Company direction:** PlayRank Technologies Pvt. Ltd.

## 1. Purpose

PlayRank India is a BGMI-first esports intelligence platform built to make Indian competitive esports data reliable, explainable and accessible.

PlayRank is not merely a directory of teams, players and tournaments. Its core purpose is to transform fragmented competitive evidence into verified identities, structured records, defensible rankings and useful public intelligence.

The platform must prioritise:

1. Data quality
2. Identity accuracy
3. Source transparency
4. Explainable rankings
5. Historical continuity
6. Honest coverage reporting

Trust takes priority over feature quantity.

---

## 2. Product Positioning

PlayRank India will become the trusted data layer for Indian esports, beginning with BGMI.

The public beta will focus on:

- Indian BGMI teams
- Indian BGMI players
- Current and historical rosters
- Tournaments and stages
- Match and map results
- Tournament standings
- Team and player histories
- Explainable rankings
- Source-labelled competitive records

Additional games may only be introduced after the BGMI data and ranking systems are stable and trustworthy.

---

## 3. Primary Users

PlayRank will serve:

- Esports players
- Professional and emerging teams
- Tournament organisers
- Coaches and team managers
- Casters and analysts
- Content creators
- Esports journalists
- Fans
- Sponsors and investors

The public beta must first work exceptionally well for users researching teams, players, rosters, tournaments and rankings.

---

## 4. Primary Product Loop

The main repeatable user experience is:

> Discover what changed in Indian BGMI, understand why rankings moved, inspect the tournaments and results behind those movements, and verify the supporting sources.

Every major public feature must support this loop.

Features that do not strengthen this experience must be postponed, hidden or removed from the public beta.

---

## 5. Product Principles

### 5.1 Trust before scale

PlayRank must not claim coverage or accuracy that its records cannot support.

A smaller verified dataset is more valuable than a larger unreliable dataset.

### 5.2 Evidence before publication

No competitive record should become publicly authoritative without identifiable supporting evidence.

### 5.3 Canonical identities

Every team, player and tournament must resolve to one canonical identity, even when different sources use different names or identifiers.

### 5.4 No invented information

Missing values must remain missing.

PlayRank must not estimate, fabricate or silently infer competitive facts unless the interface clearly labels the value as calculated or inferred.

### 5.5 Explainable calculations

Every ranking or derived metric must have:

- A documented methodology
- Defined eligibility rules
- Reproducible inputs
- A version number
- A calculation timestamp
- A confidence or completeness indicator

### 5.6 Honest coverage

PlayRank must distinguish between:

- Discovered records
- Imported records
- Resolved records
- Verified records
- Published records
- Partially covered events
- Fully covered events
- Stale records

Database row counts must not be presented as verified public coverage.

### 5.7 No one-off product exceptions

Tournament-specific or entity-specific hardcoded UI exceptions are prohibited.

If real competition data cannot be represented correctly, the domain model or ingestion workflow must be improved.

### 5.8 Build completion is not product completion

A successful TypeScript compilation, lint check or production build does not prove:

- Data accuracy
- Ranking validity
- Secure access
- Correct aggregation
- Verified coverage
- Product coherence

Every release must pass technical, data and product verification.

---

## 6. Public Beta Scope

The following features are included in the BGMI public beta.

### 6.1 Rankings

- Team rankings
- Player rankings only when sufficient verified data exists
- Ranking movement
- Ranking history
- Ranking methodology
- Ranking confidence
- Supporting tournament results

### 6.2 Teams

- Canonical team identity
- Official name and logo
- Current roster
- Historical roster memberships
- Tournament appearances
- Results and form
- Ranking history
- Verified official links
- Data sources and last-updated status

### 6.3 Players

- Canonical player identity
- Current IGN
- Verified IGN history
- Current team
- Team history
- Tournament history
- Available verified performance data
- Ranking history where eligible
- Sources and last-updated status

### 6.4 Tournaments

- Canonical tournament identity
- Organiser
- Dates
- Prize pool
- Format
- Stages
- Maps or match records
- Participating teams
- Standings
- Sources
- Coverage status
- Last-updated status

### 6.5 Data trust

- Methodology
- Source labels
- Coverage status
- Verification status
- Last-updated timestamps
- Correction submission
- Dispute handling
- Public limitations

### 6.6 Search and discovery

- Search for teams, players and tournaments
- Reliable canonical results
- Alias-aware matching
- Clear entity classification

---

## 7. Features Excluded from the Public Beta

The following features must not receive priority until the core trust system is complete:

- Multi-game expansion
- Country filtering
- Unverified real-time claims
- Live match tracking without a reliable source
- Advanced premium dashboards
- Public API monetisation
- Fantasy esports features
- Betting-related features
- AI-generated performance claims
- Unverified player statistics
- Tournament-specific hardcoded UI behaviour
- Excessive new comparison metrics
- New ranking categories without a tested methodology
- Investor-facing expansion features
- Full PUBG automation as a replacement for BGMI sourcing

These may be reconsidered only after the beta release criteria are satisfied.

---

## 8. Canonical Domain Model

The core competition hierarchy is:

> Game → Tournament → Stage → Round or Match Day → Map → Team Result → Player Result

### 8.1 Tournament

A tournament represents the complete competitive event.

Qualifiers, league stages, semifinals and finals should normally be represented as stages unless they are independently recognised events with separate identities and evidence.

### 8.2 Stage

A stage must be a structured entity.

The system must not depend permanently on free-text stage names or use `null` as the authoritative meaning of “Main Event.”

### 8.3 Match and map

The meaning of a match must be explicit.

If a database record represents one played map, it must be modelled and named consistently as a map-level record. A series, match day and map must not be treated as interchangeable concepts.

### 8.4 Team result

A team result records a team’s verified performance within a map, match, stage or tournament.

### 8.5 Player result

A player result records verified individual performance at the appropriate competitive level.

Unsupported statistics must not be displayed as confirmed values.

---

## 9. Canonical Identity Rules

### 9.1 Player identity

Every player must have one canonical PlayRank player ID.

The system should support:

- Current IGN
- Previous IGNs
- Real name when verified
- Game account identifiers
- External source identifiers
- Social or official profile links
- Team membership history
- Identity merges and splits
- Evidence and confidence
- Last verified timestamp

An IGN is an attribute of a player, not the player’s permanent identity.

### 9.2 Team identity

Every team must have one canonical PlayRank team ID.

The system should support:

- Official name
- Previous names
- Aliases
- Organisation identity
- Competitive roster identity
- Active and inactive periods
- Official links
- External source mappings
- Roster history
- Merge, acquisition and rebrand history

### 9.3 Duplicate handling

Potential duplicates must enter a review queue.

Records must not be merged automatically when identity confidence is insufficient.

Every merge or split must be auditable and reversible.

---

## 10. Data Lifecycle

Every data source must follow one common lifecycle:

1. **Discovered** — evidence has been located.
2. **Imported** — raw data has entered staging.
3. **Mapped** — source identities are connected to canonical entities.
4. **Validated** — structural and domain rules pass.
5. **Needs review** — human verification is required.
6. **Verified** — evidence has been reviewed and accepted.
7. **Published** — the record is approved for public use.
8. **Disputed** — accuracy has been challenged.
9. **Archived** — the record is retained but no longer active.

Different ingestion tools may collect data differently, but they must not bypass this lifecycle.

---

## 11. Verification Contract

“Verified” means that the record is supported by accepted evidence and has passed the required review process.

Verification must be capable of recording:

- Record or field being verified
- Source
- Source type
- Source URL or reference
- Reviewer
- Verification timestamp
- Verification notes
- Confidence level
- Conflicting evidence
- Publication state

Changing a material verified value must trigger re-verification or create a new reviewed revision.

A simple boolean may remain for compatibility, but it must not be the final verification model.

---

## 12. Source Policy

Sources should be classified as:

1. Official tournament or organiser sources
2. Official team or player announcements
3. Official game or competition APIs
4. Established secondary databases
5. Reputable reporting
6. Community-submitted evidence
7. Internal manual research

Conflicting sources must not be silently resolved.

The system must preserve:

- Original source value
- Normalised value
- Source reference
- Collection timestamp
- Resolution decision
- Reviewer notes

Liquipedia may be an important source, but it must not automatically become PlayRank’s unquestioned source of truth.

The PUBG API must not be treated as a complete source for BGMI player data.

---

## 13. Ranking Constitution

PlayRank rankings must not be published as authoritative until Ranking Methodology Version 1 is documented, implemented and tested.

The methodology must define:

- Eligible tournaments
- Minimum coverage requirements
- Minimum sample sizes
- Tournament-strength calculation
- Placement weighting
- Performance weighting
- Recency and time decay
- LAN versus online treatment
- Roster-change treatment
- Inactivity rules
- Incomplete-event treatment
- Player-role treatment
- Ranking confidence
- Tie-breaking rules
- Update frequency

Every ranking snapshot must include:

- Methodology version
- Calculation timestamp
- Eligible result window
- Score
- Rank
- Previous rank
- Confidence or completeness
- Supporting events

Methodology changes must create a new version rather than silently rewriting historical meaning.

---

## 14. Public Information Architecture

The primary public navigation should be limited to:

- Rankings
- Tournaments
- Teams
- Players
- Compare
- Data Trust

Definitions:

- **Rankings:** PlayRank’s cross-event evaluation.
- **Standings:** results within one tournament or stage.
- **Leaderboard:** a presentation component, not a competing product category.
- **Compare:** contextual comparison using verified and sufficiently complete data.
- **Data Trust:** methodology, sources, corrections and coverage.

Duplicate or overlapping routes must be merged, redirected, hidden or removed.

---

## 15. Admin Operating Model

The admin system must follow the data lifecycle rather than expose unrelated database utilities as separate workflows.

The main admin workflow is:

1. Intake
2. Resolve identity
3. Validate
4. Review evidence
5. Publish
6. Audit
7. Monitor health

Administrators should be able to identify:

- New records
- Failed imports
- Unresolved identities
- Suspected duplicates
- Records needing verification
- Records ready for publication
- Published records affected by changes
- Stale records
- Disputed records
- Pipeline failures

All material admin actions must generate audit records.

---

## 16. Security Requirements

Before public beta:

- Supabase Row Level Security must be audited.
- Service-role credentials must remain server-side.
- Admin mutation routes must require reliable authorisation.
- Same-origin checks must not be the only protection.
- Rate limiting must use shared infrastructure where required.
- Ranking mutations must be admin-restricted.
- Import and promotion routes must be protected.
- Sensitive operational errors must not be exposed publicly.
- Audit logs must exist for material data changes.
- Production secrets must never be committed.

---

## 17. Testing and Release Requirements

Critical behaviour must have automated coverage.

Required testing areas include:

- Canonical identity resolution
- Duplicate detection
- Import idempotency
- Mapping and promotion
- Verification enforcement
- Tournament-stage aggregation
- Ranking calculations
- Roster history
- Admin authorisation
- Public verified-only queries
- Correction and dispute workflows

Every release candidate must pass:

1. Formatting
2. Lint
3. Type checking
4. Production build
5. Unit tests
6. Integration tests
7. Database tests
8. End-to-end tests
9. Security checks
10. Data-quality checks
11. Production smoke tests

GitHub Actions should enforce the required release gates.

---

## 18. Repository Rules

The repository must separate:

- Application code
- Database migrations
- ETL and ingestion scripts
- Test fixtures
- Documentation
- Generated output
- Raw research data

Large raw archives, caches and reproducible generated datasets should not remain mixed with production application code.

Duplicate script directories must be reviewed and consolidated.

The repository README must explain:

- Product purpose
- Architecture
- Local setup
- Environment variables
- Database workflow
- Ingestion workflow
- Verification workflow
- Ranking workflow
- Testing
- Deployment
- Contribution rules

---

## 19. Beta Release Criteria

PlayRank may be considered ready for public beta only when:

- Canonical identities are stable.
- Duplicate resolution is operational.
- Current and historical rosters are reliable.
- Tournament and stage structures are consistent.
- Public records enforce publication and verification rules.
- Ranking Methodology V1 is documented and tested.
- Rankings are reproducible.
- Source labels and last-updated timestamps are visible.
- Correction submission is operational.
- Admin routes are securely protected.
- Critical workflows have automated tests.
- CI release gates are active.
- Major public routes have been audited against real data.
- Coverage limitations are communicated honestly.
- No tournament-specific UI exceptions remain.

---

## 20. Development Priority Order

All future development must follow this sequence:

### Phase 1 — Constitution and inventory

- Lock product scope.
- Classify existing routes and features.
- Identify conflicting implementations.
- Stop unnecessary feature expansion.

### Phase 2 — Canonical data architecture

- Finalise identities.
- Finalise roster history.
- Finalise tournament hierarchy.
- Add provenance, verification and publication models.

### Phase 3 — Unified ingestion

- Standardise staging.
- Standardise mapping.
- Standardise validation.
- Standardise review and publication.
- Add reliable monitoring and retry handling.

### Phase 4 — Ranking Methodology V1

- Freeze the methodology.
- Implement the engine.
- Create test fixtures.
- Version ranking snapshots.
- Expose confidence and supporting evidence.

### Phase 5 — Trust-first public beta

- Simplify public navigation.
- Publish only mature product surfaces.
- Add embedded source and coverage information.
- Complete correction and dispute flows.
- Perform security, performance and accessibility audits.

New features must not bypass this priority order.

---

## 21. Decision Framework

Before starting any feature, answer:

1. Does it strengthen the primary BGMI product loop?
2. Does the canonical data model support it?
3. Is the required data available and trustworthy?
4. Is the verification rule defined?
5. Can the output be explained to users?
6. Can it be tested?
7. Does an existing feature already serve the same purpose?
8. Does it belong in the current phase?
9. Will it introduce a one-off exception?
10. What will be postponed to make room for it?

If these questions cannot be answered clearly, development should not begin.

---

## 22. Change Control

This constitution is the governing product document for the PlayRank public beta.

Any material change to the following requires an explicit documented decision:

- Product scope
- Supported games
- Canonical domain definitions
- Verification rules
- Publishing rules
- Ranking methodology
- Public information architecture
- Beta release criteria

Changes must include:

- Reason
- Expected impact
- Alternatives considered
- Migration requirements
- Approval date
- Constitution version update

Chat discussions alone do not permanently change the product contract until the decision is recorded in the repository.

---

## 23. Final Product Rule

PlayRank must complete one dependable chain before expanding its surface area:

> Source evidence → canonical identity → verified competition record → explainable ranking → clearly sourced public insight.

If a feature does not strengthen this chain, it is not a priority for the current PlayRank beta.
