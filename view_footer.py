from pathlib import Path
text = Path('src/components/layout/Footer.tsx').read_bytes()
start = text.find(b'2024')-20
print(text[start:start+120])
