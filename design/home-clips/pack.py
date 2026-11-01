# The Fjell Skyr tub (AI picture, invented brand, Milan 1 November 12:31) with the real EAN-13 the clip's scanner reads,
# drawn into the empty white label. Output: 720 x 960, the camera feed's size.
from PIL import Image, ImageDraw, ImageFont
import sys
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB").resize((720, 960), Image.LANCZOS)
d = ImageDraw.Draw(im)
code12 = "400604012345"
code = code12 + str((10 - sum(int(c) * (3 if k % 2 else 1) for k, c in enumerate(code12)) % 10) % 10)
L = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"]
G = ["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"]
R = ["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"]
P = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"][int(code[0])]
bits = "101" + "".join((L if P[k] == "L" else G)[int(c)] for k, c in enumerate(code[1:7])) + "01010" + "".join(R[int(c)] for c in code[7:]) + "101"
# the white label in the 720 x 960 picture: x 231 to 511, y 545 to 683
m = 2; x0 = 371 - len(bits) * m // 2; y0 = 560; h = 92
for k, b in enumerate(bits):
    if b == "1":
        guard = k < 3 or 45 <= k < 50 or k >= 92
        d.rectangle([x0 + k * m, y0, x0 + k * m + m - 1, y0 + h + (8 if guard else 0)], fill=(20, 20, 20))
f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
d.text((x0 - 14, y0 + h + 2), code[0], font=f, fill=(20, 20, 20))
d.text((x0 + 6 * m, y0 + h + 2), " ".join(code[1:7]).replace(" ", " "), font=f, fill=(20, 20, 20))
d.text((x0 + 51 * m, y0 + h + 2), " ".join(code[7:]).replace(" ", " "), font=f, fill=(20, 20, 20))
im.save(out, quality=92); print(code, out)
