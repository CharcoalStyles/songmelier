import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="relative flex place-items-center">
        <p className="text-4xl font-bold">Songmelier</p>
      </div>

      <div className="mb-32 grid text-center ">
        <ChatWindow />
      </div>
    </main>
  );
}
