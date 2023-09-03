"use client";

import { useChat } from "ai/react";
import { FormEvent, useState } from "react";

export default function ChatWindow() {
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

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // if (messageContainerRef.current) {
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
