"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Package,
  TrendingUp,
  DollarSign,
  Calendar,
  MoreHorizontal,
  Grid3X3,
  List,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditDialog from "./EditDialog";
import { getCategories, toggleCategoryVisibility } from "@/actions/product.aciton";
import { formatDate } from "@/lib/utils";

type Categories = Awaited<ReturnType<typeof getCategories>>;

interface InventoryTableProps {
  categories: Categories;
}

export default function InventoryTable({ categories }: InventoryTableProps) {
  const router = useRouter();

  // 🔥 MINIMAL PATCH #1: Local state to apply edits immediately
  const [categoriesState, setCategoriesState] = useState(categories.userCategories);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const categoryTypes = Array.from(new Set(categoriesState?.map((p) => p.name) || []));

  // 🔥 MINIMAL PATCH #2: Filter using categoriesState instead of categories.userCategories
  const filteredCategories = categoriesState
    ?.filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || category.name === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    ?.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  const totalCategories = categoriesState.length;
  const visibleCategories = categoriesState.filter((p) => !p.isHidden).length;
  const hiddenCategories = totalCategories - visibleCategories;
  const totalValue = categoriesState.reduce((sum, p) => sum + p.price, 0);
  const avgPrice = totalCategories > 0 ? totalValue / totalCategories : 0;

  const handleToggleVisibility = async (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingStates((prev) => ({ ...prev, [categoryId]: true }));

    try {
      const result = await toggleCategoryVisibility(categoryId);

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to update category visibility");
      }
    } catch (error) {
      console.error("Error toggling visibility:", error);
      alert("An error occurred while updating category visibility");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  const handleCategoryClick = (category: any) => {
    const slugifiedName = category.name.toLowerCase().replace(/\s+/g, "-");
    const slug = `${category.id}--${slugifiedName}`;
    const categoryUrl = `/admin/categories/${slug}`;
    router.push(categoryUrl);
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold ">Manage Products</h1>
              <p className=" mt-1">Manage your product categories</p>
            </div>
          </div>
        </div>

        {/* stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm ">
            <CardContent className="p-6">
              <p className="text-sm font-medium ">Total Categories</p>
              <p className="text-3xl font-bold ">{totalCategories}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ">
            <CardContent className="p-6">
              <p className="text-sm font-medium ">Visible</p>
              <p className="text-3xl font-bold text-green-600">{visibleCategories}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ">
            <CardContent className="p-6">
              <p className="text-sm font-medium ">Hidden</p>
              <p className="text-3xl font-bold text-orange-600">{hiddenCategories}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ">
            <CardContent className="p-6">
              <p className="text-sm font-medium ">Total Value</p>
              <p className="text-3xl font-bold ">
                ₱{totalValue.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* filters */}
        <Card className="border-0 shadow-sm  mb-8">
          <CardContent className="p-6">
            
            {/* search + filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

              <div className="flex flex-col sm:flex-row gap-4 flex-1">

                <div className="relative  bg-white flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
                  <Input
                    placeholder="Search categories..."
                    className="pl-10  focus:border-blue-500 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full  bg-custom-green text-white border-0 sm:w-48 ">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoryTypes.filter(cat => cat && cat.trim()).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full  bg-custom-green text-white border-0 sm:w-48 ">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="price-low">Price (Low → High)</SelectItem>
                    <SelectItem value="price-high">Price (High → Low)</SelectItem>
                  </SelectContent>
                </Select>

              </div>

              {/* view toggle */}
              <div className="flex border border-black items-center gap-2  rounded-lg p-1">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>

                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>

            </div>

          </CardContent>
        </Card>

        {/* categories */}
        {filteredCategories && filteredCategories.length > 0 ? (
          viewMode === "table" ? (
            <Card className=" border border-transparent rounded-sm ">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className=" text-white">
                      <TableHead className="font-semibold text-white">Category Name</TableHead>
                      <TableHead className="font-semibold text-white">Price</TableHead>
                      <TableHead className="font-semibold text-white">Status</TableHead>
                      <TableHead className="font-semibold text-white">Created</TableHead>
                      <TableHead className="font-semibold text-white">Download Url</TableHead>
                      <TableHead className="font-semibold text-white text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>

                    {filteredCategories.map((category) => (
                      <TableRow
                        key={category.id}
                        className=" cursor-pointer transition-colors"
                        onClick={() => handleCategoryClick(category)}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg overflow-hidden">
                              <img
                                src={ "/sack.png"}
                                alt={category.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-black">{category.name}</p>
                              <p className="text-sm text-black truncate">
                                ID: {category.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="font-semibold">
                          ₱{category.price.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>

                        <TableCell>
                          <Badge variant={category.isHidden ? "destructive" : "default"}>
                            {category.isHidden ? "Hidden" : "Visible"}
                          </Badge>
                        </TableCell>

                        <TableCell>{formatDate(category.createdAt)}</TableCell>

                        <TableCell className="text-xs text-blue-700 break-all max-w-xs">
                          {category.downloadUrl || "No URL"}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCategoryClick(category)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* 🔥 MINIMAL PATCH #3 — Apply update to table immediately */}
                            <div className="w-24">
                              <EditDialog
                                category={category}
                                onUpdated={(updated) => {
                                  setCategoriesState((prev) =>
                                    prev.map((p) => (p.id === updated.id ? updated : p))
                                  );
                                }}
                              />
                            </div>

                            <Button
                              variant={category.isHidden ? "default" : "outline"}
                              size="lg"
                              onClick={(e) => handleToggleVisibility(category.id, e)}
                              disabled={loadingStates[category.id]}
                              className="h-10  px-3"
                            >
                              {loadingStates[category.id]
                                ? "..."
                                : category.isHidden
                                ? <>
                                    <Eye className="h-4 w-4 mr-1" /> Show
                                  </>
                                : <>
                                    <EyeOff className="h-4 w-4 mr-1" /> Hide
                                  </>
                              }
                            </Button>

                          </div>
                        </TableCell>

                      </TableRow>
                    ))}

                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            // grid view
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="group cursor-pointer border-0 shadow-sm hover:transition-all duration-300 transform hover:-translate-y-1"
                  onClick={() => handleCategoryClick(category)}
                >
                  <CardContent className="p-0">

                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-xl">
                      <img
                        src={"/sack.png"}
                        alt={category.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <Badge variant={category.isHidden ? "destructive" : "default"} className="absolute top-3 left-3">
                        {category.isHidden ? "Hidden" : "Visible"}
                      </Badge>

                      <Badge variant="secondary" className="absolute top-3 right-3 text-white border-0">
                        {category.name}
                      </Badge>
                    </div>

                    <div className="p-6">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg line-clamp-2">{category.name}</h3>
                        <p className="text-sm text-black mt-1">ID: {category.id.slice(0, 8)}...</p>

                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold">₱{category.price.toLocaleString()}</div>
                        </div>

                        <div className="flex items-center text-sm text-black">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(category.createdAt)}
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                        <div>
                          {/* 🔥 Minimal Patch — Apply updates immediately in grid view too */}
                          <EditDialog
                            category={category}
                            onUpdated={(updated) => {
                              setCategoriesState((prev) =>
                                prev.map((p) => (p.id === updated.id ? updated : p))
                              );
                            }}
                          />
                        </div>

                        <Button
                          variant={category.isHidden ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => handleToggleVisibility(category.id, e)}
                          disabled={loadingStates[category.id]}
                          className="w-full h-10"
                        >
                          {loadingStates[category.id]
                            ? "Loading..."
                            : category.isHidden
                            ? <>
                                <Eye className="h-4 w-4 mr-1" /> Show
                              </>
                            : <>
                                <EyeOff className="h-4 w-4 mr-1" /> Hide
                              </>
                          }
                        </Button>

                      </div>
                    </div>

                  </CardContent>
                </Card>
              ))}

            </div>
          )
        ) : (
          <Card className="border-0 shadow-sm ">
            <CardContent className="text-center py-16">
              <div className=" rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-black" />
              </div>
              <h3 className="text-xl font-semibold  mb-2">No categories found</h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or filter criteria.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  variant="outline"
                >
                  Clear filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
