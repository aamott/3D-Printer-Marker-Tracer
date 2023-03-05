/********************************************
 * Marker Tracer
 * 
 * Traces a tool's path once it has run, coating the lines
 * with ink. This can be useful for better supports or 
 * for multicolor prints.
 *******************************************/


let marker_tools = [];
let gcode_arr; // represents the old file, once loaded
let new_gcode = ''; // string to store new gcode in
let filename = '';

/********************
 * Download text as a file
 * Helper function
 ********************/
let download = ( filename, text ) => {
    // Get the new filename
    // TODO: Default to the original filename plus something
    filename = document.getElementById( "filename" ).value || "processed.gcode";


    // Create a link element to download with
    var element = document.createElement( 'a' );
    element.setAttribute( 'href', 'data:text/plain;charset=utf-8,' + encodeURIComponent( text ) );
    element.setAttribute( 'download', filename );

    element.style.display = 'none';
    document.body.appendChild( element );

    element.click();

    document.body.removeChild( element );
};

/***************************************************
 * Add Marker Tool
 * Note: Marker tools are stored in an object that looks like this:
 * marker_tools: [{
 *      name: string,
 *      start_marker: string,
 *      end_marker: string,
 *      start_gcode: string,
 *      end_gcode: string,
 *      no_temp_changes: bool,
 *      offsets: {
 *         x: Number,
 *         y: Number,
 *         z: Number
 *      }
 * }]
 ****************************************************/
document.getElementById( 'add_marker' ).addEventListener( 'click', () => {
    let marker_tool = {};
    marker_tool.offsets = {};

    marker_tool.name = document.getElementById( "marker_name" ).value;

    // Change indicators
    marker_tool.start_marker = document.getElementById( "start_marker" ).value;
    end_marker = document.getElementById( "end_marker" ).value || "^T*";
    marker_tool.end_marker = new RegExp( end_marker );

    // Offsets
    marker_tool.offsets.x = document.getElementById( "offset_x" ).value || 0;
    marker_tool.offsets.y = document.getElementById( "offset_y" ).value || 0;
    marker_tool.offsets.z = document.getElementById( "offset_z" ).value || 0;
    // feedrate should be stored as a simple multiplier, not percent (ex. 1.02, not 102)
    marker_tool.offsets.f = ( document.getElementById( "feedrate_percent" ).value || 100 ) / 100;

    // Gcode insertions
    marker_tool.start_gcode = document.getElementById( "start_gcode" ).value;
    marker_tool.end_gcode = document.getElementById( "end_gcode" ).value;

    marker_tool.no_temp_changes = document.getElementById( "no_temp_changes" ).checked;

    // Add tool to list
    marker_tools.push( marker_tool );

    // add to the display
    let marker_tools_display = document.getElementById( "marker_tools" );

    let tool_el = document.createElement( "section" );
    tool_el.innerHTML = `<p>- ${marker_tool.name}</p>`;

    marker_tools_display.appendChild( tool_el );

    // Enable the process button if file has been uploaded
    if ( gcode_arr.length > 0 ) {
        document.getElementById( "process_gcode" ).disabled = false;
    }
} );


/***********
 * File Upload
 * --listener--
 ***********/
document.getElementById( 'gcode_upload' ).addEventListener( "change", function () {
    // Get the file
    let file = this.files[0];
    // Read the file
    let reader = new FileReader();
    reader.onload = function ( progressEvent ) {
        gcode_arr = this.result.split( /\r\n|\n/ );
    };
    if ( file ) {
        reader.readAsText( file );
    }

    // Enable the process button if a marker tool has been added
    if ( marker_tools.length > 0 ) {
        document.getElementById( "process_gcode" ).disabled = false;
    }
} );


/***************************************
 * Check Marker
 */
const check_markers = (line) => {
    let selected_marker = null;

    for ( marker of marker_tools ) {
        if ( line.startsWith( marker.start_marker ) ) {
            // marker matched!
            selected_marker = marker;

            // clear out the old tool_gcode and load the marker
            tool_new_gcode = marker.start_gcode + '\n';

            // add Z offset
            tool_new_gcode += `G91 ; relative positioning
G0 Z${selected_marker.offsets.z}
G90 ; absolute positioning`

            skip_loop = true;
            break;
        }
    }

    return selected_marker;
}


