"use client";

import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { useContext, useEffect, useState } from "react";

type SpotifyLoginProps = {
  spotifyApi?: SpotifyApi;
};

export default function SpotifyLogin({ spotifyApi }: SpotifyLoginProps) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    console.log("ooo", spotifyApi);
    if (spotifyApi) {
      spotifyApi.currentUser.profile().then((res) => {
        console.log({ profile: res });
        setLoggedIn(true);
      });
    }
  }, [spotifyApi]);

  return (
    <div>
      <button
        onClick={() => {
          if (loggedIn && spotifyApi) {
            console.log("logging out");
            spotifyApi.logOut();
            setLoggedIn(false);
            //navigate to home
            history.pushState({}, "", "/");
            return;
          }

          const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
          console.log({ clientId });

          if (!clientId) {
            throw new Error("Missing client id");
          }

          const api = SpotifyApi.withUserAuthorization(
            clientId,
            "http://localhost:3000",
            [
              "user-read-email",
              "user-read-private",
              "user-read-playback-state",
              "user-modify-playback-state",
            ]
          );
          api.currentUser.profile()
        }}
      >
        {loggedIn ? "Logout" : "Login"}
      </button>
    </div>
  );
}
