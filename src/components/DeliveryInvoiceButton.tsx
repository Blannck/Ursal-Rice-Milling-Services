"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useState, useEffect } from "react";

interface DeliveryInvoiceButtonProps {
  orderId: string;
  deliveryId: string;
  deliveryNumber: number;
  deliveryStatus: string;
}

export default function DeliveryInvoiceButton({
  orderId,
  deliveryId,
  deliveryNumber,
  deliveryStatus,
}: DeliveryInvoiceButtonProps) {
  const [stockAvailable, setStockAvailable] = useState(true);
  const [checking, setChecking] = useState(deliveryNumber > 1 && deliveryStatus === 'pending');

  useEffect(() => {
    // For backorder deliveries (deliveryNumber > 1) that are pending, check stock
    if (deliveryNumber > 1 && deliveryStatus === 'pending') {
      checkStockAvailability();
    }
  }, [deliveryNumber, deliveryStatus]);

  const checkStockAvailability = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/delivery/${deliveryId}/stock-check`);
      const data = await response.json();
      setStockAvailable(data.available);
    } catch (error) {
      console.error("Failed to check stock:", error);
      setStockAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  // If checking stock, show loading state
  if (checking) {
    return (
      <Button variant="outline" disabled className="opacity-50">
        <FileText className="h-4 w-4 mr-2" />
        Checking...
      </Button>
    );
  }

  // If backorder without stock, show disabled button with tooltip
  if (!stockAvailable) {
    return (
      <div className="relative group">
        <Button variant="outline" disabled className="opacity-50">
          <FileText className="h-4 w-4 mr-2" />
          Invoice
        </Button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Available when stock arrives
        </div>
      </div>
    );
  }

  // Stock available or already fulfilled - show active button
  return (
    <Button asChild variant="outline">
      <a
        href={`/orders/${orderId}/delivery/${deliveryId}/invoice`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Invoice #{deliveryNumber}
      </a>
    </Button>
  );
}
