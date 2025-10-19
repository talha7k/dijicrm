import { json, error } from "@sveltejs/kit";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "$lib/firebase-admin";

export const POST = async ({ request }: any) => {
  try {
    const db = getDb();
    if (!db) throw error(500, "Database not initialized");

    const body = await request.json();
    const { events } = body; // Email service webhook format

    if (!events || !Array.isArray(events)) {
      throw error(400, "Invalid webhook payload: events array required");
    }

    const processedEvents: any[] = [];

    for (const event of events) {
      const {
        email,
        event: eventType,
        timestamp,
        sg_message_id,
        reason,
        ...additionalData
      } = event;

      // Find email record by message ID
      const emailQuery = await db
        .collection("emailHistory")
        .where("messageId", "==", sg_message_id)
        .limit(1)
        .get();

      if (emailQuery.empty) {
        console.warn(`No email record found for message ID: ${sg_message_id}`);
        continue;
      }

      const emailDoc = emailQuery.docs[0];
      let status: string;
      let deliveredAt: Timestamp | undefined;
      let errorMessage: string | undefined;

      switch (eventType) {
        case "delivered":
          status = "delivered";
          deliveredAt = Timestamp.fromMillis(timestamp * 1000);
          break;
        case "bounce":
          status = "bounced";
          errorMessage = reason || "Email bounced";
          break;
        case "complained":
          status = "complained";
          errorMessage = "Recipient marked as spam";
          break;
        case "unsubscribe":
          status = "complained";
          errorMessage = "Recipient unsubscribed";
          break;
        default:
          // Ignore other events or handle them as needed
          continue;
      }

      // Update email record status
      const updateData: any = {
        status,
        ...additionalData,
      };

      if (deliveredAt) {
        updateData.deliveredAt = deliveredAt;
      }

      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      await emailDoc.ref.update(updateData);

      processedEvents.push({
        emailId: emailDoc.id,
        eventType,
        status,
        timestamp,
      });
    }

    return json({
      success: true,
      processedEvents: processedEvents.length,
      events: processedEvents,
    });
  } catch (err) {
    console.error("Delivery webhook error:", err);

    if (err instanceof Error && "status" in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, "Failed to process delivery webhook");
  }
};

// Alternative polling endpoint for services that don't support webhooks
export const GET = async ({ url }: any) => {
  try {
    const db = getDb();
    if (!db) throw error(500, "Database not initialized");

    const emailId = url.searchParams.get("emailId");
    const emailServiceId = url.searchParams.get("emailServiceId");

    if (!emailId && !emailServiceId) {
      throw error(400, "Either emailId or emailServiceId parameter required");
    }

    // Find email record
    let emailDoc;
    if (emailServiceId) {
      const emailQuery = await db
        .collection("emailHistory")
        .where("messageId", "==", emailServiceId)
        .limit(1)
        .get();

      if (emailQuery.empty) {
        throw error(404, "Email record not found");
      }

      emailDoc = emailQuery.docs[0];
    } else {
      emailDoc = await db.collection("emailHistory").doc(emailId).get();

      if (!emailDoc.exists) {
        throw error(404, "Email record not found");
      }
    }

    // In a real implementation, you'd poll the email service API
    // For now, simulate polling response
    const mockStatus = Math.random() > 0.8 ? "delivered" : "sent"; // 80% delivered

    // Update email record status
    const updateData: any = {
      status: mockStatus,
      lastChecked: Timestamp.now(),
    };

    if (mockStatus === "delivered") {
      updateData.deliveredAt = Timestamp.now();
    }

    await emailDoc.ref.update(updateData);

    return json({
      success: true,
      emailId: emailDoc.id,
      status: mockStatus,
    });
  } catch (err) {
    console.error("Delivery polling error:", err);

    if (err instanceof Error && "status" in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, "Failed to poll delivery status");
  }
};
