# Making Blaze sound human

Blaze doesn't carry his own voice — he asks your browser to speak using the
Web Speech API. On Linux, **Chrome/Chromium get their voices from
`speech-dispatcher`**, so the quality of Blaze's voice is really the quality of
the voices installed on your machine. If all you have is eSpeak, he'll sound
robotic no matter what we do in the code.

The site already does the things it can on its own:

- scores every available voice and picks the most natural **male** one,
- prefers neural/high-quality voices (Natural, Neural, Piper, Google, remote),
- speaks **sentence by sentence with natural pauses** and small pitch/rate shifts,
- lets you choose a voice and tune **pitch** and **speed** in ⚙ settings.

To go further you install a better voice system-side. Two routes:

---

## Option A — RHVoice (easiest, still free/offline)

RHVoice is a free neural-ish TTS that ships with a `speech-dispatcher` module,
so Chrome picks it up automatically.

```bash
# Arch / Omarchy (AUR)
yay -S rhvoice    # or: paru -S rhvoice
# Debian/Ubuntu
sudo apt install rhvoice speech-dispatcher-rhvoice
```

Then restart the speech service and Chrome:

```bash
systemctl --user restart speech-dispatcher 2>/dev/null || true
# fully quit Chrome (all windows) and reopen it
```

Open Blaze → ⚙ → **Voice pick**, and look for the RHVoice voices (they'll be
tagged ♂). Pick one, hit **▶** to hear it.

---

## Option B — Piper (best quality, more fiddly)

[Piper](https://github.com/rhasspy/piper) is a fast, natural neural TTS that
runs fully offline. It needs to be bridged into `speech-dispatcher` so the
browser can use it.

1. Install Piper and a male voice (example: British male "alan"):
   ```bash
   yay -S piper-tts-bin        # or: pipx install piper-tts
   sudo pacman -S espeak-ng     # Piper uses espeak-ng for phonemes
   mkdir -p ~/.local/share/piper && cd ~/.local/share/piper
   base=https://huggingface.co/rhasspy/piper-voices/resolve/main
   curl -LO $base/en/en_GB/alan/medium/en_GB-alan-medium.onnx
   curl -LO $base/en/en_GB/alan/medium/en_GB-alan-medium.onnx.json
   ```
   Test it: `echo "hello moon" | piper -m ~/.local/share/piper/en_GB-alan-medium.onnx -f /tmp/out.wav && aplay /tmp/out.wav`

2. Bridge it into speech-dispatcher. Piper doesn't ship a speech-dispatcher
   module itself, so you wire it up with a small **generic module** wrapper in
   `~/.config/speech-dispatcher/`. Because the config grammar drifts between
   speech-dispatcher versions, follow a current community wrapper (search
   "piper speech-dispatcher generic module") and verify with `spd-say "test"`.

3. Restart speech-dispatcher, quit Chrome completely, reopen, and pick the new
   voice in ⚙.

> The exact config grammar for speech-dispatcher commonly shifts between
> versions, so treat Option B as an advanced recipe. If a voice doesn't appear
> in the picker, it's almost always the speech-dispatcher module config rather
> than the site.

---

## Option C — no install

- In ⚙ set **Pitch** around `0.80` and **Speed** around `0.95` for a warmer,
  calmer male read.
- Try different entries in **Voice pick** — sometimes an unexpected one sounds
  best.
- Prefer voices marked **♂** and (where your system offers them) ones with names
  containing *Google*, *Natural*, *Neural* or *Online*.

---

## Why we can't just "add a good voice" to the website

The site is a static page on GitHub Pages. It can't ship a big neural model
without making the page enormous, and a free cloud TTS would need an API key and
a server. So the honest split is: the site does prosody and voice-picking, and
the machine provides the actual voice.
