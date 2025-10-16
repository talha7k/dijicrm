import { json, error } from "@sveltejs/kit";
import { Timestamp } from "firebase-admin/firestore";
import type { DocumentDelivery } from "$lib/types/document";
import { documentDeliveryStore } from "$lib/stores/documentDelivery";

export const POST = async ({ request }: any) => {
  try {
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

      // Find delivery by email service ID
      // In a real implementation, you'd query the database
      // For now, we'll simulate finding the delivery
      const deliveryId = `delivery-${sg_message_id}`; // Mock mapping

      let status: DocumentDelivery["status"];
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

      // Update delivery status
      documentDeliveryStore.updateDeliveryStatus(deliveryId, status, {
        deliveredAt,
        errorMessage,
        ...additionalData,
      });

      processedEvents.push({
        deliveryId,
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
    const deliveryId = url.searchParams.get("deliveryId");
    const emailServiceId = url.searchParams.get("emailServiceId");

    if (!deliveryId && !emailServiceId) {
      throw error(
        400,
        "Either deliveryId or emailServiceId parameter required",
      );
    }

    // In a real implementation, you'd poll the email service API
    // For now, simulate polling response
    const mockStatus = {
      deliveryId: deliveryId || "mock-delivery-id",
      status: Math.random() > 0.8 ? "delivered" : "sent", // 80% delivered
      lastChecked: Timestamp.now(),
      emailServiceResponse: {
        message_id: emailServiceId || "mock-message-id",
        status: "delivered",
        delivered_at: new Date().toISOString(),
      },
    };

    // Update delivery status if found
    if (deliveryId) {
      documentDeliveryStore.updateDeliveryStatus(
        deliveryId,
        mockStatus.status as DocumentDelivery["status"],
        {
          deliveredAt:
            mockStatus.status === "delivered"
              ? (Timestamp.now() as any)
              : undefined,
        },
      );
    }

    return json({
      success: true,
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
