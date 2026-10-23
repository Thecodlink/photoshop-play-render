#!/usr/bin/env python3
"""Final mix: silent HyperFrames render + Jessica voice.wav + paper SFX cues (sfx.json).
Single ffmpeg pass, loudnorm I=-14 TP=-1 (kit pattern). Usage: mix_final.py <video.mp4> <out.mp4>"""
import json, subprocess, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))          # collage/
RUN = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # run root... collage is 06-scenes/collage
RUN = os.path.abspath(os.path.join(HERE, "..", ".."))
video, out = sys.argv[1], sys.argv[2]
DUR = 75.67
cues = json.load(open(os.path.join(HERE, "sfx.json")))
voice = os.path.join(RUN, "04-audio", "voice.wav")

inputs = ["-i", video, "-i", voice]
parts, labels = [], ["[1:a]"]
n = 2
for i, (t, name, g) in enumerate(cues):
    p = os.path.join(HERE, "assets", "sfx", f"{name}.wav")
    if not os.path.exists(p):
        print("missing sfx", name); continue
    inputs += ["-i", p]
    ms = max(0, round(t * 1000))
    parts.append(f"[{n}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g * 0.4:.3f},adelay={ms}|{ms}[s{i}]")
    labels.append(f"[s{i}]")
    n += 1
parts.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0,atrim=0:{DUR},loudnorm=I=-14:TP=-1:LRA=9[a]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(parts),
                "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                "-ar", "48000", "-t", str(DUR), "-movflags", "+faststart", out], check=True)
print("mixed", len(cues), "cues + narration ->", out)
