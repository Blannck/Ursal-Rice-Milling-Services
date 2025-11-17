import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "../../../lib/stack";

export default function Handler(props: unknown) {
  return(
   <div className="mt-20 ">
   <StackHandler  fullPage app={stackServerApp}  routeProps={props} />
    </div>
   )
   
}
