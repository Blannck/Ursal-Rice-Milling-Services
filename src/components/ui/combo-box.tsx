"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

const productCategories = [
  { value: "-", label: "None" },
  { value: "Ordinary", label: "Ordinary" },
  { value: "Toner", label: "Toner" },
  { value: "RC-160", label: "RC-160" },
];


export function Combobox({ value, onChange }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover  open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="tertiary"
          role="combobox"
          aria-expanded={open}
          className="w-[200px]  justify-between"
        >
          {value ? value : "Select category..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-white">
        <Command className="bg-white">
          <CommandInput placeholder="Search category..." className="h-9 text-black ml-0" />
         
          <CommandList className="text-black  bg-white">
            <CommandEmpty className="text-black">No category found.</CommandEmpty>
            <CommandGroup className="bg-white ">
              {productCategories.map((cat) => (
                <CommandItem
                  key={cat.value}
                  value={cat.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                  className="text-black"
                >
                  {cat.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === cat.value ? "opacity-100" : "opacity-0",
                     
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        
        </Command>
      </PopoverContent>
    </Popover>
  );
}