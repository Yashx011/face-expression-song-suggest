import { Outlet } from "react-router";
import Player from "../../home/components/player";
import { useSong } from "../../home/hooks/useSong";

export default function MainLayout() {
  const { handleSkipSong } = useSong();

  return (
    <>
      <Outlet />
      <Player onSkip={handleSkipSong} />
    </>
  );
}
