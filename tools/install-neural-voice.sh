#!/usr/bin/env bash
# Try to install a nicer (less robotic) voice for Blaze on Arch/Omarchy.
# This is a helper, not magic: package names vary, and Chrome only sees voices
# that speech-dispatcher exposes. See docs/VOICE.md for the full story.
set -u

say() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*"; }

AUR=""
for h in yay paru; do command -v "$h" >/dev/null 2>&1 && { AUR="$h"; break; }; done

say "Checking what Blaze can currently hear…"
if command -v spd-say >/dev/null 2>&1; then
  say "speech-dispatcher present. Current voices:"
  spd-say -O 2>/dev/null | sed 's/^/   /' || warn "couldn't list voices (is speech-dispatcher running?)"
else
  warn "speech-dispatcher not found. Install it first:  sudo pacman -S speech-dispatcher"
fi

echo
say "Recommended: RHVoice (free, offline, plugs into speech-dispatcher)"
if [ -n "$AUR" ]; then
  say "Detected AUR helper: $AUR"
  read -r -p "Install rhvoice now? [y/N] " ans
  if [ "${ans:-n}" = "y" ] || [ "${ans:-n}" = "Y" ]; then
    "$AUR" -S rhvoice || warn "install failed — try installing 'rhvoice' manually"
  else
    say "Skipped. You can run:  $AUR -S rhvoice"
  fi
else
  warn "No yay/paru found. Install RHVoice manually (see docs/VOICE.md)."
fi

echo
say "Alternative (best quality, fiddlier): Piper neural TTS"
echo "   yay -S piper-tts-bin && sudo pacman -S espeak-ng"
echo "   then bridge it into speech-dispatcher — see docs/VOICE.md → Option B"

echo
say "After installing anything, restart the speech service and fully quit Chrome:"
echo "   systemctl --user restart speech-dispatcher 2>/dev/null || true"
echo "   # quit ALL Chrome windows, then reopen https://sudobreakstuff.github.io/blaze/"
echo "   # ⚙ → Voice pick → choose the new voice → press ▶"
