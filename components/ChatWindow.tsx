"use client";

import { useChat } from "ai/react";
import { FormEvent, useEffect, useState } from "react";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { schema } from "@/app/api/songmelier/route";

type ChatWindowProps = {
  spotifyApi?: SpotifyApi;
};

export default function ChatWindow({ spotifyApi }: ChatWindowProps) {
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: chatEndpointIsLoading,
    setMessages,
  } = useChat({
    api: "api/songmelier",
    onError: (e) => {
      console.error(e);
    },
  });

  useEffect(() => {
    if (messages.length) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        try {
          const m: { playlist: Array<{ band: string; song: string }> } =
            JSON.parse(lastMessage.content);
          if (m.playlist) {
            Promise.all(
              m.playlist!.map(({ band, song }) => {
                return spotifyApi?.search(`artist:${band} track:${song}`, [
                  "track",
                ]);
              })
            ).then(async (res) => {
              const songs = res.reduce((acc, curr) => {
                if (curr && curr.tracks.items.length > 0) {
                  acc.push(curr.tracks.items[0].uri);
                }
                return acc;
              }, [] as Array<string>);
              console.log({ songs });

              const currentPlayer =
                await spotifyApi!.player.getAvailableDevices();
              console.log({ currentPlayer });
              const device = currentPlayer.devices.find((d) => d.is_active)?.id;
              console.log({ device });
              if (!device) {
                throw new Error("No active device");
              }

              spotifyApi!.player.startResumePlayback(device, undefined, songs);
            });
          } else {
            console.log("errrr");
          }
        } catch {
          console.log("not json");
        }
      }
    }
  }, [messages]);

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // if (messageContainerRef.current) F
    //   messageContainerRef.current.classList.add("grow");
    // }
    if (!messages.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    if (chatEndpointIsLoading) {
      return;
    }
    handleSubmit(e);
  }

  return (
    <div className="w-full h-full bg-slate-800">
      <div className="flex flex-col-reverse w-full mb-4 overflow-auto transition-[flex-grow] ease-in-out">
        {messages.length > 0
          ? [...messages].reverse().map((m) => (
              <div>
                <p>
                  <span className="text-red-400">{m.role}: </span>
                  {m.content}
                </p>
              </div>
              // m.role === "system" ? <IntermediateStep key={m.id} message={m}></IntermediateStep> : <ChatMessageBubble key={m.id} message={m} aiEmoji={emoji}></ChatMessageBubble>
            ))
          : ""}
      </div>

      <form onSubmit={sendMessage} className="flex w-full flex-col">
        <input
          className="grow mr-8 p-4 rounded text-slate-800"
          value={input}
          onChange={handleInputChange}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
