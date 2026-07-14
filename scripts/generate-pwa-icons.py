#!/usr/bin/env python3
"""Generate PWA icons (192x192 and 512x512) from the DS logo."""
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, output_path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background rounded rectangle
    margin = int(size * 0.05)
    radius = int(size * 0.18)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(39, 105, 138, 255)  # #27698a
    )
    
    # Draw "DS" text
    try:
        font_size = int(size * 0.5)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()
    
    text = "DS"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2 - bbox[0]
    y = (size - text_height) // 2 - bbox[1]
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    img.save(output_path, 'PNG')
    print(f"Generated {output_path} ({size}x{size})")

if __name__ == "__main__":
    create_icon(192, "/home/z/my-project/public/icon-192.png")
    create_icon(512, "/home/z/my-project/public/icon-512.png")
