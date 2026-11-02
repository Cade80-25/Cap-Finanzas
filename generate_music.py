import numpy as np
import wave
import struct
import os

out_dir = "C:/Users/USUARIO/Projects/Cap-Finanzas-repo/public/ads/v3"
os.makedirs(out_dir, exist_ok=True)

# Generate a simple upbeat background music (30 seconds)
# Using sine waves to create a pleasant melody
sample_rate = 44100
duration = 30
t = np.linspace(0, duration, int(sample_rate * duration), False)

# Create a simple melody with bass and melody
# Bass: low frequency pulsing
bass_freq = 80
bass = np.sin(2 * np.pi * bass_freq * t) * 0.3

# Melody: higher notes in a simple pattern
melody_freqs = [523.25, 587.33, 659.25, 698.46, 783.99, 659.25, 587.33, 523.25]
note_duration = duration / len(melody_freqs)
melody = np.zeros_like(t)
for i, freq in enumerate(melody_freqs):
    start = int(i * note_duration * sample_rate)
    end = int((i + 1) * note_duration * sample_rate)
    note_t = t[start:end] - t[start]
    melody[start:end] = np.sin(2 * np.pi * freq * note_t) * 0.2 * np.exp(-note_t * 2)

# Combine
audio = bass + melody

# Add some rhythm (kick drum effect)
kick_times = np.arange(0, duration, 0.5)
for kt in kick_times:
    idx = int(kt * sample_rate)
    if idx + 1000 < len(audio):
        kick = np.exp(-np.arange(1000) / 100) * 0.5
        audio[idx:idx+1000] += kick

# Normalize
audio = audio / np.max(np.abs(audio)) * 0.8

# Convert to 16-bit
audio_int = (audio * 32767).astype(np.int16)

# Write WAV
wav_path = os.path.join(out_dir, "background_music.wav")
with wave.open(wav_path, 'w') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(sample_rate)
    w.writeframes(audio_int.tobytes())

print(f"Music created: {wav_path}")
print(f"Duration: {duration}s")
