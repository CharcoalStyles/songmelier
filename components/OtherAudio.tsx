"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function OtherAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [sound, setSound] = useState<Blob | null>(null);

  useEffect(() => {
    if (sound && audioRef.current) {
        let reader = new FileReader();
        reader.onload = (e) => {
            if (audioRef.current) {
                audioRef.current.src = e.target?.result as string;
                audioRef.current.play();
                audioRef.current.onended = () => {
                    console.log("ended")
                    setSound(null);
                }

            }
        };
        reader.readAsDataURL(sound);
    }
  }, [sound]);

  return (
    <div>
      <button
        onClick={() => {
          //load audio from /api/voice
          axios.get<Blob>("/api/voice", {
            responseType: "blob",
          }).then((res) => {
            setSound(res.data);
          });
        }}
      >
        Load
      </button>
      <audio ref={audioRef} controls className="invisible" />
    </div>
  );
}
