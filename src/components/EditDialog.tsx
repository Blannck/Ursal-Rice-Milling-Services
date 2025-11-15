import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EditIcon } from "lucide-react";
import { Combobox } from "./ui/combo-box";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";
import { editProduct, getProductById } from "@/actions/product.aciton";
import MiniPriceChart from "./MiniPriceChart";

type ProductWithHistory = NonNullable<Awaited<ReturnType<typeof getProductById>>>;

interface EditDialogProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    downloadUrl: string | null;
    price: number;
    reorderPoint: number | null;
    category: string;
    userId: string;
    imageUrl: string | null;
  };

  // ⭐ NEW: Notifies parent to update UI
  onUpdated?: (updated: any) => void;
}

export default function EditDialog({ product, onUpdated }: EditDialogProps) {
  const [fullProduct, setFullProduct] = useState<ProductWithHistory | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState(() => ({
    name: product.name.trim(),
    description: (product.description || "").trim(),
    downloadUrl: product.downloadUrl || "",
    price: product.price,
    reorderPoint: product.reorderPoint || 0,
    category: product.category.trim(),
    userId: product.userId.trim(),
    imageUrl: product.imageUrl || "",
    priceChangeReason: "",
  }));

  useEffect(() => {
    if (isOpen && !fullProduct) {
      getProductById(product.id).then((data) => {
        if (data) setFullProduct(data);
      });
    }
  }, [isOpen, product.id, fullProduct]);

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.price !== product.price && !formData.priceChangeReason.trim()) {
      toast.error("Please provide a reason for the price change");
      return;
    }

    try {
      const updatedProduct = await editProduct(product.id, {
        ...formData,
        priceChangeReason: formData.priceChangeReason,
      });

      toast.success("Product edited successfully");

      // ⭐ NEW: Tell parent to update ProductCard immediately
      onUpdated?.(updatedProduct);

      setFullProduct(null);
      setIsOpen(false);

      setFormData({
        name: product.name.trim(),
        description: (product.description || "").trim(),
        downloadUrl: product.downloadUrl || "",
        price: product.price,
        reorderPoint: product.reorderPoint || 0,
        category: product.category.trim(),
        userId: product.userId.trim(),
        imageUrl: product.imageUrl || "",
        priceChangeReason: "",
      });
    } catch (error) {
      console.error("Error editing product", error);
      toast.error("Failed to edit product");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="default"
          className="w-full h-10 flex items-center justify-center gap-2"
          asChild
        >
          <span>
            <EditIcon className="w-4 h-4" />
            Edit
          </span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="text-black bg-custom-white max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Product</AlertDialogTitle>
          <AlertDialogDescription className="text-black">
            Update the details of this product in your inventory.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Combobox
                value={formData.category}
                onChange={(val) => handleChange("category", val)}
              />
            </div>
          </div>

          <Label htmlFor="description">Description</Label>
          <Textarea
            className="bg-white"
            id="description"
            placeholder="Type product description here."
            rows={5}
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                placeholder="Enter price"
                value={formData.price}
                onChange={(e) => handleChange("price", Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="reorderPoint">Reorder Point</Label>
              <Input
                id="reorderPoint"
                type="number"
                min="0"
                placeholder="Minimum stock level"
                value={formData.reorderPoint}
                onChange={(e) => handleChange("reorderPoint", Number(e.target.value))}
              />
            </div>
          </div>

          {fullProduct?.priceHistory && fullProduct.priceHistory.length > 0 && (
            <div className="my-4">
              <MiniPriceChart
                priceHistory={fullProduct.priceHistory}
                currentPrice={product.price}
              />
            </div>
          )}

          {formData.price !== product.price && (
            <div>
              <Label htmlFor="priceChangeReason">
                Price Change Reason <span className="text-red-500">(Required)</span>
              </Label>
              <Input
                id="priceChangeReason"
                type="text"
                placeholder="e.g., Supplier increase, Promotion, Market change"
                value={formData.priceChangeReason}
                onChange={(e) => handleChange("priceChangeReason", e.target.value)}
              />
            </div>
          )}

         

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit">Submit</AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
