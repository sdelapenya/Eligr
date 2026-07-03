# Domain Model

## Entities

### User

- id
- name
- email
- subscriptionStatus
- createdAt

### RentalSearch

- id
- userId
- title
- city
- area
- rentalTypes
- maxBudget
- moveInDate
- destinationLabel
- destinationLocation
- priorities
- createdAt
- updatedAt

### RentalOption

- id
- searchId
- title
- sourceUrl
- rentalType
- monthlyPrice
- billsIncluded
- estimatedBills
- deposit
- agencyFee
- totalMoveInCost
- locationLabel
- commuteMinutes
- size
- furnished
- bathroomType
- contractAvailable
- availableDate
- status
- notes
- createdAt
- updatedAt

### PriorityWeights

- price
- moveInCost
- commute
- location
- safety
- roomQuality
- privacy
- billsIncluded
- availability
- personalFeeling

### RentalScore

- rentalOptionId
- overallScore
- priceScore
- moveInCostScore
- commuteScore
- safetyScore
- qualityScore
- availabilityScore
- explanation
- pros
- cons
- warnings

### VisitNote

- id
- rentalOptionId
- visitedAt
- impression
- questionsAsked
- redFlags
- photos
- nextAction

## Status Values

- new
- contacted
- visit_planned
- visited
- favorite
- discarded

## Scoring Notes

The score should be transparent and explainable. Users should be able to understand why an option ranks higher or lower.

MVP scoring can be rule-based before adding AI:

- Normalize each criterion to a 0 to 100 score.
- Multiply by user-defined weight.
- Sum weighted scores.
- Add warnings for missing or risky data.

AI can later generate human-readable explanations from the structured score and notes.
