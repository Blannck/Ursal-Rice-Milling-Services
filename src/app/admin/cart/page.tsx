import { getCartItems } from "@/actions/cart.action";
import { getCategories } from "@/actions/product.aciton";
import CartTable from "@/components/CartTable";
import { stackServerApp } from "@/lib/stack";
import { SignUp } from "@stackframe/stack";
import React from "react";

async function Cart() {
  const user = await stackServerApp.getUser();
  const cartItems = await getCartItems();

  return (
    
    <>
     
      {user ? (
        <div className="max-w-7xl mt-20 mx-auto px-4 grid grid-cols-1 lg:grid-cols-10 gap-6">
          <div  className="lg:col-span-full">
            {/* Header */}
            <div className="mb-8 mt-7">
              <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
              <p className="text-white">
                Review your selected products and proceed to checkout when ready.
              </p>
            </div>
            <CartTable cartItems={cartItems} />
          </div>
        </div>
      ) : (
        <div className="flex justify-center mt-40 items-center">
          <SignUp />
        </div>
      )}
       
    </>
  
   
  );
}

export default Cart;
