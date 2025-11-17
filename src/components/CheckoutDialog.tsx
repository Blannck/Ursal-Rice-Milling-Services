"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryType: string;
    paymentMethod?: string;
  }) => Promise<void>;
  totalAmount: number;
}

export default function CheckoutDialog({
  open,
  onClose,
  onConfirm,
  totalAmount,
}: CheckoutDialogProps) {
  const [step, setStep] = useState<"info" | "payment" | "qrcode">("info");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"Pickup" | "Delivery">("Pickup");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "GCash">("COD");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(20);
  const [timerActive, setTimerActive] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep("info");
      setCustomerName("");
      setCustomerPhone("");
      setDeliveryAddress("");
      setDeliveryType("Pickup");
      setPaymentMethod("COD");
      setTimer(20);
      setTimerActive(false);
    }
  }, [open]);

  // Timer for GCash QR code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && timerActive) {
      handlePlaceOrder();
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const handleNext = () => {
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    if (deliveryType === "Pickup") {
      // Direct order placement for pickup
      handlePlaceOrder();
    } else {
      // Go to payment selection for delivery
      setStep("payment");
    }
  };

  const handlePaymentSelection = () => {
    if (paymentMethod === "GCash") {
      setStep("qrcode");
      setTimerActive(true);
    } else {
      // COD - place order directly
      handlePlaceOrder();
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      await onConfirm({
        customerName,
        customerPhone,
        deliveryAddress,
        deliveryType,
        paymentMethod: deliveryType === "Delivery" ? paymentMethod : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to place order:", error);
    } finally {
      setLoading(false);
      setTimerActive(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "info" && "Customer Information"}
            {step === "payment" && "Select Payment Method"}
            {step === "qrcode" && "Scan QR Code to Pay"}
          </DialogTitle>
        </DialogHeader>

        {step === "info" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="Enter your phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                placeholder="Enter complete delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery Type *</Label>
              <RadioGroup
                value={deliveryType}
                onValueChange={(value) => setDeliveryType(value as "Pickup" | "Delivery")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Pickup" id="pickup" />
                  <Label htmlFor="pickup" className="cursor-pointer">
                    Pickup
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Delivery" id="delivery" />
                  <Label htmlFor="delivery" className="cursor-pointer">
                    Delivery
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold">₱{totalAmount.toFixed(2)}</span>
              </div>
              <Button onClick={handleNext} className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "COD" | "GCash")}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="COD" id="cod" />
                  <Label htmlFor="cod" className="cursor-pointer flex-1">
                    <div className="font-medium">Cash on Delivery (COD)</div>
                    <div className="text-sm text-muted-foreground">
                      Pay when you receive your order
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="GCash" id="gcash" />
                  <Label htmlFor="gcash" className="cursor-pointer flex-1">
                    <div className="font-medium">GCash</div>
                    <div className="text-sm text-muted-foreground">
                      Pay now via GCash QR code
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Button onClick={handlePaymentSelection} className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Payment Method"
                )}
              </Button>
              <Button onClick={() => setStep("info")} variant="outline" className="w-full">
                Back
              </Button>
            </div>
          </div>
        )}

        {step === "qrcode" && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="mb-4">
                <p className="text-lg font-semibold mb-2">Scan to Pay</p>
                <p className="text-sm text-muted-foreground">
                  Amount: ₱{totalAmount.toFixed(2)}
                </p>
              </div>

              <div className="flex justify-center mb-4">
                <div className="border-4 border-gray-200 rounded-lg p-4 bg-white">
                  <img
                    src="/qrcode.jpg"
                    alt="GCash QR Code"
                    className="w-64 h-64 object-contain"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  This is a simulated payment. Your order will be placed automatically in{" "}
                  <span className="font-bold text-xl">{timer}</span> seconds.
                </p>
              </div>

              <div className="text-xs text-muted-foreground">
                Please complete the payment to proceed with your order.
              </div>
            </div>

            {loading && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Placing order...</span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
