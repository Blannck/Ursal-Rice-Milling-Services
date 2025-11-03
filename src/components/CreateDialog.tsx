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
import { createProduct } from "@/actions/product.aciton";

export default function CreateDialog() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    downloadUrl: "",
    price: 1,
    reorderPoint: 0,
    category: "",
    userId: "",
    imageUrl: "",
    isMilledRice: false,
    millingYieldRate: 0,
  });

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const newProduct = await createProduct(formData);
      console.log("Product created: ", newProduct);
      toast.success("Product created successfully");

      setFormData({
        name: "",
        description: "",
        downloadUrl: "",
        price: 1,
        reorderPoint: 0,
        category: "",
        userId: "",
        imageUrl: "",
        isMilledRice: false,
        millingYieldRate: 65, // Default milling yield rate is typically around 65%
      });

    } catch (error) {
      console.error("Error creating product", error);
      toast.error("Failed to create product");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="default"
          className="ml-auto font-bold flex items-center gap-2"
          asChild
        >
          <span>Add Product</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="text-black bg-custom-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Add a Product</AlertDialogTitle>
          <AlertDialogDescription className="text-black">
            Fill out the form below to add a new product to your inventory.
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
              required
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
            placeholder="Type your message here."
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

          <div className="grid grid-cols-2 gap-4">
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

          {/* Rice Milling Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="isMilledRice">Product Type</Label>
              <Select value={formData.isMilledRice ? "milled" : "unmilled"} onValueChange={(v) => handleChange("isMilledRice", v === "milled")}>
                <SelectTrigger id="isMilledRice">
                  <SelectValue placeholder="Select rice type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unmilled">Unmilled Rice</SelectItem>
                  <SelectItem value="milled">Milled Rice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.isMilledRice && (
              <div>
                <Label htmlFor="millingYieldRate">Milling Yield Rate (%)</Label>
                <Input
                  id="millingYieldRate"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Enter yield rate"
                  value={formData.millingYieldRate}
                  onChange={(e) => handleChange("millingYieldRate", Number(e.target.value))}
                />
              </div>
            )}
          </div>
        
          {/* Image Upload */}
          <div className="py-5 font-semibold  ">
              Product Image
            <ImageUpload
             
              endpoint="postImage"
              value={formData.imageUrl}
              onChange={(url) => {
                handleChange("imageUrl", url);
              }}
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
