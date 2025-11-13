import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Facebook, Phone, MessageCircle } from "lucide-react";




import {
  Search,
  Star,
  ArrowRight,
  Code,
  BookOpen,
  FileText,
  Layout,
  Zap,
  TrendingUp,
  Users,
  Award,
  ShoppingCart,
  LeafIcon,
  HandshakeIcon,
  Grid,
} from "lucide-react";
import { getProducts } from "@/actions/product.aciton";
import CardList from "./CardList";
import Link from "next/link";
import { link } from "fs";

// Mock data matching your product schema
const mockProducts = [
  {
    id: "clx1a2b3c4d5e6f7g8h9i0j1",
    name: "React E-commerce Starter Kit",
    description:
      "Complete React.js e-commerce template with modern UI components and payment integration",
    category: "code",
    price: 2999,
    imageUrl:
      "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg",
    userId: "user1",
    downloadUrl: "https://example.com/download/react-ecommerce",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "clx2b3c4d5e6f7g8h9i0j1k2",
    name: "JavaScript Mastery Course",
    description:
      "Comprehensive JavaScript course covering ES6+, async programming, and modern frameworks",
    category: "courses",
    price: 1999,
    imageUrl:
      "https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg",
    userId: "user1",
    downloadUrl: "https://example.com/download/js-course",
    createdAt: "2024-01-14T09:15:00Z",
    updatedAt: "2024-01-14T09:15:00Z",
  },
  {
    id: "clx3c4d5e6f7g8h9i0j1k2l3",
    name: "UI/UX Design System Guide",
    description:
      "Complete guide to building scalable design systems with Figma and component libraries",
    category: "guides",
    price: 1499,
    imageUrl:
      "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg",
    userId: "user1",
    downloadUrl: "https://example.com/download/design-guide",
    createdAt: "2024-01-13T14:20:00Z",
    updatedAt: "2024-01-13T14:20:00Z",
  },
  {
    id: "clx4d5e6f7g8h9i0j1k2l3m4",
    name: "Productivity Dashboard Template",
    description:
      "Beautiful Notion-style productivity dashboard template for personal and team use",
    category: "templates",
    price: 799,
    imageUrl:
      "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg",
    userId: "user1",
    downloadUrl: "https://example.com/download/dashboard-template",
    createdAt: "2024-01-12T11:45:00Z",
    updatedAt: "2024-01-12T11:45:00Z",
  },
  {
    id: "clx5e6f7g8h9i0j1k2l3m4n5",
    name: "CSS Animation Snippets",
    description:
      "Collection of 50+ modern CSS animations and micro-interactions for web projects",
    category: "snippets",
    price: 599,
    imageUrl:
      "https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg",
    userId: "user1",
    downloadUrl: "https://example.com/download/css-snippets",
    createdAt: "2024-01-11T16:30:00Z",
    updatedAt: "2024-01-11T16:30:00Z",
  },
  {
    id: "clx6f7g8h9i0j1k2l3m4n5o6",
    name: "Next.js Blog Template",
    description:
      "Modern blog template built with Next.js, Tailwind CSS, and MDX support",
    category: "code",
    price: 1799,
    imageUrl:
      "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg",
    userId: "user1",
    downloadUrl: "https://example.com/download/nextjs-blog",
    createdAt: "2024-01-10T13:15:00Z",
    updatedAt: "2024-01-10T13:15:00Z",
  },
];

const productCategories = [
  {
    value: "code",
    label: "Code Projects",
    icon: Code,
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "courses",
    label: "Mini-Courses",
    icon: BookOpen,
    color: "bg-green-100 text-green-700",
  },
  {
    value: "guides",
    label: "PDF Guides",
    icon: FileText,
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "templates",
    label: "Productivity Templates",
    icon: Layout,
    color: "bg-orange-100 text-orange-700",
  },
  {
    value: "snippets",
    label: "Reference Snippets",
    icon: Zap,
    color: "bg-pink-100 text-pink-700",
  },
];

