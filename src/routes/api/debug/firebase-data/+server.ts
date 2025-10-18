import { json, type RequestHandler } from "@sveltejs/kit";
import { getDb } from "$lib/firebase-admin";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Only allow in development or for admin users
    if (
      process.env.NODE_ENV === "production" &&
      !locals.user?.email?.includes("admin")
    ) {
      return json(
        {
          error:
            "Access denied. This endpoint is only available in development or for admin users.",
        },
        { status: 403 },
      );
    }

    const db = getDb();
    if (!db) {
      return json({ error: "Database not available" }, { status: 500 });
    }

    console.log("📊 [DEBUG] Starting Firebase data collection...");

    const result: any = {
      timestamp: new Date().toISOString(),
      collections: {},
      summary: {
        totalCollections: 0,
        totalDocuments: 0,
        totalUsers: 0,
        totalCompanies: 0,
      },
    };

    // 1. Get all root collections
    const collections = await db.listCollections();
    console.log(`📁 [DEBUG] Found ${collections.length} root collections`);

    for (const collectionRef of collections) {
      const collectionName = collectionRef.path;
      console.log(`📂 [DEBUG] Processing collection: ${collectionName}`);

      try {
        const snapshot = await db.collection(collectionName).get();
        const documents: any[] = [];

        for (const docSnapshot of snapshot.docs) {
          const docData = {
            id: docSnapshot.id,
            path: docSnapshot.ref.path,
            data: docSnapshot.data(),
            size: JSON.stringify(docSnapshot.data()).length,
          };
          documents.push(docData);
        }

        result.collections[collectionName] = {
          documentCount: documents.length,
          documents: documents,
          totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
        };

        result.summary.totalDocuments += documents.length;
        result.summary.totalCollections++;

        if (collectionName === "users") {
          result.summary.totalUsers = documents.length;
        } else if (collectionName === "companies") {
          result.summary.totalCompanies = documents.length;
        }
      } catch (error) {
        console.error(
          `❌ [DEBUG] Error processing collection ${collectionName}:`,
          error,
        );
        result.collections[collectionName] = {
          error: error instanceof Error ? error.message : "Unknown error",
          documentCount: 0,
        };
      }
    }

    // 2. Get detailed company data with subcollections
    if (
      result.collections.companies &&
      result.collections.companies.documents
    ) {
      console.log("🏢 [DEBUG] Processing company subcollections...");
      result.companiesDetail = {};

      for (const company of result.collections.companies.documents) {
        const companyId = company.id;
        console.log(
          `🏢 [DEBUG] Processing company: ${companyId} (${company.data.name})`,
        );

        try {
          const companyDetail: any = {
            id: companyId,
            name: company.data.name,
            subcollections: {},
          };

          // Check for main document configurations
          const mainDocData = company.data;
          companyDetail.mainDocument = {
            hasSmtpConfig: !!mainDocData.smtpConfig,
            hasBrandingConfig: !!mainDocData.brandingConfig,
            hasVatConfig: !!mainDocData.vatConfig,
            settings: mainDocData.settings || {},
            createdAt: mainDocData.createdAt,
            updatedAt: mainDocData.updatedAt,
          };

          // Get subcollections
          const subcollections = ["members", "smtp", "branding", "vat"];

          for (const subcollectionName of subcollections) {
            try {
              const subSnapshot = await db
                .collection(`companies/${companyId}/${subcollectionName}`)
                .get();

              const subDocs: any[] = [];
              for (const subDoc of subSnapshot.docs) {
                subDocs.push({
                  id: subDoc.id,
                  data: subDoc.data(),
                });
              }

              if (subDocs.length > 0) {
                companyDetail.subcollections[subcollectionName] = {
                  documentCount: subDocs.length,
                  documents: subDocs,
                };
              }
            } catch (subError) {
              // Subcollection might not exist, which is fine
              companyDetail.subcollections[subcollectionName] = {
                documentCount: 0,
                error:
                  subError instanceof Error
                    ? subError.message
                    : "Subcollection not accessible",
              };
            }
          }

          result.companiesDetail[companyId] = companyDetail;
        } catch (companyError) {
          console.error(
            `❌ [DEBUG] Error processing company ${companyId}:`,
            companyError,
          );
          result.companiesDetail[companyId] = {
            error:
              companyError instanceof Error
                ? companyError.message
                : "Unknown error",
          };
        }
      }
    }

    // 3. Get user details with company associations
    if (result.collections.users && result.collections.users.documents) {
      console.log("👤 [DEBUG] Processing user details...");
      result.usersDetail = {};

      for (const user of result.collections.users.documents) {
        const userId = user.id;
        const userData = user.data;

        result.usersDetail[userId] = {
          id: userId,
          email: userData.email,
          displayName: userData.displayName,
          onboardingCompleted: userData.onboardingCompleted,
          currentCompanyId: userData.currentCompanyId,
          companyAssociations: userData.companyAssociations || [],
          createdAt: userData.createdAt,
          lastLoginAt: userData.lastLoginAt,
        };
      }
    }

    // 4. Check for any other collections that might exist
    console.log("🔍 [DEBUG] Checking for additional collections...");
    const additionalCollections = [
      "orders",
      "documents",
      "templates",
      "invitations",
    ];

    for (const collectionName of additionalCollections) {
      try {
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.docs.length > 0) {
          result.collections[collectionName] = {
            documentCount: snapshot.docs.length,
            documents: snapshot.docs.map((doc) => ({
              id: doc.id,
              data: doc.data(),
            })),
          };
          result.summary.totalCollections++;
          result.summary.totalDocuments += snapshot.docs.length;
        }
      } catch (error) {
        // Collection might not exist, which is fine
        console.log(
          `ℹ️ [DEBUG] Collection ${collectionName} not found or not accessible`,
        );
      }
    }

    // 5. Add performance metrics
    result.performance = {
      collectionsProcessed: result.summary.totalCollections,
      documentsProcessed: result.summary.totalDocuments,
      processingTime: Date.now() - new Date(result.timestamp).getTime(),
    };

    console.log("✅ [DEBUG] Firebase data collection completed");
    console.log(
      `📊 [DEBUG] Summary: ${result.summary.totalCollections} collections, ${result.summary.totalDocuments} documents`,
    );

    return json(result);
  } catch (error) {
    console.error("❌ [DEBUG] Error in Firebase data collection:", error);
    return json(
      {
        error: "Failed to collect Firebase data",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
};

export const DELETE: RequestHandler = async ({ locals }) => {
  try {
    // Only allow in development and for admin users
    if (
      process.env.NODE_ENV === "production" ||
      !locals.user?.email?.includes("admin")
    ) {
      return json(
        {
          error:
            "Access denied. This endpoint is only available in development for admin users.",
        },
        { status: 403 },
      );
    }

    const db = getDb();
    if (!db) {
      return json({ error: "Database not available" }, { status: 500 });
    }

    console.log("🧹 [DEBUG] Starting database cleanup...");

    const result: any = {
      timestamp: new Date().toISOString(),
      deletedCollections: {},
      summary: {
        totalCollectionsDeleted: 0,
        totalDocumentsDeleted: 0,
      },
    };

    // Get all collections and delete them
    const collections = await db.listCollections();

    for (const collectionRef of collections) {
      const collectionName = collectionRef.path;
      console.log(`🗑️ [DEBUG] Deleting collection: ${collectionName}`);

      try {
        const snapshot = await db.collection(collectionName).get();
        let deletedCount = 0;

        // Delete all documents in the collection
        for (const doc of snapshot.docs) {
          await doc.ref.delete();
          deletedCount++;
        }

        result.deletedCollections[collectionName] = {
          documentsDeleted: deletedCount,
          status: "success",
        };

        result.summary.totalCollectionsDeleted++;
        result.summary.totalDocumentsDeleted += deletedCount;
      } catch (error) {
        console.error(
          `❌ [DEBUG] Error deleting collection ${collectionName}:`,
          error,
        );
        result.deletedCollections[collectionName] = {
          error: error instanceof Error ? error.message : "Unknown error",
          status: "failed",
        };
      }
    }

    console.log("✅ [DEBUG] Database cleanup completed");
    console.log(
      `📊 [DEBUG] Deleted ${result.summary.totalCollectionsDeleted} collections with ${result.summary.totalDocumentsDeleted} documents`,
    );

    return json(result);
  } catch (error) {
    console.error("❌ [DEBUG] Error in database cleanup:", error);
    return json(
      {
        error: "Failed to cleanup database",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    // Allow specific collection queries
    if (body.collection) {
      const db = getDb();
      if (!db) {
        return json({ error: "Database not available" }, { status: 500 });
      }

      const snapshot = await db.collection(body.collection).get();

      const documents = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
        path: doc.ref.path,
      }));

      return json({
        collection: body.collection,
        documentCount: documents.length,
        documents: documents,
        timestamp: new Date().toISOString(),
      });
    }

    return json(
      { error: "Invalid request. Please specify a collection name." },
      { status: 400 },
    );
  } catch (error) {
    console.error("❌ [DEBUG] Error in POST request:", error);
    return json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};
