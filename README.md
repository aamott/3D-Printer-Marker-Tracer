# 3D-Printer-Marker-Tracer-
A script to let a printer use markers to draw on a filament path. Useful for coating support top layers for easier removal. 

# How it works
Once a toolchange flag is found, it copies all of the code using that 'tool', removes the flag, and copies every move using the marker, drawing right on top of the lines printed. Z offset is automatically compensated, but you may want to raise the z a little bit in the start gcode. 

### TODO: 
- [ ] Detect relative movement mode vs normal movement mode (uncommon)
- [ ] Testing