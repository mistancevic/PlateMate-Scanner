import subprocess, textwrap, os
A="/mnt/user-data/attachments/a3625ff7-4226-57ca-879e-055f53d2dca0/"
imgs=[A+x for x in ["4f145da5-image.jpg","492b018b-image.jpg","04e27df8-image.jpg","3c9a139d-image.jpg","00e4001f-image.jpg","1cb65e6f-image.jpg"]]
steps=["Rinse 80 g basmati rice and bring it to the boil in 200 ml water. Cover and cook on low heat for 12 minutes.",
"Cut 160 g chicken breast into strips. Season with salt and pepper.",
"Slice 6 g garlic thin.",
"Heat 8 g olive oil in a pan on medium high heat. Fry the chicken 6 minutes, turning once, until no pink is left inside.",
"Add 120 g spinach and the garlic. Stir 2 minutes, until the spinach wilts.",
"Put the rice in a bowl and the chicken and spinach on top."]
timers={0:"12:00",3:"6:00",4:"2:00"}
F="/usr/share/fonts/opentype/inter/Inter-Bold.otf"; FR="/usr/share/fonts/opentype/inter/Inter-Medium.otf"
assert os.path.exists(F) and os.path.exists(FR)
W=1080; FPS=30
def esc(s): return s.replace("\\","\\\\").replace(":","\\:").replace("'","\u2019").replace("%","\\%")
def clip(i, img, dur, lines, head, timer=None, title=False, dark=False):
    fr=int(dur*FPS)
    vf=[f"scale=2160:2160,zoompan=z='min(1+0.06*on/{fr},1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={fr}:s={W}x{W}:fps={FPS}"]
    if dark: vf.append("eq=brightness=-0.25")
    n=len(lines); lh=54; boxh=60+lh*n+(56 if head else 0)
    y0=W-boxh-40
    vf.append(f"drawbox=x=40:y={y0}:w={W-80}:h={boxh}:color=white@0.92:t=fill")
    y=y0+34
    if head:
        vf.append(f"drawtext=fontfile={F}:text='{esc(head)}':x=72:y={y}:fontsize=30:fontcolor=0x2e7be8"); y+=56
    for l in lines:
        vf.append(f"drawtext=fontfile={F}:text='{esc(l)}':x=72:y={y}:fontsize={44 if not title else 52}:fontcolor=0x172742"); y+=lh
    if timer:
        vf.append(f"drawbox=x={W-310}:y=60:w=250:h=76:color=0x172742@0.85:t=fill")
        vf.append(f"drawtext=fontfile={F}:text='Timer {esc(timer)}':x={W-286}:y=82:fontsize=38:fontcolor=white")
    vf.append(f"drawtext=fontfile={FR}:text='Test · pictures drawn by AI (Gemini)':x=60:y=60:fontsize=26:fontcolor=white:box=1:boxcolor=0x000000@0.45:boxborderw=12")
    out=f"c{i}.mp4"
    subprocess.run(["ffmpeg","-y","-loglevel","error","-loop","1","-i",img,"-vf",",".join(vf),"-t",str(dur),"-r",str(FPS),"-pix_fmt","yuv420p","-c:v","libx264","-preset","veryfast","-crf","22",out],check=True)
    return out
clips=[clip(0,imgs[5],3.2,["Chicken rice bowl","with spinach"],"CHEF MEALAN · 6 STEPS",title=True,dark=True)]
for k,(img,t) in enumerate(zip(imgs,steps)):
    clips.append(clip(k+1,img,5.5,textwrap.wrap(t,36),f"STEP {k+1} OF 6",timers.get(k)))
clips.append(clip(7,imgs[5],3.2,["Done. Enjoy your meal."],"ALL 6 STEPS DONE",title=True))
# crossfade them
D=0.6; inputs=[]; 
for c in clips: inputs+=["-i",c]
durs=[3.2]+[5.5]*6+[3.2]
fc=[]; prev="[0:v]"; off=0
for j in range(1,len(clips)):
    off+=durs[j-1]-D
    lab=f"[v{j}]"; fc.append(f"{prev}[{j}:v]xfade=transition=fade:duration={D}:offset={off:.2f}{lab}"); prev=lab
subprocess.run(["ffmpeg","-y","-loglevel","error",*inputs,"-filter_complex",";".join(fc),"-map",prev,"-pix_fmt","yuv420p","-c:v","libx264","-preset","veryfast","-crf","22","-movflags","+faststart","chicken-rice-bowl-steps-gemini.mp4"],check=True)
print("ok")
