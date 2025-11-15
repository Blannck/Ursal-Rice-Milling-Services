"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Supplier {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  supplierId: string;
}

interface OrderItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentType, setPaymentType] = useState<"ONE_TIME" | "MONTHLY">("ONE_TIME");
  const [monthlyTerms, setMonthlyTerms] = useState<number>(3);
  const [dueDate, setDueDate] = useState("");
  
  // Add item state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSupplierId) {
      fetchSupplierProducts(selectedSupplierId);
    } else {
      setProducts([]);
    }
    // Clear items when supplier changes
    setOrderItems([]);
  }, [selectedSupplierId]);

  const fetchInitialData = async () => {
    try {
      console.log("Fetching suppliers..."); // Debug log
      const suppliersRes = await fetch("/api/admin/suppliers");
      console.log("Suppliers response status:", suppliersRes.status); // Debug log
      
      const suppliersData = await suppliersRes.json();
      console.log("Suppliers data:", suppliersData); // Debug log
      
      if (suppliersData.ok && suppliersData.data) {
        // Filter for active suppliers on the client side since your API doesn't support the active filter
        const activeSuppliers = suppliersData.data.filter((supplier: Supplier) => supplier.isActive);
        setSuppliers(activeSuppliers);
        console.log("Active suppliers loaded:", activeSuppliers.length); // Debug log
      } else {
        console.error("Suppliers API response:", suppliersData);
        alert(suppliersData.error || "Failed to fetch suppliers");
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      alert("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierProducts = async (supplierId: string) => {
    try {
      console.log("Fetching products for supplier:", supplierId); // Debug log
      const response = await fetch(`/api/admin/products?supplierId=${supplierId}`);
      console.log("Products response status:", response.status); // Debug log
      
      const data = await response.json();
      console.log("Products data:", data); // Debug log
      
      if (data.success && data.products) {
        setProducts(data.products);
        console.log("Products loaded:", data.products.length); // Debug log
      } else {
        console.error("Products API response:", data);
        alert(data.error || "Failed to fetch products");
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to fetch products");
      setProducts([]);
    }
  };

  const addOrderItem = () => {
    if (!selectedProductId || quantity <= 0) return;
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    // Check if item already exists
    const existingIndex = orderItems.findIndex(item => item.productId === selectedProductId);
    
    const price = customPrice ? parseFloat(customPrice) : product.price;
    
    if (existingIndex >= 0) {
      // Update existing item
      const newItems = [...orderItems];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: quantity,
        price: price,
      };
      setOrderItems(newItems);
    } else {
      // Add new item
      const newItem: OrderItem = {
        productId: selectedProductId,
        product: product,
        quantity: quantity,
        price: price,
      };
      setOrderItems([...orderItems, newItem]);
    }
    
    // Reset form
    setSelectedProductId("");
    setQuantity(1);
    setCustomPrice("");
  };

  const removeOrderItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeOrderItem(productId);
      return;
    }
    
    setOrderItems(orderItems.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    setOrderItems(orderItems.map(item => 
      item.productId === productId 
        ? { ...item, price: newPrice }
        : item
    ));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupplierId || orderItems.length === 0) {
      alert("Please select a supplier and add at least one item");
      return;
    }
    
    setSubmitting(true);
    
    try {
      console.log("Submitting purchase order:", {
        supplierId: selectedSupplierId,
        note,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      const response = await fetch("/api/admin/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          note,
          paymentType,
          monthlyTerms: paymentType === "MONTHLY" ? monthlyTerms : null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          items: orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });
      
     const data = await response.json();
if (data?.ok || data?.success) {
  router.push("/admin/purchase-orders?justCreated=1");
} else {
  alert(data.error || "Failed to create purchase order");
}
    } catch (error) {
      console.error("Error creating purchase order:", error);
      alert("Failed to create purchase order");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen p-6">
      < div className="border-transparent w-12/12 bg-black bg-transparent/50 rounded-lg mx-auto px-5 py-5 ">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/purchase-orders">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-white-900">Create Purchase Order</h1>
            <p className="text-white-600">Create a new purchase order for items from suppliers</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Supplier Selection */}
              <Card>
                <CardHeader className="mb-5">
                  <CardTitle >Supplier Information</CardTitle>
                  <CardDescription className="text-black ">Select the supplier for this purchase order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                      <SelectTrigger className="bg-custom-green text-white">
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 max-h-60 overflow-y-auto">
                        {suppliers.length === 0 ? (
                          <div className="p-2 text-black text-center">No suppliers found</div>
                        ) : (
                          suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id} className="text-black hover:bg-gray-100">
                              <div className="text-sm">
                                <span className="font-medium">{supplier.name} </span>
                                <span className="text-sm ml-2 ">{supplier.email || "No email"}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {suppliers.length === 0 && !loading && (
                      <p className="text-sm text-red-600 mt-1">No active suppliers found. Please add suppliers first.</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="note">Note</Label>
                    <Textarea
                      id="note"
                      placeholder="Additional notes for this purchase order"
                      value={note}
                      className="bg-white"
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Terms */}
              <Card>
                <CardHeader className="mb-5">
                  <CardTitle>Payment Terms</CardTitle>
                  <CardDescription className="text-black">Choose payment schedule for this purchase order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="paymentType">Payment Type</Label>
                    <Select value={paymentType} onValueChange={(value: "ONE_TIME" | "MONTHLY") => setPaymentType(value)}>
                      <SelectTrigger className="">
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent className=" border border-gray-200">
                        <SelectItem value="ONE_TIME" className="text-black hover:bg-gray-100">
                          One-Time Payment
                        </SelectItem>
                        <SelectItem value="MONTHLY" className="text-black hover:bg-gray-100">
                          Monthly Installment
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentType === "MONTHLY" && (
                    <div>
                      <Label htmlFor="monthlyTerms">Monthly Terms</Label>
                      <Select value={monthlyTerms.toString()} onValueChange={(value) => setMonthlyTerms(parseInt(value))}>
                        <SelectTrigger className="">
                          <SelectValue placeholder="Select terms" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200">
                          <SelectItem value="3" className="text-black hover:bg-gray-100">
                            3 Months
                          </SelectItem>
                          <SelectItem value="6" className="text-black hover:bg-gray-100">
                            6 Months
                          </SelectItem>
                          <SelectItem value="12" className="text-black hover:bg-gray-100">
                            12 Months
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-white"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs  mt-1">
                      {paymentType === "MONTHLY" 
                        ? `First installment due date (${monthlyTerms} monthly payments)` 
                        : "Final payment due date"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Add Items */}
              {selectedSupplierId && (
                <Card>
                  <CardHeader className="mb-5">
                    <CardTitle>Add Items</CardTitle>
                    <CardDescription className="text-black">Select products to include in this purchase order</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <Label>Product</Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem  className="" key={product.id} value={product.id}>
                                <div className="flex flex-col text-left">
                                  <span>{product.name}</span>
                                  <span className="text-sm ">
                                    {product.category} - ₱{product.price}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Ordered</Label>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      
                      <div>
                        <Label>Custom Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder=""
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                        />
                      </div>
                      
                      <Button type="button" onClick={addOrderItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              {orderItems.length > 0 && (
                <Card>
                  <CardHeader className="mb-5">
                    <CardTitle>Order Items</CardTitle>
                    <CardDescription className="text-black">Review and modify the items in this order</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Kilos</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell className="font-medium">
                              {item.product.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{item.product.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              ₱{(item.quantity * item.price).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOrderItem(item.productId)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="mb-5">
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span>{orderItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Kilos:</span>
                    <span>{orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span>₱{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Button
                  type="submit"
                  className="w-full bg-custom-orange hover:bg-custom-orange/50 mb-2"
                  disabled={submitting || !selectedSupplierId || orderItems.length === 0}
                >
                  {submitting ? "Creating..." : "Create Purchase Order"}
                </Button>
                <Link href="/admin/purchase-orders">
                  <Button type="button" variant="destructive" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}