
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, encode, decodeAudioData } from '../services/geminiService';

const CompanionView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>("Ready to chat");
  const [transcription, setTranscription] = useState<{ id: number, text: string, type: 'user' | 'model' }[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const transcriptionIdRef = useRef<number>(0);

  const drawWaveform = (data: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6'; // blue-500
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const sliceWidth = canvas.width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] * 1.5; // Amplify for visual
      const y = (v * canvas.height / 2) + (canvas.height / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.stroke();
  };

  const stopConversation = useCallback(() => {
    setIsActive(false);
    setStatus("Conversation ended");
    cancelAnimationFrame(animationFrameRef.current);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    for (const source of sourcesRef.current.values()) {
      try { source.stop(); } catch(e) {}
    }
    sourcesRef.current.clear();
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try { session.close(); } catch(e) {}
      });
      sessionPromiseRef.current = null;
    }
  }, []);

  const startConversation = async () => {
    try {
      setIsActive(true);
      setStatus("Connecting...");
      setTranscription([]);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: 'You are a warm, friendly health companion for an elderly person named Robert. Your voice is slow, clear, and reassuring. Keep responses short and simple. Focus on encouraging healthy habits like walking and drinking water. Always respond with empathy. If the user says something that sounds like they want to stop, such as "stop listening", "end session", or "goodbye", you can acknowledge it, but the app will automatically handle the closure.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus("Listening...");
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              drawWaveform(inputData);
              
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio output logic
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const s of sourcesRef.current) {
                try { s.stop(); } catch(e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            // Real-time Transcription handling
            if (message.serverContent?.inputTranscription?.text) {
              const text = message.serverContent.inputTranscription.text;
              const normalizedText = text.toLowerCase().trim();
              
              // Voice Commands check
              const stopCommands = ['stop listening', 'end session', 'goodbye', 'quit chat', 'stop chat'];
              const shouldStop = stopCommands.some(cmd => normalizedText.includes(cmd));
              
              setTranscription(prev => [
                ...prev.slice(-10), 
                { id: transcriptionIdRef.current++, text, type: 'user' }
              ]);

              if (shouldStop) {
                setTimeout(() => stopConversation(), 1000); // Small delay to let model acknowledge if needed
              }
            }
            if (message.serverContent?.outputTranscription?.text) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [
                ...prev.slice(-10), 
                { id: transcriptionIdRef.current++, text, type: 'model' }
              ]);
            }
          },
          onerror: (e) => {
            console.error("Live API Error:", e);
            setStatus("Connection error");
            stopConversation();
          },
          onclose: () => {
            setStatus("Disconnected");
            stopConversation();
          }
        }
      });

    } catch (err) {
      console.error("Failed to start voice session:", err);
      setStatus("Microphone access denied");
      setIsActive(false);
    }
  };

  useEffect(() => {
    return () => stopConversation();
  }, [stopConversation]);

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 max-w-md mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-bold text-slate-900">AI Health Friend</h2>
        <p className="text-lg text-slate-500 font-medium">Talk to me anytime</p>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-[3rem] p-6 flex flex-col items-center shadow-xl shadow-slate-100 relative overflow-hidden">
        {/* Visual Pulse Background */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-64 h-64 bg-blue-100 rounded-full blur-3xl animate-pulse opacity-40"></div>
          <div className="w-48 h-48 bg-indigo-100 rounded-full blur-3xl animate-pulse delay-700 opacity-40"></div>
        </div>

        {/* Real-time Waveform Canvas */}
        <div className="w-full h-24 mb-4 flex items-center justify-center z-10">
          <canvas 
            ref={canvasRef} 
            width={300} 
            height={80} 
            className={`w-full h-full rounded-2xl transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>

        <div className="z-10 flex flex-col items-center gap-6 w-full">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${isActive ? 'bg-blue-600 scale-110 shadow-blue-200' : 'bg-slate-100 shadow-none'}`}>
            {isActive ? <Volume2 size={40} className="text-white animate-bounce" /> : <Mic size={40} className="text-slate-300" />}
          </div>
          
          <div className="text-center">
            <p className={`text-xl font-extrabold transition-colors duration-500 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
              {status}
            </p>
          </div>

          {/* Transcription Scroll Area */}
          <div className="w-full h-48 overflow-y-auto space-y-3 px-2 flex flex-col-reverse">
            {[...transcription].reverse().map((item) => (
              <div 
                key={item.id} 
                className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-base font-semibold ${
                  item.type === 'user' 
                    ? 'bg-slate-100 text-slate-600 rounded-tr-none' 
                    : 'bg-blue-600 text-white rounded-tl-none shadow-md shadow-blue-100'
                }`}>
                  {item.text}
                </div>
              </div>
            ))}
            {transcription.length === 0 && (
              <p className="text-center text-slate-300 font-medium py-10 italic">
                {isActive ? "Go ahead, say something like 'How can I stay healthy today?'" : "Tap the button below to start talking"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        {!isActive ? (
          <button 
            onClick={startConversation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-3xl text-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            <Mic size={32} />
            Start Chatting
          </button>
        ) : (
          <button 
            onClick={stopConversation}
            className="w-full bg-slate-900 text-white py-6 rounded-3xl text-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            <MicOff size={32} />
            End Session
          </button>
        )}
      </div>

      <div className="bg-orange-50 rounded-2xl p-4 flex items-center gap-3 border border-orange-100">
        <AlertCircle size={20} className="text-orange-500 flex-shrink-0" />
        <div className="text-xs font-bold text-orange-700 leading-tight">
          <p>Friendly Reminder: This AI is for companionship. For medical emergencies, use the red SOS button.</p>
          <p className="mt-1 text-orange-600/70">Voice Command: Say "Goodbye" or "End Session" to stop.</p>
        </div>
      </div>
    </div>
  );
};

export default CompanionView;
