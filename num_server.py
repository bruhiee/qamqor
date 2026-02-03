from pathlib import Path
text = Path('server/index.js').read_text(encoding='utf-8').splitlines()
for i,line in enumerate(text, start=1):
    if 360 <= i <= 460:
        print(f"{i}: {line}")
