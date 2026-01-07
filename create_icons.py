"""Generate LeetBuddy extension icons"""
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    # Create image with gradient-like background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple "LB" text or code bracket symbol
    # For simplicity, let's draw { } which represents code
    center = size // 2
    
    if size >= 48:
        # Draw code brackets { }
        bracket_color = 'white'
        line_width = max(2, size // 16)
        
        # Left bracket {
        left_x = size // 4
        draw.arc([left_x - size//8, size//4, left_x + size//8, 3*size//4], 
                 90, 270, fill=bracket_color, width=line_width)
        
        # Right bracket }
        right_x = 3 * size // 4
        draw.arc([right_x - size//8, size//4, right_x + size//8, 3*size//4], 
                 270, 90, fill=bracket_color, width=line_width)
        
        # Center dot for "code"
        dot_size = size // 8
        draw.ellipse([center - dot_size//2, center - dot_size//2, 
                     center + dot_size//2, center + dot_size//2], 
                     fill=bracket_color)
    else:
        # For small icon, just fill with color
        draw.ellipse([size//4, size//4, 3*size//4, 3*size//4], fill='white')
    
    img.save(filename)
    print(f"Created {filename} ({size}x{size})")

# Create all three icon sizes
create_icon(16, 'extension/assets/icon-16.png')
create_icon(48, 'extension/assets/icon-48.png')
create_icon(128, 'extension/assets/icon-128.png')

print("\n✅ All icons created successfully!")
print("📦 Reload your extension in chrome://extensions to see the new icons")
