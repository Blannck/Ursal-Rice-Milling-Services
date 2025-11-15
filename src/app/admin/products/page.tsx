// src/app/products/page.tsx

import { getVisibleProducts } from "@/actions/product.aciton";
import CardList from "@/components/CardList";
import Spinner from "@/components/Spinner";
import { stackServerApp } from "@/lib/stack";
import React, { Suspense } from "react";

async function page() {
  const user = await stackServerApp.getUser();
  const products = await getVisibleProducts();

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-10 mt-20 gap-6 ">
        <div className="lg:col-span-full ">
          <Suspense fallback={<Spinner></Spinner>}>
            <CardList products={products} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

export default page;