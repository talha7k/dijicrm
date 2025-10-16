# Authentication vs Onboarding Architecture Design

## Current Architecture Problem

The current system treats authentication and onboarding as a single step:

```
Google Sign-In → Direct to Dashboard
```

This fails because:

1. Authentication only verifies identity (Firebase Auth user)
2. Onboarding creates application-specific profile (Firestore user document)
3. Users can exist in Auth but not have a profile document

## Proposed Architecture

### Two-Phase Authentication Flow

```
Google Sign-In → Profile Check → Onboarding (if needed) → Dashboard
```

### Phase 1: Authentication

- **Purpose**: Verify user identity with Google OAuth
- **Result**: Firebase Auth user object with uid
- **Storage**: Firebase Authentication system

### Phase 2: Profile Verification & Onboarding

- **Purpose**: Ensure user has complete application profile
- **Check**: Look for user document in Firestore using uid
- **Outcome**:
  - Profile exists → Route to appropriate dashboard
  - Profile missing → Route to onboarding flow

## Database Structure

### Users Collection (`users/{uid}`)

```typescript
{
  uid: string,                    // Firebase Auth uid (document ID)
  email: string,
  displayName: string,
  photoURL: string,

  // Application-specific fields
  role: "client" | "company",
  currentCompanyId: string,       // Active company context
  companyAssociations: [{
    companyId: string,
    role: "member" | "admin" | "owner",
    joinedAt: Timestamp
  }],

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp,
  isActive: boolean
}
```

### Companies Collection (`companies/{companyId}`)

```typescript
{
  companyName: string,
  description?: string,
  ownerUid: string,
  companyCode: string,           // For member invitations
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isActive: boolean
}
```

## Implementation Strategy

### 1. Post-Authentication Handler

Create a centralized handler that runs after every successful Google Sign-In:

```typescript
async function handlePostAuthentication(user: User) {
  // Check if user profile exists
  const userDoc = await getDoc(doc(db, "users", user.uid));

  if (userDoc.exists()) {
    // Existing user - route to appropriate dashboard
    await redirectToAppropriateDashboard(userDoc.data());
  } else {
    // New user - route to onboarding
    await goto("/onboarding");
  }
}
```

### 2. Onboarding Flow

Create dedicated onboarding route `/onboarding` that:

1. Presents role selection (Client, Company Member, Create Company)
2. Collects necessary information based on role
3. Creates user profile and company associations
4. Routes to appropriate dashboard

### 3. Authentication Guards

Update route guards to check for complete profiles:

```typescript
function requireCompleteProfile() {
  const user = get(userProfile);
  if (!user.data?.currentCompanyId) {
    goto("/onboarding");
    return false;
  }
  return true;
}
```

### 4. Profile Creation Service

Create service to handle user profile creation:

```typescript
async function createUserProfile(user: User, roleData: RoleData) {
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: roleData.role,
    currentCompanyId: roleData.companyId,
    companyAssociations: [
      {
        companyId: roleData.companyId,
        role: roleData.companyRole,
        joinedAt: serverTimestamp(),
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    isActive: true,
  };

  await setDoc(doc(db, "users", user.uid), userProfile);
}
```

## Migration Strategy

### Existing Users

1. Identify users in Firebase Auth without Firestore profiles
2. Create migration script to generate basic profiles
3. Handle edge cases where profile data is incomplete

### Backward Compatibility

1. Maintain existing routes during transition
2. Add profile checks incrementally
3. Provide fallback routing for incomplete profiles

## Security Considerations

### Profile Verification

- Always verify profile exists before granting access
- Use Firebase Security Rules to enforce profile completeness
- Validate company associations on every request

### Data Consistency

- Use transactions for profile creation
- Implement proper error handling for partial states
- Add validation for required profile fields

## Performance Implications

### Additional Database Read

- One extra Firestore read per authentication
- Mitigate with caching and optimistic UI updates
- Consider using client-side caching for user profiles

### Onboarding Overhead

- One-time cost for new users
- Batch profile creation for company invitations
- Preload common onboarding data

## Testing Strategy

### Authentication Flow Tests

1. Test new user onboarding flow
2. Test existing user direct routing
3. Test profile validation edge cases

### Integration Tests

1. Test role-based routing after onboarding
2. Test company association creation
3. Test profile migration scenarios

### Security Tests

1. Test access without complete profile
2. Test unauthorized company access attempts
3. Test profile manipulation attempts
