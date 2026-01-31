
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, User, UserRound, PhoneIncoming } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, encode, decodeAudioData } from '../services/geminiService';

const CallAgentView: React.FC = () => {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [status, setStatus] = useState<string>("Ready to call");
  const navigate = useNavigate();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const stopCall = useCallback(() => {
    setCallState('idle');
    setStatus("Call ended");
    
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
    
    setTimeout(() => navigate('/'), 1500);
  }, [navigate]);

  const startCall = async () => {
    try {
      setCallState('calling');
      setStatus("Dialing Sarah...");

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
          systemInstruction: 'You are Agent Sarah, a professional health and wellness coach for seniors. You are speaking with Robert. Your goal is to provide Robert with actionable health and wellness tips today. Start by greeting him warmly and then providing 2 clear, simple health tips. Speak clearly and slowly. Wait for him to respond after each tip.',
        },
        callbacks: {
          onopen: () => {
            setCallState('connected');
            setStatus("Connected to Agent Sarah");
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
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

            // Trigger initial greeting/tips
            sessionPromiseRef.current.then(session => {
                session.sendRealtimeInput({ text: "Hello Sarah, I'm Robert. Can you give me some health tips for today?" });
            });
          },
          onmessage: async (message: LiveServerMessage) => {
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
          },
          onerror: () => {
            setStatus("Call failed");
            stopCall();
          },
          onclose: () => {
            setStatus("Call ended");
            stopCall();
          }
        }
      });

    } catch (err) {
      console.error(err);
      setStatus("Error starting call");
      setCallState('idle');
    }
  };

  useEffect(() => {
    return () => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close()).catch(() => {});
        }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center p-8 text-white overflow-hidden">
      {/* Top Info */}
      <div className="flex flex-col items-center mt-12 space-y-4">
        <div className="w-32 h-32 bg-slate-800 rounded-full border-4 border-blue-500 flex items-center justify-center shadow-2xl relative overflow-hidden">
           <UserRound size={64} className="text-blue-500" />
           {callState === 'calling' && (
             <div className="absolute inset-0 border-4 border-blue-400 animate-ping rounded-full opacity-50"></div>
           )}
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Agent Sarah</h2>
          <p className="text-lg text-slate-400 font-medium mt-1">{status}</p>
        </div>
      </div>

      {/* Visualizer Placeholder */}
      <div className="flex-1 flex items-center justify-center w-full">
         {callState === 'connected' && (
           <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-16 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
           </div>
         )}
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-1 w-full max-w-xs gap-12 pb-24">
         {callState === 'idle' ? (
           <button 
             onClick={startCall}
             className="w-24 h-24 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl active:scale-95 transition-all"
           >
             <PhoneIncoming size={40} />
           </button>
         ) : (
           <div className="flex flex-col items-center gap-12">
             <div className="flex gap-8">
                <button className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                  <Mic size={24} />
                </button>
                <button className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                  <Volume2 size={24} />
                </button>
             </div>
             <button 
               onClick={stopCall}
               className="w-24 h-24 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all"
             >
               <PhoneOff size={40} />
             </button>
           </div>
         )}
      </div>

      <p className="text-slate-500 text-sm font-bold uppercase tracking-widest absolute bottom-12">
        Encrypted & Secure Call
      </p>
    </div>
  );
};

export default CallAgentView;
