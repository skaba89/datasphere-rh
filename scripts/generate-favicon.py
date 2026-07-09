#!/usr/bin/env python3
"""Generate favicon.ico from the SVG logo for DataSphere RH."""
import struct
import zlib
from PIL import Image
import io

def create_favicon():
    # Create a 32x32 image with the DS logo
    sizes = [16, 32, 48]

    images = []
    for size in sizes:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        # Background rounded rectangle (brand color #27698a)
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        # Fill background
        draw.rectangle([0, 0, size, size], fill=(39, 105, 138, 255))
        # Draw "DS" text
        try:
            from PIL import ImageFont
            font_size = int(size * 0.55)
            # Use a default font
            try:
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
        except Exception as e:
            print(f"Font error: {e}")
        images.append(img)

    # Save as ICO
    output_path = "/home/z/my-project/public/favicon.ico"
    images[0].save(output_path, format='ICO', sizes=[(s, s) for s in sizes], append_images=images[1:])
    print(f"Generated {output_path}")

if __name__ == "__main__":
    create_favicon()
