import type { Metadata } from "next";
import { metadataFor } from "../seo";

export const metadata: Metadata = metadataFor("broadcasts");

export default function BroadcastsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