/********************
 * Process Gcode
 */
let processing_flag = false; // tracks if the file is still processing, so the user doesn't click a bunch of times
document.getElementById( "process_gcode" ).addEventListener( 'click', () => {
    // Don't start processing again if gcode is already processing
    if ( processing_flag ) {
        return;
    }
    processing_flag = true;


    // Regex to extract G, X, Y, Z, and F values from lines of gcode
    const g_move_reg = /^(G[0-3]|G5) /;
    const x_val_reg = /(?<=X)[0-9]*\.?[0-9]*/;
    const y_val_reg = /(?<=Y)[0-9]*\.?[0-9]*/;
    const z_val_reg = /(?<=Z)[0-9]*\.?[0-9]*/;
    const f_val_reg = /(?<=F)[0-9]*\.?[0-9]*/;


    // Reset the new file
    new_gcode = '';
    let tool_new_gcode = '';

    // Process the gcode
    let selected_marker = null;
    for ( line of gcode_arr ) {
        let new_line = '';

        // check if any of the markers match
        let skip_loop = false;
        if ( !selected_marker ) {
            selected_marker = check_markers(line);

            // Remove the start_marker line from the file if a marker was added
            if ( selected_marker ) {
                continue;
            }
        }


        if ( selected_marker ) {

            // check for end of marker
            if ( marker.end_marker.test( line ) ) { // TODO: Make sure it doesn't run on the same line as the marker was started on.
                // add the tool's new gcode to the file
                new_gcode += tool_new_gcode;
                // unload the marker
                new_gcode += selected_marker.end_gcode + '\n';
                // reset the z offset
                new_gcode += `G91 ; relative positioning
G0 Z${-selected_marker.offsets.z}
G90 ; absolute positioning`
                
                selected_marker = null;

                // TODO: Test keep end marker
                // add the end marker back in, if selected
                if (document.getElementById('start_marker_is_end').checked) {
                    // check if the end flag is the start flag of another marker
                    selected_marker = check_markers(line);
                }


                // move to the next line
                continue;
            }

            // if G move, parse X, Y, Z and reassemble, including F
            if ( g_move_reg.test( line ) ) {
                // extract values
                let g = line.match( g_move_reg )?.[0];
                let x = parseFloat( line.match( x_val_reg )?.[0] || '' );
                let y = parseFloat( line.match( y_val_reg )?.[0] || '' );
                let z = parseFloat( line.match( z_val_reg )?.[0] || '' );
                let f = parseFloat( line.match( f_val_reg )?.[0] || '' );

                // assemble the line
                new_line += g;
                new_line += x ? ( ' X' + ( x + selected_marker.offsets.x ) ) : '';
                new_line += y ? ( ' Y' + ( y + selected_marker.offsets.y ) ) : '';
                new_line += z ? ( ' Z' + ( z + selected_marker.offsets.z ) ) : '';
                new_line += f ? ( ' F' + ( f * selected_marker.offsets.f ) ) : '';
                // new_line += '\n';

                // add the line to the new tool gcode
                tool_new_gcode += new_line + '\n';

                // copy the tool's current moves. The marker moves will be put in once all the printing moves are done. 
                new_gcode += line + '\n';
            }
            // remove temperature changes
            else if ( selected_marker.no_temp_changes && ( line.startsWith( "M104" ) || line.startsWith( "M109" ) ) ) {
                // continue to the next line without adding the line to the new file
                continue;
            }
            else {
                new_gcode += line + '\n';
            }
        } else {
            new_gcode += line + '\n';
        }
    }

    // immediately download the file
    download( filename, new_gcode );

    // activate the download button and make it download the new gcode
    let download_btn = document.getElementById( "download_btn" );
    download_btn.disabled = false;
    download_btn.addEventListener( 'click', () => {
        download( filename, new_gcode );
    } );

    processing_flag = false;
} );