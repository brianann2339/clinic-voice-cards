#!/usr/bin/env python3
"""Generate fixed voice cards with edge-tts 7.3.1 and ffprobe on PATH."""

import argparse
import asyncio
import json
import os
from pathlib import Path
import subprocess
import tempfile

import edge_tts


VOICE = "zh-TW-YunJheNeural"
RATE = "-8%"
PITCH = "-12Hz"
AUDIO_DIR = Path(__file__).resolve().parents[1] / "audio"
PHRASES = (
    ("01-results.mp3", "剛才的檢查已經出來了。"),
    ("02-cancer.mp3", "你得了癌症。"),
    ("03-fracture.mp3", "你這邊骨折了。"),
    ("04-flu-a.mp3", "剛才的快篩結果，你A型流感陽性。"),
    ("05-blood.mp3", "我們等等幫你抽個血。"),
    ("06-iv.mp3", "我們等等幫你打個點滴。"),
    ("07-test.mp3", "我們等等幫你做個快篩。"),
    ("08-unwell.mp3", "你今天哪裡不舒服呢？"),
    ("09-pain.mp3", "有哪邊會痛嗎？"),
    ("10-breath.mp3", "呼吸會喘嗎？"),
    ("11-inflammation.mp3", "你這邊發炎了。"),
    ("12-xray-no-fracture.mp3", "X光都正常，沒有骨折。"),
    ("13-xray-normal.mp3", "X光都正常。"),
    ("14-introduction.mp3", "你好，我是侯岳岑醫師，我今天喉嚨沒有聲音，所以只能用語音跟您對話，不好意思。"),
    ("15-im-injection.mp3", "等等幫你打個肌肉針好嗎？"),
    ("16-questions.mp3", "有沒有什麼問題？"),
    ("17-oral-meds.mp3", "那我讓你帶口服藥回家囉。"),
    ("18-suture.mp3", "這個傷口要縫。"),
    ("19-keep-dry.mp3", "傷口回去避免碰水。"),
    ("20-tetanus.mp3", "五年內打過破傷風疫苗嗎？"),
)


async def generate(only):
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    for filename, text in PHRASES:
        if only and filename != only:
            continue
        target = AUDIO_DIR / filename
        if target.exists():
            print(f"Preserved existing file: {target.name}")
            continue
        with tempfile.NamedTemporaryFile(dir=AUDIO_DIR, suffix=".mp3") as temporary:
            await edge_tts.Communicate(
                text, VOICE, rate=RATE, pitch=PITCH
            ).save(temporary.name)
            result = subprocess.run(
                [
                    "ffprobe", "-v", "error", "-show_entries",
                    "format=duration,size:stream=codec_name,sample_rate,channels",
                    "-of", "json", temporary.name,
                ],
                check=True, capture_output=True, text=True,
            )
            metadata = json.loads(result.stdout)
            if float(metadata["format"]["duration"]) <= 0:
                raise RuntimeError(f"Empty audio: {filename}")
            os.link(temporary.name, target)
        print(json.dumps({"file": filename, **metadata}, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", choices=[name for name, _ in PHRASES])
    asyncio.run(generate(parser.parse_args().only))
