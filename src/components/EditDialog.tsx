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
}

export default function EditDialog({ product }: EditDialogProps) {
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
    priceChangeReason: "", // NEW: Reason for price change
  }));

  // Fetch full product data with price history when dialog opens
  useEffect(() => {
    if (isOpen && !fullProduct) {
      getProductById(product.id).then((data) => {
        if (data) {
          setFullProduct(data);
        }
      });
    }
  }, [isOpen, product.id, fullProduct]);

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate price change reason if price changed
    if (formData.price !== product.price && !formData.priceChangeReason.trim()) {
      toast.error("Please provide a reason for the price change");
      return;
    }
    
    try {
      const updatedProduct = await editProduct(product.id, {
        ...formData,
        priceChangeReason: formData.priceChangeReason, // Pass reason to action
      });
      console.log("Product edited: ", updatedProduct);
      toast.success("Product edited successfully");
      
      // Reset full product to refetch on next open
      setFullProduct(null);
      setIsOpen(false);
      
      // Reset form
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
          className="w-full  h-10 flex items-center justify-center gap-2"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="downloadUrl">Download URL</Label>
              <Input
                id="downloadUrl"
                type="url"
                placeholder="https://example.com/your-file.zip"
                value={formData.downloadUrl}
                onChange={(e) => handleChange("downloadUrl", e.target.value)}
              />
            </div>
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
          </div>

          {/* NEW: Show mini price chart if product has price history */}
          {fullProduct?.priceHistory && fullProduct.priceHistory.length > 0 && (
            <div className="my-4 ">
              <MiniPriceChart
                priceHistory={fullProduct.priceHistory}
                currentPrice={product.price}
              />
            </div>
          )}

          {/* NEW: Show price change reason field if price is being changed */}
          {formData.price !== product.price && (
            <div>
              <Label htmlFor="priceChangeReason">
                Price Change Reason <span className="text-red-500">(Required for tracking)</span>
              </Label>
              <Input
                id="priceChangeReason"
                type="text"
                placeholder="e.g., Supplier price increase, Market adjustment, Promotion"
                value={formData.priceChangeReason}
                onChange={(e) => handleChange("priceChangeReason", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Old price: ₱{product.price.toFixed(2)} → New price: ₱{formData.price.toFixed(2)}
                <span className={formData.price > product.price ? "text-red-500 ml-2" : "text-green-500 ml-2"}>
                  {formData.price > product.price ? "↑" : "↓"}
                  {Math.abs(((formData.price - product.price) / product.price) * 100).toFixed(2)}%
                </span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
              <p className="text-xs text-black mt-1">
                Alert when stock falls below this level
              </p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="py-5 font-semibold">
            Product Image
            <ImageUpload
              endpoint="postImage"
              value={formData.imageUrl}
              onChange={(url) => handleChange("imageUrl", url)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit">Submit</AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
