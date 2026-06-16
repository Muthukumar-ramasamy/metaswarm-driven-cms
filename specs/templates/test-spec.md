# Test Spec: {FeatureName}

> Each acceptance criterion from the feature spec maps to at least one test case here.
> The QA agent reads this file to generate unit, integration, and E2E tests.

---

## 1. Coverage Map

| AC # | Criterion | Unit | Integration | E2E |
|------|-----------|------|-------------|-----|
| AC-01 | {description} | ✅ | ✅ | ✅ |
| AC-02 | {description} | ✅ | ✅ | ❌ |
| AC-03 | {description} | ❌ | ✅ | ✅ |

---

## 2. Unit Tests

**File**: `tests/unit/{feature}/{Entity}Service.test.ts`

### Test suite: {Entity}Service

```
describe('{Entity}Service', () => {

  describe('create{Entity}', () => {
    ✅ should create entity with valid data
    ✅ should throw ValidationError when required field is missing
    ✅ should throw ConflictError when email already exists
    ✅ should set createdBy to current user id
    ✅ should set default status to "new"
  })

  describe('update{Entity}', () => {
    ✅ should update entity with valid data
    ✅ should throw NotFoundError when entity does not exist
    ✅ should throw ForbiddenError when user is not owner and not admin
    ✅ should set updatedAt to current timestamp
  })

  describe('delete{Entity}', () => {
    ✅ should soft-delete by setting deletedAt
    ✅ should throw NotFoundError for non-existent id
    ✅ should throw ForbiddenError when caller is not admin
  })

  describe('list{Entity}s', () => {
    ✅ should return paginated results scoped to organization
    ✅ should filter by status when provided
    ✅ should exclude soft-deleted records
    ✅ should sort by createdAt desc by default
  })

})
```

**Mocks required**:
- `{Entity}Repository` — mock all DB calls
- `AuthService` — mock current user
- `AuditService` — mock audit log writes

---

## 3. Integration Tests

**File**: `tests/integration/{feature}/{resource}.api.test.ts`

Test against a real test database (seeded). No mocks.

### GET /api/{resource}

```
describe('GET /api/{resource}', () => {
  ✅ returns 200 with paginated list for authenticated user
  ✅ returns only records belonging to caller's organization
  ✅ filters by status query param
  ✅ filters by assignedTo query param
  ✅ returns 401 when no JWT provided
  ✅ returns 403 when JWT is for wrong organization
  ✅ respects limit and page params
})
```

### POST /api/{resource}

```
describe('POST /api/{resource}', () => {
  ✅ returns 201 with created resource for valid body
  ✅ returns 400 with field errors for missing required fields
  ✅ returns 400 for invalid email format
  ✅ returns 409 when email already exists in organization
  ✅ returns 401 when unauthenticated
  ✅ sets createdBy to caller's user id
})
```

### GET /api/{resource}/:id

```
describe('GET /api/{resource}/:id', () => {
  ✅ returns 200 with full entity for valid id
  ✅ returns 404 for non-existent id
  ✅ returns 404 for id belonging to different organization
  ✅ returns 401 when unauthenticated
})
```

### PUT /api/{resource}/:id

```
describe('PUT /api/{resource}/:id', () => {
  ✅ returns 200 with updated resource for valid body
  ✅ returns 400 for invalid field values
  ✅ returns 403 when sales rep tries to edit another user's record
  ✅ returns 404 for non-existent id
})
```

### DELETE /api/{resource}/:id

```
describe('DELETE /api/{resource}/:id', () => {
  ✅ returns 204 and soft-deletes record when called by admin
  ✅ returns 403 when called by non-admin
  ✅ returns 404 for non-existent id
  ✅ deleted record no longer appears in list endpoint
})
```

---

## 4. E2E Tests (Playwright)

**File**: `tests/e2e/{feature}/{feature}.spec.ts`

Maps directly to acceptance criteria.

### AC-01: {Criterion title}
```typescript
test('AC-01: {description}', async ({ page }) => {
  // Arrange
  await loginAs(page, 'sales-rep');
  await page.goto('/app/{resource}');

  // Act
  await page.getByRole('button', { name: '+ New {resource}' }).click();
  await page.getByLabel('{Field}').fill('{value}');
  await page.getByRole('button', { name: 'Save' }).click();

  // Assert
  await expect(page.getByText('{value}')).toBeVisible();
  await expect(page.getByText('created successfully')).toBeVisible();
});
```

### AC-02: {Criterion title}
```typescript
test('AC-02: {description}', async ({ page }) => {
  // ...
});
```

---

## 5. Test Data (Seeds)

```typescript
// tests/fixtures/{feature}.fixtures.ts

export const valid{Entity} = {
  {field1}: '{value}',
  {field2}: '{value}',
  status: 'new',
};

export const invalid{Entity}MissingRequired = {
  {field2}: '{value}',
  // {field1} intentionally missing
};

export const duplicate{Entity} = {
  ...valid{Entity},
  // Same email as an existing seed record
};
```

---

## 6. Test Environment

| Requirement | Value |
|-------------|-------|
| Database | Test DB (separate from dev) |
| Seed script | `npm run seed:test` |
| Reset between tests | Yes — truncate tables in `beforeEach` |
| Auth tokens | Generated via `createTestToken(role)` helper |
