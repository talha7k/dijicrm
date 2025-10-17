import { redirect, type ServerLoad } from '@sveltejs/kit';
import { getDb } from '$lib/firebase-admin';
import type { UserProfile } from '$lib/types/user';
import type { Company } from '$lib/types/company';
import type { CompanyMember } from '$lib/types/companyMember';
import { Timestamp } from 'firebase-admin/firestore';

// Helper function to convert Firestore Timestamps to ISO strings for serialization
function convertTimestamps(obj: any): any {
  if (obj && typeof obj === 'object') {
    if (obj._seconds !== undefined && obj._nanoseconds !== undefined) {
      // This looks like a Firestore Timestamp
      return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000).toISOString();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => convertTimestamps(item));
    }
    
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertTimestamps(obj[key]);
    }
    return converted;
  }
  return obj;
}

export const load: ServerLoad = async ({ locals }) => {
  try {
    // Stage 2: The (app) Layout Gatekeeper
    // Check for User in Local Context
    if (!locals.user) {
      // User is not logged in - redirect to login
      console.log('No user in locals, redirecting to sign-in');
      throw redirect(302, '/sign-in');
    }

    let db;
    try {
      db = getDb();
      if (!db) {
        console.error('Firebase Admin DB returned null');
        throw redirect(302, '/sign-in');
      }
    } catch (error) {
      console.error('Error getting Firebase Admin DB:', error);
      throw redirect(302, '/sign-in');
    }

    // Fetch the UserProfile using the user uid from locals
    const userDocRef = db.collection('users').doc(locals.user.uid);
    let userDoc;
    try {
      userDoc = await userDocRef.get();
    } catch (error) {
      console.error('Error fetching user document:', error);
      throw redirect(302, '/sign-in');
    }

    if (!userDoc.exists) {
      // Scenario A: UserProfile Document Does NOT Exist
      // This is a brand new user who has authenticated but has not completed sign-up flow
      // Redirect to onboarding
      console.log('No user profile found for user:', locals.user.uid);
      throw redirect(302, '/onboarding');
    }

    let userProfile: UserProfile;
    try {
      const rawProfile = userDoc.data();
      // Convert any Timestamps in the user profile to ISO strings
      userProfile = convertTimestamps(rawProfile) as UserProfile;
    } catch (error) {
      console.error('Error parsing user profile data:', error);
      throw redirect(302, '/sign-in');
    }

    // Analyze the UserProfile and redirect accordingly
    if (!userProfile.onboardingCompleted) {
      // Scenario B: UserProfile Exists, but onboardingCompleted is false
      // Redirect them to the last step of onboarding they were on
      console.log('Onboarding not completed for user:', locals.user.uid);
      throw redirect(302, '/onboarding');
    }

    // Scenario C: Check if user has company associations and currentCompanyId is set
    if (!userProfile.companyAssociations || userProfile.companyAssociations.length === 0) {
      // User has valid profile but is not a member of any company yet
      // Redirect to a page where they can create or join a company
      console.log('No company associations found for user:', locals.user.uid, 'associations:', userProfile.companyAssociations);
      throw redirect(302, '/onboarding');
    }

    if (!userProfile.currentCompanyId) {
      // User has company associations but no current company set
      console.log('No currentCompanyId set for user:', locals.user.uid, 'associations:', userProfile.companyAssociations);
      throw redirect(302, '/onboarding');
    }

    // Scenario D: UserProfile exists, onboarding is complete, and currentCompanyId is set
    // Now fetch the active company and role data
    const currentCompanyId = userProfile.currentCompanyId;
    
    // Fetch the corresponding Company document
    const companyDocRef = db.collection('companies').doc(currentCompanyId);
    let companyDoc;
    try {
      companyDoc = await companyDocRef.get();
    } catch (error) {
      console.error('Error fetching company document:', error, 'companyId:', currentCompanyId);
      throw redirect(302, '/onboarding');
    }

    if (!companyDoc.exists) {
      // Company doesn't exist anymore
      console.log('Company document does not exist:', currentCompanyId);
      throw redirect(302, '/onboarding');
    }

    let company: Company;
    try {
      const rawCompany = companyDoc.data();
      // Convert any Timestamps in the company to ISO strings
      company = convertTimestamps(rawCompany) as Company;
    } catch (error) {
      console.error('Error parsing company data:', error);
      throw redirect(302, '/onboarding');
    }

    // Fetch the CompanyMember document to get role and permissions
    // The document is in the members subcollection under the company
    const memberDocRef = db.collection(`companies/${currentCompanyId}/members`).doc(locals.user.uid);
    let memberDoc;
    try {
      memberDoc = await memberDocRef.get();
    } catch (error) {
      console.error('Error fetching membership document:', error, 'userId:', locals.user.uid, 'companyId:', currentCompanyId);
      throw redirect(302, '/onboarding');
    }

    if (!memberDoc.exists) {
      // User doesn't have a membership record for this company
      console.log('Membership document does not exist for user in company:', locals.user.uid, currentCompanyId);
      console.log('Available user data:', { currentCompanyId, companyAssociations: userProfile.companyAssociations });
      throw redirect(302, '/onboarding');
    }

    let membership: CompanyMember;
    try {
      const rawMembership = memberDoc.data();
      // Convert any Timestamps in the membership to ISO strings
      membership = convertTimestamps(rawMembership) as CompanyMember;
    } catch (error) {
      console.error('Error parsing membership data:', error);
      throw redirect(302, '/onboarding');
    }

    console.log('Successfully validated user access to dashboard for user:', locals.user.uid);

    // Return all the fetched data for use in the client-side layout
    return {
      profile: userProfile,
      company: company,
      membership: membership
    };
  } catch (error) {
    // Catch any unexpected errors and log them, then redirect to sign-in
    console.error('Unexpected error in (app)/+layout.server.ts:', error);
    throw redirect(302, '/sign-in');
  }
};