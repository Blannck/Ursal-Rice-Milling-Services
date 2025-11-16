"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addToCart } from "@/actions/cart.action";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";

type AddToCartButtonProps = {
  productId: string;
  quantity?: number;
  redirectTo?: string;
  availableStock?: number;
};

export default function AddToCartButton({
  productId,
  quantity = 1,
  redirectTo = "/cart",
  availableStock,
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const router = useRouter();

  const handleAddToCart = async (skipWarning = false) => {
    // Check if we need to show warning
    if (!skipWarning && availableStock !== undefined && quantity > availableStock) {
      setShowWarningModal(true);
      return;
    }

    setIsLoading(true);
    setShowWarningModal(false);
    try {
      await addToCart(productId, quantity);
      toast.success("Added to cart!", {
        duration: 2000,
      });
      router.refresh();
    } catch (error: any) {
      console.error("Add to cart failed", error);
      if (error.message?.includes("logged in")) {
        toast.error("Please sign in to add items to cart");
      } else {
        toast.error("Failed to add to cart");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAddToCart = () => {
    handleAddToCart(true);
  };

  const handleCloseModal = () => {
    setShowWarningModal(false);
  };

  return (
    <>
      <Button onClick={() => handleAddToCart(false)} disabled={isLoading}>
        {isLoading ? "Adding..." : "Add to cart"}
      </Button>

      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Low Stock Warning
            </DialogTitle>
            <DialogDescription className="pt-2">
              {availableStock !== undefined && availableStock > 0 ? (
                <>
                  Only <span className="font-semibold text-yellow-600">{availableStock} sack{availableStock !== 1 ? 's' : ''}</span> are currently available in stock.
                  Your order may experience delays as we restock this item.
                </>
              ) : (
                <>
                  This item is currently <span className="font-semibold text-red-600">out of stock</span>.
                  Your order will be fulfilled once we receive new inventory, which may cause significant delays.
                </>
              )}
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <strong>Note:</strong> Delivery time may be extended due to limited stock availability.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAddToCart}
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Confirm & Add to Cart"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
