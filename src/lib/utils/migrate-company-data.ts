import { db } from "$lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";

/**
 * Migration script to add companyId to existing data
 * Run this once after deploying the refactor
 */
export async function migrateCompanyData() {
  console.log("Starting company data migration...");

  try {
    // Migrate orders - assume all existing orders belong to the first company
    // In a real scenario, you'd need to determine the correct companyId
    const ordersQuery = query(collection(db, "orders"));
    const ordersSnapshot = await getDocs(ordersQuery);

    for (const orderDoc of ordersSnapshot.docs) {
      const data = orderDoc.data();
      if (!data.companyId) {
        // For migration, set a default companyId
        // In production, you'd need to map based on user/company relationships
        await updateDoc(doc(db, "orders", orderDoc.id), {
          companyId: "default-company-id", // Replace with actual logic
        });
        console.log(`Migrated order ${orderDoc.id}`);
      }
    }

    // Migrate payments
    const paymentsQuery = query(collection(db, "payments"));
    const paymentsSnapshot = await getDocs(paymentsQuery);

    for (const paymentDoc of paymentsSnapshot.docs) {
      const data = paymentDoc.data();
      if (!data.companyId) {
        await updateDoc(doc(db, "payments", paymentDoc.id), {
          companyId: "default-company-id", // Replace with actual logic
        });
        console.log(`Migrated payment ${paymentDoc.id}`);
      }
    }

    // Migrate document templates
    const templatesQuery = query(collection(db, "documentTemplates"));
    const templatesSnapshot = await getDocs(templatesQuery);

    for (const templateDoc of templatesSnapshot.docs) {
      const data = templateDoc.data();
      if (!data.companyId) {
        await updateDoc(doc(db, "documentTemplates", templateDoc.id), {
          companyId: "default-company-id", // Replace with actual logic
        });
        console.log(`Migrated template ${templateDoc.id}`);
      }
    }

    // Migrate generated documents
    const documentsQuery = query(collection(db, "generatedDocuments"));
    const documentsSnapshot = await getDocs(documentsQuery);

    for (const documentDoc of documentsSnapshot.docs) {
      const data = documentDoc.data();
      if (!data.companyId) {
        await updateDoc(doc(db, "generatedDocuments", documentDoc.id), {
          companyId: "default-company-id", // Replace with actual logic
        });
        console.log(`Migrated document ${documentDoc.id}`);
      }
    }

    // Migrate document deliveries
    const deliveriesQuery = query(collection(db, "documentDeliveries"));
    const deliveriesSnapshot = await getDocs(deliveriesQuery);

    for (const deliveryDoc of deliveriesSnapshot.docs) {
      const data = deliveryDoc.data();
      if (!data.companyId) {
        await updateDoc(doc(db, "documentDeliveries", deliveryDoc.id), {
          companyId: "default-company-id", // Replace with actual logic
        });
        console.log(`Migrated delivery ${deliveryDoc.id}`);
      }
    }

    // Migrate products
    const productsQuery = query(collection(db, "products"));
    const productsSnapshot = await getDocs(productsQuery);

    for (const productDoc of productsSnapshot.docs) {
      const data = productDoc.data();
      if (!data.companyId) {
        await updateDoc(doc(db, "products", productDoc.id), {
          companyId: "default-company-id", // Replace with actual logic
        });
        console.log(`Migrated product ${productDoc.id}`);
      }
    }

    // Migrate document types
    const typesQuery = query(collection(db, "documentTypes"));
    const typesSnapshot = await getDocs(typesQuery);

    for (const typeDoc of typesSnapshot.docs) {
      const data = typeDoc.data();
      if (!data.companyId) {
        await updateDoc(doc(db, "documentTypes", typeDoc.id), {
          companyId: "default-company-id", // Replace with actual logic
        });
        console.log(`Migrated document type ${typeDoc.id}`);
      }
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
