# 3D Printer Marker Tracer

__Try it out: [3D Printer Marker Tracer](https://aamott.github.io/3D-Printer-Marker-Tracer/marker-tracer.htm)__

This is a script to let a printer use markers to draw on a filament path. Useful for coating support top layers for easier removal. 

Here are some examples of how this idea has been used: 
- [Smart multi-colour 3D printing using only Sharpies and printed parts](https://www.youtube.com/watch?v=UnWxbU7Hfro) (YouTube)
- [Improving 3D Printed Supports with a Marker](https://hackaday.com/2020/05/27/improving-3d-printed-supports-with-a-marker/0) (Hackaday)

However, these designs were either custom gcode as a concept test or designed with a very specific toolchanger in mind (one which might triple print time, but which had many colors). This script is meant to make that more flexible, simply giving people a way to automatically trace the lines regardless of setup. This could potentially be used for a dozen or more markers lined up on the side of a CoreXY 3D printer or with a mendel and a [clicky Sharpie](https://www.sharpie.com/markers/permanent-markers/sharpie-retractable-permanent-markers-fine-point/SP_1185598.html). It could make easily removable supports on filaments that normally stick too well to their own supports, like Nylon or PETG, improving surface quality. If you have doubts, just check out that cube on the second link above. 

Note: this doesn't work with relative movement mode because at the end of a marker move, it will go back to absolute moves. If this ever becomes an issue, it should easy to implement, but is rare enough that I likely won't implement it myself. 

# How it works
Once a toolchange flag is found, it copies all of the code using that 'tool', removes the flag, and copies every move using the marker, drawing right on top of the lines printed. Z offset is automatically compensated, but you may want to raise the z a little bit in the start gcode. 

## TODO: 
- [ ] Store tools in cache
- [ ] Allow removing tools
- [ ] Testing