export  default async function HomePage() {
  const productsResult = await getProducts();
  const products = productsResult?.userProducts?.slice(0, 3) ?? [];
  

  const featuredProducts = mockProducts.slice(0, 3);
  const popularProducts = mockProducts.slice(3, 6);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
          
     <section id="hero-section"  className="relative bg-transparent  items-center  py-36 overflow-hidden grid grid-cols-2 gap-4">
    
  

 
  <div className="relative max-w-7xl ml-32  px-4 sm:px-6 lg:px-8 col-span-1 text-center ">
    <h1 className="text-4xl md:text-6xl font-bold text-white mb-10 text-left leading-tight">
      Premium Rice Milling & Processing Solutions
    </h1>

    <p className="text-lg md:text-2xl text-white text-left max-w-3xl mb-10 mx-auto">
      At <span className="text-white font-semibold">Ursal Rice Milling Services</span>, 
      we combine <span className="font-medium">modern technology</span> with 
      <span className="font-medium"> traditional expertise</span> to deliver 
      high-quality, locally milled rice trusted by farmers, retailers, and communities.
    </p>

   
    <div className="flex flex-col sm:flex-row justify-start  mb-20 gap-4">
      <Link href="/products">
        <Button
          variant="default"
          size="lg"
          className="bg-custom-orange hover:bg-custom-orange/90 text-white font-semibold px-8"
        >
          Shop Now
        </Button>
      </Link>
    
    
    </div>
      {/* Trust Indicators */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left text-white">
      <div >
        <h3 className="text-3xl font-bold ">15+</h3>
        <p className="text-sm  uppercase tracking-wide">Years of Experience</p>
      </div>
      <div>
        <h3 className="text-3xl font-bold ">1000+</h3>
        <p className="text-sm uppercase tracking-wide">Satisfied Clients</p>
      </div>
      <div>
        <h3 className="text-3xl font-bold ">99.9%</h3>
        <p className="text-sm uppercase tracking-wide">Quality Assurance</p>
      </div>
    </div>

    

    

    
  </div>
  <div className="relative col-span-1 flex flex-col items-center  justify-center">
    <img
      src="/happy.png"
      alt="Rice Milling"
      className="w-full h-auto max-w-md border-transparent rounded-full mb-10 shadow-lg object-cover"
    />
    
  
  </div>

  
</section>


<section className="py-20 bg-custom-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-custom-green mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-custom-green">
              Discover the advantages of partnering with Ursal Rice Milling
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-transparent p-8 rounded-xl text-center hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-custom-green  w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-4xl font-semibold text-custom-green mb-4">Premium Quality</h3>
              <p className="text-black text-lg">
                We ensure the highest quality standards for all our rice products
              </p>
            </div>

            <div className="bg-transparent p-8 rounded-xl text-center hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-custom-green  w-40 h-40  rounded-full flex items-center justify-center mx-auto mb-6">
                <HandshakeIcon className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-4xl font-semibold text-custom-green mb-4">Locally Sourced</h3>
              <p className="text-black text-lg">
                Supporting local farmers while delivering rice that's fresh and sustainable
              </p>
            </div>

            <div className="bg-transparent p-8 rounded-xl text-center hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-custom-green  w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-6">
                <LeafIcon className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-4xl font-semibold text-custom-green mb-4">Consistent Purity</h3>
              <p className="text-black text-lg">
                Every grain is milled to perfection, ensuring purity and freshness
              </p>
            </div>
          </div>
        </div>
      </section>


    

      {/* Featured Products Section */}
      <section className="py-20 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div> 
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Featured Products
              </h2>
              <p className="text-xl text-white">
                Hand-picked premium products from our collection
              </p>
            </div>
            <Link href="/products">
            <Button variant="outline" className="hidden md:flex text-white border-white hover:bg-white/10">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-8">
            {products.map((product) => (

              <Link href={`/products/${product.id}`}>  <Card
                key={product.id}
                className="group cursor-pointer  border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform   overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={product.imageUrl ?? "/rice1.jpg"}
                      alt={product.name}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Category Badge */}
                    <Badge className="absolute top-4 left-4 /90  border-0 font-semibold">
                      {
                        productCategories.find(
                          (cat) => cat.value === product.category
                        )?.label
                      }
                    </Badge>

                    {/* Featured Badge */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r text-white bg-custom-green px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6 group-hover:text-custom-orange transition-colors duration-300">
                    <h3 className="font-bold text-xl  mb-3  transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <p className=" mb-4 line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold ">
                        ₱{product.price.toLocaleString()}
                      </div>
                      <Button className="bg-custom-orange hover:bg-custom-orange/700  px-6 py-2 rounded-xl font-semibold">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
                </Card>
                </Link>
            ))}
          </div>

          {/* Mobile View All Button */}
          <div className="text-center mt-12 md:hidden">
            <Link href="/products">
              <Button variant="outline" size="lg">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      

      {/* Call to Action Section */}
      <section className="py-20 bg-custom-brown">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Experience Our Premium Rice Products?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Join our growing family of satisfied customers and discover the difference of quality rice products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
            <Button size="lg" variant="default">
              Shop Now
              <ShoppingCart className="ml-2 h-5 w-5" />
            </Button>
            </Link>
          
          </div>
        </div>
      </section>
      <section className="bg-[#1b1717] text-white py-16 px-6 md:px-20">
          
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        
        {/* Left: Contact Information */}
        <div>
          <h2 className="text-3xl font-bold mb-4">You can reach us at:</h2>

          <div className="mb-6">
            <p className="text-sm uppercase font-semibold mb-1">Address:</p>
            <p className="text-lg leading-relaxed">
              Purok Bagong Silang,<br />
              Barangay Poblacion, Santo Niño,<br />
              South Cotabato
            </p>
          </div>

          <div className="mb-6">
            <p className="text-sm uppercase font-semibold mb-1">Contact:</p>
            <p className="text-lg font-medium">0999 592 7346</p>
          </div>

          {/* Social Icons */}
          <div className="flex gap-6 mt-6">
            <a
              href="#"
              className="bg-custom-orange text-black rounded-full p-3 hover:bg-custom-orange/90 transition"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="bg-custom-orange text-black rounded-full p-3 hover:bg-custom-orange/90 transition"
            >
              <MessageCircle className="w-6 h-6" />
            </a>
          </div>
        </div>

        {/* Right: Google Map Embed */}
        <div className="w-full h-[400px]">
          <iframe
            title="Location Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63783.01629578757!2d124.664!3d6.369!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f7e9c3a1b1a28f%3A0x4a7bfb7f8764e4ce!2sSanto%20Ni%C3%B1o%2C%20South%20Cotabato!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
            width="100%"
            height="100%"
            allowFullScreen
            loading="lazy"
            className="rounded-xl shadow-lg border-0"
          ></iframe>
        </div>
      </div>
    
      </section>
    </div>
  );
}
