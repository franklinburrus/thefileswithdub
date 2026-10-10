import FilesPlatform from "./components/files-platform";
import HomeBroadcast from "./components/home-broadcast";
import { metadataFor } from "./seo";

export const metadata = metadataFor("home");

export default function HomePage() {
  return <FilesPlatform page="home" homeBroadcast={<HomeBroadcast />} />;
}
