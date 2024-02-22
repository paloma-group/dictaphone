"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { decode } from "base64-arraybuffer";
import { v4 } from "uuid";
import { useRouter } from "next/navigation";

const Recorder = ({ userId }: { userId: string }) => {
  const { push } = useRouter();

  const [title, setTitle] = useState("Record your voice note");

  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [minutes, setMinutes] = useState(0);

  async function startRecording() {
    setIsRunning(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    let audioChunks: any = [];

    recorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: "audio/mp3" });
      const arrayBuffer = await blob.arrayBuffer();
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("voice-notes")
        .upload(`/${userId}/${v4()}/voice-note.mp3`, arrayBuffer, {
          contentType: "audio/mpeg",
        });

      if (data?.path) {
        const { data: note, error } = await supabase
          .from("notes")
          .insert({
            audio_file_path: data.path,
            audio_file_id: data?.id,
            user_id: userId,
          })
          .select();

        if (note) {
          push("/");
        }
      }
      setTitle("Record your voice note");
      setMinutes(0);
      setSeconds(0);
    };
    setMediaRecorder(recorder as any);
    recorder.start();
  }

  function stopRecording() {
    // @ts-ignore
    mediaRecorder.stop();
    setIsRunning(false);
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds === 59) {
            setMinutes((prevMinutes) => prevMinutes + 1);
            return 0;
          }
          return prevSeconds + 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleRecordClick = () => {
    if (title === "Record your voice note") {
      setTitle("Recording...");
      startRecording();
    } else if (title === "Recording...") {
      setTitle("Processing...");
      stopRecording();
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="mt-32 text-3xl font-bold text-center">{title}</h2>
      <div className="text-5xl font-bold text-center my-16">
        {minutes < 10 ? `0${minutes}` : minutes}:
        {seconds < 10 ? `0${seconds}` : seconds}
      </div>
      <button
        className={`block w-16 h-16 mx-auto text-white font-bold rounded-full ${isRunning ? "bg-black hover:bg-gray-800" : "bg-orange-500 hover:bg-orange-400"}`}
        onClick={handleRecordClick}
      >
        {isRunning ? "STOP" : "REC"}
      </button>
    </div>
  );
};

export default Recorder;