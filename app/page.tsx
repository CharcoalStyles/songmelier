"use client";
import { useEffect, createContext, useState } from "react";

import ChatWindow from "@/components/ChatWindow";
import OtherAudio from "@/components/OtherAudio";
import SpotifyLogin from "@/components/SpotifyLogin";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

export default function Home() {
  const [spotifyApi, setSpotifyApi] = useState<SpotifyApi | undefined>();

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const api = SpotifyApi.withUserAuthorization(
      clientId!,
      "http://localhost:3000",
      [
        "user-read-email",
        "user-read-private",
        "user-read-playback-state",
        "user-modify-playback-state",
      ]
    );

    const token = localStorage.getItem(
      "spotify-sdk:AuthorizationCodeWithPKCEStrategy:token"
    );
    if (token) {
      api.currentUser.profile().then((res) => {
        console.log({ profile: res });
        setSpotifyApi(api);
      });
    }

    //get the query params
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      api.currentUser.profile().then((res) => {
        console.log({ profile: res });
        setSpotifyApi(api);
        history.pushState({}, "", "/");
      });
    }
  }, []);

  useEffect(() => {
    if (spotifyApi) {
      spotifyApi.currentUser.profile().then((res) => {
        console.log({ profile: res });
      });
    }
  }, [spotifyApi]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="relative flex place-items-center">
        <p className="text-4xl font-bold">Songmelier</p>
      </div>
      <div className="mb-32 grid text-center ">
        <ChatWindow />
        <OtherAudio />
        <SpotifyLogin spotifyApi={spotifyApi} />
      </div>
    </main>
  );
}
