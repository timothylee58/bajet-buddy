"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { API_URL } from "@/lib/constants";

interface VoiceInputProps {
  onParsed: (result: { amount: string; merchant: string; category: string }) => void;
}

export function VoiceInput({ onParsed }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type SpeechRecognitionCtor = new () => {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
  };

  type SpeechRecognitionEvent = {
    resultIndex: number;
    results: {
      length: number;
      [index: number]: { isFinal: boolean; [index: number]: { transcript: string } };
    };
  };

  type WindowWithSpeech = Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  const supported =
    typeof window !== "undefined" &&
    !!((window as WindowWithSpeech).SpeechRecognition || (window as WindowWithSpeech).webkitSpeechRecognition);

  if (!supported) {
    return (
      <p className="font-sans text-xs text-muted text-center">Voice not supported in this browser</p>
    );
  }

  function startListening() {
    setError(null);
    setTranscript("");

    const win = window as WindowWithSpeech;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-MY";

    setListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(final || interim);
    };

    recognition.onerror = () => {
      setListening(false);
      setError("Could not capture voice. Please try again.");
    };

    recognition.onend = async () => {
      setListening(false);
      const captured = transcript;
      if (!captured.trim()) return;

      setParsing(true);
      try {
        const res = await fetch(`${API_URL}/api/voice/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: captured }),
        });
        if (!res.ok) throw new Error("Parse failed");
        const data = await res.json();
        if (data.confidence >= 50) {
          onParsed({
            amount: data.amount != null ? String(data.amount.toFixed(2)) : "",
            merchant: data.merchant ?? "",
            category: data.category,
          });
        } else {
          setError("Could not parse spend details with enough confidence. Please try again.");
        }
      } catch {
        setError("Failed to parse transcript. Please try again.");
      } finally {
        setParsing(false);
      }
    };

    recognition.start();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        {listening && (
          <span className="absolute inline-flex h-10 w-10 rounded-full bg-red-400 opacity-75 animate-ping" />
        )}
        <button
          type="button"
          onClick={startListening}
          disabled={listening || parsing}
          className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-surface-muted hover:bg-neutral-light disabled:opacity-50 transition-colors"
          aria-label={listening ? "Listening…" : "Tap to speak"}
        >
          {listening ? (
            <Mic className="w-5 h-5 text-red-500" />
          ) : (
            <MicOff className="w-5 h-5 text-muted" />
          )}
        </button>
      </div>

      {transcript && (
        <p className="font-sans text-xs text-muted text-center max-w-xs">{transcript}</p>
      )}

      {parsing && (
        <p className="font-sans text-xs text-muted text-center">Parsing…</p>
      )}

      {error && (
        <p className="font-sans text-xs text-danger text-center">{error}</p>
      )}
    </div>
  );
}
