// https://github.com/skpm/skpm
// https://developer.sketch.com/reference/api/#ui
// https://developer.sketch.com/reference/api/#document
// https://www.smashingmagazine.com/2019/07/build-sketch-plugin-javascript-html-css-part-1/
// https://www.smashingmagazine.com/2019/07/build-sketch-plugin-javascript-html-css-part-2/

// https://gist.github.com/mjackson/5311256
// https://gist.github.com/xenozauros/f6e185c8de2a04cdfecf
// https://css-tricks.com/converting-color-spaces-in-javascript/


const document = require('sketch/dom').getSelectedDocument();
const ui = require('sketch/ui');

// https://stackoverflow.com/questions/32290952/convert-6-digit-color-code-to-3-digits/32291202
const hexaToRgba = hexa => {
    // // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    // var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    // hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    //     return r + r + g + g + b + b;
    // });

    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexa);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: parseFloat( ((+`0x${result[4]}`) / 255).toFixed(2) )
    } : null;
  },
  formatHex = hex => {
    // convert to lowercase and shortens the value if possible
    hex = hex.toLowerCase();

    if(shortenHexColors) {
      let regex, replace;

      if(hex.length === 7) { // without alpha
        regex = /#([\dA-Fa-f])\1([\dA-Fa-f])\2([\dA-Fa-f])\3/;
        replace = '#$1$2$3';

      } else { // with alpha
        regex = /#([\dA-Fa-f])\1([\dA-Fa-f])\2([\dA-Fa-f])\3([\dA-Fa-f])\4/;
        replace = '#$1$2$3$4';
      }
      hex = hex.replace(regex, replace);
    }
    return hex;
};


// defaults
// in the future, they may be editable via ui
const shortenHexColors = true,
  alignValues = true,
  
  formats = {
    'Sass/Less' : {name: 'sass', prefix: '$'}, 
    'CSS custom properties': {name: 'css', prefix: '--'}
  },
  notations = {
    'Hex':       {name: 'hex',  alpha: false}, 
    'Hex alpha': {name: 'hexa', alpha: true}, 
    'RGB':       {name: 'rgb',  alpha: false}, 
    'RGBa':      {name: 'rgba', alpha: true}, 
    // 'HSL':       {name: 'hsl',  alpha: false}, 
    // 'HSLa':      {name: 'hsla', alpha: true}
  };

// console.log(document)
let colors = document.swatches.map(item => { 
  return {
    name: item.name,  
    color: item.color, // hex alpha 
    // rgb: item.referencingColor
  };
});

if(colors.length === 0) {
  ui.alert('No color swatches', 'Bye');

} else {

  ui.getInputFromUser(
    "Export colors as",
    {
      type: ui.INPUT_TYPE.selection,
      possibleValues: Object.keys(formats),
      initialValue: Object.keys(formats)[0]
    },
    (err, value) => {

      if (err) {
        return
      } else {

        let this_format = formats[value];

        ui.getInputFromUser(
          "Color notation",
          {
            type: ui.INPUT_TYPE.selection,
            possibleValues: Object.keys(notations),
            initialValue: Object.keys(notations)[0]
          },
          (err, notation) => {
            
            if (err) {
              return
            } else {
              let this_notation = notations[notation];
              notation = this_notation.name;

              const formatName = string => {
                  return this_format.prefix + string.trim().toLowerCase().replace(/[\W| |\-|_]+/g, '-');
                },

                formatColor = (color, notation) => {

                  // original color notation is hex alpha
                  if(notation === 'hex') {
                    return formatHex(color.substr(0, 7));

                  } else if(notation === 'rgb') {
                    let rgb = hexaToRgba(color);
                    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

                  } else if(notation === 'rgba') {
                    let rgb = hexaToRgba(color);
                    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${String(rgb.a).replace(/^0/, '')})`;
                  
                  } else { // hex alpha
                    return formatHex(color);
                  }
                };
              
              // format names and colors
              colors = colors.map( item => {
                let originalColor = item.color;
                if(!this_notation.alpha) {
                  originalColor = originalColor.substr(0, 7);
                }

                return {
                  name: formatName(item.name), 
                  formattedColor: formatColor(item.color, notation),
                  color: originalColor
                };
              }); 

              // max name and color lengths (used for align values)
              let maxNameLength = colors.reduce((prev, current) => {
                  return prev > current.name.length? prev : current.name.length;
                }, 0) + 1,

                maxColorLength = colors.reduce((prev, current) => {
                  return prev > current.formattedColor.length? prev : current.formattedColor.length;
                }, 0) + 2;
              
              // export strings
              let result = colors.map( item => {
                let str = item.name + ': ' + 
                  (alignValues? Array(maxNameLength - item.name.length).join(' ') : '') +
                  item.formattedColor + `;`;

                // original hex color is added as comment
                if(notation !== 'hex' && notation !== 'hexa') {
                  let spaces = Array(maxColorLength - item.formattedColor.length).join(' ');

                  if(this_format.name === 'sass') {
                    str += `${spaces}\/\/ ${item.color}`;
                  } else {
                    str += `${spaces}\/\* ${item.color} \*\/`;
                  }
                }

                return str;
              }); 

              ui.alert('Here are your colors: copy them', result.join('\n'));
              //ui.message('Done. Your colors are in the clipboard');
            }
          }
        );
      
      }
    }
  );

}
