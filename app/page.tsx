"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { create } from 'zustand';
import { cn } from '@lib/utils';
import { mapPromptToParams, SceneParams } from '@lib/promptMapper';

const SceneCanvas = dynamic(() => import('@components/SceneCanvas'), { ssr: false });

type AppState = {
  params: SceneParams;
  setParams: (p: Partial<SceneParams>) => void;
};

const useApp = create<AppState>((set) => ({
  params: mapPromptToParams('minimal backlit silhouette'),
  setParams: (p) => set((s) => ({ params: { ...s.params, ...p } })),
}));

export default function Page() {
  const { params, setParams } = useApp();
  const [prompt, setPrompt] = useState('Minimal backlit silhouette in fog, moody, soft rim light');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const onApplyPrompt = () => {
    const mapped = mapPromptToParams(prompt);
    setParams(mapped);
  };

  const onUpload = async (file: File) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode().catch(() => {});
    const c = document.createElement('canvas');
    const w = (c.width = 64);
    const h = (c.height = 64);
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0, w, h);
    const data = g.getImageData(0, 0, w, h).data;
    let r = 0, gsum = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      gsum += data[i + 1];
      b += data[i + 2];
      n++;
    }
    const avg = [r / n, gsum / n, b / n];
    const toHex = (v: number) => '#' + [0,1,2].map(i => Math.round(avg[i]).toString(16).padStart(2, '0')).join('');
    const colorHex = toHex(0);
    setParams({ lightColor: colorHex });
  };

  const exportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cinematic-still.png';
    a.click();
  };

  const startRecording = async (seconds = 6) => {
    if (!canvasRef.current || isRecording) return;
    const stream = canvasRef.current.captureStream(60);
    const chunks: BlobPart[] = [];
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    recordedChunksRef.current = [];
    setIsRecording(true);
    setRecordingProgress(0);
    rec.ondataavailable = (e) => e.data.size && recordedChunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cinematic-broll.webm';
      a.click();
      setIsRecording(false);
      setRecordingProgress(100);
    };
    rec.start();
    mediaRecorderRef.current = rec;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      setRecordingProgress(Math.min(100, (t / seconds) * 100));
      if (t >= seconds) {
        rec.stop();
      } else if (isRecording) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[380px_1fr]">
      <section className="p-5 lg:p-6 space-y-4 lg:space-y-6 border-b lg:border-b-0 lg:border-r border-white/10">
        <h1 className="text-2xl font-semibold">Cinematic 3D B?Roll</h1>
        <p className="text-white/60 text-sm">Ultra?realistic, featureless humanoids in minimal scenes for documentaries.</p>
        <div className="card p-4 space-y-3">
          <textarea
            className="input h-28 resize-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your scene? e.g. backlit silhouette in fog, warm rim light"
          />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={onApplyPrompt}>Apply Prompt</button>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-white/10 hover:border-accent/60 cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onUpload(e.target.files[0])} />
              Use Photo
            </label>
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary" onClick={exportPNG}>Export Still (PNG)</button>
            <button className="btn-primary" onClick={() => startRecording(6)} disabled={isRecording}>
              {isRecording ? `Recording? ${Math.round(recordingProgress)}%` : 'Generate B?roll (6s)'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="flex items-center justify-between gap-2">Mood
              <select
                className="input ml-2"
                value={params.mood}
                onChange={(e) => setParams({ mood: e.target.value as SceneParams['mood'] })}
              >
                <option value="moody">Moody</option>
                <option value="clinical">Clinical</option>
                <option value="dramatic">Dramatic</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-2">Pose
              <select
                className="input ml-2"
                value={params.pose}
                onChange={(e) => setParams({ pose: e.target.value as SceneParams['pose'] })}
              >
                <option value="standing">Standing</option>
                <option value="profile">Profile</option>
                <option value="looking_down">Looking Down</option>
                <option value="seated">Seated</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-2">Camera
              <select
                className="input ml-2"
                value={params.cameraPath}
                onChange={(e) => setParams({ cameraPath: e.target.value as SceneParams['cameraPath'] })}
              >
                <option value="orbit">Orbit</option>
                <option value="dolly_in">Dolly In</option>
                <option value="pan">Pan</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-2">Light color
              <input
                className="input ml-2"
                type="color"
                value={params.lightColor}
                onChange={(e) => setParams({ lightColor: e.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="text-xs text-white/40">
          Tip: Upload a reference photo to match lighting color. Use prompts like ?backlit silhouette in fog? or ?hard top light, high contrast?.
        </div>
      </section>
      <section className="relative">
        <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-white/60">Loading scene?</div>}>
          <SceneCanvas params={params} canvasRef={canvasRef} isRecording={isRecording} />
        </Suspense>
      </section>
    </main>
  );
}
