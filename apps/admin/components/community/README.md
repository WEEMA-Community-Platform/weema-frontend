# Community Module (Admin) - Implementation Guide

This document explains how community structure is implemented in `apps/admin`:

- Federation, Cluster, SHG, and Member manager flows
- where API wiring and cache invalidation live
- assignment behavior for Federation <-> Cluster and Cluster <-> SHG
- file layout after dialog/component extraction

## 1) Scope and user flows

Community structure currently covers:

- **Federations**: create/edit/view/delete + assign/remove clusters
- **Clusters**: create/edit/view/delete + assign/remove SHGs
- **SHGs**: create/edit/view/delete + optional cluster linkage in edit
- **Members**: separate manager + dialogs under `community/members`

High-level flow:

1. Open a community manager tab (Federation / Cluster / SHG / Members).
2. Use table/cards and filters to locate records.
3. Use add/edit dialogs for base entity data.
4. Use assignment dialogs for relationship management (not edit forms).

## 2) Core files

- `components/community/federation-manager.tsx`
- `components/community/cluster-manager.tsx`
- `components/community/shg-manager.tsx`
- `components/community/members/*`
- `hooks/use-community.ts`
- `lib/api/community.ts`

## 3) Extracted dialog architecture

To keep manager files readable, dialog-heavy UI is split out:

- `components/community/federation-manager-dialogs.tsx`
  - `FederationDetailDialog`
  - `AssignClustersDialog`
  - `FederationFormDialog`
  - `FederationDeleteDialog`
- `components/community/cluster-manager-dialogs.tsx`
  - `ClusterDetailDialog`
  - `AssignSHGsDialog`
  - `ClusterFormDialog`
  - `ClusterDeleteDialog`
- `components/community/shg-manager-dialogs.tsx`
  - `SHGDetailDialog`
  - `SHGFormDialog`
  - `SHGDeleteDialog`

Manager components now primarily own:

- list/filter/pagination state
- mutation submit handlers
- open/close orchestration for extracted dialogs

## 4) API client and React Query hooks

`lib/api/community.ts` contains:

- domain types (`Federation`, `Cluster`, `SHG`, payloads, list query types)
- fetch helpers for list/detail CRUD
- assignment APIs:
  - `addClustersToFederation(...)`
  - `removeClusterFromFederation(...)`
  - `addSHGsToCluster(...)`
  - `removeSHGFromCluster(...)`

`hooks/use-community.ts` contains:

- query hooks (`useFederationsQuery`, `useClustersQuery`, `useSHGsQuery`, detail hooks)
- mutation hooks with query invalidation for dependent lists

## 5) Assignment rules (important)

### Federation <- Clusters

- Assign dialog fetches:
  - unassigned add-list using `getClusters({ unAssignedFederation: true })`
  - assigned list using `getClusters({ federationId })`
- Remove is available from both:
  - federation detail view
  - assign clusters dialog

### Cluster <- SHGs

- Assign dialog fetches:
  - unassigned add-list using `getSHGs({ unassignedCluster: true })`
  - assigned list using `getSHGs({ clusterId })`
- Remove is available from both:
  - cluster detail view
  - assign SHGs dialog

### Cluster edit behavior

- Federation assignment is intentionally not editable in cluster edit form.
- Guidance points users to federation-level **Assign clusters** flow.

## 6) UI consistency notes

- Remove actions in detail/assign lists use destructive trash icon style with orange hover treatment.
- Detail dialogs keep active IDs during close animation to avoid content flicker.
- Detail fields use compact two-column metadata layout on larger screens.

## 7) Contributor notes

- Prefer adding new UI behavior in extracted dialog files instead of expanding manager files.
- Keep relationship mutations in assignment flows; avoid reintroducing relationship edits in unrelated forms.
- If you add new filters/query params, wire both:
  - `lib/api/community.ts` query serializer
  - `hooks/use-community.ts` query/mutation invalidation coverage
