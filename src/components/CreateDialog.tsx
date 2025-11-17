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
import { Combobox } from "./ui/combo-box";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";
import { createCategory } from "@/actions/product.aciton";
import { Plus } from "lucide-react";

export default function CreateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    downloadUrl: "",
    price: 1,
    reorderPoint: 0,
    userId: "",
    imageUrl: "",
    isMilledRice: false, // Always create unmilled rice categories by default
    isHidden: true // Hide from Manage Products page by default
  });

  const handleChange = (field: string, value: string | number | boolean) => {
    console.log(`Updating field "${field}" with value:`, value);
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log("Submitting category with data:", formData);
    
    try {
      const newCategory = await createCategory(formData);
      console.log("Product created successfully:", newCategory);
      
      // Close dialog first
      setIsOpen(false);

      // Show success notification with custom styling
      toast.success(`✅ Product "${formData.name}" created successfully!`, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#10b981',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold',
          padding: '16px',
          borderRadius: '8px',
        },
        icon: '🎉',
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        downloadUrl: "",
        price: 1,
        reorderPoint: 0,
        userId: "",
        imageUrl: "",
        isMilledRice: false,
        isHidden: true
      });

      // Force a page refresh to show the new category with its image
      setTimeout(() => {
        window.location.reload();
      }, 300);

    } catch (error) {
      console.error("Error creating category", error);
      toast.error("❌ Failed to create category. Please try again.", {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="default"
          className="flex items-center gap-2"
          asChild
        >
          <span>
            <Plus className="h-4 w-4" />
            Add Product
          </span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="text-black bg-custom-white max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Add a Product</AlertDialogTitle>
          <AlertDialogDescription className="text-black">
            Fill out the form below to add a new product to your inventory.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Ordinary, Toner, or RC-160"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            className="bg-white"
            id="description"
            placeholder="Type your message here."
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
                placeholder="Minimum stock level (default: 0)"
                value={formData.reorderPoint}
                onChange={(e) => handleChange("reorderPoint", Number(e.target.value))}
              />
              <p className="text-xs text-black mt-1">
                Alert when stock falls below this level
              </p>
            </div>
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
