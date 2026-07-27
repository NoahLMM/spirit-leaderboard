# Airtable schema reference

This app expects a specific Airtable base structure. If you're duplicating
the maintained template linked from the [README](../README.md), your base
already matches this — this doc is a reference for verifying it, or for
rebuilding it by hand if you're not using the template.

Field names must match **exactly** (including punctuation like `?`) — the
frontend and Netlify functions read them by name.

## Members

| Field | Type | Notes |
|---|---|---|
| `Name` | Single line text | Primary field |
| `Email` | Email | Looked up case-insensitively on submit |
| `Team Name` | Lookup | Pulls the member's team name; must return an array (a Lookup field, not plain text) — the app reads `fields['Team Name'][0]` |
| `Total Points` | Rollup (Sum) | Sum of `Points` across the member's `Approved` submissions |
| `NSubmissions` | Rollup (Count/Sum) | Count of the member's `Approved` submissions |
| `Submissions` | Link to another record → Submissions | Used to find a member's own submissions (including unapproved ones) when checking which challenges they've already completed |

## Challenges

| Field | Type | Notes |
|---|---|---|
| `Challenge Name` | Single line text | Primary field |
| `Description` | Long text | |
| `Points` | Number | |
| `End Date` | Date (with time) | Shown on the Challenges page |
| `Is Active` | Checkbox | Only active challenges are shown/selectable |
| `Picture Required?` | Single select — choices `Yes`, `No` | Must store the literal string `"Yes"`/`"No"`, not a checkbox |
| `Reflection Required?` | Single select — choices `Yes`, `No` | Same as above |
| `Team?` | Single select — choices `Yes`, `No` | Marks a challenge as a team/group challenge |
| `Repeatable?` | Single select — choices `Yes`, `No` | If `Yes`, a member/team can submit it more than once |

## Submissions

| Field | Type | Notes |
|---|---|---|
| `Member` | Link to another record → Members | |
| `Member Names` | Lookup (Members → Name) | Displayed on the activity feed |
| `Team Name` | Lookup (Members → Team Name) | Displayed on the activity feed and used to find a team's submissions |
| `Challenge` | Link to another record → Challenges | |
| `Challenge Name` | Lookup (Challenges → Challenge Name) | |
| `Points` | Lookup or Rollup (Challenges → Points) | |
| `Notes` | Long text | Reflection text, when required |
| `Proof` | Attachment | Photo proof, when required |
| `Share Reflection?` | Single select — choices `Yes`, `No` | Whether the member opted to show their reflection publicly |
| `Approved` | Checkbox | An admin checks this in Airtable to approve a submission; only approved submissions appear on the public leaderboard/activity feed |

Airtable's built-in record creation timestamp is used for sorting the
activity feed — no separate `Created` field is needed.

## Running your season

- **Add challenges**: add rows to the Challenges table. Set `Is Active` to
  make one live; uncheck it (or leave it unchecked) to hide/retire it.
- **Approve submissions**: review new rows in the Submissions table and
  check `Approved` to make them count toward points and show up publicly.
- **Add members**: add rows to the Members table with each person's name,
  email, and team.
