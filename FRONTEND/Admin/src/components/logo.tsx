import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center justify-center h-1 w-full">
      <div className="relative h-20 w-24">
      <Image
  src="/images/logo/serviceimagelogo.png"
  alt="Logo"
  width={80}  // same as w-24
  height={70} // same as h-8
  className="object-contain"
  quality={100}
/>

      </div>
    </div>
  );
}
